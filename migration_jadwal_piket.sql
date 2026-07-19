-- ═══════════════════════════════════════════════════════════════
-- SANTIK v2.0 — Tabel Baru: Jadwal Piket & Tukar Jadwal
-- Jalankan HANYA query ini di Supabase SQL Editor
-- (Tabel users, antrian, dll sudah dibuat sebelumnya)
-- ═══════════════════════════════════════════════════════════════

-- 1. JADWAL PIKET
create table if not exists public.jadwal_piket (
  id          uuid primary key default gen_random_uuid(),
  tanggal     text not null,
  user_piket  text not null,
  posisi      text not null default 'PST Loket 1',
  bulan       int,
  tahun       int,
  status      text default 'aktif',
  created_by  text,
  created_at  timestamptz default now()
);

-- 2. TUKAR JADWAL
create table if not exists public.tukar_jadwal (
  id           uuid primary key default gen_random_uuid(),
  jadwal_id    uuid references public.jadwal_piket(id) on delete cascade,
  pengaju      text not null,
  penerima     text not null,
  tanggal_asal text not null,
  posisi       text,
  alasan       text,
  status       text default 'menunggu',
  created_at   timestamptz default now()
);

-- Row Level Security
alter table public.jadwal_piket enable row level security;
alter table public.tukar_jadwal enable row level security;

-- RLS Policy (anon full access - sesuaikan jika perlu keamanan lebih ketat)
do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'jadwal_piket' and policyname = 'anon_all_jadwal'
  ) then
    execute 'create policy "anon_all_jadwal" on public.jadwal_piket for all using (true) with check (true)';
  end if;
  if not exists (
    select 1 from pg_policies where tablename = 'tukar_jadwal' and policyname = 'anon_all_tukar'
  ) then
    execute 'create policy "anon_all_tukar" on public.tukar_jadwal for all using (true) with check (true)';
  end if;
end $$;

-- Index untuk performa
create index if not exists idx_jadwal_tanggal on public.jadwal_piket (tanggal);
create index if not exists idx_jadwal_user    on public.jadwal_piket (user_piket);
create index if not exists idx_jadwal_bulan   on public.jadwal_piket (bulan, tahun);
create index if not exists idx_tukar_penerima on public.tukar_jadwal (penerima);
create index if not exists idx_tukar_status   on public.tukar_jadwal (status);

-- Selesai!
select 'Tabel jadwal_piket dan tukar_jadwal berhasil dibuat!' as pesan;
