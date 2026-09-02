import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CompanyStatusBadge,
  CompanyTypeBadge,
  DealStageBadge,
  DealTypeBadge,
  MouStatusBadge,
  label,
} from "@/components/external/badges";
import {
  CompanyFormDialog,
  DealFormDialog,
  MouFormDialog,
  PersonFormDialog,
} from "@/components/external/forms";
import {
  useCompany,
  useDeals,
  useMous,
  usePeople,
  type Person,
} from "@/hooks/useExternal";
import { formatDate, rupiah } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/companies/$id")({
  head: () => ({
    meta: [
      { title: "Detail Perusahaan — OrgTool" },
      { name: "description", content: "Kontak, deal, dan MoU dari satu perusahaan mitra." },
      { property: "og:title", content: "Detail Perusahaan — OrgTool" },
      {
        property: "og:description",
        content: "Kontak, deal, dan MoU dari satu perusahaan mitra.",
      },
    ],
  }),
  component: CompanyDetailPage,
});

function CompanyDetailPage() {
  const { id } = Route.useParams();
  const { data: company, isLoading } = useCompany(id);
  const { data: people = [] } = usePeople(id);
  const { data: deals = [] } = useDeals(id);
  const { data: mous = [] } = useMous(id);

  const [editOpen, setEditOpen] = useState(false);
  const [personOpen, setPersonOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [dealOpen, setDealOpen] = useState(false);
  const [mouOpen, setMouOpen] = useState(false);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Memuat perusahaan…</p>;
  }
  if (!company) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Perusahaan tidak ditemukan.</p>
        <Link to="/companies" className="text-sm font-medium text-primary underline">
          Kembali ke daftar perusahaan
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <Link
        to="/companies"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Daftar Perusahaan
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border bg-card p-5 shadow-sm">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">{company.name}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <CompanyTypeBadge value={company.type} />
            <CompanyStatusBadge value={company.overall_status} />
            {company.city && (
              <span className="text-xs text-muted-foreground">{company.city}</span>
            )}
          </div>
          {company.website && (
            <a
              href={company.website}
              target="_blank"
              rel="noreferrer"
              className="block text-sm text-primary underline"
            >
              {company.website}
            </a>
          )}
          {company.notes && (
            <p className="max-w-xl text-sm text-muted-foreground">{company.notes}</p>
          )}
        </div>
        <Button variant="outline" onClick={() => setEditOpen(true)}>
          <Pencil className="size-4" /> Edit
        </Button>
      </div>

      <Tabs defaultValue="kontak">
        <TabsList>
          <TabsTrigger value="kontak">Kontak</TabsTrigger>
          <TabsTrigger value="deal">Deal</TabsTrigger>
          <TabsTrigger value="mou">MoU</TabsTrigger>
        </TabsList>

        <TabsContent value="kontak" className="space-y-3">
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={() => {
                setEditingPerson(null);
                setPersonOpen(true);
              }}
            >
              <Plus className="size-4" /> Tambah Kontak
            </Button>
          </div>
          {people.length === 0 && (
            <p className="text-sm text-muted-foreground">Belum ada kontak.</p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {people.map((p) => (
              <div key={p.id} className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{p.full_name}</p>
                    <p className="text-xs text-muted-foreground">{p.title ?? "-"}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingPerson(p);
                      setPersonOpen(true);
                    }}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                </div>
                <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                  {p.email && <p>{p.email}</p>}
                  {p.phone && <p>{p.phone}</p>}
                  <p>
                    {label(p.role_in_relation)} · via {label(p.preferred_channel)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="deal" className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setDealOpen(true)}>
              <Plus className="size-4" /> Tambah Deal
            </Button>
          </div>
          {deals.length === 0 && <p className="text-sm text-muted-foreground">Belum ada deal.</p>}
          <div className="space-y-3">
            {deals.map((d) => (
              <div
                key={d.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4 shadow-sm"
              >
                <div>
                  <p className="font-semibold">{d.name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <DealTypeBadge value={d.deal_type} />
                    <DealStageBadge value={d.stage} />
                    {d.events && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground">
                        🎯 {d.events.name}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right text-sm">
                  <p className="font-semibold">{rupiah(d.value_idr)}</p>
                  <p className="text-xs text-muted-foreground">
                    Deadline: {formatDate(d.deadline)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="mou" className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setMouOpen(true)}>
              <Plus className="size-4" /> Tambah MoU
            </Button>
          </div>
          {mous.length === 0 && <p className="text-sm text-muted-foreground">Belum ada MoU.</p>}
          <div className="space-y-3">
            {mous.map((m) => (
              <div
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4 shadow-sm"
              >
                <div>
                  <p className="font-semibold">{m.title}</p>
                  <MouStatusBadge value={m.status} />
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <p>Ditandatangani: {formatDate(m.signed_date)}</p>
                  <p>Expired: {formatDate(m.expiry_date)}</p>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <CompanyFormDialog open={editOpen} onOpenChange={setEditOpen} company={company} />
      <PersonFormDialog
        open={personOpen}
        onOpenChange={setPersonOpen}
        companyId={company.id}
        person={editingPerson}
      />
      <DealFormDialog open={dealOpen} onOpenChange={setDealOpen} companyId={company.id} />
      <MouFormDialog open={mouOpen} onOpenChange={setMouOpen} companyId={company.id} />
    </div>
  );
}
