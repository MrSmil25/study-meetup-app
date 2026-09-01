import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Pencil, Trash2, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  BreakdownTable,
  FundStatusBadge,
  FundUrgencyBadge,
  StatusTimeline,
} from "@/components/funds/fund-ui";
import { FundRequestFormDialog } from "@/components/funds/FundRequestFormDialog";
import {
  parseBreakdown,
  useDeleteFundRequest,
  useFundRequest,
  useUpdateFundRequest,
} from "@/hooks/useFunds";
import { useMyProfile } from "@/hooks/useProfile";
import { uploadDocument } from "@/hooks/useExternal";
import { formatDate, rupiah } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/fund-requests/$id")({
  head: () => ({
    meta: [
      { title: "Detail Pengajuan Dana — OrgTool" },
      {
        name: "description",
        content: "Rincian pengajuan dana, timeline status, dan laporan pertanggungjawaban.",
      },
      { property: "og:title", content: "Detail Pengajuan Dana — OrgTool" },
      {
        property: "og:description",
        content: "Rincian pengajuan dana, timeline status, dan laporan pertanggungjawaban.",
      },
    ],
  }),
  component: FundRequestDetailPage,
});

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value ?? "-"}</p>
    </div>
  );
}

function FundRequestDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data: request, isLoading } = useFundRequest(id);
  const { data: profile } = useMyProfile();
  const update = useUpdateFundRequest();
  const remove = useDeleteFundRequest();
  const [editOpen, setEditOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  if (isLoading) return <p className="text-muted-foreground">Memuat…</p>;
  if (!request)
    return (
      <div className="space-y-3">
        <p className="text-muted-foreground">Pengajuan tidak ditemukan.</p>
        <Link to="/fund-requests" className="text-sm underline">
          Kembali ke daftar
        </Link>
      </div>
    );

  const isOwnerDraft = profile?.id === request.requester_id && request.status === "Draft";
  const rows = parseBreakdown(request.breakdown);

  async function handleReport(file: File) {
    setUploading(true);
    try {
      const path = await uploadDocument(file);
      await update.mutateAsync({
        id: request!.id,
        values: {
          report_url: path,
          report_submitted_at: new Date().toISOString(),
          status: "Reported",
        },
      });
      toast.success("LPJ terkirim.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal mengunggah LPJ.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete() {
    try {
      await remove.mutateAsync(request!.id);
      toast.success("Pengajuan dihapus.");
      navigate({ to: "/fund-requests" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menghapus pengajuan.");
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Link
        to="/fund-requests"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Kembali
      </Link>

      <div className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">{request.request_number ?? "Draft"}</p>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{request.purpose}</h1>
            <div className="mt-2 flex flex-wrap gap-2">
              <FundStatusBadge value={request.status} />
              <FundUrgencyBadge value={request.urgency} />
            </div>
          </div>
          {isOwnerDraft && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                <Pencil className="size-4" /> Edit
              </Button>
              <Button variant="outline" size="sm" onClick={handleDelete}>
                <Trash2 className="size-4" /> Hapus
              </Button>
            </div>
          )}
        </div>

        <div className="mt-6 overflow-x-auto pb-1">
          <StatusTimeline status={request.status} />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Info label="Jumlah" value={rupiah(request.amount_idr)} />
          <Info label="Divisi" value={request.requester_division ?? "-"} />
          <Info label="Pemohon" value={request.requester?.full_name ?? "-"} />
          <Info label="Tanggal Diajukan" value={formatDate(request.created_at)} />
          <Info label="Approver" value={request.approver?.full_name ?? "-"} />
          <Info label="Disetujui" value={formatDate(request.approved_at)} />
          <Info label="Dicairkan" value={formatDate(request.disbursed_at)} />
          <Info label="LPJ Dikirim" value={formatDate(request.report_submitted_at)} />
          <Info label="Catatan" value={request.notes ?? "-"} />
        </div>
      </div>

      {request.status === "Rejected" && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800">
          <h2 className="font-semibold">Pengajuan Ditolak</h2>
          <p className="mt-1 text-sm">{request.approval_notes ?? "Tanpa alasan tercatat."}</p>
        </div>
      )}

      {request.status === "Under_Review" && request.approval_notes && (
        <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5 text-yellow-900">
          <h2 className="font-semibold">Butuh Info Tambahan</h2>
          <p className="mt-1 text-sm">{request.approval_notes}</p>
        </div>
      )}

      <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
        <h2 className="mb-3 text-lg font-semibold">Breakdown Rincian</h2>
        <BreakdownTable rows={rows} />
      </section>

      {request.status === "Disbursed" && (
        <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold">Upload LPJ</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Unggah laporan pertanggungjawaban (PDF) untuk menutup pengajuan ini.
          </p>
          <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted">
            <Upload className="size-4" />
            {uploading ? "Mengunggah…" : "Pilih file PDF"}
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleReport(file);
              }}
            />
          </label>
        </section>
      )}

      {request.report_url && (
        <p className="text-sm text-muted-foreground">Berkas LPJ: {request.report_url}</p>
      )}

      <FundRequestFormDialog open={editOpen} onOpenChange={setEditOpen} request={request} />
    </div>
  );
}
