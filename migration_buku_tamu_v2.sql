-- ═══════════════════════════════════════════════════════════════
-- MIGRATION: Tambah kolom baru pada tabel buku_tamu
-- Jalankan di Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

alter table public.buku_tamu
  add column if not exists pekerjaan      text,
  add column if not exists alamat         text,
  add column if not exists pegawai_tujuan text,
  add column if not exists keperluan      text,
  add column if not exists tanda_tangan   text;   -- base64 PNG dari canvas
