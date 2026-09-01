import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Field } from "@/components/external/form-fields";
import {
  CATEGORY_TYPES,
  canManageCategories,
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
  type TransactionCategory,
} from "@/hooks/useFinance";
import { useMyProfile } from "@/hooks/useProfile";

export const Route = createFileRoute("/_authenticated/admin/categories")({
  head: () => ({
    meta: [
      { title: "Kelola Kategori Transaksi — OrgTool" },
      {
        name: "description",
        content: "Atur daftar kategori resmi pemasukan dan pengeluaran organisasi.",
      },
      { property: "og:title", content: "Kelola Kategori Transaksi — OrgTool" },
      {
        property: "og:description",
        content: "Atur daftar kategori resmi pemasukan dan pengeluaran organisasi.",
      },
    ],
  }),
  component: CategoriesPage,
});

const TYPE_BADGE: Record<string, string> = {
  Income: "bg-green-100 text-green-700",
  Expense: "bg-red-100 text-red-700",
  Both: "bg-blue-100 text-blue-700",
};

function errorMessage(e: unknown, fallback: string) {
  if (e && typeof e === "object") {
    const err = e as { message?: string; details?: string; hint?: string };
    const parts = [err.message, err.details, err.hint].filter(Boolean);
    if (parts.length) return parts.join(" — ");
  }
  return fallback;
}

function CategoriesPage() {
  const { data: profile } = useMyProfile();
  const { data: categories = [], isLoading } = useCategories();
  const update = useUpdateCategory();
  const remove = useDeleteCategory();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TransactionCategory | null>(null);
  const [deleting, setDeleting] = useState<TransactionCategory | null>(null);

  const allowed = canManageCategories(profile?.role);

  if (!allowed) {
    return (
      <p className="rounded-2xl border bg-card p-6 text-center text-muted-foreground">
        Halaman ini hanya untuk Controller, Ketua, dan Waketu.
      </p>
    );
  }

  async function toggleActive(cat: TransactionCategory, value: boolean) {
    try {
      await update.mutateAsync({ id: cat.id, values: { is_active: value } });
    } catch (e) {
      toast.error(errorMessage(e, "Gagal mengubah status kategori."));
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await remove.mutateAsync(deleting.id);
      toast.success("Kategori dihapus.");
      setDeleting(null);
    } catch (e) {
      toast.error(errorMessage(e, "Gagal menghapus kategori."));
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kelola Kategori Transaksi</h1>
          <p className="text-sm text-muted-foreground">
            Daftar kategori resmi yang dipakai saat mencatat transaksi.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" /> Tambah Kategori
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border bg-card shadow-sm">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Warna</th>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Tipe</th>
              <th className="px-4 py-3">Aktif</th>
              <th className="px-4 py-3">Urutan</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                  Memuat…
                </td>
              </tr>
            )}
            {!isLoading && categories.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                  Belum ada kategori.
                </td>
              </tr>
            )}
            {categories.map((c) => (
              <tr
                key={c.id}
                className={`border-b last:border-0 ${c.is_active === false ? "opacity-50" : ""}`}
              >
                <td className="px-4 py-3">
                  <span
                    className="inline-block size-5 rounded-full border"
                    style={{ backgroundColor: c.color_hex ?? "#94a3b8" }}
                  />
                </td>
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      TYPE_BADGE[c.type] ?? "bg-muted text-muted-foreground"
                    }`}
                  >
                    {c.type}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Switch
                    checked={c.is_active !== false}
                    onCheckedChange={(v) => toggleActive(c, v)}
                  />
                </td>
                <td className="px-4 py-3">{c.sort_order ?? 0}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditing(c);
                        setFormOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setDeleting(c)}>
                      Hapus
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CategoryFormDialog
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditing(null);
        }}
        category={editing}
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus kategori?</AlertDialogTitle>
            <AlertDialogDescription>
              Yakin hapus kategori "{deleting?.name}"? Aksi ini tidak bisa dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CategoryFormDialog({
  open,
  onOpenChange,
  category,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: TransactionCategory | null;
}) {
  const create = useCreateCategory();
  const update = useUpdateCategory();

  const [name, setName] = useState("");
  const [type, setType] = useState<string>("Expense");
  const [color, setColor] = useState("#64748b");
  const [sortOrder, setSortOrder] = useState(0);
  const [active, setActive] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(category?.name ?? "");
    setType(category?.type ?? "Expense");
    setColor(category?.color_hex ?? "#64748b");
    setSortOrder(category?.sort_order ?? 0);
    setActive(category?.is_active !== false);
    setBusy(false);
  }, [open, category]);

  async function submit() {
    if (!name.trim()) {
      toast.error("Nama kategori wajib diisi.");
      return;
    }
    setBusy(true);
    try {
      const values = {
        name: name.trim(),
        type,
        color_hex: color,
        sort_order: Number(sortOrder) || 0,
        is_active: active,
      };
      if (category) {
        await update.mutateAsync({ id: category.id, values });
        toast.success("Kategori diperbarui.");
      } else {
        await create.mutateAsync(values);
        toast.success("Kategori ditambahkan.");
      }
      onOpenChange(false);
    } catch (e) {
      toast.error(errorMessage(e, "Gagal menyimpan kategori."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{category ? "Edit Kategori" : "Tambah Kategori"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Field label="Nama *">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Konsumsi"
            />
          </Field>

          <Field label="Tipe *">
            <div className="flex flex-wrap gap-4 pt-1">
              {CATEGORY_TYPES.map((t) => (
                <label key={t} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="cat-type"
                    checked={type === t}
                    onChange={() => setType(t)}
                  />
                  {t}
                </label>
              ))}
            </div>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Warna">
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-10 w-16 p-1"
                />
                <Input value={color} onChange={(e) => setColor(e.target.value)} />
              </div>
            </Field>
            <Field label="Urutan">
              <Input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
              />
            </Field>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={active} onCheckedChange={(v) => setActive(v === true)} />
            Status Aktif
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Batal
          </Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? "Menyimpan…" : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
