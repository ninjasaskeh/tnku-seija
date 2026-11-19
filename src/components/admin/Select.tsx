"use client";

import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { type KeyboardEvent, type ReactNode, useId, useState } from "react";
import Select, { type ClassNamesConfig, type GroupBase } from "react-select";
import CreatableSelect from "react-select/creatable";

/*
 * react-select pake emotion. Defaultnya emotion nyelipin <style> inline waktu SSR tapi nggak di client,
 * jadi React 19 protes hydration mismatch. `compat = true` (mode extract-critical emotion) bikin server
 * nggak nge-render <style> sama sekali; style-nya baru dimasukin ke <head> di client. Markup server &
 * client jadi sama persis. Efeknya: sebelum hydrate, layout dasar react-select belum ada (sekejap).
 */
const emotionCache = createCache({ key: "rs", prepend: true });
emotionCache.compat = true;
const Emotion = ({ children }: { children: ReactNode }) => <CacheProvider value={emotionCache}>{children}</CacheProvider>;

/*
 * react-select dengan gaya admin (mode `unstyled` + class Tailwind dari token tema).
 * Nilainya ikut terkirim di <form> lewat input tersembunyi (prop `name`),
 * jadi bisa langsung dipake di Server Action tanpa state tambahan.
 */

type Opt = { value: string; label: string };

function classNames<IsMulti extends boolean>(): ClassNamesConfig<Opt, IsMulti, GroupBase<Opt>> {
  return {
    control: ({ isFocused }) =>
      `mt-1.5 min-h-10 border bg-ink px-2 transition-colors ${isFocused ? "border-acid" : "border-line hover:border-ash/60"}`,
    valueContainer: () => "gap-1.5 py-1.5",
    placeholder: () => "text-ash/50",
    input: () => "text-paper",
    singleValue: () => "text-paper",
    multiValue: () => "border border-line bg-line/50",
    multiValueLabel: () => "px-1.5 py-0.5 text-small text-paper",
    multiValueRemove: () => "px-1 text-ash hover:bg-violet hover:text-ink",
    indicatorsContainer: () => "gap-1 text-ash",
    clearIndicator: () => "p-1 hover:text-violet",
    dropdownIndicator: () => "p-1 hover:text-acid",
    indicatorSeparator: () => "hidden",
    menu: () => "mt-1 border border-line bg-ink shadow-[0_12px_32px_rgb(0_0_0/0.6)]",
    menuList: () => "py-1",
    option: ({ isFocused, isSelected }) =>
      `cursor-pointer px-3 py-2 text-small ${isSelected ? "bg-acid font-bold text-ink" : isFocused ? "bg-line text-paper" : "text-paper"}`,
    noOptionsMessage: () => "px-3 py-2 text-small text-ash",
  };
}

/** Dropdown satu pilihan. */
export function SelectField({
  label,
  name,
  options,
  defaultValue,
}: {
  label: string;
  name: string;
  options: Opt[];
  defaultValue?: string;
}) {
  const id = useId();
  return (
    <div className="text-small">
      <label htmlFor={`${id}-input`} className="text-ash">
        {label}
      </label>
      <Emotion>
        <Select<Opt, false>
          instanceId={id}
          inputId={`${id}-input`}
          name={name}
          options={options}
          defaultValue={options.find((o) => o.value === defaultValue) ?? options[0]}
          isSearchable={false}
          unstyled
          classNames={classNames<false>()}
        />
      </Emotion>
    </div>
  );
}

const toOpt = (v: string): Opt => ({ value: v, label: v });

/**
 * Input tag (bebas ketik): Enter / Tab / koma = jadi chip. Nilai dikirim sebagai satu input
 * tersembunyi berisi "a,b,c" (prop `delimiter`), cocok sama parser koma di Server Action.
 */
export function TagField({
  label,
  name,
  defaultValue = [],
  placeholder,
  hint,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string[];
  placeholder?: string;
  hint?: string;
  required?: boolean;
}) {
  const id = useId();
  const [value, setValue] = useState<readonly Opt[]>(defaultValue.map(toOpt));
  const [input, setInput] = useState("");

  const commit = () => {
    const v = input.replace(/,/g, " ").trim();
    if (v && !value.some((o) => o.value.toLowerCase() === v.toLowerCase())) setValue([...value, toOpt(v)]);
    setInput("");
  };
  const onKeyDown = (e: KeyboardEvent) => {
    if (!input) return;
    if (e.key === "Enter" || e.key === "Tab" || e.key === ",") {
      commit();
      e.preventDefault();
    }
  };

  return (
    <div className="text-small">
      <label htmlFor={`${id}-input`} className="text-ash">
        {label}
        {required && <span className="text-acid"> *</span>}
      </label>
      <Emotion>
        <CreatableSelect<Opt, true>
          instanceId={id}
          inputId={`${id}-input`}
          name={name}
          delimiter=","
          isMulti
          isClearable
          menuIsOpen={false}
          components={{ DropdownIndicator: null }}
          inputValue={input}
          value={value}
          onChange={(v) => setValue(v)}
          onInputChange={(v) => setInput(v)}
          onKeyDown={onKeyDown}
          onBlur={commit}
          placeholder={placeholder}
          unstyled
          classNames={classNames<true>()}
        />
      </Emotion>
      {hint && <span className="mt-1 block text-micro text-ash">{hint}</span>}
    </div>
  );
}
