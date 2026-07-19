// Script untuk membaca file Excel jadwal piket dan menampilkan strukturnya
// Jalankan: node --env-file=.env read_excel.js

import XLSX from 'xlsx'
import { readFileSync } from 'fs'

const filePath = './daftar piket bulan juli.xlsx'

try {
  const buf  = readFileSync(filePath)
  const wb   = XLSX.read(buf, { type: 'buffer' })

  console.log('\n📊 Nama Sheet yang ditemukan:')
  wb.SheetNames.forEach((name, i) => console.log(`  [${i}] ${name}`))

  wb.SheetNames.forEach(sheetName => {
    console.log(`\n═══════════════════════════════`)
    console.log(`📋 Sheet: "${sheetName}"`)
    console.log(`═══════════════════════════════`)

    const ws   = wb.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

    // Tampilkan 50 baris pertama (cukup untuk lihat struktur)
    data.slice(0, 50).forEach((row, i) => {
      if (row.some(cell => cell !== '')) {
        console.log(`Baris ${i + 1}: ${JSON.stringify(row)}`)
      }
    })
  })
} catch (err) {
  console.error('❌ Error membaca file:', err.message)
}
