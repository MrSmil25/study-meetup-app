import { cn } from "@/lib/utils";

const BASE = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold";

export const COMPANY_TYPES = [
  "Sponsor",
  "Media",
  "Speaker_Source",
  "Institutional",
  "Vendor",
] as const;

export const COMPANY_STATUSES = ["Cold", "Warm", "Active", "Dormant", "Blacklist"] as const;

export const CONTACT_ROLES = [
  "Decision_Maker",
  "Influencer",
  "Executor",
  "Gatekeeper",
] as const;

export const CONTACT_CHANNELS = ["WA", "Email", "Phone"] as const;

export const DEAL_TYPES = [
  "Sponsorship",
  "Media_Partnership",
  "Speaker",
  "Institutional_MoU",
  "In_kind",
] as const;

export const DEAL_STAGES = [
  "Prospect",
  "Contacted",
  "Pitched",
  "Negotiating",
  "Deal",
  "Rejected",
  "Ghosted",
] as const;

export const MOU_STATUSES = ["Draft", "Under_Review", "Signed", "Expired", "Terminated"] as const;

const COMPANY_TYPE_CLASS: Record<string, string> = {
  Sponsor: "bg-blue-100 text-blue-700",
  Media: "bg-purple-100 text-purple-700",
  Speaker_Source: "bg-red-100 text-red-700",
  Institutional: "bg-green-100 text-green-700",
  Vendor: "bg-gray-200 text-gray-700",
};

const COMPANY_STATUS_CLASS: Record<string, string> = {
  Cold: "bg-gray-200 text-gray-700",
  Warm: "bg-yellow-100 text-yellow-800",
  Active: "bg-green-100 text-green-700",
  Dormant: "bg-orange-100 text-orange-700",
  Blacklist: "bg-red-100 text-red-700",
};

const DEAL_STAGE_CLASS: Record<string, string> = {
  Prospect: "bg-gray-200 text-gray-700",
  Contacted: "bg-sky-100 text-sky-700",
  Pitched: "bg-blue-100 text-blue-700",
  Negotiating: "bg-yellow-100 text-yellow-800",
  Deal: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
  Ghosted: "bg-gray-700 text-gray-100",
};

export const DEAL_STAGE_HEADER_CLASS: Record<string, string> = {
  Prospect: "bg-gray-200 text-gray-800",
  Contacted: "bg-sky-200 text-sky-900",
  Pitched: "bg-blue-200 text-blue-900",
  Negotiating: "bg-yellow-200 text-yellow-900",
  Deal: "bg-green-200 text-green-900",
  Rejected: "bg-red-200 text-red-900",
  Ghosted: "bg-gray-700 text-gray-50",
};

const MOU_STATUS_CLASS: Record<string, string> = {
  Draft: "bg-gray-200 text-gray-700",
  Under_Review: "bg-yellow-100 text-yellow-800",
  Signed: "bg-green-100 text-green-700",
  Expired: "bg-red-100 text-red-700",
  Terminated: "bg-neutral-900 text-neutral-50",
};

const DEAL_TYPE_CLASS = "bg-secondary text-secondary-foreground";

export function label(value?: string | null) {
  return (value ?? "-").replace(/_/g, " ");
}

function Pill({ value, map, fallback }: { value: string | null | undefined; map?: Record<string, string> | undefined; fallback?: string | undefined }) {
  if (!value) return <span className="text-xs text-muted-foreground">-</span>;
  return <span className={cn(BASE, map?.[value] ?? fallback ?? "bg-muted text-foreground")}>{label(value)}</span>;
}

export const CompanyTypeBadge = ({ value }: { value?: string | null }) => (
  <Pill value={value} map={COMPANY_TYPE_CLASS} />
);
export const CompanyStatusBadge = ({ value }: { value?: string | null }) => (
  <Pill value={value} map={COMPANY_STATUS_CLASS} />
);
export const DealStageBadge = ({ value }: { value?: string | null }) => (
  <Pill value={value} map={DEAL_STAGE_CLASS} />
);
export const DealTypeBadge = ({ value }: { value?: string | null }) => (
  <Pill value={value} fallback={DEAL_TYPE_CLASS} />
);
export const MouStatusBadge = ({ value }: { value?: string | null }) => (
  <Pill value={value} map={MOU_STATUS_CLASS} />
);
