import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { EnumSelect, NONE } from "@/components/external/form-fields";
import {
  BucketImage,
  EVENT_STATUSES,
  EVENT_TYPES,
  EventStatusBadge,
  EventTypeBadge,
  formatEventRange,
} from "@/components/events/event-ui";
import { EventFormDialog } from "@/components/events/forms";
import { canManageEvents, useEvents } from "@/hooks/useEvents";
import { useMyProfile } from "@/hooks/useProfile";
import { rupiah } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/events/")({
  head: () => ({
    meta: [
      { title: "Events — OrgTool" },
      { name: "description", content: "Kelola seluruh event organisasi: jadwal, PIC, dan budget." },
      { property: "og:title", content: "Events — OrgTool" },
      {
        property: "og:description",
        content: "Kelola seluruh event organisasi: jadwal, PIC, dan budget.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EventsPage,
});

function EventsPage() {
  const { data: events = [], isLoading } = useEvents();
  const { data: profile } = useMyProfile();
  const navigate = useNavigate();
  const [status, setStatus] = useState(NONE);
  const [type, setType] = useState(NONE);
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [open, setOpen] = useState(false);

  const canManage = canManageEvents(profile?.role, profile?.division);

  const years = useMemo(() => {
    const set = new Set<string>([String(new Date().getFullYear())]);
    for (const e of events) if (e.date_start) set.add(e.date_start.slice(0, 4));
    return Array.from(set).sort((a, b) => Number(b) - Number(a));
  }, [events]);

  const rows = useMemo(
    () =>
      events.filter(
        (e) =>
          (status === NONE || e.status === status) &&
          (type === NONE || e.event_type === type) &&
          (year === NONE || (e.date_start ?? "").startsWith(year)),
      ),
    [events, status, type, year],
  );

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Events</h1>
          <p className="text-sm text-muted-foreground">
            {events.length} event tercatat di organisasi.
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setOpen(true)}>
            <Plus className="size-4" /> Buat Event
          </Button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <EnumSelect
          value={status}
          onChange={setStatus}
          options={EVENT_STATUSES}
          emptyLabel="Semua status"
        />
        <EnumSelect value={type} onChange={setType} options={EVENT_TYPES} emptyLabel="Semua tipe" />
        <EnumSelect
          value={year}
          onChange={setYear}
          options={years.map((y) => ({ value: y, label: y }))}
          emptyLabel="Semua tahun"
        />
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Memuat data…</p>}
      {!isLoading && rows.length === 0 && (
        <div className="rounded-2xl border bg-card p-8 text-center text-sm text-muted-foreground">
          Belum ada event yang cocok dengan filter.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {rows.map((event) => {
          const budget = Number(event.budget_idr ?? 0);
          const actual = Number(event.actual_spend_idr ?? 0);
          const over = budget > 0 && actual / budget > 0.8;
          return (
            <button
              key={event.id}
              type="button"
              onClick={() => navigate({ to: "/events/$id", params: { id: event.id } })}
              className="flex flex-col overflow-hidden rounded-2xl border bg-card text-left shadow-sm transition-shadow hover:shadow-md"
            >
              <BucketImage
                bucket="events"
                path={event.poster_url}
                alt={`Poster ${event.name}`}
                className="aspect-[4/3] w-full"
                fallback="Tanpa poster"
              />
              <div className="flex flex-1 flex-col gap-2 p-4">
                <p className="text-base font-bold leading-tight">{event.name}</p>
                <div className="flex flex-wrap gap-1.5">
                  <EventTypeBadge value={event.event_type} />
                  <EventStatusBadge value={event.status} />
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatEventRange(event.date_start, event.date_end)}
                </p>
                <p className="text-sm text-muted-foreground">{event.venue ?? "Venue belum diatur"}</p>
                <p className="text-sm text-muted-foreground">
                  PIC: {event.pic?.full_name ?? "-"}
                </p>
                <p className={`mt-auto text-sm font-medium ${over ? "text-red-600" : ""}`}>
                  {rupiah(budget)} / {rupiah(actual)}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <EventFormDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
