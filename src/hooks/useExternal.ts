import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type T = Database["public"]["Tables"];
export type Company = T["companies"]["Row"];
export type CompanyInsert = T["companies"]["Insert"];
export type CompanyUpdate = T["companies"]["Update"];
export type Person = T["people"]["Row"];
export type PersonInsert = T["people"]["Insert"];
export type PersonUpdate = T["people"]["Update"];
export type Deal = T["deals"]["Row"];
export type DealInsert = T["deals"]["Insert"];
export type DealUpdate = T["deals"]["Update"];
export type Mou = T["mous"]["Row"];
export type MouInsert = T["mous"]["Insert"];
export type MouUpdate = T["mous"]["Update"];

export type DealWithRelations = Deal & {
  companies: { name: string } | null;
  owner: { full_name: string } | null;
};
export type MouWithCompany = Mou & { companies: { name: string } | null };

const EXTERNAL_KEYS = ["companies", "people", "deals", "mous"];

function useInvalidateExternal() {
  const queryClient = useQueryClient();
  return () => {
    for (const key of EXTERNAL_KEYS) queryClient.invalidateQueries({ queryKey: [key] });
  };
}

export function useCompanies() {
  return useQuery({
    queryKey: ["companies"],
    queryFn: async (): Promise<Company[]> => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCompany(id: string) {
  return useQuery({
    queryKey: ["companies", id],
    queryFn: async (): Promise<Company | null> => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function usePeople(companyId?: string) {
  return useQuery({
    queryKey: ["people", companyId ?? "all"],
    queryFn: async (): Promise<Person[]> => {
      let query = supabase.from("people").select("*").order("full_name");
      if (companyId) query = query.eq("company_id", companyId);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useDeals(companyId?: string) {
  return useQuery({
    queryKey: ["deals", companyId ?? "all"],
    queryFn: async (): Promise<DealWithRelations[]> => {
      let query = supabase
        .from("deals")
        .select("*, companies(name), owner:profiles!deals_owner_person_id_fkey(full_name)")
        .order("created_at", { ascending: false });
      if (companyId) query = query.eq("company_id", companyId);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as DealWithRelations[];
    },
  });
}

export function useMous(companyId?: string) {
  return useQuery({
    queryKey: ["mous", companyId ?? "all"],
    queryFn: async (): Promise<MouWithCompany[]> => {
      let query = supabase
        .from("mous")
        .select("*, companies(name)")
        .order("created_at", { ascending: false });
      if (companyId) query = query.eq("company_id", companyId);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as MouWithCompany[];
    },
  });
}

export function useCreateCompany() {
  const invalidate = useInvalidateExternal();
  return useMutation({
    mutationFn: async (payload: CompanyInsert) => {
      const { data, error } = await supabase.from("companies").insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
  });
}

export function useUpdateCompany() {
  const invalidate = useInvalidateExternal();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: CompanyUpdate }) => {
      const { error } = await supabase.from("companies").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useCreatePerson() {
  const invalidate = useInvalidateExternal();
  return useMutation({
    mutationFn: async (payload: PersonInsert) => {
      const { error } = await supabase.from("people").insert(payload);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useUpdatePerson() {
  const invalidate = useInvalidateExternal();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: PersonUpdate }) => {
      const { error } = await supabase.from("people").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useCreateDeal() {
  const invalidate = useInvalidateExternal();
  return useMutation({
    mutationFn: async (payload: DealInsert) => {
      const { error } = await supabase.from("deals").insert(payload);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useUpdateDeal() {
  const invalidate = useInvalidateExternal();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: DealUpdate }) => {
      const { error } = await supabase.from("deals").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useCreateMou() {
  const invalidate = useInvalidateExternal();
  return useMutation({
    mutationFn: async (payload: MouInsert) => {
      const { error } = await supabase.from("mous").insert(payload);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useUpdateMou() {
  const invalidate = useInvalidateExternal();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: MouUpdate }) => {
      const { error } = await supabase.from("mous").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export async function uploadDocument(file: File) {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id ?? "anon";
  const path = `${uid}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
  const { error } = await supabase.storage.from("documents").upload(path, file);
  if (error) throw error;
  return path;
}
