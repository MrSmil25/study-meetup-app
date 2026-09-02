
create policy "Auth read events bucket" on storage.objects for select to authenticated using (bucket_id = 'events');
create policy "Auth write events bucket" on storage.objects for insert to authenticated with check (bucket_id = 'events');
create policy "Auth update events bucket" on storage.objects for update to authenticated using (bucket_id = 'events') with check (bucket_id = 'events');
create policy "Auth delete events bucket" on storage.objects for delete to authenticated using (bucket_id = 'events');

create policy "Auth read speakers bucket" on storage.objects for select to authenticated using (bucket_id = 'speakers');
create policy "Auth write speakers bucket" on storage.objects for insert to authenticated with check (bucket_id = 'speakers');
create policy "Auth update speakers bucket" on storage.objects for update to authenticated using (bucket_id = 'speakers') with check (bucket_id = 'speakers');
create policy "Auth delete speakers bucket" on storage.objects for delete to authenticated using (bucket_id = 'speakers');
