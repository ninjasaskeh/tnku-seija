import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { deleteChatSession } from "@/app/admin/actions";
import { ActionForm } from "@/components/admin/ActionForm";
import { TranscriptSkeleton } from "@/components/admin/skeletons";
import { Badge, cx, fmtUsd, PageHeader, Panel } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { priceFor } from "@/lib/chat";
import { db } from "@/lib/db";

const when = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" });

export default function ConversationPage({ params }: PageProps<"/admin/conversations/[id]">) {
  return (
    <div className="space-y-6">
      <Link href="/admin/conversations" className="text-small text-ash hover:text-acid">
        ← All conversations
      </Link>
      <Suspense fallback={<TranscriptSkeleton />}>
        <Transcript params={params} />
      </Suspense>
    </div>
  );
}

async function Transcript({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const session = await db().chatSession.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!session) notFound();

  const answers = session.messages.filter((m) => m.role === "assistant");
  const cost = answers.reduce((n, m) => {
    const p = priceFor(m.model);
    return n + ((m.inputTokens ?? 0) * p.input + (m.outputTokens ?? 0) * p.output) / 1_000_000;
  }, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        kicker={`session ${session.id.slice(0, 8)}`}
        title="Conversation"
        description={
          <>
            {when.format(session.createdAt)} WIB · visitor #{session.ipHash.slice(0, 6)} ·{" "}
            {session.userAgent?.split(") ")[0]?.replace(/^Mozilla\/5\.0 \(/, "") ?? "unknown browser"}
          </>
        }
        actions={
          <>
            <Badge>{session.messages.length} messages</Badge>
            <Badge tone="accent">≈ {fmtUsd(cost)}</Badge>
          </>
        }
      />

      <ol className="space-y-5">
        {session.messages.map((m) => {
          const visitor = m.role === "user";
          return (
            <li key={m.id} className={cx("flex", visitor ? "justify-end" : "justify-start")}>
              <div className={cx("max-w-[85%] sm:max-w-[70%]", visitor && "text-right")}>
                <p className="mb-1 text-micro text-ash">
                  {visitor ? "Visitor" : `AI · ${m.model ?? "?"}`} · {when.format(m.createdAt)}
                  {!visitor && m.outputTokens != null && ` · ${m.inputTokens} in / ${m.outputTokens} out`}
                </p>
                <div
                  className={cx(
                    "inline-block whitespace-pre-wrap break-words px-4 py-3 text-left",
                    visitor ? "bg-acid text-ink" : "border border-line bg-ink",
                  )}
                >
                  {m.content || <span className="text-ash">(empty)</span>}
                </div>
                {m.stopReason && m.stopReason !== "end_turn" && (
                  <p className="mt-1">
                    <Badge tone="warn">{m.stopReason}</Badge>
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <Panel title="Danger zone" subtitle="Permanently removes this conversation and all its messages.">
        <ActionForm action={deleteChatSession} submit="Delete conversation" danger>
          <input type="hidden" name="id" value={session.id} />
          <label className="flex items-center gap-2 text-small text-ash">
            <input type="checkbox" name="confirm" required /> I understand this can&apos;t be undone
          </label>
        </ActionForm>
      </Panel>
    </div>
  );
}
