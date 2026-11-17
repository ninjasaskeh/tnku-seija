import Link from "next/link";
import { Suspense } from "react";
import { ProjectThumb } from "@/components/ProjectThumb";
import { GridSkeleton } from "@/components/admin/skeletons";
import { Badge, btn, PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        kicker="~/routes"
        title="Projects"
        description="Each project is a route in the Routes hop. Lower order shows first and sets the /01, /02 numbers the 3D blocks form."
        actions={
          <Link href="/admin/projects/new" className={btn("primary")}>
            + New project
          </Link>
        }
      />
      <Suspense fallback={<GridSkeleton />}>
        <Grid />
      </Suspense>
    </div>
  );
}

async function Grid() {
  await requireAdmin();
  const projects = await db().project.findMany({ orderBy: [{ order: "asc" }, { id: "asc" }] });
  let n = 0;

  return (
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {projects.map((p, i) => {
        const route = p.published ? `/${String(++n).padStart(2, "0")}` : "hidden";
        return (
          <li key={p.id}>
            <Link
              href={`/admin/projects/${p.id}`}
              className="group block border border-line bg-ink transition-colors hover:border-acid focus-visible:border-acid focus-visible:outline-none"
            >
              <div className="relative">
                <ProjectThumb
                  project={{
                    slug: p.slug,
                    title: p.title,
                    year: p.year,
                    role: p.role,
                    description: p.description,
                    stack: p.stack,
                    links: {},
                    thumbnail: p.thumbnail ?? undefined,
                  }}
                  index={i}
                  className="aspect-[16/9]"
                />
                <span className="absolute left-2 top-2 bg-ink px-1.5 py-0.5 text-micro font-bold text-acid">{route}</span>
              </div>
              <div className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-bold group-hover:text-acid">{p.title}</h2>
                  {!p.published && <Badge tone="warn">Hidden</Badge>}
                </div>
                <p className="text-micro text-ash">
                  /projects/{p.slug} · {p.year} · {p.role}
                </p>
                <ul className="flex flex-wrap gap-1.5 pt-1">
                  {p.stack.slice(0, 4).map((s) => (
                    <li key={s} className="border border-line px-1.5 py-px text-micro text-ash">
                      {s}
                    </li>
                  ))}
                  {p.stack.length > 4 && <li className="text-micro text-ash">+{p.stack.length - 4}</li>}
                </ul>
              </div>
            </Link>
          </li>
        );
      })}
      <li>
        <Link
          href="/admin/projects/new"
          className="grid h-full min-h-56 place-items-center border border-dashed border-line text-ash transition-colors hover:border-acid hover:text-acid"
        >
          <span className="text-center">
            <span className="block text-h3">+</span>
            New project
          </span>
        </Link>
      </li>
    </ul>
  );
}
