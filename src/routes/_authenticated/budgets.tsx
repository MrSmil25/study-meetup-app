import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EnumSelect, Field, NONE } from "@/components/external/form-fields";
import { BudgetProgress, BudgetStatusBadge } from "@/components/finance/finance-ui";
import { BudgetFormDialog } from "@/components/finance/BudgetFormDialog";
import { BudgetDetailDialog } from "@/components/finance/BudgetDetailDialog";
import {
  BUDGET_STATUSES,
  canManageBudget,
  useBudgets,
  type Budget,
  type BudgetWithEvent,
} from "@/hooks/useFinance";
import { useDivisions, useMyProfile } from "@/hooks/useProfile";
import { rupiah } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/budgets")({
  head: () => ({
    meta: [
      { title: "Budget — OrgTool" },
      {
        name: "description",
        content: "Pantau alokasi dan realisasi anggaran tiap divisi organisasi kampus.",
      },
      { property: "og:title", content: "Budget — OrgTool" },
      {
        property: "og:description",
        content: "Pantau alokasi dan realisasi anggaran tiap divisi organisasi kampus.",
      },
    ],
  }),
  component: BudgetsPage,
});

function BudgetsPage() {
  const { data: profile } = useMyProfile();
  const { data: divisions = [] } = useDivisions();
  const { data: budgets = [], isLoading } = useBudgets();

  const [period, setPeriod] = useState(NONE);
  const [division, setDivision] = useState(NONE);
  const [status, setStatus] = useState(NONE);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Budget | null>(null);
  const [detail, setDetail] = useState<Budget | null>(null);
  const [scope, setScope] = useState(NONE);

  const periods = useMemo(
    () => Array.from(new Set(budgets.map((b) => b.period).filter(Boolean))).sort(),
    [budgets],
  );

  const filtered = budgets.filter((b) => {
    if (period !== NONE && b.period !== period) return false;
    if (division !== NONE && (b.division ?? "") !== division) return false;
    if (status !== NONE && b.status !== status) return false;
    if (scope === "division" && b.event_id) return false;
    if (scope === "event" && !b.event_id) return false;
    return true;
  });

  function divisionColor(code: string | null) {
    return divisions.find((d) => d.code === code)?.color_hex ?? null;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Budget</h1>
          <p className="text-sm text-muted-foreground">
            Alokasi anggaran dan realisasinya per divisi.
          </p>
        </div>
        {canManageBudget(profile?.role) && (
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" /> Buat Budget
          </Button>
        )}
      </div>

      <div className="grid gap-3 rounded-2xl border bg-card p-4 shadow-sm sm:grid-cols-4">
        <Field label="Period">
          <EnumSelect
            value={period}
            onChange={setPeriod}
            options={periods}
            emptyLabel="Semua Period"
          />
        </Field>
        <Field label="Divisi">
          <EnumSelect
            value={division}
            onChange={setDivision}
            options={divisions.map((d) => ({ value: d.code, label: d.name }))}
            emptyLabel="Semua Divisi"
          />
        </Field>
        <Field label="Status">
          <EnumSelect
            value={status}
            onChange={setStatus}
            options={BUDGET_STATUSES}
            emptyLabel="Semua Status"
          />
        </Field>
        <Field label="Scope">
          <EnumSelect
            value={scope}
            onChange={setScope}
            options={[
              { value: "division", label: "Per Divisi" },
              { value: "event", label: "Per Event" },
            ]}
            emptyLabel="Semua Scope"
          />
        </Field>
      </div>

      {isLoading && (
        <p className="rounded-2xl border bg-card p-6 text-center text-muted-foreground">
          Memuat…
        </p>
      )}
      {!isLoading && filtered.length === 0 && (
        <p className="rounded-2xl border bg-card p-6 text-center text-muted-foreground">
          Belum ada budget.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {(filtered as BudgetWithEvent[]).map((b) => {
          const allocated = Number(b.allocated_idr ?? 0);
          const spent = Number(b.spent_idr ?? 0);
          const sisa = allocated - spent;
          const color = divisionColor(b.division);
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => setDetail(b)}
              className="space-y-3 rounded-2xl border bg-card p-5 text-left shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-center gap-2">
                <span
                  className="size-2.5 rounded-full bg-primary"
                  style={color ? { backgroundColor: color } : undefined}
                />
                <p className="font-semibold">
                  {b.events ? `🎯 ${b.events.name}` : (b.division ?? "Umum Organisasi")} ·{" "}
                  {b.category}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">{b.period}</p>
              <BudgetProgress spent={spent} allocated={allocated} status={b.status} />
              <div className="flex items-center justify-between">
                <p className="text-sm">
                  Sisa:{" "}
                  <span className={sisa < 0 ? "font-semibold text-red-600" : "font-semibold text-green-600"}>
                    {sisa < 0 ? `- ${rupiah(Math.abs(sisa))}` : rupiah(sisa)}
                  </span>
                </p>
                <BudgetStatusBadge value={b.status} />
              </div>
            </button>
          );
        })}
      </div>

      <BudgetFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        budget={editing}
      />

      <BudgetDetailDialog
        budget={detail}
        onOpenChange={(open) => {
          if (!open) setDetail(null);
        }}
        onEdit={(b) => {
          setDetail(null);
          setEditing(b);
          setFormOpen(true);
        }}
      />
    </div>
  );
}
