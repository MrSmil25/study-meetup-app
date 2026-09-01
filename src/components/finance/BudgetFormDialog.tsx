import { useEffect, useState } from "react";
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
import { RupiahInput } from "@/components/funds/fund-ui";
import { useCreateBudget, useUpdateBudget, type Budget } from "@/hooks/useFinance";
import { useDivisions } from "@/hooks/useProfile";

export function BudgetFormDialog({
  open,
  onOpenChange,
  budget,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budget?: Budget | null;
}) {
  const { data: divisions = [] } = useDivisions();
  const create = useCreateBudget();
  const update = useUpdateBudget();

  const [period, setPeriod] = useState("");
  const [division, setDivision] = useState(NONE);
  const [category, setCategory] = useState("");
  const [allocated, setAllocated] = useState(0);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPeriod(budget?.period ?? "");
    setDivision(budget?.division ?? NONE);
    setCategory(budget?.category ?? "");
    setAllocated(Number(budget?.allocated_idr ?? 0));
    setNotes(budget?.notes ?? "");
  }, [open, budget]);

  async function submit() {
    if (!period.trim()) {
      toast.error("Period wajib diisi.");
      return;
    }
    if (!category.trim()) {
      toast.error("Kategori wajib diisi.");
      return;
    }
    if (allocated <= 0) {
      toast.error("Alokasi harus lebih dari 0.");
      return;
    }
    setBusy(true);
    try {
      if (budget) {
        await update.mutateAsync({
          id: budget.id,
          values: {
            allocated_idr: allocated,
            notes: notes.trim() === "" ? null : notes.trim(),
          },
        });
        toast.success("Budget diperbarui.");
      } else {
        await create.mutateAsync({
          period: period.trim(),
          division: division === NONE ? null : division,
          category: category.trim(),
          allocated_idr: allocated,
          notes: notes.trim() === "" ? null : notes.trim(),
        });
        toast.success("Budget dibuat.");
      }
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menyimpan budget.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{budget ? "Edit Budget" : "Buat Budget"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Field label="Period *">
            <Input
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              placeholder="Contoh: Semester 1 2026"
              disabled={!!budget}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Divisi (kosong = organisasi)">
              <EnumSelect
                value={division}
                onChange={setDivision}
                emptyLabel="Umum Organisasi"
                options={divisions.map((d) => ({ value: d.code, label: d.name }))}
              />
            </Field>
            <Field label="Kategori *">
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Contoh: Operasional"
                disabled={!!budget}
              />
            </Field>
          </div>
          <Field label="Alokasi (IDR) *">
            <RupiahInput value={allocated} onChange={setAllocated} />
          </Field>
          <Field label="Catatan">
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Batal
          </Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? "Menyimpan…" : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
