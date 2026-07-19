import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Error: VITE_SUPABASE_URL atau VITE_SUPABASE_ANON_KEY tidak ditemukan di .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function seedProduksi() {
  console.log('🔄 Memigrasi SEMUA data user lama (dengan hash asli) ke Supabase produksi...')
  
  // Data user langsung diambil dari login.py yang lama
  // Password di bawah ini SUDAH dalam bentuk Hash SHA-256 (sama seperti di Firebase)
  const users = [
    {"username": "admin", "password": "e86f78a8a3caf0b60d8e74e5942aa6d86dc150cd3c03338aef25b7d2d7e3acc7", "role": "admin"},
    {"username": "Rizky Ananda", "password": "a04f0cd8fc9684c371a8989cd41953e210d06aec32e7309eb44d24985dbe9f13", "role": "operator"},
    {"username": "Paulina Siallagan", "password": "33f9be939550d3f1cfb6d7c97e8d6a37b7e0746a2a468c9385351b355a78da2a", "role": "operator"},
    {"username": "Zulkifli", "password": "d422f3865fd805f49c8b15506f32c944f33b522929ef2663b2eea0507a027ea8", "role": "operator"},
    {"username": "Sukur Dalimunthe", "password": "5228771e6aaeb6a35a1798974a9e593c592d03d2bdfd43e059cb56912ae88f19", "role": "operator"},
    {"username": "Muhammad Iqbal", "password": "aa97ba92ae53e2827030d96de460ab3acddf6a9de2b10588bb2b4b6fb91f5bdb", "role": "operator"},
    {"username": "Lidia Harni Pratiwi Aceh", "password": "727f0308316f180536cd8460901d611ada4a4833454c71c7b9e5e95574f31596", "role": "operator"},
    {"username": "Fandi M Saputra", "password": "56e5b3bb836e54fab1db710952542c7e679d0c6b22dd5d7c6c30074000e067ad", "role": "operator"},
    {"username": "Darajatin Syarifah Sebayang", "password": "993b34158d35140abdd654ebf4e32373c437aeef2518400586c4b4e08bee00c3", "role": "operator"},
    {"username": "Khairun Nisa", "password": "f9647984948af7fd618dbcc255fecfef838e540a94b2f26f81fde85c82ec5db9", "role": "operator"},
    {"username": "Deliana Derita Bulolo", "password": "37a78d44ec4895c4b3ec976483b17f590577b8155aa98f2f9d96147ad863b760", "role": "operator"},
    {"username": "Gracilia Stevi Martha", "password": "1a68cb068e9bee74c03cde92796e8a5e0c9acd3aa6096864cb79380aa17856e5", "role": "operator"},
    {"username": "Chandra Onita Situmorang", "password": "768394d6c6853d4bcec45ca97c82988a10010f8aa6e2b19c9db390ebfe6ecea1", "role": "operator"},
    {"username": "Siti Hajijah", "password": "51b348eb0bd4c9ada49c9d5cc9517bd928b2d3e562b798c983e8281179a1c98d", "role": "operator"},
    {"username": "Devi Nadia Limbong", "password": "82ad738ada5ab35bc46a59314cca7cb12d959a41a2c879017941b855fd4aae02", "role": "operator"},
    {"username": "Sri Irmayani", "password": "19662eceba8a8cc06fc21856e19e19f5f371d7e5108ee351b578a3d942a1a19a", "role": "operator"},
    {"username": "Emmy Khairani Ritonga", "password": "f91b9e0b2b6ea27a8b9b204778f56540943165f3366b9abfb4db429ceb56ff8e", "role": "operator"}
  ]

  for (const u of users) {
    // Kita LANGSUNG menyimpan nilai "password" (karena sudah berwujud hash panjang)
    // agar semua operator bisa login menggunakan password mereka yang selama ini dipakai.
    const { error } = await supabase
      .from('users')
      .upsert({ username: u.username, password: u.password, role: u.role }, { onConflict: 'username' })
    
    if (error) {
      console.log(`❌ Gagal: ${u.username} -`, error.message)
    } else {
      console.log(`✅ Sukses dipindahkan: ${u.username}`)
    }
  }
  
  console.log('\n🎉 Selesai! SEMUA user kini telah dipindahkan ke database produksi (Supabase).')
  console.log('Seluruh petugas sekarang bisa login dengan password yang sama persis dengan yang mereka gunakan sebelumnya.')
}

seedProduksi()
