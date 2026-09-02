import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Users,
  Boxes,
  UserCheck,
  Building2,
  Handshake,
  Wallet,
  ClipboardCheck,
  Receipt,
  PiggyBank,
  TrendingDown,
  CalendarDays,
  CalendarClock,
} from "lucide-react";
import { useDivisions, useMyProfile, useProfiles } from "@/hooks/useProfile";
import { useDeals } from "@/hooks/useExternal";
import { isApprover, useFundRequests } from "@/hooks/useFunds";
import { transactionDivision, useTransactions } from "@/hooks/useFinance";
import { useEvents } from "@/hooks/useEvents";
import { formatEventRange } from "@/components/events/event-ui";
import { rupiah } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — OrgTool" },
      { name: "description", content: "Ringkasan anggota dan divisi organisasi kampus." },
      { property: "og:title", content: "Dashboard — OrgTool" },
      { property: "og:description", content: "Ringkasan anggota dan divisi organisasi kampus." },
    ],
  }),
  component: DashboardPage,
});

function StatCard({
  label,
  value,
  icon: Icon,
  valueClass,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  valueClass?: string;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <span className="flex size-9 items-center justify-center rounded-lg bg-secondary text-primary">
          <Icon className="size-4" />
        </span>
      </div>
      <p className={`mt-3 text-3xl font-bold tracking-tight ${valueClass ?? ""}`}>{value}</p>
    </div>
  );
}

function DashboardPage() {
  const { data: profile } = useMyProfile();
  const { data: profiles = [], isLoading } = useProfiles();
  const { data: divisions = [] } = useDivisions();
  const { data: deals = [], isLoading: dealsLoading } = useDeals();
  const { data: funds = [], isLoading: fundsLoading } = useFundRequests();
  const { data: transactions = [], isLoading: txLoading } = useTransactions();
  const { data: events = [], isLoading: eventsLoading } = useEvents();

  const eventAktif = events.filter((e) =>
    ["Planning", "Preparation", "Live"].includes(e.status),
  ).length;
  const todayIso = new Date().toISOString().slice(0, 10);
  const nextEvent = events
    .filter(
      (e) =>
        !["Done", "Cancelled"].includes(e.status) && !!e.date_start && e.date_start >= todayIso,
    )
    .sort((a, b) => (a.date_start ?? "").localeCompare(b.date_start ?? ""))[0];



  const totalAnggota = profiles.length;
  const anggotaAktif = profiles.filter((p) => p.status === "Active").length;
  const myDivision = divisions.find((d) => d.code === profile?.division);

  const dealAktif = deals.filter(
    (d) => !["Deal", "Rejected", "Ghosted"].includes(d.stage),
  ).length;
  const pipelineValue = deals
    .filter((d) => ["Prospect", "Contacted", "Pitched", "Negotiating"].includes(d.stage))
    .reduce((sum, d) => sum + Number(d.value_idr ?? 0), 0);

  const now = new Date();
  const needReview = funds.filter((f) =>
    ["Submitted", "Under_Review"].includes(f.status),
  ).length;
  const fundsThisMonth = funds.filter((f) => {
    if (!f.created_at) return false;
    const d = new Date(f.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const publicTx = transactions.filter((t) => t.visibility === "Public_Org");
  const saldo = publicTx.reduce(
    (sum, t) => sum + (t.type === "Income" ? 1 : -1) * Number(t.amount_idr ?? 0),
    0,
  );
  const isThisMonth = (value?: string | null) => {
    if (!value) return false;
    const d = new Date(value);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  };
  const expenseThisMonth = transactions
    .filter((t) => t.type === "Expense" && isThisMonth(t.transaction_date))
    .reduce((sum, t) => sum + Number(t.amount_idr ?? 0), 0);

  const expenseByDivision = Object.entries(
    transactions
      .filter((t) => t.type === "Expense" && isThisMonth(t.transaction_date))
      .reduce<Record<string, number>>((acc, t) => {
        const key = transactionDivision(t) ?? "Umum";
        acc[key] = (acc[key] ?? 0) + Number(t.amount_idr ?? 0);
        return acc;
      }, {}),
  ).sort((a, b) => b[1] - a[1]);
  const maxDivisionExpense = Math.max(1, ...expenseByDivision.map(([, v]) => v));


  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="rounded-2xl bg-primary p-6 text-primary-foreground shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold sm:text-3xl">
          Halo, {profile?.nickname || profile?.full_name || "Anggota"}!
        </h1>
        <p className="mt-2 text-sm text-primary-foreground/80">
          Selamat datang kembali di OrgTool. Berikut ringkasan organisasi hari ini.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Total Anggota" value={isLoading ? "…" : totalAnggota} icon={Users} />
        <StatCard label="Total Divisi" value={divisions.length || "…"} icon={Boxes} />
        <StatCard label="Anggota Aktif" value={isLoading ? "…" : anggotaAktif} icon={UserCheck} />
        <StatCard label="Divisi Saya" value={myDivision?.code ?? "-"} icon={Building2} />
        <StatCard label="Deal Aktif" value={dealsLoading ? "…" : dealAktif} icon={Handshake} />
        <StatCard
          label="Total Pipeline Value"
          value={dealsLoading ? "…" : rupiah(pipelineValue)}
          icon={Wallet}
        />
        <StatCard
          label="Pengajuan Bulan Ini"
          value={fundsLoading ? "…" : fundsThisMonth}
          icon={Receipt}
        />
        {isApprover(profile?.role) && (
          <StatCard
            label="Pengajuan Perlu Review"
            value={fundsLoading ? "…" : needReview}
            icon={ClipboardCheck}
          />
        )}
        <StatCard
          label="Saldo Organisasi"
          value={txLoading ? "…" : saldo < 0 ? `- ${rupiah(Math.abs(saldo))}` : rupiah(saldo)}
          icon={PiggyBank}
          valueClass={saldo < 0 ? "text-red-600" : "text-green-600"}
        />
        <StatCard
          label="Expense Bulan Ini"
          value={txLoading ? "…" : rupiah(expenseThisMonth)}
          icon={TrendingDown}
          valueClass="text-red-600"
        />
      </section>

      {expenseByDivision.length > 0 && (
        <section className="rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Expense per Divisi Bulan Ini</h2>
          <div className="mt-4 space-y-3">
            {expenseByDivision.map(([div, value]) => (
              <div key={div} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{div}</span>
                  <span className="text-muted-foreground">{rupiah(value)}</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.round((value / maxDivisionExpense) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}


      {myDivision && (
        <section className="rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Divisi {myDivision.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {myDivision.description ?? "Belum ada deskripsi divisi."}
          </p>
        </section>
      )}
    </div>
  );
}
