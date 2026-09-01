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
import {
  COMPANY_STATUSES,
  COMPANY_TYPES,
  CompanyStatusBadge,
  CompanyTypeBadge,
} from "@/components/external/badges";
import { EnumSelect, NONE } from "@/components/external/form-fields";
import { CompanyFormDialog } from "@/components/external/forms";
import { useCompanies } from "@/hooks/useExternal";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/companies/")({
  head: () => ({
    meta: [
      { title: "Perusahaan — OrgTool" },
      { name: "description", content: "Database perusahaan sponsor, media, dan mitra institusi." },
      { property: "og:title", content: "Perusahaan — OrgTool" },
      {
        property: "og:description",
        content: "Database perusahaan sponsor, media, dan mitra institusi.",
      },
    ],
  }),
  component: CompaniesPage,
});

function CompaniesPage() {
  const { data: companies = [], isLoading } = useCompanies();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [type, setType] = useState(NONE);
  const [status, setStatus] = useState(NONE);
  const [open, setOpen] = useState(false);

  const rows = useMemo(
    () =>
      companies.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) &&
          (type === NONE || c.type === type) &&
          (status === NONE || c.overall_status === status),
      ),
    [companies, search, type, status],
  );

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Perusahaan</h1>
          <p className="text-sm text-muted-foreground">
            {companies.length} perusahaan terdaftar di database eksternal.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" /> Tambah Perusahaan
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Cari nama perusahaan…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <EnumSelect value={type} onChange={setType} options={COMPANY_TYPES} emptyLabel="Semua tipe" />
        <EnumSelect
          value={status}
          onChange={setStatus}
          options={COMPANY_STATUSES}
          emptyLabel="Semua status"
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Tipe</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Kota</TableHead>
              <TableHead>Divisi Pemilik</TableHead>
              <TableHead>Terakhir Dihubungi</TableHead>
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
                  Belum ada perusahaan yang cocok.
                </TableCell>
              </TableRow>
            )}
            {rows.map((c) => (
              <TableRow
                key={c.id}
                className="cursor-pointer"
                onClick={() =>
                  navigate({ to: "/companies/$id", params: { id: c.id } })
                }
              >
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell>
                  <CompanyTypeBadge value={c.type} />
                </TableCell>
                <TableCell>
                  <CompanyStatusBadge value={c.overall_status} />
                </TableCell>
                <TableCell>{c.city ?? "-"}</TableCell>
                <TableCell>{c.owner_division ?? "-"}</TableCell>
                <TableCell>{formatDate(c.last_touch_date)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <CompanyFormDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
