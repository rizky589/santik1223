import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Save, CheckCircle2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { RevealText, AnimatedCard } from '../components/animations/Motion'
import { useToast } from '../hooks/useToast'
import { Toasts } from '../components/animations/Motion'

const LAYANAN_LIST = [
  'Konsultasi Statistik','Perpustakaan',
  'Akses Produk Statistik pada Website',
  'Data Mikro','Pengaduan Masyarakat','Lainnya',
]
const PENDIDIKAN_LIST = ['SMA','D1/D2/D3','S1','S2','S3']

const INIT = { nama:'', email:'', jenis_kelamin:'Laki-laki', pendidikan:'S1', instansi:'', kontak:'', layanan: LAYANAN_LIST[0], catatan:'' }

export default function BukuTamu() {
  const { antrianId } = useAuthStore()
  const { toasts, toast, dismiss } = useToast()
  const [form,    setForm]    = useState(INIT)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const validateEmail = (e) => /^[^@]+@[^@]+\.[^@]+$/.test(e)

  const getNextNo = async () => {
    const { count } = await supabase.from('buku_tamu').select('*', { count: 'exact', head: true })
    return (count || 0) + 1
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const { nama, email, instansi, kontak, jenis_kelamin, pendidikan, layanan } = form
    if (!nama || !email || !instansi || !kontak) return toast.warning('Semua field wajib diisi.')
    if (!validateEmail(email))                    return toast.error('Format email tidak valid.')
    const digits = kontak.replace(/\D/g,'')
    if (digits.length < 10 || digits.length > 13) return toast.error('Nomor WA harus 10–13 digit.')

    setLoading(true)
    try {
      const no_urut = await getNextNo()
      const now     = new Date().toISOString()
      const payload = {
        no_urut, nama_lengkap: nama, email,
        jenis_kelamin, pendidikan, instansi,
        kontak: digits, layanan,
        catatan:     form.catatan,
        waktu_masuk: now,
        waktu_selesai: now,
        status:      'selesai',
      }
      const { error } = await supabase.from('buku_tamu').insert([payload])
      if (error) throw error

      // Link antrian
      if (antrianId) {
        await supabase.from('antrian').update({
          status: 'selesai', waktu_selesai: now, timestamp_selesai: now,
        }).eq('id', antrianId)
      }

      setSuccess(true)
      setForm(INIT)
      toast.success('Data buku tamu berhasil disimpan!')
      setTimeout(() => setSuccess(false), 5000)
    } catch (err) {
      toast.error('Gagal menyimpan: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Toasts toasts={toasts} onDismiss={dismiss} />

      <RevealText>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
            <BookOpen size={20} className="text-violet-400" />
          </div>
          <div>
            <h1 className="page-title">Buku Tamu</h1>
            <p className="page-subtitle">Isi data pengunjung layanan PST & PPID</p>
          </div>
        </div>
      </RevealText>

      {/* Success banner */}
      <AnimatePresence>
        {success && (
          <motion.div
            className="glass rounded-xl px-5 py-4 border border-emerald-500/30 flex items-center gap-3"
            initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
          >
            <CheckCircle2 size={20} className="text-emerald-400 flex-shrink-0" />
            <p className="text-emerald-400 font-semibold text-sm">Data berhasil disimpan! 🎉</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatedCard className="glass-md rounded-2xl p-6 border border-white/8">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nama */}
          <div>
            <label className="input-label">Nama Lengkap *</label>
            <input className="input-field" placeholder="Nama lengkap pengunjung"
              value={form.nama} onChange={e => set('nama', e.target.value)} required />
          </div>

          {/* Email */}
          <div>
            <label className="input-label">Email *</label>
            <input className="input-field" type="email" placeholder="email@contoh.com"
              value={form.email} onChange={e => set('email', e.target.value)} required />
          </div>

          {/* Jenis Kelamin + Pendidikan */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="input-label">Jenis Kelamin</label>
              <div className="flex gap-2">
                {['Laki-laki','Perempuan'].map(j => (
                  <motion.button key={j} type="button"
                    whileTap={{ scale: 0.96 }}
                    onClick={() => set('jenis_kelamin', j)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all
                      ${form.jenis_kelamin === j
                        ? 'bg-brand-500/25 border-brand-500/50 text-brand-300'
                        : 'glass border-white/10 text-white/50'}`}
                  >{j}</motion.button>
                ))}
              </div>
            </div>
            <div>
              <label className="input-label">Pendidikan Tertinggi</label>
              <select className="input-field" value={form.pendidikan} onChange={e => set('pendidikan', e.target.value)}>
                {PENDIDIKAN_LIST.map(p => <option key={p} value={p} className="bg-surface-2">{p}</option>)}
              </select>
            </div>
          </div>

          {/* Instansi */}
          <div>
            <label className="input-label">Asal Instansi *</label>
            <input className="input-field" placeholder="Nama instansi / lembaga"
              value={form.instansi} onChange={e => set('instansi', e.target.value)} required />
          </div>

          {/* Kontak */}
          <div>
            <label className="input-label">Nomor Telepon / WA *</label>
            <input className="input-field" placeholder="08xxxxxxxxxx" maxLength={15}
              value={form.kontak} onChange={e => set('kontak', e.target.value)} required />
          </div>

          {/* Layanan */}
          <div>
            <label className="input-label">Jenis Layanan *</label>
            <select className="input-field" value={form.layanan} onChange={e => set('layanan', e.target.value)}>
              {LAYANAN_LIST.map(l => <option key={l} value={l} className="bg-surface-2">{l}</option>)}
            </select>
          </div>

          {/* Catatan */}
          <div>
            <label className="input-label">Catatan (opsional)</label>
            <textarea className="input-field resize-none" rows={3} placeholder="Keterangan tambahan..."
              value={form.catatan} onChange={e => set('catatan', e.target.value)} />
          </div>

          <motion.button type="submit" disabled={loading}
            className="btn-primary w-full py-3"
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          >
            {loading
              ? <><motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> Menyimpan...</>
              : <><Save size={16} /> Simpan Data</>}
          </motion.button>
        </form>
      </AnimatedCard>
    </div>
  )
}
