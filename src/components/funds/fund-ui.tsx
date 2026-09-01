import { cn } from "@/lib/utils";
import { label } from "@/components/external/badges";
import { rupiah } from "@/lib/format";

const BASE = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold";

export const FUND_URGENCIES = ["Normal", "Urgent", "Emergency"] as const;
export const FUND_STATUSES = [
  "Draft",
  "Submitted",
  "Under_Review",
  "Approved",
  "Rejected",
  "Disbursed",
  "Reported",
] as const;

const URGENCY_CLASS: Record<string, string> = {
  Normal: "bg-gray-200 text-gray-700",
  Urgent: "bg-yellow-100 text-yellow-800",
  Emergency: "bg-red-100 text-red-700",
};

const STATUS_CLASS: Record<string, string> = {
  Draft: "bg-gray-200 text-gray-700",
  Submitted: "bg-sky-100 text-sky-700",
  Under_Review: "bg-yellow-100 text-yellow-800",
  Approved: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
  Disbursed: "bg-blue-100 text-blue-700",
  Reported: "bg-emerald-100 text-emerald-800",
};

export const FundUrgencyBadge = ({ value }: { value?: string | null }) =>
  value ? (
    <span className={cn(BASE, URGENCY_CLASS[value] ?? "bg-muted")}>{label(value)}</span>
  ) : (
    <span className="text-xs text-muted-foreground">-</span>
  );

export const FundStatusBadge = ({ value }: { value?: string | null }) =>
  value ? (
    <span className={cn(BASE, STATUS_CLASS[value] ?? "bg-muted")}>{label(value)}</span>
  ) : (
    <span className="text-xs text-muted-foreground">-</span>
  );

export function digitsToNumber(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits ? Number(digits) : 0;
}

export function RupiahInput({
  value,
  onChange,
  placeholder = "Rp 0",
  id,
}: {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  id?: string;
}) {
  return (
    <input
      id={id}
      inputMode="numeric"
      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      value={value ? rupiah(value) : ""}
      placeholder={placeholder}
      onChange={(e) => onChange(digitsToNumber(e.target.value))}
    />
  );
}

const STEPS = ["Draft", "Submitted", "Under_Review", "Approved", "Disbursed", "Reported"] as const;

export function StatusTimeline({ status }: { status: string }) {
  const rejected = status === "Rejected";
  const steps = rejected ? ["Draft", "Submitted", "Under_Review", "Rejected"] : [...STEPS];
  const currentIndex = steps.indexOf(status);
  return (
    <ol className="flex flex-wrap items-center gap-y-3">
      {steps.map((step, i) => {
        const done = currentIndex >= 0 && i <= currentIndex;
        const isRejectStep = step === "Rejected";
        return (
          <li key={step} className="flex items-center">
            <div className="flex flex-col items-center gap-1 px-1">
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-full text-xs font-bold",
                  done
                    ? isRejectStep
                      ? "bg-red-600 text-white"
                      : "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {i + 1}
              </span>
              <span
                className={cn(
                  "whitespace-nowrap text-[11px]",
                  done ? "font-semibold" : "text-muted-foreground",
                )}
              >
                {label(step)}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span
                className={cn("h-0.5 w-6 sm:w-10", done ? "bg-primary" : "bg-border")}
                aria-hidden
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function BreakdownTable({
  rows,
}: {
  rows: { item: string; qty: number; unit_price: number }[];
}) {
  if (rows.length === 0)
    return <p className="text-sm text-muted-foreground">Tidak ada rincian.</p>;
  const total = rows.reduce((s, r) => s + r.qty * r.unit_price, 0);
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-3 py-2 text-left">Item</th>
            <th className="px-3 py-2 text-right">Qty</th>
            <th className="px-3 py-2 text-right">Harga Satuan</th>
            <th className="px-3 py-2 text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t">
              <td className="px-3 py-2">{r.item || "-"}</td>
              <td className="px-3 py-2 text-right">{r.qty}</td>
              <td className="px-3 py-2 text-right">{rupiah(r.unit_price)}</td>
              <td className="px-3 py-2 text-right">{rupiah(r.qty * r.unit_price)}</td>
            </tr>
          ))}
          <tr className="border-t bg-muted/30 font-semibold">
            <td className="px-3 py-2" colSpan={3}>
              Total Rincian
            </td>
            <td className="px-3 py-2 text-right">{rupiah(total)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
