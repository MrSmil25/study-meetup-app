import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BucketImage, ConfirmationBadge, formatDateTime } from "@/components/events/event-ui";
import { SpeakerFormDialog } from "@/components/events/forms";
import { useSpeakerEvents, type SpeakerWithCompany } from "@/hooks/useEvents";
import { rupiah } from "@/lib/format";

export function SpeakerDetailDialog({
  speaker,
  onOpenChange,
  canManage,
}: {
  speaker: SpeakerWithCompany | null;
  onOpenChange: (open: boolean) => void;
  canManage: boolean;
}) {
  const { data: history = [], isLoading } = useSpeakerEvents(speaker?.id);
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <Dialog open={!!speaker} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{speaker?.full_name ?? "Speaker"}</DialogTitle>
          </DialogHeader>

          {speaker && (
            <Tabs defaultValue="info">
              <TabsList>
                <TabsTrigger value="info">Info</TabsTrigger>
                <TabsTrigger value="history">Riwayat Event</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4 pt-4">
                <div className="flex gap-4">
                  <BucketImage
                    bucket="speakers"
                    path={speaker.photo_url}
                    alt={speaker.full_name}
                    className="size-24 shrink-0 rounded-xl"
                    fallback="Foto"
                  />
                  <div className="space-y-1 text-sm">
                    <p className="text-base font-semibold">{speaker.full_name}</p>
                    <p className="text-muted-foreground">{speaker.title ?? "-"}</p>
                    <p className="text-muted-foreground">Expertise: {speaker.expertise ?? "-"}</p>
                    <p className="text-muted-foreground">
                      Afiliasi: {speaker.companies?.name ?? "-"}
                    </p>
                  </div>
                </div>
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  <Row label="Email" value={speaker.direct_email} />
                  <Row label="Phone" value={speaker.direct_phone} />
                  <Row
                    label="Default Rate"
                    value={speaker.default_rate_idr != null ? rupiah(speaker.default_rate_idr) : null}
                  />
                  <Row label="Bio Singkat" value={speaker.bio_short} />
                  <Row label="Catatan" value={speaker.notes} />
                </dl>
                {canManage && (
                  <Button variant="outline" onClick={() => setEditOpen(true)}>
                    Edit Speaker
                  </Button>
                )}
              </TabsContent>

              <TabsContent value="history" className="space-y-3 pt-4">
                {isLoading && <p className="text-sm text-muted-foreground">Memuat data…</p>}
                {!isLoading && history.length === 0 && (
                  <p className="text-sm text-muted-foreground">Belum pernah mengisi event.</p>
                )}
                {history.map((row) => (
                  <div key={row.id} className="rounded-xl border p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{row.events?.name ?? "Event"}</p>
                      <ConfirmationBadge value={row.confirmation_status} />
                    </div>
                    <p className="text-muted-foreground">{row.session_title ?? "Tanpa judul sesi"}</p>
                    <p className="text-muted-foreground">
                      {formatDateTime(row.session_time_start)} · Fee{" "}
                      {row.fee_idr != null ? rupiah(row.fee_idr) : "-"}
                    </p>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      <SpeakerFormDialog open={editOpen} onOpenChange={setEditOpen} speaker={speaker} />
    </>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-0.5">{value || "-"}</dd>
    </div>
  );
}
