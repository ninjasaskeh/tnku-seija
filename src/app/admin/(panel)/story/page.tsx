import { Suspense } from "react";
import { saveStory } from "@/app/admin/actions";
import { ActionForm } from "@/components/admin/ActionForm";
import { FormSkeleton } from "@/components/admin/skeletons";
import { StoryEditor } from "@/components/admin/StoryEditor";
import { PageHeader, Panel } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export default function StoryPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        kicker="~/keep-alive"
        title="Story"
        description="Your journey, shown in the Keep-Alive hop as a heartbeat timeline. The AI terminal reads it too, so visitors can ask how you got here."
      />
      <Suspense fallback={<FormSkeleton label="Loading story" fields={6} />}>
        <StoryForm />
      </Suspense>
    </div>
  );
}

async function StoryForm() {
  await requireAdmin();
  const p = await db().profile.findUnique({ where: { id: 1 }, select: { story: true } });
  return (
    <Panel
      title="Beats"
      subtitle="One paragraph per beat, top to bottom. 2–3 sentences each reads best. Empty beats are skipped."
    >
      <ActionForm action={saveStory} submit="Save story">
        <StoryEditor initial={p?.story ?? []} />
      </ActionForm>
    </Panel>
  );
}
