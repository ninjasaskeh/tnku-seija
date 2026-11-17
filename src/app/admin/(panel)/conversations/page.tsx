import Link from "next/link";
import { Suspense } from "react";
import { ListSkeleton } from "@/components/admin/skeletons";
import { btn, EmptyState, fmtNum, PageHeader, Panel, timeAgo } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { listConversations } from "@/lib/stats";

export default function ConversationsPage({ searchParams }: PageProps<"/admin/conversations">) {
  return (
    <div className="space-y-6">
      <PageHeader
        kicker="~/chat.log"
        title="Conversations"
        description="Every question asked in the site terminal, newest first. Visitors are shown as a short anonymous id, never an IP."
      />
      <Suspense fallback={<ListSkeleton label="Loading conversations" rows={10} />}>
        <List searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function List({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";
  const page = Math.max(1, Number(sp.page) || 1);
  const { rows, total, pages } = await listConversations(page, q);
  const link = (p: number) => `/admin/conversations?${new URLSearchParams({ ...(q && { q }), page: String(p) })}`;

  return (
    <div className="space-y-4">
      <form role="search" className="flex flex-wrap gap-2">
        <label className="min-w-0 flex-1">
          <span className="sr-only">Search messages</span>
          <input
            name="q"
            defaultValue={q}
            placeholder="Search what people asked…"
            className="w-full border border-line bg-ink px-3 py-2 placeholder:text-ash/60 focus:border-acid focus:outline-none"
          />
        </label>
        <button type="submit" className={btn("ghost")}>
          Search
        </button>
        {q && (
          <Link href="/admin/conversations" className={btn("ghost")}>
            Clear
          </Link>
        )}
      </form>

      <Panel
        title={q ? `Results for “${q}”` : "All conversations"}
        subtitle={`${fmtNum(total)} total · page ${page} of ${pages}`}
        bodyClassName="p-0"
      >
        {rows.length ? (
          <table className="w-full text-left">
            <thead className="border-b border-line text-micro text-ash">
              <tr>
                <th scope="col" className="px-4 py-2 font-normal">
                  When
                </th>
                <th scope="col" className="px-2 py-2 font-normal">
                  First question
                </th>
                <th scope="col" className="hidden px-2 py-2 font-normal sm:table-cell">
                  Visitor
                </th>
                <th scope="col" className="px-4 py-2 text-right font-normal">
                  Msgs
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.id} className="group relative transition-colors hover:bg-line/40">
                  <td className="whitespace-nowrap px-4 py-3 text-micro text-ash">
                    <time dateTime={r.at.toISOString()} title={r.at.toISOString()}>
                      {timeAgo(r.at)}
                    </time>
                  </td>
                  <td className="max-w-0 px-2 py-3">
                    {/* seluruh baris bisa diklik: link-nya ngelebar nutup baris */}
                    <Link href={`/admin/conversations/${r.id}`} className="block truncate after:absolute after:inset-0">
                      {r.first || "(empty)"}
                    </Link>
                  </td>
                  <td className="hidden px-2 py-3 text-micro text-ash sm:table-cell">#{r.visitor}</td>
                  <td className="px-4 py-3 text-right text-micro tabular-nums">{r.messages}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-4">
            <EmptyState title={q ? "Nothing matches that search" : "No conversations yet"}>
              {q ? "Try a shorter word." : "Questions typed into the site terminal show up here."}
            </EmptyState>
          </div>
        )}
      </Panel>

      {pages > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-between">
          {page > 1 ? (
            <Link href={link(page - 1)} className={btn("ghost", "sm")}>
              ← Newer
            </Link>
          ) : (
            <span />
          )}
          {page < pages && (
            <Link href={link(page + 1)} className={btn("ghost", "sm")}>
              Older →
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
