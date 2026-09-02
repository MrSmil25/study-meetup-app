import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
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
import { EnumSelect, Field, NONE } from "@/components/external/form-fields";
import {
  FUND_URGENCIES,
  RupiahInput,
  digitsToNumber,
} from "@/components/funds/fund-ui";
import {
  generateRequestNumber,
  parseBreakdown,
  useCreateFundRequest,
  useUpdateFundRequest,
  type BreakdownRow,
  type FundRequest,
} from "@/hooks/useFunds";
import { useMyProfile } from "@/hooks/useProfile";
import { eventOptionLabel, useActiveEvents } from "@/hooks/useEvents";
import { rupiah } from "@/lib/format";

export function FundRequestFormDialog({
  open,
  onOpenChange,
  request,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request?: FundRequest | null;
}) {
  const { data: profile } = useMyProfile();
  const create = useCreateFundRequest();
  const update = useUpdateFundRequest();
  const { data: events = [] } = useActiveEvents();

  const [purpose, setPurpose] = useState("");
  const [amount, setAmount] = useState(0);
  const [urgency, setUrgency] = useState("Normal");
  const [notes, setNotes] = useState("");
  const [eventId, setEventId] = useState(NONE);
  const [rows, setRows] = useState<BreakdownRow[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPurpose(request?.purpose ?? "");
    setAmount(Number(request?.amount_idr ?? 0));
    setUrgency(request?.urgency ?? "Normal");
    setNotes(request?.notes ?? "");
    setEventId(request?.event_id ?? NONE);
    setRows(parseBreakdown(request?.breakdown));
  }, [open, request]);

  const totalBreakdown = rows.reduce((s, r) => s + r.qty * r.unit_price, 0);

  function setRow(index: number, patch: Partial<BreakdownRow>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  async function submit(mode: "draft" | "submit") {
    if (!purpose.trim()) {
      toast.error("Perihal wajib diisi.");
      return;
    }
    if (amount <= 0) {
      toast.error("Jumlah harus lebih dari 0.");
      return;
    }
    if (!profile) {
      toast.error("Profil belum siap.");
      return;
    }
    setBusy(true);
    try {
      const cleanRows = rows.filter((r) => r.item.trim() !== "");
      const values = {
        purpose: purpose.trim(),
        amount_idr: amount,
        urgency: urgency as FundRequest["urgency"],
        notes: notes.trim() === "" ? null : notes.trim(),
        breakdown: cleanRows,
        event_id: eventId === NONE ? null : eventId,
        status: (mode === "draft" ? "Draft" : "Submitted") as FundRequest["status"],
      };

      let requestNumber = request?.request_number ?? null;
      if (mode === "submit" && !requestNumber) requestNumber = await generateRequestNumber();

      if (request) {
        await update.mutateAsync({
          id: request.id,
          values: { ...values, request_number: requestNumber },
        });
      } else {
        await create.mutateAsync({
          ...values,
          request_number: requestNumber,
          requester_id: profile.id,
          requester_division: profile.division,
        });
      }
      toast.success(mode === "draft" ? "Draft tersimpan." : "Pengajuan terkirim.");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menyimpan pengajuan.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{request ? "Edit Pengajuan Dana" : "Ajukan Dana"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Field label="Perihal / Tujuan *">
            <Textarea
              rows={3}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Contoh: Konsumsi rapat kerja divisi"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Jumlah Total (IDR) *">
              <RupiahInput value={amount} onChange={setAmount} />
            </Field>
            <Field label="Urgency">
              <EnumSelect value={urgency} onChange={setUrgency} options={FUND_URGENCIES} />
            </Field>
          </div>

          <Field label="Event Terkait">
            <EnumSelect
              value={eventId}
              onChange={setEventId}
              emptyLabel="Tanpa event"
              options={events.map((e) => ({ value: e.id, label: eventOptionLabel(e) }))}
            />
          </Field>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">BREAKDOWN RINCIAN</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRows((p) => [...p, { item: "", qty: 1, unit_price: 0 }])}
              >
                <Plus className="size-4" /> Tambah Baris
              </Button>
            </div>
            {rows.length === 0 && (
              <p className="text-sm text-muted-foreground">Belum ada rincian (opsional).</p>
            )}
            {rows.map((row, i) => (
              <div key={i} className="grid grid-cols-12 items-center gap-2">
                <Input
                  className="col-span-12 sm:col-span-5"
                  placeholder="Item"
                  value={row.item}
                  onChange={(e) => setRow(i, { item: e.target.value })}
                />
                <Input
                  className="col-span-4 sm:col-span-2"
                  inputMode="numeric"
                  placeholder="Qty"
                  value={row.qty === 0 ? "" : String(row.qty)}
                  onChange={(e) => setRow(i, { qty: digitsToNumber(e.target.value) })}
                />
                <div className="col-span-6 sm:col-span-4">
                  <RupiahInput
                    value={row.unit_price}
                    onChange={(v) => setRow(i, { unit_price: v })}
                    placeholder="Harga Satuan"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="col-span-2 sm:col-span-1"
                  aria-label="Hapus baris"
                  onClick={() => setRows((p) => p.filter((_, idx) => idx !== i))}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            {rows.length > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total rincian</span>
                <span className="font-semibold">{rupiah(totalBreakdown)}</span>
              </div>
            )}
          </div>

          <Field label="Catatan">
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" disabled={busy} onClick={() => submit("draft")}>
            Simpan Draft
          </Button>
          <Button disabled={busy} onClick={() => submit("submit")}>
            Ajukan Sekarang
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
