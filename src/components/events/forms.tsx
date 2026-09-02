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
  CONFIRMATION_STATUSES,
  EVENT_STATUSES,
  EVENT_TYPES,
  FEE_STATUSES,
} from "@/components/events/event-ui";
import {
  useCreateEvent,
  useCreateEventSpeaker,
  useCreateSpeaker,
  useSpeakers,
  useUpdateEvent,
  useUpdateSpeaker,
  type Event,
  type Speaker,
} from "@/hooks/useEvents";
import { useProfiles } from "@/hooks/useProfile";
import { useCompanies, usePeople } from "@/hooks/useExternal";
import { slugify, uploadToBucket } from "@/lib/storage";
import { rupiah } from "@/lib/format";

type DialogProps = { open: boolean; onOpenChange: (open: boolean) => void };

function orNull(value: string) {
  return value === "" || value === NONE ? null : value;
}
function numOrNull(value: string) {
  return value === "" ? null : Number(value);
}

/* -------------------------------- Event -------------------------------- */

export function EventFormDialog({
  open,
  onOpenChange,
  event,
}: DialogProps & { event?: Event | null }) {
  const create = useCreateEvent();
  const update = useUpdateEvent();
  const { data: profiles = [] } = useProfiles();
  const [saving, setSaving] = useState(false);
  const [poster, setPoster] = useState<File | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    event_type: "Workshop",
    date_start: "",
    date_end: "",
    venue: "",
    venue_address: "",
    pic_id: NONE,
    target_attendees: "",
    actual_attendees: "",
    budget_idr: "",
    status: "Planning",
    notes: "",
  });

  useEffect(() => {
    if (!open) return;
    setPoster(null);
    setSlugTouched(!!event);
    setForm({
      name: event?.name ?? "",
      slug: event?.slug ?? "",
      description: event?.description ?? "",
      event_type: event?.event_type ?? "Workshop",
      date_start: event?.date_start ?? "",
      date_end: event?.date_end ?? "",
      venue: event?.venue ?? "",
      venue_address: event?.venue_address ?? "",
      pic_id: event?.pic_id ?? NONE,
      target_attendees: event?.target_attendees != null ? String(event.target_attendees) : "",
      actual_attendees: event?.actual_attendees != null ? String(event.actual_attendees) : "",
      budget_idr: event?.budget_idr != null ? String(event.budget_idr) : "",
      status: event?.status ?? "Planning",
      notes: event?.notes ?? "",
    });
  }, [open, event]);

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  async function handleSubmit() {
    if (!form.name.trim()) {
      toast.error("Nama event wajib diisi.");
      return;
    }
    if (!form.date_start) {
      toast.error("Tanggal mulai wajib diisi.");
      return;
    }
    setSaving(true);
    try {
      let posterPath = event?.poster_url ?? null;
      if (poster) posterPath = await uploadToBucket("events", poster);

      const values = {
        name: form.name.trim(),
        slug: (form.slug || slugify(form.name)).trim(),
        description: orNull(form.description),
        event_type: form.event_type as Event["event_type"],
        date_start: form.date_start,
        date_end: orNull(form.date_end),
        venue: orNull(form.venue),
        venue_address: orNull(form.venue_address),
        pic_id: orNull(form.pic_id),
        target_attendees: numOrNull(form.target_attendees),
        actual_attendees: numOrNull(form.actual_attendees),
        budget_idr: numOrNull(form.budget_idr),
        status: form.status as Event["status"],
        poster_url: posterPath,
        notes: orNull(form.notes),
      };
      console.log("[event] payload", values);
      if (event) await update.mutateAsync({ id: event.id, values });
      else await create.mutateAsync(values);
      toast.success(event ? "Event diperbarui." : "Event dibuat.");
      onOpenChange(false);
    } catch (error) {
      toast.error((error as Error).message || "Gagal menyimpan event.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{event ? "Edit Event" : "Buat Event"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nama Event *" className="space-y-1.5 sm:col-span-2">
            <Input
              value={form.name}
              onChange={(e) => {
                const name = e.target.value;
                setForm((f) => ({ ...f, name, slug: slugTouched ? f.slug : slugify(name) }));
              }}
              placeholder="Contoh: Tech Talk 2026"
            />
          </Field>
          <Field label="Slug" className="space-y-1.5 sm:col-span-2">
            <Input
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                set("slug", e.target.value);
              }}
              placeholder="tech-talk-2026"
            />
          </Field>
          <Field label="Deskripsi" className="space-y-1.5 sm:col-span-2">
            <Textarea
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </Field>
          <Field label="Tipe">
            <EnumSelect
              value={form.event_type}
              onChange={(v) => set("event_type", v)}
              options={EVENT_TYPES}
            />
          </Field>
          <Field label="Status">
            <EnumSelect
              value={form.status}
              onChange={(v) => set("status", v)}
              options={EVENT_STATUSES}
            />
          </Field>
          <Field label="Tanggal Mulai *">
            <Input
              type="date"
              value={form.date_start}
              onChange={(e) => set("date_start", e.target.value)}
            />
          </Field>
          <Field label="Tanggal Selesai">
            <Input
              type="date"
              value={form.date_end}
              onChange={(e) => set("date_end", e.target.value)}
            />
          </Field>
          <Field label="Venue">
            <Input value={form.venue} onChange={(e) => set("venue", e.target.value)} />
          </Field>
          <Field label="PIC">
            <EnumSelect
              value={form.pic_id}
              onChange={(v) => set("pic_id", v)}
              emptyLabel="Tanpa PIC"
              options={profiles.map((p) => ({ value: p.id, label: p.full_name }))}
            />
          </Field>
          <Field label="Alamat Venue" className="space-y-1.5 sm:col-span-2">
            <Textarea
              rows={2}
              value={form.venue_address}
              onChange={(e) => set("venue_address", e.target.value)}
            />
          </Field>
          <Field label="Target Peserta">
            <Input
              type="number"
              value={form.target_attendees}
              onChange={(e) => set("target_attendees", e.target.value)}
            />
          </Field>
          <Field label="Peserta Aktual">
            <Input
              type="number"
              value={form.actual_attendees}
              onChange={(e) => set("actual_attendees", e.target.value)}
            />
          </Field>
          <Field label={`Budget Total ${form.budget_idr ? `(${rupiah(Number(form.budget_idr))})` : ""}`}>
            <Input
              type="number"
              value={form.budget_idr}
              onChange={(e) => set("budget_idr", e.target.value)}
            />
          </Field>
          <Field label="Poster (gambar)">
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setPoster(e.target.files?.[0] ?? null)}
            />
          </Field>
          <Field label="Catatan" className="space-y-1.5 sm:col-span-2">
            <Textarea rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Menyimpan…" : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------- Speaker ------------------------------- */

export function SpeakerFormDialog({
  open,
  onOpenChange,
  speaker,
  onCreated,
}: DialogProps & { speaker?: Speaker | null; onCreated?: (speaker: Speaker) => void }) {
  const create = useCreateSpeaker();
  const update = useUpdateSpeaker();
  const { data: companies = [] } = useCompanies();
  const [saving, setSaving] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [cv, setCv] = useState<File | null>(null);
  const [form, setForm] = useState({
    full_name: "",
    title: "",
    expertise: "",
    bio_short: "",
    default_rate_idr: "",
    company_id: NONE,
    contact_person_id: NONE,
    direct_email: "",
    direct_phone: "",
    notes: "",
  });
  const { data: people = [] } = usePeople(
    form.company_id !== NONE ? form.company_id : undefined,
  );

  useEffect(() => {
    if (!open) return;
    setPhoto(null);
    setCv(null);
    setForm({
      full_name: speaker?.full_name ?? "",
      title: speaker?.title ?? "",
      expertise: speaker?.expertise ?? "",
      bio_short: speaker?.bio_short ?? "",
      default_rate_idr: speaker?.default_rate_idr != null ? String(speaker.default_rate_idr) : "",
      company_id: speaker?.company_id ?? NONE,
      contact_person_id: speaker?.contact_person_id ?? NONE,
      direct_email: speaker?.direct_email ?? "",
      direct_phone: speaker?.direct_phone ?? "",
      notes: speaker?.notes ?? "",
    });
  }, [open, speaker]);

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  async function handleSubmit() {
    if (!form.full_name.trim()) {
      toast.error("Nama lengkap wajib diisi.");
      return;
    }
    setSaving(true);
    try {
      let photoPath = speaker?.photo_url ?? null;
      let cvPath = speaker?.cv_url ?? null;
      if (photo) photoPath = await uploadToBucket("speakers", photo);
      if (cv) cvPath = await uploadToBucket("documents", cv);

      const values = {
        full_name: form.full_name.trim(),
        title: orNull(form.title),
        expertise: orNull(form.expertise),
        bio_short: orNull(form.bio_short),
        photo_url: photoPath,
        cv_url: cvPath,
        default_rate_idr: numOrNull(form.default_rate_idr),
        company_id: orNull(form.company_id),
        contact_person_id: orNull(form.contact_person_id),
        direct_email: orNull(form.direct_email),
        direct_phone: orNull(form.direct_phone),
        notes: orNull(form.notes),
      };
      console.log("[speaker] payload", values);
      if (speaker) {
        await update.mutateAsync({ id: speaker.id, values });
      } else {
        const created = await create.mutateAsync(values);
        onCreated?.(created as Speaker);
      }
      toast.success(speaker ? "Speaker diperbarui." : "Speaker ditambahkan.");
      onOpenChange(false);
    } catch (error) {
      toast.error((error as Error).message || "Gagal menyimpan speaker.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{speaker ? "Edit Speaker" : "Tambah Speaker"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nama Lengkap *" className="space-y-1.5 sm:col-span-2">
            <Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} />
          </Field>
          <Field label="Title/Jabatan">
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} />
          </Field>
          <Field label="Expertise">
            <Input value={form.expertise} onChange={(e) => set("expertise", e.target.value)} />
          </Field>
          <Field label="Bio Singkat" className="space-y-1.5 sm:col-span-2">
            <Textarea
              rows={3}
              value={form.bio_short}
              onChange={(e) => set("bio_short", e.target.value)}
            />
          </Field>
          <Field label="Foto">
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
            />
          </Field>
          <Field label="CV (PDF)">
            <Input
              type="file"
              accept="application/pdf"
              onChange={(e) => setCv(e.target.files?.[0] ?? null)}
            />
          </Field>
          <Field
            label={`Default Rate ${form.default_rate_idr ? `(${rupiah(Number(form.default_rate_idr))})` : ""}`}
          >
            <Input
              type="number"
              value={form.default_rate_idr}
              onChange={(e) => set("default_rate_idr", e.target.value)}
            />
          </Field>
          <Field label="Afiliasi Perusahaan">
            <EnumSelect
              value={form.company_id}
              onChange={(v) => setForm((f) => ({ ...f, company_id: v, contact_person_id: NONE }))}
              emptyLabel="Tanpa afiliasi"
              options={companies.map((c) => ({ value: c.id, label: c.name }))}
            />
          </Field>
          <Field label="Kontak Perantara">
            <EnumSelect
              value={form.contact_person_id}
              onChange={(v) => set("contact_person_id", v)}
              emptyLabel="Tanpa perantara"
              options={people.map((p) => ({ value: p.id, label: p.full_name }))}
            />
          </Field>
          <Field label="Email Langsung">
            <Input value={form.direct_email} onChange={(e) => set("direct_email", e.target.value)} />
          </Field>
          <Field label="Phone Langsung">
            <Input value={form.direct_phone} onChange={(e) => set("direct_phone", e.target.value)} />
          </Field>
          <Field label="Catatan" className="space-y-1.5 sm:col-span-2">
            <Textarea rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Menyimpan…" : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* --------------------------- Speaker di Event --------------------------- */

export function EventSpeakerFormDialog({
  open,
  onOpenChange,
  eventId,
}: DialogProps & { eventId: string }) {
  const { data: speakers = [] } = useSpeakers();
  const create = useCreateEventSpeaker();
  const [saving, setSaving] = useState(false);
  const [newSpeakerOpen, setNewSpeakerOpen] = useState(false);
  const [tor, setTor] = useState<File | null>(null);
  const [form, setForm] = useState({
    speaker_id: NONE,
    session_title: "",
    session_time_start: "",
    session_time_end: "",
    fee_idr: "",
    fee_status: "Pending",
    confirmation_status: "Invited",
    notes: "",
  });

  useEffect(() => {
    if (!open) return;
    setTor(null);
    setForm({
      speaker_id: NONE,
      session_title: "",
      session_time_start: "",
      session_time_end: "",
      fee_idr: "",
      fee_status: "Pending",
      confirmation_status: "Invited",
      notes: "",
    });
  }, [open]);

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  function pickSpeaker(id: string) {
    const speaker = speakers.find((s) => s.id === id);
    setForm((f) => ({
      ...f,
      speaker_id: id,
      fee_idr: speaker?.default_rate_idr != null ? String(speaker.default_rate_idr) : f.fee_idr,
    }));
  }

  async function handleSubmit() {
    if (form.speaker_id === NONE) {
      toast.error("Pilih speaker terlebih dahulu.");
      return;
    }
    setSaving(true);
    try {
      let torPath: string | null = null;
      if (tor) torPath = await uploadToBucket("documents", tor);
      const values = {
        event_id: eventId,
        speaker_id: form.speaker_id,
        session_title: orNull(form.session_title),
        session_time_start: form.session_time_start
          ? new Date(form.session_time_start).toISOString()
          : null,
        session_time_end: form.session_time_end
          ? new Date(form.session_time_end).toISOString()
          : null,
        fee_idr: numOrNull(form.fee_idr),
        fee_status: form.fee_status as "Not_Applicable" | "Pending" | "Paid",
        confirmation_status: form.confirmation_status as
          | "Invited"
          | "Confirmed"
          | "Declined"
          | "Cancelled",
        tor_url: torPath,
        notes: orNull(form.notes),
      };
      console.log("[event_speaker] payload", values);
      await create.mutateAsync(values);
      toast.success("Speaker ditambahkan ke event.");
      onOpenChange(false);
    } catch (error) {
      toast.error((error as Error).message || "Gagal menambahkan speaker.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Tambah Speaker ke Event</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Speaker *" className="space-y-1.5 sm:col-span-2">
              <div className="flex gap-2">
                <div className="flex-1">
                  <EnumSelect
                    value={form.speaker_id}
                    onChange={pickSpeaker}
                    placeholder="Pilih speaker…"
                    options={speakers.map((s) => ({
                      value: s.id,
                      label: s.expertise ? `${s.full_name} — ${s.expertise}` : s.full_name,
                    }))}
                  />
                </div>
                <Button variant="outline" onClick={() => setNewSpeakerOpen(true)}>
                  + Baru
                </Button>
              </div>
            </Field>
            <Field label="Judul Sesi" className="space-y-1.5 sm:col-span-2">
              <Input
                value={form.session_title}
                onChange={(e) => set("session_title", e.target.value)}
              />
            </Field>
            <Field label="Waktu Mulai">
              <Input
                type="datetime-local"
                value={form.session_time_start}
                onChange={(e) => set("session_time_start", e.target.value)}
              />
            </Field>
            <Field label="Waktu Selesai">
              <Input
                type="datetime-local"
                value={form.session_time_end}
                onChange={(e) => set("session_time_end", e.target.value)}
              />
            </Field>
            <Field label={`Fee ${form.fee_idr ? `(${rupiah(Number(form.fee_idr))})` : ""}`}>
              <Input
                type="number"
                value={form.fee_idr}
                onChange={(e) => set("fee_idr", e.target.value)}
              />
            </Field>
            <Field label="Status Fee">
              <EnumSelect
                value={form.fee_status}
                onChange={(v) => set("fee_status", v)}
                options={FEE_STATUSES}
              />
            </Field>
            <Field label="Status Konfirmasi">
              <EnumSelect
                value={form.confirmation_status}
                onChange={(v) => set("confirmation_status", v)}
                options={CONFIRMATION_STATUSES}
              />
            </Field>
            <Field label="ToR (PDF)">
              <Input
                type="file"
                accept="application/pdf"
                onChange={(e) => setTor(e.target.files?.[0] ?? null)}
              />
            </Field>
            <Field label="Catatan" className="space-y-1.5 sm:col-span-2">
              <Textarea rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
            </Field>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? "Menyimpan…" : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SpeakerFormDialog
        open={newSpeakerOpen}
        onOpenChange={setNewSpeakerOpen}
        onCreated={(s) => pickSpeaker(s.id)}
      />
    </>
  );
}
