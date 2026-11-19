import { Suspense } from "react";
import { saveExperience } from "@/app/admin/actions";
import { ActionForm } from "@/components/admin/ActionForm";
import { ExperienceEditor } from "@/components/admin/ExperienceEditor";
import { FormSkeleton } from "@/components/admin/skeletons";
import { EmptyState, PageHeader, Panel } from "@/components/admin/ui";
import { EXPERIENCE_KINDS, type Experience, type ExperienceKind } from "@/lib/content-types";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export default function ExperiencePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        kicker="~/access.log"
        title="Experience"
        description="Your work history, shown in the Logs hop as lines of an access log (current job = 200 OK, past ones = 301). The AI terminal reads it too."
      />
      <Suspense fallback={<FormSkeleton label="Loading experience" fields={8} />}>
        <ExperienceForm />
      </Suspense>
    </div>
  );
}

async function ExperienceForm() {
  await requireAdmin();
  const rows = await db()
    .experience.findMany({ orderBy: [{ order: "asc" }, { id: "asc" }] })
    .catch(() => null);

  if (!rows) {
    return (
      <EmptyState title="The Experience table does not exist yet">
        Run the database migration first (npm run db:migrate locally, npm run db:deploy in production), then reload
        this page.
      </EmptyState>
    );
  }

  const initial: Experience[] = rows.map((r) => ({
    company: r.company,
    role: r.role,
    kind: (EXPERIENCE_KINDS as readonly string[]).includes(r.kind) ? (r.kind as ExperienceKind) : "full-time",
    location: r.location,
    start: r.start,
    end: r.end ?? undefined,
    summary: r.summary,
    highlights: r.highlights,
    stack: r.stack,
    url: r.url ?? undefined,
  }));

  return (
    <Panel title="Entries" subtitle="Newest on top. Order here = order on the site. Empty cards are skipped.">
      <ActionForm action={saveExperience} submit="Save experience">
        <ExperienceEditor initial={initial} />
      </ActionForm>
    </Panel>
  );
}
