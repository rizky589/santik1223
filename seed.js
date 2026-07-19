// Reset / Tambah akun admin & operator dengan password yang diketahui
// Jalankan: node --env-file=.env seed.js

import { createClient } from '@supabase/supabase-js'
import { createHash }   from 'crypto'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

function sha256(str) {
  return createHash('sha256').update(str).digest('hex')
}

async function seed() {
  console.log('\n🔄 Reset password akun admin...\n')

  const users = [
    { username: 'admin',    password: 'admin123',  role: 'admin'    },
    { username: 'operator', password: 'operator',  role: 'operator' },
  ]

  for (const u of users) {
    const hashed = sha256(u.password)

    // Cek apakah sudah ada → update password-nya
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('username', u.username)
      .single()

    if (existing) {
      // Update password yang ada
      const { error } = await supabase
        .from('users')
        .update({ password: hashed, role: u.role })
        .eq('username', u.username)

      if (error) {
        console.log(`❌ Gagal update ${u.username}: ${error.message}`)
      } else {
        console.log(`✅ Password ${u.username} berhasil direset → "${u.password}"`)
      }
    } else {
      // Insert baru
      const { error } = await supabase
        .from('users')
        .insert([{ username: u.username, password: hashed, role: u.role }])

      if (error) {
        console.log(`❌ Gagal tambah ${u.username}: ${error.message}`)
      } else {
        console.log(`✅ Akun baru dibuat: ${u.username} → password: "${u.password}"`)
      }
    }
  }

  console.log('\n════════════════════════════════')
  console.log('  ✅ Selesai! Gunakan akun ini:')
  console.log('  Username : admin')
  console.log('  Password : admin123')
  console.log('════════════════════════════════\n')
}

seed()
