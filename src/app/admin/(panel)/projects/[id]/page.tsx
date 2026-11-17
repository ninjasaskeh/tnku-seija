import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { deleteProject, saveProject } from "@/app/admin/actions";
import { ActionForm, Field } from "@/components/admin/ActionForm";
import { FormSkeleton } from "@/components/admin/skeletons";
import { ThumbnailInput } from "@/components/admin/ThumbnailInput";
import { Badge, PageHeader, Panel } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { storageConfigured } from "@/lib/storage";

/** /admin/projects/new = project baru, /admin/projects/<id> = edit. */
export default function ProjectEditPage({ params }: PageProps<"/admin/projects/[id]">) {
  return (
    <div className="space-y-6">
      <Link href="/admin/projects" className="text-small text-ash hover:text-acid">
        ← All projects
      </Link>
      <Suspense fallback={<FormSkeleton label="Loading project" fields={8} />}>
        <Editor params={params} />
      </Suspense>
    </div>
  );
}

async function Editor({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const isNew = id === "new";
  const p = isNew ? null : await db().project.findUnique({ where: { id: Number(id) || -1 } });
  if (!isNew && !p) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        kicker={isNew ? "~/routes/new" : `~/routes/${p!.slug}`}
        title={isNew ? "New project" : p!.title}
        description={isNew ? "Add a route to the Routes hop." : `GET /projects/${p!.slug}`}
        actions={!isNew && (p!.published ? <Badge tone="accent">Live</Badge> : <Badge tone="warn">Hidden</Badge>)}
      />

      <ActionForm action={saveProject} submit={isNew ? "Create project" : "Save project"}>
        <input type="hidden" name="id" value={p?.id ?? ""} />
        <div className="space-y-6">
          <Panel title="Details">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Title" name="title" defaultValue={p?.title} required />
              <Field label="Slug" name="slug" defaultValue={p?.slug} required hint="lowercase-with-dashes, used in /projects/slug" />
              <Field label="Year" name="year" defaultValue={p?.year ?? String(new Date().getFullYear())} />
              <Field label="Role" name="role" defaultValue={p?.role} placeholder="Fullstack" />
              <Field
                label="Description"
                name="description"
                defaultValue={p?.description}
                rows={4}
                required
                className="sm:col-span-2"
                hint="One or two sentences: the problem, your part, the result. The AI terminal reads this too."
              />
              <Field label="Stack" name="stack" defaultValue={p?.stack.join(", ")} hint="Comma separated" className="sm:col-span-2" />
            </div>
          </Panel>

          <Panel title="Thumbnail" subtitle="Shown in the Response panel of the route">
            <ThumbnailInput current={p?.thumbnail ?? null} canUpload={storageConfigured()} />
          </Panel>

          <Panel title="Links & visibility">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Live URL" name="liveUrl" defaultValue={p?.liveUrl} placeholder="https://…" />
              <Field label="Repo URL" name="repoUrl" defaultValue={p?.repoUrl} placeholder="https://github.com/…" />
              <Field label="Order" name="order" type="number" defaultValue={p?.order ?? 99} hint="Lower shows first" />
              <label className="flex items-center gap-2 self-center pt-4 text-small">
                <input type="checkbox" name="published" defaultChecked={p?.published ?? true} /> Show on the site
              </label>
            </div>
          </Panel>
        </div>
      </ActionForm>

      {!isNew && (
        <Panel title="Danger zone" subtitle="Deletes the project and its uploaded image.">
          <ActionForm action={deleteProject} submit="Delete project" danger>
            <input type="hidden" name="id" value={p!.id} />
            <label className="flex items-center gap-2 text-small text-ash">
              <input type="checkbox" name="confirm" required /> Yes, permanently delete &quot;{p!.title}&quot;
            </label>
          </ActionForm>
        </Panel>
      )}
    </div>
  );
}
