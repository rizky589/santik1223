// ═══════════════════════════════════════════════════════════════
// IMPORT JADWAL PIKET — Universal Script (semua bulan)
// 
// CARA PAKAI setiap bulan baru:
//   1. Taruh file Excel jadwal bulan baru ke folder santik-react
//   2. Jalankan: node --env-file=.env import_jadwal.js "nama file excel.xlsx"
//
// Contoh:
//   node --env-file=.env import_jadwal.js "daftar piket bulan agustus.xlsx"
//   node --env-file=.env import_jadwal.js "daftar piket bulan september.xlsx"
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js'
import { createHash }   from 'crypto'
import { readFileSync }  from 'fs'
import XLSX              from 'xlsx'
import path              from 'path'

// ── Supabase client ───────────────────────────────────────────
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

function sha256(str) {
  return createHash('sha256').update(str).digest('hex')
}

// ── Nama bulan → angka bulan ──────────────────────────────────
const BULAN_MAP = {
  januari: 1, februari: 2, maret: 3, april: 4,
  mei: 5, juni: 6, juli: 7, agustus: 8,
  september: 9, oktober: 10, november: 11, desember: 12,
}
const BULAN_LABEL = [
  '', 'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember'
]

// ── Strip gelar akademik dari nama lengkap ────────────────────
// Agar nama Excel bisa dicocokkan ke database (yang tanpa gelar)
function stripGelar(nama) {
  const gelar = [
    'A\\.Md\\.', 'S\\.Stat\\.?', 'S\\.E\\.?', 'S\\.Si\\.?', 'S\\.T\\.?',
    'SST', 'MM', 'M\\.Si\\.?', 'M\\.M\\.?',
    'S\\.Tr\\.Stat\\.?', 'S\\.Tr\\.?', 'SE', 'SST',
    'S\\.P\\.?', 'S\\.H\\.?', 'S\\.Sos\\.?',
  ]
  let hasil = nama
  for (const g of gelar) {
    hasil = hasil.replace(new RegExp(',?\\s*' + g + '\\s*', 'gi'), '')
  }
  return hasil.replace(/,+$/, '').trim()
}

// ── Cocokkan nama Excel ke username di database ───────────────
async function cariUsername(namaExcel, dbUsers) {
  const bersih = stripGelar(namaExcel).toLowerCase()

  // 1. Coba exact match (case-insensitive)
  const exact = dbUsers.find(u => u.username.toLowerCase() === bersih)
  if (exact) return exact.username

  // 2. Coba partial match (nama depan + belakang saja)
  const bagian = bersih.split(/\s+/)
  const partial = dbUsers.find(u => {
    const db = u.username.toLowerCase().split(/\s+/)
    return bagian[0] === db[0] && bagian[bagian.length - 1] === db[db.length - 1]
  })
  if (partial) return partial.username

  // 3. Coba starts-with match
  const starts = dbUsers.find(u =>
    u.username.toLowerCase().startsWith(bagian[0]) ||
    bersih.startsWith(u.username.toLowerCase().split(/\s+/)[0])
  )
  if (starts) return starts.username

  return null // Tidak ditemukan
}

// ── Parse string tanggal dari Excel ──────────────────────────
// Contoh: "1, 13 dan\r\n24" → [1, 13, 24]
// Contoh: "14 dan 23"       → [14, 23]
function parseTanggal(str) {
  if (!str && str !== 0) return []
  const cleaned = String(str).replace(/\r?\n/g, ' ').replace(/dan/gi, ',')
  return cleaned
    .split(/[,\s]+/)
    .map(s => parseInt(s.trim()))
    .filter(n => !isNaN(n) && n >= 1 && n <= 31)
}

// ── Deteksi bulan & tahun dari judul sheet ────────────────────
function deteksiBulanTahun(judulCell, namaFile) {
  const sources = [judulCell, namaFile].map(s => (s || '').toLowerCase())
  let bulan = null, tahun = new Date().getFullYear()

  for (const src of sources) {
    // Cari nama bulan
    for (const [nama, angka] of Object.entries(BULAN_MAP)) {
      if (src.includes(nama)) { bulan = angka; break }
    }
    // Cari tahun (4 digit)
    const tahunMatch = src.match(/20\d{2}/)
    if (tahunMatch) tahun = parseInt(tahunMatch[0])
    if (bulan) break
  }

  return { bulan, tahun }
}

// ── Main ──────────────────────────────────────────────────────
async function main() {
  // Ambil nama file dari argumen
  const namaFile = process.argv[2]
  if (!namaFile) {
    console.error('\n❌ Error: Nama file Excel tidak diberikan!')
    console.error('   Contoh: node --env-file=.env import_jadwal.js "daftar piket agustus.xlsx"')
    process.exit(1)
  }

  const filePath = path.resolve(namaFile)
  console.log('\n' + '═'.repeat(60))
  console.log(' 📆 IMPORT JADWAL PIKET — UNIVERSAL SCRIPT')
  console.log(' BPS Kabupaten Labuhanbatu Utara')
  console.log('═'.repeat(60))
  console.log(`\n📂 File: ${namaFile}`)

  // Baca Excel
  let wb
  try {
    const buf = readFileSync(filePath)
    wb = XLSX.read(buf, { type: 'buffer' })
  } catch (e) {
    console.error(`\n❌ Gagal membaca file: ${e.message}`)
    process.exit(1)
  }

  const ws   = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

  // Deteksi bulan & tahun
  const judul = String(rows[0]?.[1] || '').replace(/\r?\n/g, ' ')
  const { bulan, tahun } = deteksiBulanTahun(judul, namaFile)

  if (!bulan) {
    console.error('\n❌ Tidak bisa mendeteksi bulan dari judul file/Excel.')
    console.error('   Pastikan nama file mengandung nama bulan, contoh: "piket agustus 2026.xlsx"')
    process.exit(1)
  }

  console.log(`📅 Bulan terdeteksi: ${BULAN_LABEL[bulan]} ${tahun}\n`)

  // Ambil semua user dari database
  const { data: dbUsers, error: usersErr } = await supabase.from('users').select('username')
  if (usersErr) { console.error('❌ Gagal ambil users:', usersErr.message); process.exit(1) }

  // ── Parse baris data (mulai dari baris ke-4, index 3) ────────
  const dataRows = rows.slice(3).filter(r => r.some(c => c !== ''))
  const pasangan = []
  let pairBuffer = null

  for (const row of dataRows) {
    const [no, nama, jenisStr, tanggalStr] = row
    if (!nama || String(nama).trim() === '') continue

    const jenis    = String(jenisStr || '').trim().toUpperCase()
    const namaStr  = String(nama).trim()
    const tanggal  = parseTanggal(tanggalStr)
    const username = await cariUsername(namaStr, dbUsers)

    if (jenis === 'PPID') {
      // Mulai pasangan baru
      pairBuffer = {
        ppidNama: namaStr,
        ppidUser: username,
        tanggal,
      }
    } else if (jenis === 'PST' && pairBuffer) {
      // Lengkapi pasangan dengan PST
      pairBuffer.pstNama = namaStr
      pairBuffer.pstUser = username
      pasangan.push({ ...pairBuffer })
      pairBuffer = null
    }
  }

  console.log(`👥 Pasangan piket ditemukan: ${pasangan.length} pasang\n`)

  // ── Validasi: Cek username yang tidak ditemukan ───────────────
  const tidakDitemukan = []
  for (const p of pasangan) {
    if (!p.ppidUser) tidakDitemukan.push({ nama: p.ppidNama, posisi: 'PPID' })
    if (!p.pstUser)  tidakDitemukan.push({ nama: p.pstNama,  posisi: 'PST'  })
  }

  if (tidakDitemukan.length > 0) {
    console.log('⚠️  Nama berikut TIDAK ditemukan di database (akan di-skip):')
    for (const t of tidakDitemukan) {
      console.log(`   ❓ [${t.posisi}] ${t.nama}`)
    }
    console.log('   → Tambahkan pegawai baru via menu "Manajemen Petugas" di aplikasi,')
    console.log('     lalu jalankan script ini lagi.\n')
  }

  // ── Hapus data bulan ini & import ulang ──────────────────────
  const startDate = `${tahun}-${String(bulan).padStart(2,'0')}-01`
  const endDate   = `${tahun}-${String(bulan).padStart(2,'0')}-${String(new Date(tahun, bulan, 0).getDate()).padStart(2,'0')}`

  await supabase.from('jadwal_piket').delete()
    .gte('tanggal', startDate)
    .lte('tanggal', endDate)
  console.log(`🗑️  Data lama ${BULAN_LABEL[bulan]} ${tahun} dihapus (fresh import)\n`)

  // ── Insert jadwal ─────────────────────────────────────────────
  let sukses = 0, gagal = 0
  for (const p of pasangan) {
    for (const tgl of p.tanggal) {
      const tanggal = `${tahun}-${String(bulan).padStart(2,'0')}-${String(tgl).padStart(2,'0')}`
      const hari = new Date(tanggal).toLocaleDateString('id-ID', { weekday: 'short' })

      for (const { user_piket, posisi } of [
        { user_piket: p.ppidUser, posisi: 'PPID' },
        { user_piket: p.pstUser,  posisi: 'PST'  },
      ]) {
        if (!user_piket) { gagal++; continue }
        const { error } = await supabase.from('jadwal_piket').insert([{
          tanggal, user_piket, posisi,
          bulan, tahun, status: 'aktif', created_by: 'import-excel',
        }])
        if (error) {
          console.log(`   ❌ ${tanggal} | ${posisi} | ${user_piket} → ${error.message}`)
          gagal++
        } else {
          console.log(`   ✅ ${tanggal} (${hari}) | ${posisi.padEnd(4)} | ${user_piket}`)
          sukses++
        }
      }
    }
  }

  // ── Ringkasan ─────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60))
  console.log(` 🎉 Selesai! ${sukses} jadwal berhasil diimpor${gagal > 0 ? `, ${gagal} gagal` : ''}.`)
  console.log(`    Bulan: ${BULAN_LABEL[bulan]} ${tahun}`)
  console.log('═'.repeat(60))
  console.log('\n✨ Buka aplikasi → menu "Jadwal Piket" → kalender sudah terisi!\n')
}

main()
