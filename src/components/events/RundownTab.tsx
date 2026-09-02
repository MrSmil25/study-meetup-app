import { useEffect, useMemo, useState } from "react";
import { MoreHorizontal } from "lucide-react";
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
import { EnumSelect, Field, NONE } from "@/components/external/form-fields";
import { DivisionBadge } from "@/components/DivisionBadge";
import {
  useCreateRundown,
  useDeleteRundown,
  useRundowns,
  useUpdateRundown,
  type RundownWithPic,
} from "@/hooks/useEvents";
import { useDivisions, useProfiles } from "@/hooks/useProfile";
import { formatDate, initialsOf } from "@/lib/format";

/** ISO → nilai input datetime-local (waktu lokal). */
function toLocalInput(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toIso(value: string) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function clock(value?: string | null) {
  if (!value) return "--:--";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "--:--";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function RundownFormDialog({
  open,
  onOpenChange,
  eventId,
  eventDateStart,
  nextSortOrder,
  item,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  eventDateStart?: string | null;
  nextSortOrder: number;
  item?: RundownWithPic | null;
}) {
  const { data: profiles = [] } = useProfiles();
  const create = useCreateRundown();
  const update = useUpdateRundown();

  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [activity, setActivity] = useState("");
  const [picId, setPicId] = useState(NONE);
  const [notes, setNotes] = useState("");
  const [sortOrder, setSortOrder] = useState(String(nextSortOrder));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prefill = eventDateStart ? `${eventDateStart}T08:00` : "";
    setStart(item ? toLocalInput(item.time_start) : prefill);
    setEnd(item ? toLocalInput(item.time_end) : "");
    setActivity(item?.activity ?? "");
    setPicId(item?.pic_id ?? NONE);
    setNotes(item?.notes ?? "");
    setSortOrder(String(item?.sort_order ?? nextSortOrder));
  }, [open, item, eventDateStart, nextSortOrder]);

  async function submit() {
    if (!activity.trim()) {
      toast.error("Aktivitas wajib diisi.");
      return;
    }
    setBusy(true);
    try {
      const values = {
        event_id: eventId,
        time_start: toIso(start),
        time_end: toIso(end),
        activity: activity.trim(),
        pic_id: picId === NONE ? null : picId,
        notes: notes.trim() === "" ? null : notes.trim(),
        sort_order: Number(sortOrder) || 0,
      };
      if (item) {
        await update.mutateAsync({ id: item.id, values });
        toast.success("Item rundown diperbarui.");
      } else {
        await create.mutateAsync(values);
        toast.success("Item rundown ditambahkan.");
      }
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menyimpan item rundown.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{item ? "Edit Item Rundown" : "Tambah Item Rundown"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Waktu Mulai">
              <Input
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </Field>
            <Field label="Waktu Selesai">
              <Input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
            </Field>
          </div>
          <Field label="Aktivitas *">
            <Input
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              placeholder="Contoh: Opening Ceremony"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="PIC">
              <EnumSelect
                value={picId}
                onChange={setPicId}
                emptyLabel="Tanpa PIC"
                options={profiles.map((p) => ({ value: p.id, label: p.full_name }))}
              />
            </Field>
            <Field label="Urutan">
              <Input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              />
            </Field>
          </div>
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

export function RundownTab({
  eventId,
  eventDateStart,
  eventDateEnd,
  canManage,
}: {
  eventId: string;
  eventDateStart?: string | null;
  eventDateEnd?: string | null;
  canManage: boolean;
}) {
  const { data: items = [], isLoading } = useRundowns(eventId);
  const { data: divisions = [] } = useDivisions();
  const remove = useDeleteRundown();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RundownWithPic | null>(null);
  const [deleting, setDeleting] = useState<RundownWithPic | null>(null);

  const multiDay = !!eventDateStart && !!eventDateEnd && eventDateStart !== eventDateEnd;
  const nextSortOrder = useMemo(
    () => (items.length === 0 ? 10 : Math.max(...items.map((i) => i.sort_order ?? 0)) + 10),
    [items],
  );

  async function handleDelete() {
    if (!deleting) return;
    try {
      await remove.mutateAsync(deleting.id);
      toast.success("Item rundown dihapus.");
      setDeleting(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menghapus item rundown.");
    }
  }

  return (
    <div className="space-y-4">
      {canManage && (
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          + Tambah Item
        </Button>
      )}

      {isLoading && <p className="text-sm text-muted-foreground">Memuat rundown…</p>}
      {!isLoading && items.length === 0 && (
        <p className="rounded-2xl border bg-card p-6 text-center text-muted-foreground">
          Belum ada item rundown.
        </p>
      )}

      <ol className="relative space-y-4 border-l border-border pl-6">
        {items.map((item) => {
          const div = divisions.find((d) => d.code === item.pic?.division);
          return (
            <li key={item.id} className="relative">
              <span className="absolute -left-[31px] top-5 size-3 rounded-full border-2 border-background bg-primary" />
              <div className="flex flex-wrap items-start gap-4 rounded-2xl border bg-card p-4 shadow-sm">
                <div className="w-28 shrink-0">
                  <p className="text-sm font-semibold">
                    {clock(item.time_start)} - {clock(item.time_end)}
                  </p>
                  {multiDay && (
                    <p className="text-xs text-muted-foreground">
                      {formatDate(item.time_start)}
                    </p>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-bold leading-snug">{item.activity}</p>
                  {item.notes && (
                    <p className="mt-1 text-xs text-muted-foreground">{item.notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {item.pic ? (
                    <div className="flex items-center gap-2">
                      <span className="flex size-8 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-secondary-foreground">
                        {initialsOf(item.pic.full_name)}
                      </span>
                      <div>
                        <p className="text-xs font-medium">{item.pic.full_name}</p>
                        <DivisionBadge name={div?.code ?? item.pic.division} colorHex={div?.color_hex} />
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Tanpa PIC</span>
                  )}
                  {canManage && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Aksi rundown">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditing(item);
                            setFormOpen(true);
                          }}
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleting(item)}
                        >
                          Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <RundownFormDialog
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditing(null);
        }}
        eventId={eventId}
        eventDateStart={eventDateStart}
        nextSortOrder={nextSortOrder}
        item={editing}
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus item rundown?</AlertDialogTitle>
            <AlertDialogDescription>
              Yakin hapus item ini? Aksi ini tidak bisa dibatalkan.
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
