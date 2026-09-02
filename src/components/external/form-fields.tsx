import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { label as prettify } from "@/components/external/badges";

export const NONE = "__none__";

export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className ?? "space-y-1.5"}>
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

export function EnumSelect({
  value,
  onChange,
  options,
  placeholder = "Pilih…",
  emptyLabel,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  options: readonly { value: string; label: string }[] | readonly string[];
  placeholder?: string;
  emptyLabel?: string;
  disabled?: boolean;
}) {
  const items = (options as readonly unknown[]).map((o) =>
    typeof o === "string" ? { value: o, label: prettify(o) } : (o as { value: string; label: string }),
  );
  return (
    <Select value={value || NONE} onValueChange={onChange} disabled={disabled ?? false}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>

      <SelectContent>
        {emptyLabel && <SelectItem value={NONE}>{emptyLabel}</SelectItem>}
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
