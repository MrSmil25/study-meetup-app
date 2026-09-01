import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type T = Database["public"]["Tables"];
export type FundRequest = T["fund_requests"]["Row"];
export type FundRequestInsert = T["fund_requests"]["Insert"];
export type FundRequestUpdate = T["fund_requests"]["Update"];

export type FundRequestWithPeople = FundRequest & {
  requester: { full_name: string; division: string | null } | null;
  approver: { full_name: string } | null;
};

export type BreakdownRow = { item: string; qty: number; unit_price: number };

export function parseBreakdown(value: unknown): BreakdownRow[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((r): r is Record<string, unknown> => !!r && typeof r === "object")
    .map((r) => ({
      item: String(r["item"] ?? ""),
      qty: Number(r["qty"] ?? 0),
      unit_price: Number(r["unit_price"] ?? 0),
    }));
}

const SELECT =
  "*, requester:profiles!fund_requests_requester_id_fkey(full_name, division), approver:profiles!fund_requests_approver_id_fkey(full_name)";

function useInvalidateFunds() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["fund_requests"] });
}

export function useFundRequests() {
  return useQuery({
    queryKey: ["fund_requests"],
    queryFn: async (): Promise<FundRequestWithPeople[]> => {
      const { data, error } = await supabase
        .from("fund_requests")
        .select(SELECT)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as FundRequestWithPeople[];
    },
  });
}

export function useFundRequest(id: string) {
  return useQuery({
    queryKey: ["fund_requests", id],
    queryFn: async (): Promise<FundRequestWithPeople | null> => {
      const { data, error } = await supabase
        .from("fund_requests")
        .select(SELECT)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as FundRequestWithPeople | null;
    },
  });
}

export async function generateRequestNumber() {
  const { data, error } = await supabase.rpc("generate_fund_request_number");
  if (error) throw error;
  return data as string;
}

export function useCreateFundRequest() {
  const invalidate = useInvalidateFunds();
  return useMutation({
    mutationFn: async (payload: FundRequestInsert) => {
      const { data, error } = await supabase
        .from("fund_requests")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
  });
}

export function useUpdateFundRequest() {
  const invalidate = useInvalidateFunds();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: FundRequestUpdate }) => {
      const { error } = await supabase.from("fund_requests").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useDeleteFundRequest() {
  const invalidate = useInvalidateFunds();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("fund_requests")
        .delete()
        .eq("id", id)
        .select("id");
      if (error) throw error;
      if (!data || data.length === 0)
        throw new Error("Tidak diizinkan menghapus pengajuan ini.");
    },
    onSuccess: invalidate,
  });
}

export const APPROVER_ROLES = ["Controller", "Ketua", "Waketu"];

export function isApprover(role?: string | null) {
  return !!role && APPROVER_ROLES.includes(role);
}
