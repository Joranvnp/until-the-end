import { useEffect, useMemo, useState } from "react";

type SearchableItem = { label: string; hint: string };

export function useCommandSearch<T extends SearchableItem>(items: readonly T[]) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) =>
      `${item.label} ${item.hint}`.toLowerCase().includes(term),
    );
  }, [items, search]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  return { open, setOpen, search, setSearch, filtered };
}
