"use client";

import { type ReactNode, useActionState } from "react";
import type { ActionState } from "@/app/admin/actions";
import { btn, cx } from "./ui";

type Props = {
  action: (state: ActionState, form: FormData) => Promise<ActionState>;
  submit: string;
  children: ReactNode;
  className?: string;
  danger?: boolean;
  /** isi tambahan di bar tombol (kiri), mis. tombol batal */
  aside?: ReactNode;
};

/** Form admin: kirim ke Server Action, status sukses/error tampil di bar tombol. */
export function ActionForm({ action, submit, children, className, danger = false, aside }: Props) {
  const [state, run, pending] = useActionState(action, null);
  return (
    <form action={run} className={className} aria-busy={pending}>
      {children}
      <div className="mt-5 flex flex-wrap items-center justify-end gap-3 border-t border-line pt-4">
        <p role="status" className="mr-auto text-small">
          {state?.ok && <span className="text-acid">✓ {state.ok}</span>}
          {state?.error && <span className="text-violet">✕ {state.error}</span>}
        </p>
        {aside}
        <button type="submit" disabled={pending} className={btn(danger ? "danger" : "primary")}>
          {pending && <span aria-hidden="true" className="size-3 animate-spin border-2 border-current border-t-transparent" />}
          {pending ? "Saving…" : submit}
        </button>
      </div>
    </form>
  );
}

const inputCls =
  "mt-1.5 block w-full border border-line bg-ink px-3 py-2 text-paper placeholder:text-ash/50 transition-colors hover:border-ash/60 focus:border-acid focus:outline-none";

/** Label + input standar admin. */
export function Field({
  label,
  name,
  defaultValue,
  hint,
  type = "text",
  rows,
  required,
  placeholder,
  className,
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  hint?: string;
  type?: string;
  rows?: number;
  required?: boolean;
  placeholder?: string;
  className?: string;
}) {
  return (
    <label className={cx("block text-small", className)}>
      <span className="text-ash">
        {label}
        {required && <span className="text-acid"> *</span>}
      </span>
      {rows ? (
        <textarea
          name={name}
          defaultValue={defaultValue ?? ""}
          rows={rows}
          required={required}
          placeholder={placeholder}
          className={cx(inputCls, "resize-y leading-relaxed")}
        />
      ) : (
        <input
          name={name}
          type={type}
          defaultValue={defaultValue ?? ""}
          required={required}
          placeholder={placeholder}
          className={inputCls}
        />
      )}
      {hint && <span className="mt-1 block text-micro text-ash">{hint}</span>}
    </label>
  );
}
