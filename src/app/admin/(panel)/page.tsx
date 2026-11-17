import Link from "next/link";
import { Suspense } from "react";
import { BarList, ColumnChart } from "@/components/admin/charts";
import { DashboardSkeleton } from "@/components/admin/skeletons";
import { StatTile } from "@/components/admin/StatTile";
import { cx, EmptyState, fmtNum, fmtUsd, PageHeader, Panel, timeAgo } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/session";
import { parseRange, RANGES, dashboardStats } from "@/lib/stats";

export default function OverviewPage({ searchParams }: PageProps<"/admin">) {
  return (
    <div className="space-y-6">
      <PageHeader
        kicker="~/overview"
        title="Network operations"
        description="Who's sending requests to your portfolio, how far they travel, and what they ask the terminal."
      />
      <Suspense fallback={<DashboardSkeleton />}>
        <Dashboard searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Dashboard({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const range = parseRange((await searchParams).range);
  const s = await dashboardStats(range);
  const period = `${range}d`;

  return (
    <div className="space-y-6">
      {/* satu filter, di atas semua angka yang dia atur */}
      <nav aria-label="Date range" className="flex flex-wrap items-center gap-1">
        {RANGES.map((r) => (
          <Link
            key={r}
            href={`/admin?range=${r}`}
            scroll={false}
            aria-current={r === range ? "true" : undefined}
            className={cx(
              "whitespace-nowrap border px-3 py-1.5 text-small",
              r === range ? "border-acid bg-acid font-bold text-ink" : "border-line text-ash hover:border-ash hover:text-paper",
            )}
          >
            <span className="max-sm:hidden">Last </span>
            {r} days
          </Link>
        ))}
      </nav>

      <div className="grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Visits"
          value={fmtNum(s.visits.current)}
          current={s.visits.current}
          previous={s.visits.previous}
          trend={s.visits.daily.map((d) => d.value)}
          periodLabel={period}
        />
        <StatTile
          label="Chat sessions"
          value={fmtNum(s.sessions.current)}
          current={s.sessions.current}
          previous={s.sessions.previous}
          periodLabel={period}
        />
        <StatTile
          label="AI answers"
          value={fmtNum(s.answers.current)}
          current={s.answers.current}
          previous={s.answers.previous}
          trend={s.answers.trend}
          periodLabel={period}
        />
        <StatTile
          label="AI cost (estimate)"
          value={fmtUsd(s.cost.current)}
          current={s.cost.current}
          previous={s.cost.previous}
          upIsGood={false}
          periodLabel={period}
        />
      </div>

      <Panel
        title="Visits per day"
        subtitle={`Unique visits (one per browser tab) · last ${range} days · hover or use arrow keys for exact numbers`}
      >
        {s.visits.current ? (
          <ColumnChart data={s.visits.daily} unit="visits" />
        ) : (
          <EmptyState title="No visits recorded yet">
            Visits appear here once people open the site (Do Not Track visitors are never counted).
          </EmptyState>
        )}
      </Panel>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="How far they travel" subtitle="Share of visits that reached each hop">
          <BarList rows={s.funnel} />
        </Panel>
        <Panel title="Devices" subtitle="By pointer & screen size">
          <BarList rows={s.devices} />
        </Panel>
        <Panel title="Top referrers" subtitle="Direct visits are not listed">
          <BarList rows={s.referrers} emptyLabel="No referrers yet." />
        </Panel>
      </div>

      <Panel
        title="Latest conversations"
        subtitle={`${fmtNum(s.tokens.inp)} tokens in · ${fmtNum(s.tokens.out)} out (last ${range} days)`}
        action={
          <Link href="/admin/conversations" className="text-small text-ash hover:text-acid">
            All →
          </Link>
        }
        bodyClassName="p-0"
      >
        {s.recent.length ? (
          <ul className="divide-y divide-line">
            {s.recent.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/admin/conversations/${c.id}`}
                  className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-line/40"
                >
                  <span className="w-16 shrink-0 text-micro text-ash">{timeAgo(c.at)}</span>
                  <span className="min-w-0 flex-1 truncate">{c.first || "(empty)"}</span>
                  <span className="shrink-0 text-micro text-ash tabular-nums">{c.messages} msgs</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-4">
            <EmptyState title="No conversations yet">Questions typed into the site terminal show up here.</EmptyState>
          </div>
        )}
      </Panel>
    </div>
  );
}
