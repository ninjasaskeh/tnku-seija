import { Suspense } from "react";
import { deleteReference, saveReference } from "@/app/admin/actions";
import { ActionForm, Field } from "@/components/admin/ActionForm";
import { SelectField, TagField } from "@/components/admin/Select";
import { ListSkeleton } from "@/components/admin/skeletons";
import { Badge, EmptyState, PageHeader, Panel } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

const KIND_LABEL: Record<string, string> = { public: "Public figure", friend: "Friend", other: "Other" };

export default function EasterEggsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        kicker="~/ai.lore"
        title="Easter eggs"
        description="People the AI terminal recognises when a visitor mentions them: public figures and friends. Names and nicknames trigger it; your note decides what it says."
      />
      <Suspense fallback={<ListSkeleton label="Loading easter eggs" rows={6} />}>
        <List />
      </Suspense>
    </div>
  );
}

type Row = Awaited<ReturnType<ReturnType<typeof db>["reference"]["findMany"]>>[number];

async function List() {
  await requireAdmin();
  const rows = (await db().reference.findMany()).sort((a, b) =>
    (a.names[0] ?? "").localeCompare(b.names[0] ?? "", "en", { sensitivity: "base" }),
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <Panel title="Add someone" subtitle="Takes effect in the chat right after saving">
          <EggForm />
        </Panel>
        <Panel title="How the AI uses this">
          <ul className="space-y-2 text-small text-ash">
            <li>
              <span className="text-paper">Public figure:</span> uses your note as the facts, can be playful with
              nicknames, but no political opinions or insults.
            </li>
            <li>
              <span className="text-paper">Friend:</span> warm and in on the joke, using only your note. Don&apos;t put
              private details (address, phone, anything they wouldn&apos;t want public): anyone can ask the AI.
            </li>
            <li>
              <span className="text-paper">Other:</span> just follows your note.
            </li>
          </ul>
        </Panel>
      </div>

      <Panel title={`Entries (${rows.length})`} bodyClassName="p-0">
        {rows.length ? (
          <ul className="divide-y divide-line">
            {rows.map((r) => (
              <li key={r.id}>
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 hover:bg-line/40">
                    <span aria-hidden="true" className="text-ash group-open:rotate-90">
                      ▸
                    </span>
                    <span className="font-bold">{r.names[0]}</span>
                    {r.names.length > 1 && (
                      <span className="truncate text-micro text-ash">aka {r.names.slice(1).join(", ")}</span>
                    )}
                    <span className="ml-auto flex shrink-0 gap-1.5">
                      <Badge tone={r.kind === "friend" ? "accent" : "neutral"}>{KIND_LABEL[r.kind] ?? r.kind}</Badge>
                      {!r.enabled && <Badge tone="warn">Off</Badge>}
                    </span>
                  </summary>
                  <div className="space-y-4 border-t border-line bg-ink px-4 py-4">
                    <EggForm row={r} />
                    <ActionForm action={deleteReference} submit="Delete" danger>
                      <input type="hidden" name="id" value={r.id} />
                      <label className="flex items-center gap-2 text-small text-ash">
                        <input type="checkbox" name="confirm" required /> Delete {r.names[0]}
                      </label>
                    </ActionForm>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-4">
            <EmptyState title="No easter eggs yet">
              Add a public figure or a friend above, then ask the terminal about them.
            </EmptyState>
          </div>
        )}
      </Panel>
    </div>
  );
}

function EggForm({ row }: { row?: Row }) {
  return (
    <ActionForm action={saveReference} submit={row ? "Save" : "Add"}>
      <input type="hidden" name="id" value={row?.id ?? ""} />
      <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
        <TagField
          label="Names & nicknames"
          name="names"
          defaultValue={row?.names}
          required
          placeholder="Type a name, press Enter"
          hint="Press Enter (or comma) after each one. The first one is the main name."
        />
        <SelectField
          label="Type"
          name="kind"
          defaultValue={row?.kind ?? "public"}
          options={[
            { value: "public", label: "Public figure" },
            { value: "friend", label: "Friend" },
            { value: "other", label: "Other" },
          ]}
        />
        <Field
          label="Note for the AI"
          name="note"
          defaultValue={row?.note}
          rows={3}
          required
          className="sm:col-span-2"
          placeholder="Facts to use and how to react. E.g. 'Current President of Indonesia. Answer respectfully, a light joke about the nickname is fine.'"
          hint="Max 500 characters. Facts here override what the AI thinks it knows."
        />
        <label className="flex items-center gap-2 text-small">
          <input type="checkbox" name="enabled" defaultChecked={row?.enabled ?? true} /> Active
        </label>
      </div>
    </ActionForm>
  );
}
