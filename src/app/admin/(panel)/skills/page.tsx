import { Suspense } from "react";
import { saveSkills } from "@/app/admin/actions";
import { ActionForm } from "@/components/admin/ActionForm";
import { SkillsEditor } from "@/components/admin/SkillsEditor";
import { FormSkeleton } from "@/components/admin/skeletons";
import { PageHeader, Panel } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export default function SkillsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        kicker="~/skills"
        title="Skills"
        description="Rows of the SELECT … FROM skills table in the Query hop. Group names become the WHERE filters."
      />
      <Suspense fallback={<FormSkeleton label="Loading skills" fields={4} />}>
        <SkillsForm />
      </Suspense>
    </div>
  );
}

async function SkillsForm() {
  await requireAdmin();
  const groups = await db().skillGroup.findMany({ orderBy: [{ order: "asc" }, { id: "asc" }] });
  return (
    <Panel title="Skill groups" subtitle="Order here = order on the site">
      <ActionForm action={saveSkills} submit="Save skills">
        <SkillsEditor initial={groups.map((g) => ({ name: g.name, items: g.items }))} />
      </ActionForm>
    </Panel>
  );
}
