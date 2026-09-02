import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EnumSelect, Field, NONE } from "@/components/external/form-fields";
import { RupiahInput } from "@/components/funds/fund-ui";
import {
  TRANSACTION_TYPES,
  TRANSACTION_VISIBILITIES,
  categoriesForType,
  useCategories,
  useCreateTransaction,
  useUpdateTransaction,
  type Transaction,
  type TransactionWithRelations,
} from "@/hooks/useFinance";
import { useFundRequests } from "@/hooks/useFunds";
import { useDeals, uploadDocument } from "@/hooks/useExternal";
import { useMyProfile } from "@/hooks/useProfile";
import { eventOptionLabel, useActiveEvents } from "@/hooks/useEvents";
import { rupiah } from "@/lib/format";

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function errorMessage(e: unknown) {
  if (e && typeof e === "object") {
    const err = e as { message?: string; details?: string; hint?: string; code?: string };
    const parts = [err.message, err.details, err.hint, err.code && `(kode ${err.code})`].filter(
      Boolean,
    );
    if (parts.length) return parts.join(" — ");
  }
  return "Gagal menyimpan transaksi.";
}

type Relation = "request" | "deal" | "event" | "none";

export function TransactionFormDialog({
  open,
  onOpenChange,
  transaction,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: TransactionWithRelations | null;
}) {
  const isEdit = !!transaction;
  const { data: profile } = useMyProfile();
  const create = useCreateTransaction();
  const update = useUpdateTransaction();
  const { data: categories = [] } = useCategories();
  const { data: requests = [] } = useFundRequests();
  const { data: deals = [] } = useDeals();
  const { data: events = [] } = useActiveEvents();

  const [date, setDate] = useState(todayISO());
  const [type, setType] = useState<"Income" | "Expense">("Expense");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState("");
  const [relation, setRelation] = useState<Relation>("none");
  const [requestId, setRequestId] = useState(NONE);
  const [dealId, setDealId] = useState(NONE);
  const [eventId, setEventId] = useState(NONE);
  const [visibility, setVisibility] = useState("Public_Org");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const eligibleRequests = useMemo(
    () => requests.filter((r) => r.status === "Approved" || r.status === "Disbursed"),
    [requests],
  );

  useEffect(() => {
    if (!open) return;
    if (transaction) {
      setDate(transaction.transaction_date);
      setType(transaction.type as "Income" | "Expense");
      setCategory(transaction.category ?? "");
      setAmount(Number(transaction.amount_idr ?? 0));
      setDescription(transaction.description ?? "");
      setRelation(
        transaction.related_fund_request_id
          ? "request"
          : transaction.related_deal_id
            ? "deal"
            : transaction.related_event_id
              ? "event"
              : "none",
      );
      setRequestId(transaction.related_fund_request_id ?? NONE);
      setDealId(transaction.related_deal_id ?? NONE);
      setEventId(transaction.related_event_id ?? NONE);
      setVisibility(transaction.visibility);
      setFile(null);
      return;
    }
    setDate(todayISO());
    setType("Expense");
    setCategory("");
    setAmount(0);
    setDescription("");
    setRelation(eligibleRequests.length > 0 ? "request" : "none");
    setRequestId(NONE);
    setDealId(NONE);
    setEventId(NONE);
    setVisibility("Public_Org");
    setFile(null);
  }, [open, transaction, eligibleRequests.length]);

  const options = useMemo(() => categoriesForType(categories, type), [categories, type]);

  // Reset kategori kalau tidak valid untuk tipe terpilih
  useEffect(() => {
    if (category && !options.some((c) => c.name === category)) setCategory("");
  }, [options, category]);

  async function submit() {
    if (!category.trim()) {
      toast.error("Kategori wajib dipilih.");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Jumlah harus lebih dari 0.");
      return;
    }
    if (!description.trim()) {
      toast.error("Deskripsi wajib diisi.");
      return;
    }
    setBusy(true);
    try {
      let proofPath: string | null = transaction?.proof_url ?? null;
      if (file) proofPath = await uploadDocument(file);
      const payload = {
        transaction_date: date,
        type: type as Transaction["type"],
        category: category.trim(),
        amount_idr: Number(amount),
        description: description.trim(),
        related_fund_request_id:
          relation === "request" && requestId !== NONE ? requestId : null,
        related_deal_id: relation === "deal" && dealId !== NONE ? dealId : null,
        related_event_id: relation === "event" && eventId !== NONE ? eventId : null,
        proof_url: proofPath,
        visibility: visibility as Transaction["visibility"],
        recorded_by: profile?.id ?? null,
      };
      console.log("[transaksi] payload", payload);
      if (transaction) {
        await update.mutateAsync({ id: transaction.id, values: payload });
        toast.success("Transaksi diperbarui.");
      } else {
        await create.mutateAsync(payload);
        toast.success("Transaksi tercatat.");
      }
      onOpenChange(false);
    } catch (e) {
      console.error("[transaksi] gagal menyimpan", e);
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Transaksi" : "Catat Transaksi"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tanggal Transaksi *">
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field label="Tipe *">
              <div className="flex gap-4 pt-2">
                {TRANSACTION_TYPES.map((t) => (
                  <label key={t} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="tx-type"
                      checked={type === t}
                      onChange={() => setType(t)}
                    />
                    {t === "Income" ? "Pemasukan" : "Pengeluaran"}
                  </label>
                ))}
              </div>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Kategori *">
              <Select value={category} onValueChange={setCategory} disabled={!type}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={type ? "Pilih kategori…" : "Pilih tipe transaksi dulu"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {options.map((c) => (
                    <SelectItem key={c.id} value={c.name}>
                      <span className="flex items-center gap-2">
                        <span
                          className="inline-block size-2.5 rounded-full"
                          style={{ backgroundColor: c.color_hex ?? "#94a3b8" }}
                        />
                        {c.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Jumlah (IDR) *">
              <RupiahInput value={amount} onChange={setAmount} />
            </Field>
          </div>

          <Field label="Deskripsi *">
            <Textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Pembelian konsumsi rapat kerja"
            />
          </Field>

          <Field label="Sumber Dana / Terkait">
            <div className="flex flex-wrap gap-4 pt-1">
              {(
                [
                  ["request", "Dari Pengajuan Dana yang Approved"],
                  ["deal", "Terkait Deal"],
                  ["event", "Terkait Event"],
                  ["none", "Tidak Terkait / Umum"],
                ] as [Relation, string][]
              ).map(([value, labelText]) => (
                <label key={value} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="tx-relation"
                    checked={relation === value}
                    onChange={() => setRelation(value)}
                  />
                  {labelText}
                </label>
              ))}
            </div>
          </Field>

          {relation === "request" && (
            <Field label="Pengajuan Dana">
              <EnumSelect
                value={requestId}
                onChange={setRequestId}
                emptyLabel="Belum dipilih"
                options={eligibleRequests.map((r) => ({
                  value: r.id,
                  label: `${r.request_number ?? "Tanpa nomor"} - ${r.purpose} - ${rupiah(
                    r.amount_idr,
                  )}${r.requester_division ? ` (Divisi ${r.requester_division})` : ""}`,
                }))}
              />
            </Field>
          )}

          {relation === "deal" && (
            <Field label="Deal">
              <EnumSelect
                value={dealId}
                onChange={setDealId}
                emptyLabel="Belum dipilih"
                options={deals.map((d) => ({
                  value: d.id,
                  label: `${d.name}${d.companies?.name ? ` - ${d.companies.name}` : ""} - ${rupiah(
                    d.value_idr,
                  )}${d.owner_division ? ` (Divisi ${d.owner_division})` : ""}`,
                }))}
              />
            </Field>
          )}

          {relation === "event" && (
            <Field label="Event">
              <EnumSelect
                value={eventId}
                onChange={setEventId}
                emptyLabel="Belum dipilih"
                options={events.map((e) => ({ value: e.id, label: eventOptionLabel(e) }))}
              />
            </Field>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Upload Bukti">
              <Input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </Field>
            <Field label="Visibility">
              <EnumSelect
                value={visibility}
                onChange={setVisibility}
                options={TRANSACTION_VISIBILITIES}
              />
            </Field>
          </div>
          <p className="text-xs text-muted-foreground">
            Public_Org = semua anggota bisa lihat, gunakan Controller_Only hanya untuk kasus
            sangat sensitif.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Batal
          </Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? "Menyimpan…" : isEdit ? "Simpan Perubahan" : "Simpan Transaksi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
