import type { ReactNode } from "react";
import { Loading, Skeleton } from "./ui";

/*
 * Skeleton loading: bentuknya niru layout halaman aslinya, biar pas data masuk
 * nggak ada lompatan layout. Dipake sebagai fallback <Suspense>.
 */

function PanelSkeleton({ children, title = true }: { children: ReactNode; title?: boolean }) {
  return (
    <div className="border border-line">
      {title && (
        <div className="border-b border-line px-4 py-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-2 h-2.5 w-48" />
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <Loading label="Loading dashboard">
      <div className="space-y-6">
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-8 w-20" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="space-y-3 bg-ink p-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-28" />
              <Skeleton className="h-3 w-36" />
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
        </div>
        <PanelSkeleton>
          <div className="flex h-44 items-end gap-0.5">
            {Array.from({ length: 30 }, (_, i) => (
              <Skeleton key={i} className="flex-1" style={{ height: `${20 + ((i * 37) % 70)}%` }} />
            ))}
          </div>
        </PanelSkeleton>
        <div className="grid gap-6 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <PanelSkeleton key={i}>
              <BarsSkeleton rows={5} />
            </PanelSkeleton>
          ))}
        </div>
        <PanelSkeleton>
          <RowsSkeleton rows={5} />
        </PanelSkeleton>
      </div>
    </Loading>
  );
}

function BarsSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="space-y-1.5">
          <div className="flex justify-between">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-8" />
          </div>
          <Skeleton className="h-2" style={{ width: `${95 - i * 15}%` }} />
        </div>
      ))}
    </div>
  );
}

function RowsSkeleton({ rows }: { rows: number }) {
  return (
    <div className="divide-y divide-line">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 py-3">
          <Skeleton className="h-3 w-16 shrink-0" />
          <Skeleton className="h-3 flex-1" style={{ maxWidth: `${70 - (i % 3) * 15}%` }} />
          <Skeleton className="h-3 w-12 shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ label = "Loading list", rows = 8 }: { label?: string; rows?: number }) {
  return (
    <Loading label={label}>
      <PanelSkeleton title={false}>
        <RowsSkeleton rows={rows} />
      </PanelSkeleton>
    </Loading>
  );
}

export function TranscriptSkeleton() {
  return (
    <Loading label="Loading conversation">
      <div className="space-y-5">
        <Skeleton className="h-3 w-64" />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={i % 2 ? "mr-auto w-4/5" : "ml-auto w-3/5"}>
            <Skeleton className="mb-1.5 h-2.5 w-24" />
            <Skeleton className={i % 2 ? "h-20" : "h-10"} />
          </div>
        ))}
      </div>
    </Loading>
  );
}

export function FormSkeleton({ label = "Loading form", fields = 6 }: { label?: string; fields?: number }) {
  return (
    <Loading label={label}>
      <div className="grid gap-6 lg:grid-cols-2">
        {[0, 1].map((p) => (
          <PanelSkeleton key={p}>
            <div className="space-y-4">
              {Array.from({ length: fields / 2 }, (_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className={i === 2 ? "h-20" : "h-9"} />
                </div>
              ))}
            </div>
          </PanelSkeleton>
        ))}
      </div>
    </Loading>
  );
}

export function GridSkeleton({ label = "Loading projects", cards = 4 }: { label?: string; cards?: number }) {
  return (
    <Loading label={label}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: cards }, (_, i) => (
          <div key={i} className="border border-line">
            <Skeleton className="aspect-[16/9]" />
            <div className="space-y-2 p-4">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
              <div className="flex gap-1.5 pt-1">
                <Skeleton className="h-5 w-14" />
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-12" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Loading>
  );
}

export function UserSkeleton() {
  return (
    <div className="flex items-center gap-2.5">
      <Skeleton className="size-8 shrink-0" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-2.5 w-32" />
      </div>
    </div>
  );
}
