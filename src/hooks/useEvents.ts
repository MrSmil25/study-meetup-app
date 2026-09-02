import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type T = Database["public"]["Tables"];
export type Event = T["events"]["Row"];
export type EventInsert = T["events"]["Insert"];
export type EventUpdate = T["events"]["Update"];
export type Speaker = T["speakers"]["Row"];
export type SpeakerInsert = T["speakers"]["Insert"];
export type SpeakerUpdate = T["speakers"]["Update"];
export type EventSpeaker = T["event_speakers"]["Row"];
export type EventSpeakerInsert = T["event_speakers"]["Insert"];
export type EventSpeakerUpdate = T["event_speakers"]["Update"];

export type EventWithPic = Event & { pic: { full_name: string } | null };
export type EventSpeakerWithSpeaker = EventSpeaker & { speakers: Speaker | null };
export type EventSpeakerWithEvent = EventSpeaker & { events: Event | null };
export type SpeakerWithCompany = Speaker & {
  companies: { name: string } | null;
  event_speakers: { event_id: string }[];
};

const EVENT_KEYS = ["events", "speakers", "event-speakers"];

function useInvalidateEvents() {
  const queryClient = useQueryClient();
  return () => {
    for (const key of EVENT_KEYS) queryClient.invalidateQueries({ queryKey: [key] });
  };
}

/** Divisi EVT (Anggota/Kadiv) atau BPH (Ketua/Waketu) boleh kelola event & speaker. */
export function canManageEvents(role?: string | null, division?: string | null) {
  if (role === "Ketua" || role === "Waketu") return true;
  return division === "EVT" && (role === "Anggota" || role === "Kadiv");
}

export function useEvents() {
  return useQuery({
    queryKey: ["events"],
    queryFn: async (): Promise<EventWithPic[]> => {
      const { data, error } = await supabase
        .from("events")
        .select("*, pic:profiles!events_pic_id_fkey(full_name)")
        .order("date_start", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as EventWithPic[];
    },
  });
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: ["events", id],
    queryFn: async (): Promise<EventWithPic | null> => {
      const { data, error } = await supabase
        .from("events")
        .select("*, pic:profiles!events_pic_id_fkey(full_name)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as EventWithPic | null;
    },
  });
}

export function useSpeakers() {
  return useQuery({
    queryKey: ["speakers"],
    queryFn: async (): Promise<SpeakerWithCompany[]> => {
      const { data, error } = await supabase
        .from("speakers")
        .select("*, companies(name), event_speakers(event_id)")
        .order("full_name");
      if (error) throw error;
      return (data ?? []) as unknown as SpeakerWithCompany[];
    },
  });
}

export function useEventSpeakers(eventId: string) {
  return useQuery({
    queryKey: ["event-speakers", "event", eventId],
    queryFn: async (): Promise<EventSpeakerWithSpeaker[]> => {
      const { data, error } = await supabase
        .from("event_speakers")
        .select("*, speakers(*)")
        .eq("event_id", eventId)
        .order("session_time_start", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as EventSpeakerWithSpeaker[];
    },
  });
}

export function useSpeakerEvents(speakerId?: string) {
  return useQuery({
    enabled: !!speakerId,
    queryKey: ["event-speakers", "speaker", speakerId ?? "none"],
    queryFn: async (): Promise<EventSpeakerWithEvent[]> => {
      const { data, error } = await supabase
        .from("event_speakers")
        .select("*, events(*)")
        .eq("speaker_id", speakerId!)
        .order("session_time_start", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as EventSpeakerWithEvent[];
    },
  });
}

export function useEventDeals(eventId: string) {
  return useQuery({
    queryKey: ["events", eventId, "deals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deals")
        .select("*, companies(name)")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as (Database["public"]["Tables"]["deals"]["Row"] & {
        companies: { name: string } | null;
      })[];
    },
  });
}

export function useEventTransactions(eventId: string) {
  return useQuery({
    queryKey: ["events", eventId, "transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fund_transactions")
        .select("*")
        .eq("related_event_id", eventId)
        .order("transaction_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateEvent() {
  const invalidate = useInvalidateEvents();
  return useMutation({
    mutationFn: async (payload: EventInsert) => {
      const { data, error } = await supabase.from("events").insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
  });
}

export function useUpdateEvent() {
  const invalidate = useInvalidateEvents();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: EventUpdate }) => {
      const { error } = await supabase.from("events").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useCreateSpeaker() {
  const invalidate = useInvalidateEvents();
  return useMutation({
    mutationFn: async (payload: SpeakerInsert) => {
      const { data, error } = await supabase.from("speakers").insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
  });
}

export function useUpdateSpeaker() {
  const invalidate = useInvalidateEvents();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: SpeakerUpdate }) => {
      const { error } = await supabase.from("speakers").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useCreateEventSpeaker() {
  const invalidate = useInvalidateEvents();
  return useMutation({
    mutationFn: async (payload: EventSpeakerInsert) => {
      const { error } = await supabase.from("event_speakers").insert(payload);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useUpdateEventSpeaker() {
  const invalidate = useInvalidateEvents();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: EventSpeakerUpdate }) => {
      const { error } = await supabase.from("event_speakers").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useDeleteEventSpeaker() {
  const invalidate = useInvalidateEvents();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("event_speakers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

/* -------------------------------- Rundown -------------------------------- */

export type Rundown = T["event_rundowns"]["Row"];
export type RundownInsert = T["event_rundowns"]["Insert"];
export type RundownUpdate = T["event_rundowns"]["Update"];
export type RundownWithPic = Rundown & {
  pic: { full_name: string; division: string | null } | null;
};

/** Event yang masih berjalan (untuk dropdown di modul lain). */
export function useActiveEvents() {
  return useQuery({
    queryKey: ["events", "active"],
    queryFn: async (): Promise<Event[]> => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .in("status", ["Planning", "Preparation", "Live"])
        .order("date_start", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useRundowns(eventId: string) {
  return useQuery({
    queryKey: ["event-rundowns", eventId],
    queryFn: async (): Promise<RundownWithPic[]> => {
      const { data, error } = await supabase
        .from("event_rundowns")
        .select("*, pic:profiles!event_rundowns_pic_id_fkey(full_name, division)")
        .eq("event_id", eventId);
      if (error) throw error;
      return ((data ?? []) as unknown as RundownWithPic[]).sort(
        (a, b) =>
          (a.sort_order ?? 0) - (b.sort_order ?? 0) ||
          (a.time_start ?? "").localeCompare(b.time_start ?? ""),
      );
    },
  });
}

function useInvalidateRundowns() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["event-rundowns"] });
}

export function useCreateRundown() {
  const invalidate = useInvalidateRundowns();
  return useMutation({
    mutationFn: async (payload: RundownInsert) => {
      const { error } = await supabase.from("event_rundowns").insert(payload);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useUpdateRundown() {
  const invalidate = useInvalidateRundowns();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: RundownUpdate }) => {
      const { error } = await supabase.from("event_rundowns").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useDeleteRundown() {
  const invalidate = useInvalidateRundowns();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("event_rundowns").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

/** Label dropdown event: "Nama Event - 12 Sep 2026". */
export function eventOptionLabel(e: { name: string; date_start?: string | null }) {
  if (!e.date_start) return e.name;
  const d = new Date(e.date_start);
  if (Number.isNaN(d.getTime())) return e.name;
  return `${e.name} - ${d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}`;
}
