-- ═══════════════════════════════════════════════════════════════
-- SANTIK — Supabase Database Schema
-- Run this in your Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════
-- TABEL BARU (Fitur Jadwal Piket & Manajemen Petugas)
-- Jalankan query ini di SQL Editor Supabase
-- ═══════════════════════════════════════════════════════════════

-- 6. JADWAL PIKET
create table if not exists public.jadwal_piket (
  id          uuid primary key default gen_random_uuid(),
  tanggal     text not null,              -- YYYY-MM-DD
  user_piket  text not null,              -- username
  posisi      text not null,              -- PST Loket 1, PPID, dll
  bulan       int,
  tahun       int,
  status      text default 'aktif',       -- aktif | libur
  created_by  text,
  created_at  timestamptz default now()
);

-- 7. TUKAR JADWAL
create table if not exists public.tukar_jadwal (
  id           uuid primary key default gen_random_uuid(),
  jadwal_id    uuid references public.jadwal_piket(id) on delete cascade,
  pengaju      text not null,             -- username yang mengajukan
  penerima     text not null,             -- username yang diminta tukar
  tanggal_asal text not null,            -- tanggal jadwal asli
  posisi       text,
  alasan       text,
  status       text default 'menunggu',  -- menunggu | disetujui | ditolak
  created_at   timestamptz default now()
);

-- RLS untuk tabel baru
alter table public.jadwal_piket  enable row level security;
alter table public.tukar_jadwal  enable row level security;

create policy "anon_all_jadwal"  on public.jadwal_piket  for all using (true) with check (true);
create policy "anon_all_tukar"   on public.tukar_jadwal  for all using (true) with check (true);

-- Index untuk performa query kalender
create index if not exists idx_jadwal_tanggal on public.jadwal_piket (tanggal);
create index if not exists idx_jadwal_user    on public.jadwal_piket (user_piket);
create index if not exists idx_tukar_penerima on public.tukar_jadwal (penerima);

-- 1. USERS
create table if not exists public.users (
  id        uuid primary key default gen_random_uuid(),
  username  text unique not null,
  password  text not null,           -- SHA-256 hex
  role      text not null default 'operator',
  created_at timestamptz default now()
);

-- 2. ANTRIAN
create table if not exists public.antrian (
  id        uuid primary key default gen_random_uuid(),
  no        text not null,           -- e.g. PST-001
  nama      text not null,
  keperluan text not null,
  loket     text not null,
  tanggal   text not null,           -- YYYY-MM-DD
  waktu     text not null,           -- HH:MM:SS
  status    text not null default 'menunggu',
  timestamp timestamptz default now(),
  waktu_selesai     text,
  timestamp_selesai timestamptz
);

-- 3. BUKU TAMU
create table if not exists public.buku_tamu (
  id            uuid primary key default gen_random_uuid(),
  no_urut       int,
  nama_lengkap  text not null,
  email         text,
  jenis_kelamin text,
  pendidikan    text,
  instansi      text,
  kontak        text,
  layanan       text,
  catatan       text,
  waktu_masuk   timestamptz default now(),
  waktu_selesai timestamptz default now(),
  status        text default 'selesai'
);

-- 4. PRESENSI
create table if not exists public.presensi (
  id           uuid primary key default gen_random_uuid(),
  "user"       text not null,
  nama_petugas text not null,
  jabatan      text,
  tanggal      text not null,        -- YYYY-MM-DD
  jam_presensi text,                 -- HH:MM
  status       text,
  menit_telat  int default 0,
  kegiatan     text,
  timestamp    timestamptz default now()
);

-- 5. SURVEY KEPUASAN
create table if not exists public.survey_kepuasan (
  id             uuid primary key default gen_random_uuid(),
  tanggal        text,
  waktu          text,
  penilaian      jsonb,              -- { "Aspek": nilai }
  nilai_overall  int,
  rata_rata      numeric(4,2),
  saran          text,
  timestamp      timestamptz default now()
);

-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY — Enable for all tables
-- ═══════════════════════════════════════════════════════════════
alter table public.users          enable row level security;
alter table public.antrian        enable row level security;
alter table public.buku_tamu      enable row level security;
alter table public.presensi       enable row level security;
alter table public.survey_kepuasan enable row level security;

-- Allow anon read/write for app usage (adjust to your security needs)
create policy "anon_all_users"     on public.users          for all using (true) with check (true);
create policy "anon_all_antrian"   on public.antrian        for all using (true) with check (true);
create policy "anon_all_buku"      on public.buku_tamu      for all using (true) with check (true);
create policy "anon_all_presensi"  on public.presensi       for all using (true) with check (true);
create policy "anon_all_survey"    on public.survey_kepuasan for all using (true) with check (true);

-- ═══════════════════════════════════════════════════════════════
-- DEFAULT USERS  (password = SHA-256 hash of original passwords)
-- admin / admin123  →  hash below
-- ═══════════════════════════════════════════════════════════════
-- Insert users via Supabase dashboard or use the app's seed script.
-- Example (replace hashes with actual SHA-256 of each password):
--
-- insert into public.users (username, password, role) values
--   ('admin',            'e86f78a8a3caf0b60d8e74e5942aa6d86dc150cd3c03338aef25b7d2d7e3acc7', 'admin'),
--   ('Rizky Ananda',     'a04f0cd8fc9684c371a8989cd41953e210d06aec32e7309eb44d24985dbe9f13', 'operator');
