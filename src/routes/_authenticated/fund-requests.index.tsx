import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
import {
  FUND_STATUSES,
  FundStatusBadge,
  FundUrgencyBadge,
} from "@/components/funds/fund-ui";
import { FundRequestFormDialog } from "@/components/funds/FundRequestFormDialog";
import { useFundRequests } from "@/hooks/useFunds";
import { formatDate, rupiah } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/fund-requests/")({
  head: () => ({
    meta: [
      { title: "Pengajuan Dana — OrgTool" },
      {
        name: "description",
        content: "Daftar pengajuan dana divisi beserta status persetujuan dan pelaporan.",
      },
      { property: "og:title", content: "Pengajuan Dana — OrgTool" },
      {
        property: "og:description",
        content: "Daftar pengajuan dana divisi beserta status persetujuan dan pelaporan.",
      },
    ],
  }),
  component: FundRequestsPage,
});

function FundRequestsPage() {
  const navigate = useNavigate();
  const { data: requests = [], isLoading } = useFundRequests();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(NONE);
  const [formOpen, setFormOpen] = useState(false);

  const filtered = useMemo(
    () =>
      requests.filter((r) => {
        const okSearch = r.purpose.toLowerCase().includes(search.toLowerCase());
        const okStatus = status === NONE || r.status === status;
        return okSearch && okStatus;
      }),
    [requests, search, status],
  );

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pengajuan Dana</h1>
          <p className="text-sm text-muted-foreground">
            Kelola pengajuan dana dan pantau statusnya.
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="size-4" /> Ajukan Dana
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Cari perihal…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48">
          <EnumSelect
            value={status}
            onChange={setStatus}
            options={FUND_STATUSES}
            emptyLabel="Semua Status"
            placeholder="Semua Status"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No Request</TableHead>
              <TableHead>Perihal</TableHead>
              <TableHead>Divisi</TableHead>
              <TableHead className="text-right">Jumlah</TableHead>
              <TableHead>Urgency</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tanggal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  Memuat…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  Belum ada pengajuan.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((r) => (
              <TableRow
                key={r.id}
                className="cursor-pointer"
                onClick={() =>
                  navigate({ to: "/fund-requests/$id", params: { id: r.id } })
                }
              >
                <TableCell className="font-medium">{r.request_number ?? "—"}</TableCell>
                <TableCell className="max-w-[240px]">
                  <span className="block truncate">{r.purpose}</span>
                  {r.events && (
                    <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground">
                      🎯 {r.events.name}
                    </span>
                  )}
                </TableCell>
                <TableCell>{r.requester_division ?? "-"}</TableCell>
                <TableCell className="text-right">{rupiah(r.amount_idr)}</TableCell>
                <TableCell>
                  <FundUrgencyBadge value={r.urgency} />
                </TableCell>
                <TableCell>
                  <FundStatusBadge value={r.status} />
                </TableCell>
                <TableCell>{formatDate(r.created_at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <FundRequestFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}
