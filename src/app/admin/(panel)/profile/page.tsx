import { Suspense } from "react";
import { saveProfile } from "@/app/admin/actions";
import { ActionForm, Field } from "@/components/admin/ActionForm";
import { FormSkeleton } from "@/components/admin/skeletons";
import { PageHeader, Panel } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import type { Fact, Social } from "@/lib/content-types";
import { db } from "@/lib/db";

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        kicker="~/profile"
        title="Profile"
        description="Who the request reaches. Shown in the hero, the handshake, the response headers, and used by the AI terminal."
      />
      <Suspense fallback={<FormSkeleton label="Loading profile" fields={8} />}>
        <ProfileForm />
      </Suspense>
    </div>
  );
}

const asList = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

async function ProfileForm() {
  await requireAdmin();
  const p = await db().profile.findUnique({ where: { id: 1 } });

  return (
    <ActionForm action={saveProfile} submit="Save profile">
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Identity" subtitle="Hero, URL bar, certificate subject">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" name="name" defaultValue={p?.name} required />
            <Field label="Role" name="role" defaultValue={p?.role} required placeholder="Fullstack Developer" />
            <Field label="Domain" name="domain" defaultValue={p?.domain} required hint="Shown as GET yourname.dev/…" />
            <Field label="Location" name="location" defaultValue={p?.location} />
            <Field label="Email" name="email" type="email" defaultValue={p?.email} required className="sm:col-span-2" />
            <Field label="Timezone" name="timezone" defaultValue={p?.timezone ?? "Asia/Jakarta"} hint="IANA name, e.g. Asia/Jakarta" />
            <Field label="Timezone label" name="timezoneLabel" defaultValue={p?.timezoneLabel ?? "WIB"} />
          </div>
        </Panel>

        <Panel title="Story" subtitle="Hero tagline and the SYN-ACK bio">
          <div className="space-y-4">
            <Field label="Tagline" name="tagline" defaultValue={p?.tagline} rows={2} />
            <Field
              label="Bio"
              name="bio"
              defaultValue={p?.bio.join("\n\n")}
              rows={8}
              hint="Blank line between paragraphs. The first paragraph is the big one."
            />
          </div>
        </Panel>

        <Panel title="Certificate facts" subtitle="Rows in the handshake certificate">
          <Field
            label="Facts"
            name="facts"
            rows={6}
            defaultValue={asList<Fact>(p?.facts)
              .map((f) => `${f.label} | ${f.value}`)
              .join("\n")}
            hint="One per line: Label | Value"
            placeholder={"Role | Fullstack Developer\nStatus | Open to new projects"}
          />
        </Panel>

        <Panel title="Links" subtitle="Response Link headers + buttons">
          <Field
            label="Links"
            name="socials"
            rows={6}
            defaultValue={asList<Social>(p?.socials)
              .map((s) => `${s.label} | ${s.href}`)
              .join("\n")}
            hint="One per line: Label | https://…"
            placeholder="GitHub | https://github.com/you"
          />
        </Panel>
      </div>
    </ActionForm>
  );
}
