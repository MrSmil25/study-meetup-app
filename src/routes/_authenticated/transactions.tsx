import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, FileText, MoreHorizontal, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EnumSelect, Field, NONE } from "@/components/external/form-fields";
import { CategoryBadge } from "@/components/finance/finance-ui";
import { TransactionFormDialog } from "@/components/finance/TransactionFormDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  TRANSACTION_TYPES,
  canManageTransaction,
  canRecordTransaction,
  useDeleteTransaction,
  type TransactionWithRelations,
  monthRange,
  openProof,
  transactionDivision,
  useTransactions,
} from "@/hooks/useFinance";
import { useDivisions, useMyProfile } from "@/hooks/useProfile";
import { formatDate, rupiah } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/transactions")({
  head: () => ({
    meta: [
      { title: "Feed Keuangan — OrgTool" },
      {
        name: "description",
        content: "Timeline transparan pemasukan dan pengeluaran organisasi kampus.",
      },
      { property: "og:title", content: "Feed Keuangan — OrgTool" },
      {
        property: "og:description",
        content: "Timeline transparan pemasukan dan pengeluaran organisasi kampus.",
      },
    ],
  }),
  component: TransactionsPage,
});

function TransactionsPage() {
  const { data: profile } = useMyProfile();
  const { data: divisions = [] } = useDivisions();
  const { data: transactions = [], isLoading } = useTransactions();

  const defaults = monthRange();
  const [from, setFrom] = useState(defaults.from);
  const [to, setTo] = useState(defaults.to);
  const [type, setType] = useState(NONE);
  const [category, setCategory] = useState(NONE);
  const [division, setDivision] = useState(NONE);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TransactionWithRelations | null>(null);
  const [deleting, setDeleting] = useState<TransactionWithRelations | null>(null);
  const removeTx = useDeleteTransaction();
  const canManage = canManageTransaction(profile?.role);

  async function handleDelete() {
    if (!deleting) return;
    try {
      await removeTx.mutateAsync(deleting.id);
      toast.success("Transaksi dihapus.");
      setDeleting(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menghapus transaksi.");
    }
  }

  const categories = useMemo(
    () => Array.from(new Set(transactions.map((t) => t.category).filter(Boolean))).sort(),
    [transactions],
  );

  const filtered = useMemo(
    () =>
      transactions.filter((t) => {
        const d = t.transaction_date;
        if (from && d < from) return false;
        if (to && d > to) return false;
        if (type !== NONE && t.type !== type) return false;
        if (category !== NONE && t.category !== category) return false;
        if (division !== NONE && transactionDivision(t) !== division) return false;
        return true;
      }),
    [transactions, from, to, type, category, division],
  );

  const income = filtered
    .filter((t) => t.type === "Income")
    .reduce((s, t) => s + Number(t.amount_idr ?? 0), 0);
  const expense = filtered
    .filter((t) => t.type === "Expense")
    .reduce((s, t) => s + Number(t.amount_idr ?? 0), 0);
  const net = income - expense;

  async function handleProof(path: string) {
    try {
      await openProof(path);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal membuka bukti.");
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Feed Keuangan</h1>
          <p className="text-sm text-muted-foreground">
            Semua arus kas organisasi, terbuka untuk anggota.
          </p>
        </div>
        {canRecordTransaction(profile?.role) && (
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" /> Catat Transaksi
          </Button>
        )}
      </div>

      <div className="grid gap-3 rounded-2xl border bg-card p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-5">
        <Field label="Dari">
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </Field>
        <Field label="Sampai">
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </Field>
        <Field label="Tipe">
          <EnumSelect
            value={type}
            onChange={setType}
            options={TRANSACTION_TYPES}
            emptyLabel="Semua Tipe"
          />
        </Field>
        <Field label="Kategori">
          <EnumSelect
            value={category}
            onChange={setCategory}
            options={categories}
            emptyLabel="Semua Kategori"
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
      </div>

      <div className="grid gap-4 rounded-2xl border bg-card p-5 shadow-sm sm:grid-cols-3">
        <div>
          <p className="text-sm text-muted-foreground">Total Pemasukan</p>
          <p className="text-xl font-bold text-green-600">{rupiah(income)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Total Pengeluaran</p>
          <p className="text-xl font-bold text-red-600">{rupiah(expense)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Net</p>
          <p
            className={`text-xl font-bold ${net < 0 ? "text-red-600" : "text-green-600"}`}
          >
            {net < 0 ? `- ${rupiah(Math.abs(net))}` : rupiah(net)}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {isLoading && (
          <p className="rounded-2xl border bg-card p-6 text-center text-muted-foreground">
            Memuat…
          </p>
        )}
        {!isLoading && filtered.length === 0 && (
          <p className="rounded-2xl border bg-card p-6 text-center text-muted-foreground">
            Belum ada transaksi pada periode ini.
          </p>
        )}
        {filtered.map((t) => {
          const isIncome = t.type === "Income";
          const div = transactionDivision(t);
          return (
            <article
              key={t.id}
              className="flex gap-4 rounded-2xl border bg-card p-4 shadow-sm sm:p-5"
            >
              <span
                className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
                  isIncome ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                }`}
              >
                {isIncome ? (
                  <ArrowDownLeft className="size-5" />
                ) : (
                  <ArrowUpRight className="size-5" />
                )}
              </span>
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-base font-bold leading-snug">{t.description}</p>
                  {canManage && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Aksi transaksi">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditing(t);
                            setFormOpen(true);
                          }}
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleting(t)}
                        >
                          Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <CategoryBadge value={t.category} />
                  {div && <span className="text-xs text-muted-foreground">Divisi {div}</span>}
                </div>
                <p
                  className={`text-xl font-bold ${isIncome ? "text-green-600" : "text-red-600"}`}
                >
                  {isIncome ? "+ " : "- "}
                  {rupiah(t.amount_idr)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(t.transaction_date)} · dicatat oleh{" "}
                  {t.recorder?.full_name ?? "—"}
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  {t.proof_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleProof(t.proof_url as string)}
                    >
                      <FileText className="size-4" /> Lihat Bukti
                    </Button>
                  )}
                  {t.fund_request && (
                    <Link
                      to="/fund-requests/$id"
                      params={{ id: t.fund_request.id }}
                      className="text-xs font-medium text-primary underline-offset-2 hover:underline"
                    >
                      Lihat Pengajuan {t.fund_request.request_number ?? ""}
                    </Link>
                  )}
                  {t.deal && (
                    <span className="text-xs text-muted-foreground">
                      Terkait Deal: {t.deal.name}
                    </span>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <TransactionFormDialog
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditing(null);
        }}
        transaction={editing}
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus transaksi?</AlertDialogTitle>
            <AlertDialogDescription>
              Yakin hapus transaksi ini? Aksi ini tidak bisa dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
