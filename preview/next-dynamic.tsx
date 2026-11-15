// Pengganti next/dynamic buat build preview: cukup React.lazy + Suspense.
import { type ComponentType, lazy, Suspense } from "react";

export default function dynamic<P extends object>(loader: () => Promise<{ default: ComponentType<P> }>) {
  const Lazy = lazy(loader);
  return function Dynamic(props: P) {
    return (
      <Suspense fallback={null}>
        <Lazy {...props} />
      </Suspense>
    );
  };
}
