import { useEffect, useState } from "react";
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
import { EnumSelect, Field, NONE } from "@/components/external/form-fields";
import {
  COMPANY_STATUSES,
  COMPANY_TYPES,
  CONTACT_CHANNELS,
  CONTACT_ROLES,
  DEAL_STAGES,
  DEAL_TYPES,
  MOU_STATUSES,
} from "@/components/external/badges";
import {
  useCompanies,
  useCreateCompany,
  useCreateDeal,
  useCreateMou,
  useCreatePerson,
  useDeals,
  usePeople,
  useUpdateCompany,
  useUpdateDeal,
  useUpdateMou,
  useUpdatePerson,
  uploadDocument,
  type Company,
  type Deal,
  type Mou,
  type Person,
} from "@/hooks/useExternal";
import { useDivisions, useProfiles } from "@/hooks/useProfile";
import { eventOptionLabel, useEvents } from "@/hooks/useEvents";
import { supabase } from "@/integrations/supabase/client";

type DialogProps = { open: boolean; onOpenChange: (open: boolean) => void };

function orNull(value: string) {
  return value === "" || value === NONE ? null : value;
}

/* ------------------------------- Company ------------------------------- */

export function CompanyFormDialog({
  open,
  onOpenChange,
  company,
}: DialogProps & { company?: Company | null }) {
  const create = useCreateCompany();
  const update = useUpdateCompany();
  const { data: divisions = [] } = useDivisions();
  const [form, setForm] = useState({
    name: "",
    type: "Sponsor",
    industry: "",
    website: "",
    city: "",
    notes: "",
    owner_division: NONE,
    overall_status: "Cold",
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      name: company?.name ?? "",
      type: company?.type ?? "Sponsor",
      industry: company?.industry ?? "",
      website: company?.website ?? "",
      city: company?.city ?? "",
      notes: company?.notes ?? "",
      owner_division: company?.owner_division ?? NONE,
      overall_status: company?.overall_status ?? "Cold",
    });
  }, [open, company]);

  async function handleSubmit() {
    if (!form.name.trim()) {
      toast.error("Nama perusahaan wajib diisi");
      return;
    }
    const values = {
      name: form.name.trim(),
      type: form.type as Company["type"],
      industry: orNull(form.industry),
      website: orNull(form.website),
      city: orNull(form.city),
      notes: orNull(form.notes),
      owner_division: orNull(form.owner_division),
      overall_status: form.overall_status as Company["overall_status"],
    };
    try {
      if (company) {
        await update.mutateAsync({ id: company.id, values });
        toast.success("Perusahaan diperbarui");
      } else {
        const { data: userData } = await supabase.auth.getUser();
        await create.mutateAsync({ ...values, created_by: userData.user?.id ?? null });
        toast.success("Perusahaan ditambahkan");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{company ? "Edit Perusahaan" : "Tambah Perusahaan"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nama Perusahaan *" className="space-y-1.5 sm:col-span-2">
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="PT Contoh Jaya"
            />
          </Field>
          <Field label="Tipe">
            <EnumSelect
              value={form.type}
              onChange={(v) => setForm({ ...form, type: v })}
              options={COMPANY_TYPES}
            />
          </Field>
          <Field label="Status">
            <EnumSelect
              value={form.overall_status}
              onChange={(v) => setForm({ ...form, overall_status: v })}
              options={COMPANY_STATUSES}
            />
          </Field>
          <Field label="Industri">
            <Input
              value={form.industry}
              onChange={(e) => setForm({ ...form, industry: e.target.value })}
            />
          </Field>
          <Field label="Kota">
            <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </Field>
          <Field label="Website" className="space-y-1.5 sm:col-span-2">
            <Input
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              placeholder="https://"
            />
          </Field>
          <Field label="Divisi Pemilik" className="space-y-1.5 sm:col-span-2">
            <EnumSelect
              value={form.owner_division}
              onChange={(v) => setForm({ ...form, owner_division: v })}
              options={divisions.map((d) => ({ value: d.code, label: `${d.code} — ${d.name}` }))}
              emptyLabel="Tanpa divisi"
            />
          </Field>
          <Field label="Catatan" className="space-y-1.5 sm:col-span-2">
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
            />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={create.isPending || update.isPending}>
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------- Person -------------------------------- */

export function PersonFormDialog({
  open,
  onOpenChange,
  companyId,
  person,
}: DialogProps & { companyId: string; person?: Person | null }) {
  const create = useCreatePerson();
  const update = useUpdatePerson();
  const [form, setForm] = useState({
    full_name: "",
    title: "",
    email: "",
    phone: "",
    linkedin_url: "",
    role_in_relation: NONE,
    preferred_channel: "WA",
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      full_name: person?.full_name ?? "",
      title: person?.title ?? "",
      email: person?.email ?? "",
      phone: person?.phone ?? "",
      linkedin_url: person?.linkedin_url ?? "",
      role_in_relation: person?.role_in_relation ?? NONE,
      preferred_channel: person?.preferred_channel ?? "WA",
    });
  }, [open, person]);

  async function handleSubmit() {
    if (!form.full_name.trim()) {
      toast.error("Nama lengkap wajib diisi");
      return;
    }
    const values = {
      full_name: form.full_name.trim(),
      title: orNull(form.title),
      email: orNull(form.email),
      phone: orNull(form.phone),
      linkedin_url: orNull(form.linkedin_url),
      role_in_relation: orNull(form.role_in_relation) as Person["role_in_relation"],
      preferred_channel: form.preferred_channel as Person["preferred_channel"],
      company_id: companyId,
    };
    try {
      if (person) {
        await update.mutateAsync({ id: person.id, values });
        toast.success("Kontak diperbarui");
      } else {
        await create.mutateAsync(values);
        toast.success("Kontak ditambahkan");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{person ? "Edit Kontak" : "Tambah Kontak"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nama Lengkap *" className="space-y-1.5 sm:col-span-2">
            <Input
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
          </Field>
          <Field label="Jabatan">
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </Field>
          <Field label="Email">
            <Input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Field>
          <Field label="Phone">
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </Field>
          <Field label="LinkedIn">
            <Input
              value={form.linkedin_url}
              onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })}
            />
          </Field>
          <Field label="Role">
            <EnumSelect
              value={form.role_in_relation}
              onChange={(v) => setForm({ ...form, role_in_relation: v })}
              options={CONTACT_ROLES}
              emptyLabel="Belum ditentukan"
            />
          </Field>
          <Field label="Channel Favorit">
            <EnumSelect
              value={form.preferred_channel}
              onChange={(v) => setForm({ ...form, preferred_channel: v })}
              options={CONTACT_CHANNELS}
            />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={create.isPending || update.isPending}>
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* --------------------------------- Deal --------------------------------- */

export function DealFormDialog({
  open,
  onOpenChange,
  companyId,
  deal,
}: DialogProps & { companyId?: string; deal?: Deal | null }) {
  const create = useCreateDeal();
  const update = useUpdateDeal();
  const { data: companies = [] } = useCompanies();
  const { data: divisions = [] } = useDivisions();
  const { data: profiles = [] } = useProfiles();
  const { data: events = [] } = useEvents();
  const [form, setForm] = useState({
    name: "",
    deal_type: "Sponsorship",
    company_id: NONE,
    primary_contact_id: NONE,
    owner_division: NONE,
    owner_person_id: NONE,
    stage: "Prospect",
    event_id: NONE,
    value_idr: "",
    deliverables: "",
    deadline: "",
    notes: "",
  });
  const { data: people = [] } = usePeople(
    form.company_id !== NONE ? form.company_id : undefined,
  );

  useEffect(() => {
    if (!open) return;
    setForm({
      name: deal?.name ?? "",
      deal_type: deal?.deal_type ?? "Sponsorship",
      company_id: deal?.company_id ?? companyId ?? NONE,
      primary_contact_id: deal?.primary_contact_id ?? NONE,
      owner_division: deal?.owner_division ?? NONE,
      owner_person_id: deal?.owner_person_id ?? NONE,
      stage: deal?.stage ?? "Prospect",
      event_id: deal?.event_id ?? NONE,
      value_idr: deal?.value_idr ? String(deal.value_idr) : "",
      deliverables: deal?.deliverables ?? "",
      deadline: deal?.deadline ?? "",
      notes: deal?.notes ?? "",
    });
  }, [open, deal, companyId]);

  const picOptions = profiles
    .filter((p) => (form.owner_division === NONE ? true : p.division === form.owner_division))
    .map((p) => ({ value: p.id, label: p.full_name }));

  async function handleSubmit() {
    if (!form.name.trim()) {
      toast.error("Nama deal wajib diisi");
      return;
    }
    const values = {
      name: form.name.trim(),
      deal_type: form.deal_type as Deal["deal_type"],
      company_id: orNull(form.company_id),
      primary_contact_id: orNull(form.primary_contact_id),
      owner_division: orNull(form.owner_division),
      owner_person_id: orNull(form.owner_person_id),
      stage: form.stage as Deal["stage"],
      event_id: orNull(form.event_id),
      value_idr: form.value_idr ? Number(form.value_idr) : 0,
      deliverables: orNull(form.deliverables),
      deadline: orNull(form.deadline),
      notes: orNull(form.notes),
    };
    try {
      if (deal) {
        await update.mutateAsync({ id: deal.id, values });
        toast.success("Deal diperbarui");
      } else {
        await create.mutateAsync(values);
        toast.success("Deal ditambahkan");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{deal ? "Edit Deal" : "Deal Baru"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nama Deal *" className="space-y-1.5 sm:col-span-2">
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label="Tipe">
            <EnumSelect
              value={form.deal_type}
              onChange={(v) => setForm({ ...form, deal_type: v })}
              options={DEAL_TYPES}
            />
          </Field>
          <Field label="Stage">
            <EnumSelect
              value={form.stage}
              onChange={(v) => setForm({ ...form, stage: v })}
              options={DEAL_STAGES}
            />
          </Field>
          <Field label="Perusahaan">
            <EnumSelect
              value={form.company_id}
              onChange={(v) => setForm({ ...form, company_id: v, primary_contact_id: NONE })}
              options={companies.map((c) => ({ value: c.id, label: c.name }))}
              emptyLabel="Tanpa perusahaan"
            />
          </Field>
          <Field label="Kontak Utama">
            <EnumSelect
              value={form.primary_contact_id}
              onChange={(v) => setForm({ ...form, primary_contact_id: v })}
              options={people.map((p) => ({ value: p.id, label: p.full_name }))}
              emptyLabel="Tanpa kontak"
            />
          </Field>
          <Field label="Divisi Pemilik">
            <EnumSelect
              value={form.owner_division}
              onChange={(v) => setForm({ ...form, owner_division: v, owner_person_id: NONE })}
              options={divisions.map((d) => ({ value: d.code, label: `${d.code} — ${d.name}` }))}
              emptyLabel="Tanpa divisi"
            />
          </Field>
          <Field label="PIC">
            <EnumSelect
              value={form.owner_person_id}
              onChange={(v) => setForm({ ...form, owner_person_id: v })}
              options={picOptions}
              emptyLabel="Tanpa PIC"
            />
          </Field>
          <Field label="Event Terkait">
            <EnumSelect
              value={form.event_id}
              onChange={(v) => setForm({ ...form, event_id: v })}
              options={events.map((e) => ({ value: e.id, label: eventOptionLabel(e) }))}
              emptyLabel="Tanpa event"
            />
          </Field>
          <Field label="Value (IDR)">
            <Input
              type="number"
              value={form.value_idr}
              onChange={(e) => setForm({ ...form, value_idr: e.target.value })}
            />
          </Field>
          <Field label="Deadline">
            <Input
              type="date"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            />
          </Field>
          <Field label="Deliverables" className="space-y-1.5 sm:col-span-2">
            <Textarea
              value={form.deliverables}
              onChange={(e) => setForm({ ...form, deliverables: e.target.value })}
              rows={3}
            />
          </Field>
          <Field label="Catatan" className="space-y-1.5 sm:col-span-2">
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
            />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={create.isPending || update.isPending}>
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------------------------- MoU ---------------------------------- */

export function MouFormDialog({
  open,
  onOpenChange,
  companyId,
  mou,
}: DialogProps & { companyId?: string; mou?: Mou | null }) {
  const create = useCreateMou();
  const update = useUpdateMou();
  const { data: companies = [] } = useCompanies();
  const { data: profiles = [] } = useProfiles();
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    company_id: NONE,
    deal_id: NONE,
    signed_date: "",
    expiry_date: "",
    pdf_url: "",
    signatory_our_side_id: NONE,
    signatory_their_name: "",
    signatory_their_title: "",
    status: "Draft",
    renewal_reminder_days: "30",
    notes: "",
  });
  const { data: deals = [] } = useDeals(form.company_id !== NONE ? form.company_id : undefined);

  useEffect(() => {
    if (!open) return;
    setForm({
      title: mou?.title ?? "",
      company_id: mou?.company_id ?? companyId ?? NONE,
      deal_id: mou?.deal_id ?? NONE,
      signed_date: mou?.signed_date ?? "",
      expiry_date: mou?.expiry_date ?? "",
      pdf_url: mou?.pdf_url ?? "",
      signatory_our_side_id: mou?.signatory_our_side_id ?? NONE,
      signatory_their_name: mou?.signatory_their_name ?? "",
      signatory_their_title: mou?.signatory_their_title ?? "",
      status: mou?.status ?? "Draft",
      renewal_reminder_days: String(mou?.renewal_reminder_days ?? 30),
      notes: mou?.notes ?? "",
    });
  }, [open, mou, companyId]);

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const path = await uploadDocument(file);
      setForm((prev) => ({ ...prev, pdf_url: path }));
      toast.success("Dokumen terunggah");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit() {
    if (!form.title.trim()) {
      toast.error("Judul MoU wajib diisi");
      return;
    }
    const values = {
      title: form.title.trim(),
      company_id: orNull(form.company_id),
      deal_id: orNull(form.deal_id),
      signed_date: orNull(form.signed_date),
      expiry_date: orNull(form.expiry_date),
      pdf_url: orNull(form.pdf_url),
      signatory_our_side_id: orNull(form.signatory_our_side_id),
      signatory_their_name: orNull(form.signatory_their_name),
      signatory_their_title: orNull(form.signatory_their_title),
      status: form.status as Mou["status"],
      renewal_reminder_days: Number(form.renewal_reminder_days || 30),
      notes: orNull(form.notes),
    };
    try {
      if (mou) {
        await update.mutateAsync({ id: mou.id, values });
        toast.success("MoU diperbarui");
      } else {
        await create.mutateAsync(values);
        toast.success("MoU ditambahkan");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mou ? "Edit MoU" : "Tambah MoU"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Judul *" className="space-y-1.5 sm:col-span-2">
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </Field>
          <Field label="Perusahaan">
            <EnumSelect
              value={form.company_id}
              onChange={(v) => setForm({ ...form, company_id: v, deal_id: NONE })}
              options={companies.map((c) => ({ value: c.id, label: c.name }))}
              emptyLabel="Tanpa perusahaan"
            />
          </Field>
          <Field label="Deal Terkait">
            <EnumSelect
              value={form.deal_id}
              onChange={(v) => setForm({ ...form, deal_id: v })}
              options={deals.map((d) => ({ value: d.id, label: d.name }))}
              emptyLabel="Tanpa deal"
            />
          </Field>
          <Field label="Tanggal Tanda Tangan">
            <Input
              type="date"
              value={form.signed_date}
              onChange={(e) => setForm({ ...form, signed_date: e.target.value })}
            />
          </Field>
          <Field label="Tanggal Expired">
            <Input
              type="date"
              value={form.expiry_date}
              onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
            />
          </Field>
          <Field label="Dokumen PDF" className="space-y-1.5 sm:col-span-2">
            <Input
              type="file"
              accept="application/pdf"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleUpload(file);
              }}
            />
            {form.pdf_url && (
              <p className="truncate text-xs text-muted-foreground">
                Tersimpan: {form.pdf_url}
              </p>
            )}
          </Field>
          <Field label="Penandatangan Kita">
            <EnumSelect
              value={form.signatory_our_side_id}
              onChange={(v) => setForm({ ...form, signatory_our_side_id: v })}
              options={profiles.map((p) => ({ value: p.id, label: p.full_name }))}
              emptyLabel="Belum ditentukan"
            />
          </Field>
          <Field label="Status">
            <EnumSelect
              value={form.status}
              onChange={(v) => setForm({ ...form, status: v })}
              options={MOU_STATUSES}
            />
          </Field>
          <Field label="Nama Penandatangan Mereka">
            <Input
              value={form.signatory_their_name}
              onChange={(e) => setForm({ ...form, signatory_their_name: e.target.value })}
            />
          </Field>
          <Field label="Jabatan Mereka">
            <Input
              value={form.signatory_their_title}
              onChange={(e) => setForm({ ...form, signatory_their_title: e.target.value })}
            />
          </Field>
          <Field label="Reminder H- (hari)">
            <Input
              type="number"
              value={form.renewal_reminder_days}
              onChange={(e) => setForm({ ...form, renewal_reminder_days: e.target.value })}
            />
          </Field>
          <Field label="Catatan" className="space-y-1.5 sm:col-span-2">
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
            />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={create.isPending || update.isPending}>
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
