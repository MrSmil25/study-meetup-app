import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type T = Database["public"]["Tables"];

export type Transaction = T["fund_transactions"]["Row"];
export type TransactionInsert = T["fund_transactions"]["Insert"];
export type Budget = T["budgets"]["Row"];
export type BudgetInsert = T["budgets"]["Insert"];
export type BudgetUpdate = T["budgets"]["Update"];

export type TransactionWithRelations = Transaction & {
  recorder: { full_name: string } | null;
  fund_request:
    | { id: string; request_number: string | null; requester_division: string | null }
    | null;
  deal: { id: string; name: string; owner_division: string | null } | null;
};

export const TRANSACTION_TYPES = ["Income", "Expense"] as const;
export const TRANSACTION_VISIBILITIES = [
  "Public_Org",
  "Kadiv_And_Above",
  "Controller_Only",
] as const;
export const BUDGET_STATUSES = ["On_Budget", "Warning", "Over_Budget"] as const;

export const TRANSACTION_RECORDER_ROLES = ["Controller", "Ketua"];
export const BUDGET_MANAGER_ROLES = ["Controller", "Ketua", "Waketu"];
export const FINANCE_ADMIN_ROLES = ["Controller", "Ketua", "Waketu"];

export function canRecordTransaction(role?: string | null) {
  return !!role && TRANSACTION_RECORDER_ROLES.includes(role);
}

export function canManageBudget(role?: string | null) {
  return !!role && BUDGET_MANAGER_ROLES.includes(role);
}

export function canManageTransaction(role?: string | null) {
  return !!role && FINANCE_ADMIN_ROLES.includes(role);
}

export function canManageCategories(role?: string | null) {
  return !!role && FINANCE_ADMIN_ROLES.includes(role);
}

export type TransactionCategory = T["transaction_categories"]["Row"];
export type TransactionCategoryInsert = T["transaction_categories"]["Insert"];
export type TransactionCategoryUpdate = T["transaction_categories"]["Update"];

export const CATEGORY_TYPES = ["Income", "Expense", "Both"] as const;

export function useCategories() {
  return useQuery({
    queryKey: ["transaction_categories"],
    queryFn: async (): Promise<TransactionCategory[]> => {
      const { data, error } = await supabase
        .from("transaction_categories")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

function useInvalidateCategories() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["transaction_categories"] });
}

export function useCreateCategory() {
  const invalidate = useInvalidateCategories();
  return useMutation({
    mutationFn: async (payload: TransactionCategoryInsert) => {
      const { error } = await supabase.from("transaction_categories").insert(payload);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useUpdateCategory() {
  const invalidate = useInvalidateCategories();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: TransactionCategoryUpdate }) => {
      const { error } = await supabase
        .from("transaction_categories")
        .update(values)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useDeleteCategory() {
  const invalidate = useInvalidateCategories();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("transaction_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

/** Kategori aktif yang cocok dengan tipe transaksi, "Lainnya" selalu paling bawah. */
export function categoriesForType(
  categories: TransactionCategory[],
  type: "Income" | "Expense" | null,
) {
  if (!type) return [];
  return categories
    .filter((c) => c.is_active !== false && (c.type === type || c.type === "Both"))
    .sort((a, b) => {
      const aLast = /lainnya/i.test(a.name) ? 1 : 0;
      const bLast = /lainnya/i.test(b.name) ? 1 : 0;
      if (aLast !== bLast) return aLast - bLast;
      return (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name);
    });
}

const TX_SELECT =
  "*, recorder:profiles!fund_transactions_recorded_by_fkey(full_name), fund_request:fund_requests(id, request_number, requester_division), deal:deals(id, name, owner_division)";

export function transactionDivision(tx: TransactionWithRelations) {
  return tx.fund_request?.requester_division ?? tx.deal?.owner_division ?? null;
}

export function useTransactions() {
  return useQuery({
    queryKey: ["fund_transactions"],
    queryFn: async (): Promise<TransactionWithRelations[]> => {
      const { data, error } = await supabase
        .from("fund_transactions")
        .select(TX_SELECT)
        .order("transaction_date", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as TransactionWithRelations[];
    },
  });
}

export function useTransactionCategories() {
  const { data = [] } = useTransactions();
  return Array.from(new Set(data.map((t) => t.category).filter(Boolean))).sort();
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TransactionInsert) => {
      const { data, error } = await supabase
        .from("fund_transactions")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fund_transactions"] });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
  });
}

function useInvalidateTransactions() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["fund_transactions"] });
    queryClient.invalidateQueries({ queryKey: ["budgets"] });
  };
}

export function useUpdateTransaction() {
  const invalidate = useInvalidateTransactions();
  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string;
      values: Database["public"]["Tables"]["fund_transactions"]["Update"];
    }) => {
      const { data, error } = await supabase
        .from("fund_transactions")
        .update(values)
        .eq("id", id)
        .select("id");
      if (error) throw error;
      if (!data || data.length === 0)
        throw new Error("Tidak diizinkan mengubah transaksi ini (RLS).");
    },
    onSuccess: invalidate,
  });
}

export function useDeleteTransaction() {
  const invalidate = useInvalidateTransactions();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("fund_transactions")
        .delete()
        .eq("id", id)
        .select("id");
      if (error) throw error;
      if (!data || data.length === 0)
        throw new Error("Tidak diizinkan menghapus transaksi ini (RLS).");
    },
    onSuccess: invalidate,
  });
}

export function useBudgets() {
  return useQuery({
    queryKey: ["budgets"],
    queryFn: async (): Promise<Budget[]> => {
      const { data, error } = await supabase
        .from("budgets")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

function useInvalidateBudgets() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["budgets"] });
}

export function useCreateBudget() {
  const invalidate = useInvalidateBudgets();
  return useMutation({
    mutationFn: async (payload: BudgetInsert) => {
      const { data, error } = await supabase.from("budgets").insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
  });
}

export function useUpdateBudget() {
  const invalidate = useInvalidateBudgets();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: BudgetUpdate }) => {
      const { error } = await supabase.from("budgets").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useDeleteBudget() {
  const invalidate = useInvalidateBudgets();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.from("budgets").delete().eq("id", id).select("id");
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Tidak diizinkan menghapus budget ini.");
    },
    onSuccess: invalidate,
  });
}

export async function openProof(pathOrUrl: string) {
  if (/^https?:\/\//.test(pathOrUrl)) {
    window.open(pathOrUrl, "_blank", "noopener");
    return;
  }
  const { data, error } = await supabase.storage
    .from("documents")
    .createSignedUrl(pathOrUrl, 3600);
  if (error) throw error;
  window.open(data.signedUrl, "_blank", "noopener");
}

export function monthRange(date = new Date()) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const iso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { from: iso(first), to: iso(last) };
}
