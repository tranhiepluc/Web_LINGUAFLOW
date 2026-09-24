"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";

export interface SearchInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  debounceMs?: number;
  onSearch?: (value: string) => void;
  className?: string;
  size?: "default" | "lg";
  autoFocus?: boolean;
  label?: string;
}

export function SearchInput({
  placeholder = "Nhập từ cần tìm...",
  value: controlledValue,
  onChange,
  debounceMs = 250,
  onSearch,
  className,
  size = "default",
  autoFocus,
  label,
}: SearchInputProps) {
  const [internal, setInternal] = React.useState(controlledValue ?? "");
  const debounced = useDebounce(internal, debounceMs);

  const value = controlledValue ?? internal;

  React.useEffect(() => {
    if (controlledValue !== undefined && controlledValue !== internal) {
      setInternal(controlledValue);
    }
  }, [controlledValue]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    onChange?.(debounced);
  }, [debounced]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        value={value}
        aria-label={label ?? "Tìm kiếm"}
        placeholder={placeholder}
        autoFocus={autoFocus}
        onChange={(e) => setInternal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSearch?.(value);
        }}
        className={cn(
          "w-full appearance-none rounded-2xl border border-border bg-card pl-10 text-foreground shadow-sm outline-none transition-all placeholder:text-muted-foreground focus:ring-2 focus:ring-ring",
          size === "lg" ? "h-12 pr-10 text-base" : "h-10 pr-9 text-sm",
        )}
      />
      {value && (
        <button
          type="button"
          aria-label="Xóa"
          onClick={() => {
            setInternal("");
            onChange?.("");
            onSearch?.("");
          }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}