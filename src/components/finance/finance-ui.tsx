import { cn } from "@/lib/utils";
import { label } from "@/components/external/badges";
import { rupiah } from "@/lib/format";

const BASE = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold";

const BUDGET_STATUS_CLASS: Record<string, string> = {
  On_Budget: "bg-green-100 text-green-700",
  Warning: "bg-yellow-100 text-yellow-800",
  Over_Budget: "bg-red-100 text-red-700",
};

export const BudgetStatusBadge = ({ value }: { value?: string | null }) =>
  value ? (
    <span className={cn(BASE, BUDGET_STATUS_CLASS[value] ?? "bg-muted")}>{label(value)}</span>
  ) : (
    <span className="text-xs text-muted-foreground">-</span>
  );

export const CategoryBadge = ({ value }: { value?: string | null }) =>
  value ? (
    <span className={cn(BASE, "bg-gray-200 text-gray-700")}>{value}</span>
  ) : null;

export function budgetStatusOf(spent: number, allocated: number) {
  if (allocated <= 0) return "On_Budget";
  const ratio = spent / allocated;
  if (ratio >= 1) return "Over_Budget";
  if (ratio >= 0.8) return "Warning";
  return "On_Budget";
}

const BAR_CLASS: Record<string, string> = {
  On_Budget: "bg-green-500",
  Warning: "bg-yellow-500",
  Over_Budget: "bg-red-500",
};

export function BudgetProgress({
  spent,
  allocated,
  status,
}: {
  spent: number;
  allocated: number;
  status?: string | null;
}) {
  const effective = status ?? budgetStatusOf(spent, allocated);
  const pct = allocated > 0 ? Math.round((spent / allocated) * 100) : 0;
  const width = Math.min(100, Math.max(pct, spent > 0 ? 4 : 0));
  return (
    <div className="relative h-8 w-full overflow-hidden rounded-lg bg-muted">
      <div
        className={cn("h-full transition-all", BAR_CLASS[effective] ?? "bg-primary")}
        style={{ width: `${width}%` }}
      />
      <span className="absolute inset-0 flex items-center justify-center px-2 text-center text-[11px] font-semibold text-foreground sm:text-xs">
        {rupiah(spent)} / {rupiah(allocated)} ({pct}%)
      </span>
    </div>
  );
}
