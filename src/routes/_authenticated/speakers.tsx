import { createFileRoute } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EnumSelect, NONE } from "@/components/external/form-fields";
import { BucketImage } from "@/components/events/event-ui";
import { SpeakerFormDialog } from "@/components/events/forms";
import { SpeakerDetailDialog } from "@/components/events/SpeakerDetailDialog";
import { canManageEvents, useSpeakers, type SpeakerWithCompany } from "@/hooks/useEvents";
import { useMyProfile } from "@/hooks/useProfile";
import { useCompanies } from "@/hooks/useExternal";

export const Route = createFileRoute("/_authenticated/speakers")({
  head: () => ({
    meta: [
      { title: "Speaker — OrgTool" },
      { name: "description", content: "Database pembicara: keahlian, kontak, dan riwayat event." },
      { property: "og:title", content: "Speaker — OrgTool" },
      {
        property: "og:description",
        content: "Database pembicara: keahlian, kontak, dan riwayat event.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SpeakersPage,
});

function SpeakersPage() {
  const { data: speakers = [], isLoading } = useSpeakers();
  const { data: companies = [] } = useCompanies();
  const { data: profile } = useMyProfile();
  const [search, setSearch] = useState("");
  const [company, setCompany] = useState(NONE);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<SpeakerWithCompany | null>(null);

  const canManage = canManageEvents(profile?.role, profile?.division);

  const rows = useMemo(() => {
    const q = search.toLowerCase();
    return speakers.filter(
      (s) =>
        (s.full_name.toLowerCase().includes(q) ||
          (s.expertise ?? "").toLowerCase().includes(q)) &&
        (company === NONE || s.company_id === company),
    );
  }, [speakers, search, company]);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Speaker</h1>
          <p className="text-sm text-muted-foreground">
            {speakers.length} pembicara di database organisasi.
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setOpen(true)}>
            <Plus className="size-4" /> Tambah Speaker
          </Button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Cari nama atau expertise…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <EnumSelect
          value={company}
          onChange={setCompany}
          emptyLabel="Semua afiliasi"
          options={companies.map((c) => ({ value: c.id, label: c.name }))}
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Foto</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Expertise</TableHead>
              <TableHead>Kontak</TableHead>
              <TableHead>Afiliasi</TableHead>
              <TableHead>Total Event</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                  Memuat data…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                  Belum ada speaker yang cocok.
                </TableCell>
              </TableRow>
            )}
            {rows.map((s) => (
              <TableRow key={s.id} className="cursor-pointer" onClick={() => setSelected(s)}>
                <TableCell>
                  <BucketImage
                    bucket="speakers"
                    path={s.photo_url}
                    alt={s.full_name}
                    className="size-10 rounded-full"
                    fallback="?"
                  />
                </TableCell>
                <TableCell className="font-medium">{s.full_name}</TableCell>
                <TableCell>{s.title ?? "-"}</TableCell>
                <TableCell>{s.expertise ?? "-"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {s.direct_email || s.direct_phone || "-"}
                </TableCell>
                <TableCell>{s.companies?.name ?? "-"}</TableCell>
                <TableCell>{s.event_speakers?.length ?? 0}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <SpeakerFormDialog open={open} onOpenChange={setOpen} />
      <SpeakerDetailDialog
        speaker={selected}
        onOpenChange={(o) => !o && setSelected(null)}
        canManage={canManage}
      />
    </div>
  );
}
