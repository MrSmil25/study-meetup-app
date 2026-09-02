import { supabase } from "@/integrations/supabase/client";

const cache = new Map<string, string>();

/** URL bertanda tangan untuk file di bucket privat. */
export async function getSignedUrl(bucket: string, path?: string | null): Promise<string | null> {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const key = `${bucket}/${path}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
  if (error || !data?.signedUrl) return null;
  cache.set(key, data.signedUrl);
  return data.signedUrl;
}

export function invalidateSignedUrl(bucket: string, path?: string | null) {
  if (path) cache.delete(`${bucket}/${path}`);
}

/** Upload file ke bucket privat, mengembalikan path-nya. */
export async function uploadToBucket(bucket: string, file: File) {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id ?? "anon";
  const path = `${uid}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file);
  if (error) throw error;
  return path;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
