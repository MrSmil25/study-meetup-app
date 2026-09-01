import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MOU_STATUSES, MouStatusBadge } from "@/components/external/badges";
import { EnumSelect, NONE } from "@/components/external/form-fields";
import { MouFormDialog } from "@/components/external/forms";
import { useMous, type MouWithCompany } from "@/hooks/useExternal";
import { daysUntil, formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/mous")({
  head: () => ({
    meta: [
      { title: "MoU — OrgTool" },
      { name: "description", content: "Arsip MoU kerja sama beserta masa berlaku dan pengingat." },
      { property: "og:title", content: "MoU — OrgTool" },
      {
        property: "og:description",
        content: "Arsip MoU kerja sama beserta masa berlaku dan pengingat.",
      },
    ],
  }),
  component: MousPage,
});

function RemainingDays({ expiry }: { expiry?: string | null }) {
  const days = daysUntil(expiry);
  if (days === null) return <span className="text-muted-foreground">-</span>;
  const critical = days < 30;
  return (
    <span className={critical ? "font-semibold text-red-600" : ""}>
      {days < 0 ? `Lewat ${Math.abs(days)} hari` : `${days} hari`}
    </span>
  );
}

function MousPage() {
  const { data: mous = [], isLoading } = useMous();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(NONE);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MouWithCompany | null>(null);
  const [detail, setDetail] = useState<MouWithCompany | null>(null);

  const rows = useMemo(() => {
    const q = search.toLowerCase();
    return mous.filter(
      (m) =>
        (m.title.toLowerCase().includes(q) ||
          (m.companies?.name ?? "").toLowerCase().includes(q)) &&
        (status === NONE || m.status === status),
    );
  }, [mous, search, status]);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">MoU</h1>
          <p className="text-sm text-muted-foreground">{mous.length} dokumen kerja sama tercatat.</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" /> Tambah MoU
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Cari judul atau perusahaan…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <EnumSelect
          value={status}
          onChange={setStatus}
          options={MOU_STATUSES}
          emptyLabel="Semua status"
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Judul</TableHead>
              <TableHead>Perusahaan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ditandatangani</TableHead>
              <TableHead>Expired</TableHead>
              <TableHead>Sisa Hari</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                  Memuat data…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                  Belum ada MoU yang cocok.
                </TableCell>
              </TableRow>
            )}
            {rows.map((m) => (
              <TableRow key={m.id} className="cursor-pointer" onClick={() => setDetail(m)}>
                <TableCell className="font-medium">{m.title}</TableCell>
                <TableCell>{m.companies?.name ?? "-"}</TableCell>
                <TableCell>
                  <MouStatusBadge value={m.status} />
                </TableCell>
                <TableCell>{formatDate(m.signed_date)}</TableCell>
                <TableCell>{formatDate(m.expiry_date)}</TableCell>
                <TableCell>
                  <RemainingDays expiry={m.expiry_date} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!detail} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{detail?.title}</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">Perusahaan: </span>
                {detail.companies?.name ?? "-"}
              </p>
              <p className="flex items-center gap-2">
                <span className="text-muted-foreground">Status:</span>
                <MouStatusBadge value={detail.status} />
              </p>
              <p>
                <span className="text-muted-foreground">Ditandatangani: </span>
                {formatDate(detail.signed_date)}
              </p>
              <p>
                <span className="text-muted-foreground">Expired: </span>
                {formatDate(detail.expiry_date)}
              </p>
              <p>
                <span className="text-muted-foreground">Penandatangan mereka: </span>
                {detail.signatory_their_name ?? "-"}
                {detail.signatory_their_title ? ` (${detail.signatory_their_title})` : ""}
              </p>
              <p>
                <span className="text-muted-foreground">Reminder H-: </span>
                {detail.renewal_reminder_days ?? 30} hari
              </p>
              {detail.pdf_url && (
                <p className="truncate">
                  <span className="text-muted-foreground">Dokumen: </span>
                  {detail.pdf_url}
                </p>
              )}
              {detail.notes && (
                <p>
                  <span className="text-muted-foreground">Catatan: </span>
                  {detail.notes}
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              onClick={() => {
                setEditing(detail);
                setDetail(null);
                setFormOpen(true);
              }}
            >
              <Pencil className="size-4" /> Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MouFormDialog open={formOpen} onOpenChange={setFormOpen} mou={editing} />
    </div>
  );
}
