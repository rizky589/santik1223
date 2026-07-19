// ═══════════════════════════════════════════════════════════════
// Seed Jadwal Piket Juli 2026 — dari data Excel yang sudah dikonfirmasi
// Jalankan: node --env-file=.env seed_jadwal_juli.js
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js'
import { createHash }   from 'crypto'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

function sha256(str) {
  return createHash('sha256').update(str).digest('hex')
}

// ── Pegawai BARU yang belum ada di tabel users ────────────────
const PEGAWAI_BARU = [
  { username: 'Ihdayani Banun Afa', password: 'ihdayani123', role: 'operator' },
]

// ── Pasangan piket (PPID + PST) beserta tanggal piket ─────────
// Dikonfirmasi sesuai file: "DAFTAR PIKET PPID DAN PST JULI 2026"
const JADWAL = [
  { ppid: 'Rizky Ananda',           pst: 'Darajatin Syarifah Sebayang', tanggal: [1, 13, 24] },
  { ppid: 'Khairun Nisa',           pst: 'Fandi M Saputra',             tanggal: [2, 15, 28] },
  { ppid: 'Muhammad Iqbal',         pst: 'Ihdayani Banun Afa',          tanggal: [3, 16, 29] },
  { ppid: 'Sri Irmayani',           pst: 'Lidia Harni Pratiwi Aceh',    tanggal: [6, 17, 30] },
  { ppid: 'Emmy Khairani Ritonga',  pst: 'Devi Nadia Limbong',          tanggal: [14, 23]    },
  { ppid: 'Deliana Derita Bulolo',  pst: 'Paulina Siallagan',           tanggal: [8, 10, 21] },
  { ppid: 'Sukur Dalimunthe',       pst: 'Chandra Onita Situmorang',    tanggal: [9, 22, 31] },
  { ppid: 'Zulkifli',              pst: 'Gracilia Stevi Martha',        tanggal: [7, 20, 27] },
]

const TAHUN = 2026
const BULAN = 7  // Juli

// ── Langkah 1: Tambah pegawai baru ke tabel users ────────────
async function tambahPegawaiBaru() {
  console.log('👤 Langkah 1: Mengecek & menambahkan pegawai baru...')
  for (const p of PEGAWAI_BARU) {
    const { data: cek } = await supabase
      .from('users').select('id').eq('username', p.username).single()

    if (cek) {
      console.log(`   ⏭️  ${p.username} sudah ada di database.`)
      continue
    }

    const { error } = await supabase.from('users').insert([{
      username: p.username,
      password: sha256(p.password),
      role:     p.role,
    }])

    if (error) {
      console.log(`   ❌ Gagal tambah ${p.username}: ${error.message}`)
    } else {
      console.log(`   ✅ Ditambahkan: ${p.username}`)
      console.log(`      🔑 Password default: "${p.password}" (bisa direset via Manajemen Petugas)`)
    }
  }
  console.log()
}

// ── Langkah 2: Import jadwal piket ───────────────────────────
async function importJadwal() {
  console.log('📅 Langkah 2: Import jadwal piket Juli 2026...')

  // Hapus data Juli 2026 yang sudah ada (fresh import)
  const { error: delErr } = await supabase
    .from('jadwal_piket')
    .delete()
    .gte('tanggal', `${TAHUN}-07-01`)
    .lte('tanggal', `${TAHUN}-07-31`)

  if (delErr) {
    console.log('   ⚠️  Tidak ada data lama untuk dihapus.')
  } else {
    console.log('   🗑️  Data Juli 2026 lama dihapus (fresh import)\n')
  }

  // Buat semua baris jadwal
  const rows = []
  for (const pasangan of JADWAL) {
    for (const tgl of pasangan.tanggal) {
      const tanggal = `${TAHUN}-${String(BULAN).padStart(2,'0')}-${String(tgl).padStart(2,'0')}`
      rows.push({ tanggal, user_piket: pasangan.ppid, posisi: 'PPID', bulan: BULAN, tahun: TAHUN, status: 'aktif', created_by: 'import-excel' })
      rows.push({ tanggal, user_piket: pasangan.pst,  posisi: 'PST',  bulan: BULAN, tahun: TAHUN, status: 'aktif', created_by: 'import-excel' })
    }
  }
  rows.sort((a, b) => a.tanggal.localeCompare(b.tanggal))

  console.log(`   📊 Total entri: ${rows.length} baris\n`)

  let sukses = 0, gagal = 0
  for (const row of rows) {
    const { error } = await supabase.from('jadwal_piket').insert([row])
    if (error) {
      console.log(`   ❌ ${row.tanggal} | ${row.posisi} | ${row.user_piket} → ${error.message}`)
      gagal++
    } else {
      const hari = new Date(row.tanggal).toLocaleDateString('id-ID', { weekday: 'long' })
      console.log(`   ✅ ${row.tanggal} (${hari}) | ${row.posisi.padEnd(4)} | ${row.user_piket}`)
      sukses++
    }
  }

  return { sukses, gagal }
}

// ── Main ──────────────────────────────────────────────────────
async function main() {
  console.log('\n' + '═'.repeat(55))
  console.log(' 📆 IMPORT JADWAL PIKET PST & PPID — JULI 2026')
  console.log(' BPS Kabupaten Labuhanbatu Utara')
  console.log('═'.repeat(55) + '\n')

  await tambahPegawaiBaru()
  const { sukses, gagal } = await importJadwal()

  console.log('\n' + '═'.repeat(55))
  console.log(` 🎉 Selesai! ${sukses} jadwal berhasil diimpor.`)
  if (gagal > 0) console.log(` ❌ ${gagal} jadwal gagal — periksa nama username.`)
  console.log('═'.repeat(55))
  console.log('\n✨ Buka aplikasi → menu "Jadwal Piket" → kalender Juli 2026 sudah terisi!')
  console.log('👤 Ihdayani Banun Afa bisa login dengan password: ihdayani123\n')
}

main()
