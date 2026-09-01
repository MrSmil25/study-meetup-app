import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BudgetProgress, BudgetStatusBadge } from "@/components/finance/finance-ui";
import {
  canManageBudget,
  transactionDivision,
  useDeleteBudget,
  useTransactions,
  type Budget,
} from "@/hooks/useFinance";
import { useMyProfile } from "@/hooks/useProfile";
import { formatDate, rupiah } from "@/lib/format";

export function BudgetDetailDialog({
  budget,
  onOpenChange,
  onEdit,
}: {
  budget: Budget | null;
  onOpenChange: (open: boolean) => void;
  onEdit: (budget: Budget) => void;
}) {
  const { data: profile } = useMyProfile();
  const { data: transactions = [] } = useTransactions();
  const remove = useDeleteBudget();
  const [busy, setBusy] = useState(false);

  if (!budget) return null;

  const allocated = Number(budget.allocated_idr ?? 0);
  const spent = Number(budget.spent_idr ?? 0);
  const sisa = allocated - spent;

  const related = transactions.filter(
    (t) =>
      t.type === "Expense" &&
      t.category.toLowerCase() === budget.category.toLowerCase() &&
      (!budget.division || transactionDivision(t) === budget.division),
  );

  async function handleDelete() {
    if (!budget) return;
    if (!window.confirm("Hapus budget ini?")) return;
    setBusy(true);
    try {
      await remove.mutateAsync(budget.id);
      toast.success("Budget dihapus.");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menghapus budget.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {budget.division ?? "Umum Organisasi"} — {budget.category}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span>{budget.period}</span>
            <BudgetStatusBadge value={budget.status} />
          </div>

          <BudgetProgress spent={spent} allocated={allocated} status={budget.status} />

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border bg-card p-3">
              <p className="text-xs text-muted-foreground">Alokasi</p>
              <p className="font-semibold">{rupiah(allocated)}</p>
            </div>
            <div className="rounded-xl border bg-card p-3">
              <p className="text-xs text-muted-foreground">Terpakai</p>
              <p className="font-semibold">{rupiah(spent)}</p>
            </div>
            <div className="rounded-xl border bg-card p-3">
              <p className="text-xs text-muted-foreground">Sisa</p>
              <p
                className={`font-semibold ${sisa < 0 ? "text-red-600" : "text-green-600"}`}
              >
                {sisa < 0 ? `- ${rupiah(Math.abs(sisa))}` : rupiah(sisa)}
              </p>
            </div>
          </div>

          {budget.notes && (
            <p className="rounded-xl bg-muted p-3 text-sm">{budget.notes}</p>
          )}

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Transaksi Pengeluaran Terkait
            </p>
            <div className="overflow-x-auto rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {related.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="py-6 text-center text-muted-foreground">
                        Belum ada transaksi terkait.
                      </TableCell>
                    </TableRow>
                  )}
                  {related.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>{formatDate(t.transaction_date)}</TableCell>
                      <TableCell className="max-w-[280px] truncate">{t.description}</TableCell>
                      <TableCell className="text-right">{rupiah(t.amount_idr)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {canManageBudget(profile?.role) && (
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onEdit(budget)} disabled={busy}>
                Edit
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={busy}>
                Hapus
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
