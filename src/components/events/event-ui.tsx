import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { getSignedUrl } from "@/lib/storage";
import { label } from "@/components/external/badges";

const BASE = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold";

export const EVENT_TYPES = [
  "Flagship",
  "Workshop",
  "Talkshow",
  "Internal",
  "Competition",
  "Other",
] as const;

export const EVENT_STATUSES = ["Planning", "Preparation", "Live", "Done", "Cancelled"] as const;
export const FEE_STATUSES = ["Not_Applicable", "Pending", "Paid"] as const;
export const CONFIRMATION_STATUSES = ["Invited", "Confirmed", "Declined", "Cancelled"] as const;

const EVENT_TYPE_CLASS: Record<string, string> = {
  Flagship: "bg-purple-100 text-purple-700",
  Workshop: "bg-blue-100 text-blue-700",
  Talkshow: "bg-orange-100 text-orange-700",
  Internal: "bg-gray-200 text-gray-700",
  Competition: "bg-red-100 text-red-700",
  Other: "bg-gray-700 text-gray-100",
};

const EVENT_STATUS_CLASS: Record<string, string> = {
  Planning: "bg-gray-200 text-gray-700",
  Preparation: "bg-yellow-100 text-yellow-800",
  Live: "bg-green-100 text-green-700 animate-pulse",
  Done: "bg-blue-100 text-blue-700",
  Cancelled: "bg-red-100 text-red-700",
};

const CONFIRMATION_CLASS: Record<string, string> = {
  Invited: "bg-gray-200 text-gray-700",
  Confirmed: "bg-green-100 text-green-700",
  Declined: "bg-red-100 text-red-700",
  Cancelled: "bg-neutral-900 text-neutral-50",
};

const FEE_CLASS: Record<string, string> = {
  Not_Applicable: "bg-gray-200 text-gray-700",
  Pending: "bg-yellow-100 text-yellow-800",
  Paid: "bg-green-100 text-green-700",
};

function Pill({ value, map }: { value?: string | null | undefined; map: Record<string, string> }) {
  if (!value) return <span className="text-xs text-muted-foreground">-</span>;
  return <span className={cn(BASE, map[value] ?? "bg-muted text-foreground")}>{label(value)}</span>;
}

export const EventTypeBadge = ({ value }: { value?: string | null }) => (
  <Pill value={value} map={EVENT_TYPE_CLASS} />
);
export const EventStatusBadge = ({ value }: { value?: string | null }) => (
  <Pill value={value} map={EVENT_STATUS_CLASS} />
);
export const ConfirmationBadge = ({ value }: { value?: string | null }) => (
  <Pill value={value} map={CONFIRMATION_CLASS} />
);
export const FeeStatusBadge = ({ value }: { value?: string | null }) => (
  <Pill value={value} map={FEE_CLASS} />
);

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

function parts(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return { d: d.getDate(), m: d.getMonth(), y: d.getFullYear() };
}

/** "12-14 Sep 2026" (multi-hari) atau "15 Sep 2026" (satu hari). */
export function formatEventRange(start?: string | null, end?: string | null) {
  const s = start ? parts(start) : null;
  if (!s) return "-";
  const e = end ? parts(end) : null;
  const one = `${s.d} ${MONTHS[s.m]} ${s.y}`;
  if (!e || (e.d === s.d && e.m === s.m && e.y === s.y)) return one;
  if (e.y === s.y && e.m === s.m) return `${s.d}-${e.d} ${MONTHS[s.m]} ${s.y}`;
  if (e.y === s.y) return `${s.d} ${MONTHS[s.m]} - ${e.d} ${MONTHS[e.m]} ${s.y}`;
  return `${one} - ${e.d} ${MONTHS[e.m]} ${e.y}`;
}

export function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()} ${String(d.getHours()).padStart(2, "0")}.${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Gambar dari bucket privat Supabase, dengan placeholder saat kosong. */
export function BucketImage({
  bucket,
  path,
  alt,
  className,
  fallback,
}: {
  bucket: string;
  path?: string | null | undefined;
  alt: string;
  className?: string | undefined;
  fallback?: string | undefined;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setUrl(null);
    getSignedUrl(bucket, path).then((u) => {
      if (active) setUrl(u);
    });
    return () => {
      active = false;
    };
  }, [bucket, path]);

  if (!url) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-secondary text-xs font-medium text-muted-foreground",
          className,
        )}
      >
        {fallback ?? "Tanpa gambar"}
      </div>
    );
  }
  return <img src={url} alt={alt} className={cn("object-cover", className)} loading="lazy" />;
}
