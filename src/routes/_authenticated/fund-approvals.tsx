import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BreakdownTable,
  FundStatusBadge,
  FundUrgencyBadge,
} from "@/components/funds/fund-ui";
import {
  isApprover,
  parseBreakdown,
  useFundRequests,
  useUpdateFundRequest,
  type FundRequestWithPeople,
} from "@/hooks/useFunds";
import { useMyProfile } from "@/hooks/useProfile";
import { uploadDocument } from "@/hooks/useExternal";
import { formatDate, rupiah } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/fund-approvals")({
  head: () => ({
    meta: [
      { title: "Approval Dana — OrgTool" },
      {
        name: "description",
        content: "Review, setujui, atau tolak pengajuan dana organisasi.",
      },
      { property: "og:title", content: "Approval Dana — OrgTool" },
      {
        property: "og:description",
        content: "Review, setujui, atau tolak pengajuan dana organisasi.",
      },
    ],
  }),
  component: FundApprovalsPage,
});

const TABS = [
  { key: "review", label: "Perlu Review", statuses: ["Submitted", "Under_Review"] },
  { key: "approved", label: "Disetujui", statuses: ["Approved", "Disbursed"] },
  { key: "rejected", label: "Ditolak", statuses: ["Rejected"] },
  { key: "all", label: "Semua", statuses: [] },
] as const;

function FundApprovalsPage() {
  const navigate = useNavigate();
  const { data: profile, isLoading: profileLoading } = useMyProfile();
  const { data: requests = [], isLoading } = useFundRequests();
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("review");
  const [active, setActive] = useState<FundRequestWithPeople | null>(null);

  const allowed = isApprover(profile?.role);

  useEffect(() => {
    if (!profileLoading && profile && !allowed) {
      toast.error("Akses ditolak");
      navigate({ to: "/dashboard", replace: true });
    }
  }, [profileLoading, profile, allowed, navigate]);

  const rows = useMemo(() => {
    const conf = TABS.find((t) => t.key === tab)!;
    if (conf.statuses.length === 0) return requests;
    return requests.filter((r) => (conf.statuses as readonly string[]).includes(r.status));
  }, [requests, tab]);

  if (!allowed) return <p className="text-muted-foreground">Memeriksa akses…</p>;

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Approval Dana</h1>
        <p className="text-sm text-muted-foreground">
          Tinjau pengajuan dana dari seluruh divisi.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No Request</TableHead>
              <TableHead>Perihal</TableHead>
              <TableHead>Pemohon</TableHead>
              <TableHead>Divisi</TableHead>
              <TableHead className="text-right">Jumlah</TableHead>
              <TableHead>Urgency</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tanggal Ajukan</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                  Memuat…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                  Tidak ada pengajuan.
                </TableCell>
              </TableRow>
            )}
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.request_number ?? "—"}</TableCell>
                <TableCell className="max-w-[220px] truncate">{r.purpose}</TableCell>
                <TableCell>{r.requester?.full_name ?? "-"}</TableCell>
                <TableCell>{r.requester_division ?? "-"}</TableCell>
                <TableCell className="text-right">{rupiah(r.amount_idr)}</TableCell>
                <TableCell>
                  <FundUrgencyBadge value={r.urgency} />
                </TableCell>
                <TableCell>
                  <FundStatusBadge value={r.status} />
                </TableCell>
                <TableCell>{formatDate(r.created_at)}</TableCell>
                <TableCell className="text-right">
                  {["Submitted", "Under_Review", "Approved"].includes(r.status) ? (
                    <Button size="sm" variant="outline" onClick={() => setActive(r)}>
                      Review
                    </Button>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => setActive(r)}>
                      Detail
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ReviewDialog request={active} onClose={() => setActive(null)} approverId={profile?.id} />
    </div>
  );
}

function ReviewDialog({
  request,
  onClose,
  approverId,
}: {
  request: FundRequestWithPeople | null;
  onClose: () => void;
  approverId?: string | undefined;
}) {
  const update = useUpdateFundRequest();
  const [mode, setMode] = useState<"none" | "reject" | "info">("none");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setMode("none");
    setNotes("");
  }, [request?.id]);

  if (!request) return null;
  const pending = ["Submitted", "Under_Review"].includes(request.status);

  async function run(values: Parameters<typeof update.mutateAsync>[0]["values"], msg: string) {
    setBusy(true);
    try {
      await update.mutateAsync({ id: request!.id, values });
      toast.success(msg);
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal memperbarui pengajuan.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDisbursed(file: File) {
    setBusy(true);
    try {
      const path = await uploadDocument(file);
      await update.mutateAsync({
        id: request!.id,
        values: {
          status: "Disbursed",
          disbursed_at: new Date().toISOString(),
          disbursement_proof_url: path,
        },
      });
      toast.success("Pengajuan ditandai sudah dicairkan.");
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal mengunggah bukti transfer.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{request.request_number ?? "Draft"} — Review Pengajuan</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <FundStatusBadge value={request.status} />
            <FundUrgencyBadge value={request.urgency} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Perihal</p>
              <p className="text-sm font-medium">{request.purpose}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Jumlah</p>
              <p className="text-sm font-medium">{rupiah(request.amount_idr)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pemohon</p>
              <p className="text-sm font-medium">{request.requester?.full_name ?? "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Divisi</p>
              <p className="text-sm font-medium">{request.requester_division ?? "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tanggal Ajukan</p>
              <p className="text-sm font-medium">{formatDate(request.created_at)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Catatan Pemohon</p>
              <p className="text-sm font-medium">{request.notes ?? "-"}</p>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">BREAKDOWN RINCIAN</p>
            <BreakdownTable rows={parseBreakdown(request.breakdown)} />
          </div>

          {mode !== "none" && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                {mode === "reject" ? "ALASAN PENOLAKAN" : "CATATAN TAMBAHAN"}
              </p>
              <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-2 pt-2">
            {pending && mode === "none" && (
              <>
                <Button
                  disabled={busy}
                  onClick={() =>
                    run(
                      {
                        status: "Approved",
                        approver_id: approverId ?? null,
                        approved_at: new Date().toISOString(),
                      },
                      "Pengajuan disetujui.",
                    )
                  }
                >
                  Setujui
                </Button>
                <Button variant="outline" disabled={busy} onClick={() => setMode("reject")}>
                  Tolak
                </Button>
                <Button variant="outline" disabled={busy} onClick={() => setMode("info")}>
                  Butuh Info Tambahan
                </Button>
              </>
            )}

            {mode !== "none" && (
              <>
                <Button variant="ghost" disabled={busy} onClick={() => setMode("none")}>
                  Batal
                </Button>
                <Button
                  disabled={busy}
                  onClick={() => {
                    if (!notes.trim()) {
                      toast.error("Catatan wajib diisi.");
                      return;
                    }
                    void run(
                      mode === "reject"
                        ? {
                            status: "Rejected",
                            approval_notes: notes.trim(),
                            approver_id: approverId ?? null,
                          }
                        : { status: "Under_Review", approval_notes: notes.trim() },
                      mode === "reject" ? "Pengajuan ditolak." : "Permintaan info dikirim.",
                    );
                  }}
                >
                  {mode === "reject" ? "Konfirmasi Penolakan" : "Kirim Catatan"}
                </Button>
              </>
            )}

            {request.status === "Approved" && (
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                {busy ? "Mengunggah…" : "Tandai Disbursed (upload bukti)"}
                <input
                  type="file"
                  className="hidden"
                  disabled={busy}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleDisbursed(file);
                  }}
                />
              </label>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
