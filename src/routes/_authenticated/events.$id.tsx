import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BucketImage,
  ConfirmationBadge,
  EventStatusBadge,
  EventTypeBadge,
  FeeStatusBadge,
  formatDateTime,
  formatEventRange,
} from "@/components/events/event-ui";
import { EventFormDialog, EventSpeakerFormDialog } from "@/components/events/forms";
import { DealStageBadge } from "@/components/external/badges";
import {
  canManageEvents,
  useDeleteEventSpeaker,
  useEvent,
  useEventDeals,
  useEventSpeakers,
  useEventTransactions,
} from "@/hooks/useEvents";
import { useMyProfile } from "@/hooks/useProfile";
import { formatDate, rupiah } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/events/$id")({
  head: () => ({
    meta: [
      { title: "Detail Event — OrgTool" },
      { name: "description", content: "Detail event: speaker, sponsorship, dan keuangan event." },
      { property: "og:title", content: "Detail Event — OrgTool" },
      {
        property: "og:description",
        content: "Detail event: speaker, sponsorship, dan keuangan event.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EventDetailPage,
});

const TIMELINE = ["Planning", "Preparation", "Live", "Done"] as const;

function StatCard({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`mt-2 text-2xl font-bold tracking-tight ${valueClass ?? ""}`}>{value}</p>
    </div>
  );
}

function EventDetailPage() {
  const { id } = useParams({ from: "/_authenticated/events/$id" });
  const { data: event, isLoading } = useEvent(id);
  const { data: profile } = useMyProfile();
  const { data: speakers = [] } = useEventSpeakers(id);
  const { data: deals = [] } = useEventDeals(id);
  const { data: transactions = [] } = useEventTransactions(id);
  const removeSpeaker = useDeleteEventSpeaker();
  const [editOpen, setEditOpen] = useState(false);
  const [addSpeakerOpen, setAddSpeakerOpen] = useState(false);

  const canManage = canManageEvents(profile?.role, profile?.division);

  if (isLoading) return <p className="text-sm text-muted-foreground">Memuat data…</p>;
  if (!event) return <p className="text-sm text-muted-foreground">Event tidak ditemukan.</p>;

  const sponsorship = deals
    .filter((d) => d.stage === "Deal")
    .reduce((sum, d) => sum + Number(d.value_idr ?? 0), 0);
  const expense = transactions
    .filter((t) => t.type === "Expense")
    .reduce((sum, t) => sum + Number(t.amount_idr ?? 0), 0);
  const budget = Number(event.budget_idr ?? 0);
  const over = budget > 0 && expense / budget > 0.8;
  const activeStep = TIMELINE.indexOf(event.status as (typeof TIMELINE)[number]);

  async function handleRemove(rowId: string) {
    try {
      await removeSpeaker.mutateAsync(rowId);
      toast.success("Speaker dihapus dari event.");
    } catch (error) {
      toast.error((error as Error).message || "Gagal menghapus speaker.");
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Link to="/events" className="text-sm text-muted-foreground hover:underline">
        ← Kembali ke daftar event
      </Link>

      <section className="grid gap-5 rounded-2xl border bg-card p-5 shadow-sm sm:grid-cols-[minmax(0,260px)_1fr]">
        <BucketImage
          bucket="events"
          path={event.poster_url}
          alt={`Poster ${event.name}`}
          className="aspect-[4/3] w-full rounded-xl"
          fallback="Tanpa poster"
        />
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">{event.name}</h1>
          <div className="flex flex-wrap gap-1.5">
            <EventTypeBadge value={event.event_type} />
            <EventStatusBadge value={event.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {formatEventRange(event.date_start, event.date_end)}
          </p>
          <p className="text-sm text-muted-foreground">
            {event.venue ?? "Venue belum diatur"}
            {event.venue_address ? ` — ${event.venue_address}` : ""}
          </p>
          <p className="text-sm text-muted-foreground">PIC: {event.pic?.full_name ?? "-"}</p>
          {canManage && (
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              Edit Event
            </Button>
          )}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Speaker" value={String(speakers.length)} />
        <StatCard label="Total Sponsorship" value={rupiah(sponsorship)} />
        <StatCard
          label="Total Expense"
          value={rupiah(expense)}
          valueClass={over ? "text-red-600" : ""}
        />
        <StatCard
          label="Peserta Aktual"
          value={
            event.status === "Done"
              ? String(event.actual_attendees ?? 0)
              : "Belum selesai"
          }
        />
      </section>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="speakers">Speaker</TabsTrigger>
          <TabsTrigger value="sponsorship">Sponsorship</TabsTrigger>
          <TabsTrigger value="finance">Keuangan</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 pt-4">
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Deskripsi</h2>
            <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
              {event.description || "Belum ada deskripsi."}
            </p>
            <h2 className="mt-5 text-lg font-semibold">Catatan</h2>
            <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
              {event.notes || "Belum ada catatan."}
            </p>
          </div>
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Timeline</h2>
            <ol className="mt-4 flex flex-wrap items-center gap-3">
              {TIMELINE.map((step, index) => (
                <li key={step} className="flex items-center gap-3">
                  <span
                    className={`flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${
                      activeStep >= index
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {step}
                  </span>
                  {index < TIMELINE.length - 1 && (
                    <span className="text-muted-foreground">→</span>
                  )}
                </li>
              ))}
            </ol>
            {event.status === "Cancelled" && (
              <p className="mt-3 text-sm font-medium text-red-600">Event dibatalkan.</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="speakers" className="space-y-4 pt-4">
          {canManage && (
            <Button onClick={() => setAddSpeakerOpen(true)}>+ Tambah Speaker ke Event</Button>
          )}
          <div className="overflow-x-auto rounded-2xl border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Foto</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Judul Sesi</TableHead>
                  <TableHead>Waktu Sesi</TableHead>
                  <TableHead>Fee</TableHead>
                  <TableHead>Konfirmasi</TableHead>
                  {canManage && <TableHead>Aksi</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {speakers.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={canManage ? 7 : 6}
                      className="text-center text-sm text-muted-foreground"
                    >
                      Belum ada speaker di event ini.
                    </TableCell>
                  </TableRow>
                )}
                {speakers.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <BucketImage
                        bucket="speakers"
                        path={row.speakers?.photo_url}
                        alt={row.speakers?.full_name ?? "Speaker"}
                        className="size-10 rounded-full"
                        fallback="?"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{row.speakers?.full_name ?? "-"}</TableCell>
                    <TableCell>{row.session_title ?? "-"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateTime(row.session_time_start)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{row.fee_idr != null ? rupiah(row.fee_idr) : "-"}</span>
                        <FeeStatusBadge value={row.fee_status} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <ConfirmationBadge value={row.confirmation_status} />
                    </TableCell>
                    {canManage && (
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemove(row.id)}
                        >
                          Hapus
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="sponsorship" className="pt-4">
          <div className="overflow-x-auto rounded-2xl border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deal</TableHead>
                  <TableHead>Perusahaan</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Nilai</TableHead>
                  <TableHead>Deadline</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deals.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                      Belum ada sponsorship terkait event ini.
                    </TableCell>
                  </TableRow>
                )}
                {deals.map((deal) => (
                  <TableRow key={deal.id}>
                    <TableCell className="font-medium">{deal.name}</TableCell>
                    <TableCell>
                      {deal.company_id ? (
                        <Link
                          to="/companies/$id"
                          params={{ id: deal.company_id }}
                          className="text-primary hover:underline"
                        >
                          {deal.companies?.name ?? "Lihat perusahaan"}
                        </Link>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <DealStageBadge value={deal.stage} />
                    </TableCell>
                    <TableCell>{rupiah(deal.value_idr)}</TableCell>
                    <TableCell>{formatDate(deal.deadline)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="finance" className="space-y-4 pt-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Budget Event" value={rupiah(budget)} />
            <StatCard
              label="Realisasi Expense"
              value={rupiah(expense)}
              valueClass={over ? "text-red-600" : ""}
            />
            <StatCard label="Sisa Budget" value={rupiah(Math.max(0, budget - expense))} />
          </div>
          <div className="overflow-x-auto rounded-2xl border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Jumlah</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                      Belum ada transaksi terkait event ini.
                    </TableCell>
                  </TableRow>
                )}
                {transactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{formatDate(t.transaction_date)}</TableCell>
                    <TableCell>{t.type === "Income" ? "Pemasukan" : "Pengeluaran"}</TableCell>
                    <TableCell>{t.category}</TableCell>
                    <TableCell>{t.description}</TableCell>
                    <TableCell className={t.type === "Expense" ? "text-red-600" : "text-green-600"}>
                      {rupiah(t.amount_idr)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <EventFormDialog open={editOpen} onOpenChange={setEditOpen} event={event} />
      <EventSpeakerFormDialog
        open={addSpeakerOpen}
        onOpenChange={setAddSpeakerOpen}
        eventId={id}
      />
    </div>
  );
}
