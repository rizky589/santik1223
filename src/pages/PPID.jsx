import { useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, CheckCircle2, Globe, Ticket, FileDown, FileEdit } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { RevealText, AnimatedCard, Toasts } from '../components/animations/Motion'
import { useToast } from '../hooks/useToast'
import { todayString, timeString } from '../lib/utils'
import { useNavigate } from 'react-router-dom'

const CARA_MEMPEROLEH_LIST = [
  'Melihat/Membaca',
  'Mendengarkan',
  'Mencatat',
  'Mendapatkan Salinan Hardcopy',
  'Soft Copy'
]

const CARA_SALINAN_LIST = [
  'Mengambil Langsung',
  'Email',
  'Kurir/Pos',
  'Faxsimili'
]

const INIT = {
  nama_lengkap: '',
  no_identitas: '',
  no_wa: '',
  instansi: '',
  pekerjaan: '',
  alamat: '',
  rincian_informasi: '',
  tujuan_penggunaan: '',
  cara_memperoleh: CARA_MEMPEROLEH_LIST[0],
  cara_salinan: CARA_SALINAN_LIST[0],
}

// ── Success Screen ───────────────────────────────────────────────
function SuccessScreen({ tiket, onBack }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, type: 'spring', bounce: 0.3 }}
      className="max-w-md mx-auto"
    >
      <motion.div
        initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30"
      >
        <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />
        <p className="text-sm font-semibold text-emerald-300">
          Permohonan Berhasil! Nomor Antrian Anda: <span className="font-black">{tiket.no}</span>
        </p>
      </motion.div>

      <div className="glass-md rounded-3xl border border-white/10 overflow-hidden shadow-card">
        <div className="h-1.5 w-full bg-gradient-to-r from-brand-500 via-violet-500 to-cyan-500" />
        <div className="p-8 text-center">
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 20 }}
            className="w-20 h-20 rounded-full bg-emerald-500/15 border-2 border-emerald-500/30 flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle2 size={40} className="text-emerald-400" />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="text-2xl font-display font-black text-white mb-2"
          >
            Registrasi Berhasil!
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="text-white/50 text-sm mb-8"
          >
            Silakan menunggu panggilan petugas.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="glass rounded-2xl border border-brand-500/25 p-6 mb-6"
          >
            <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-3">Nomor Antrian Anda</p>
            <motion.div
              animate={{ scale: [1, 1.04, 1] }} transition={{ delay: 0.6, duration: 0.5 }}
              className="text-6xl font-display font-black text-gradient mb-4"
            >
              {tiket.no}
            </motion.div>
            <div className="border-t border-white/8 pt-4 space-y-1.5">
              <p className="text-xs text-white/40">Jenis Layanan:</p>
              <p className="text-sm font-semibold text-violet-400 flex items-center justify-center gap-1.5">
                <FileEdit size={16} />
                Permintaan Informasi Publik (PPID)
              </p>
              <p className="text-xs italic text-white/40 mt-1">"tidak ada"</p>
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
            className="text-xs text-brand-300/80 leading-relaxed mb-8"
          >
            Mohon duduk di ruang tunggu. Nomor antrian akan ditampilkan di layar monitor.
          </motion.p>

          <div className="space-y-3">
            <motion.a
              href="/Formulir_Permintaan_PPID.pdf"
              download="Formulir_Permintaan_PPID.pdf"
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="btn-primary w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white"
            >
              <FileDown size={16} /> Download Formulir PPID
            </motion.a>

            <motion.button
              onClick={onBack}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
              className="btn-primary w-full py-3.5 text-sm font-bold bg-blue-600 hover:bg-blue-500 border-none"
            >
              Kembali ke Halaman Utama
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function PPID() {
  const { toasts, toast, dismiss } = useToast()
  const navigate                   = useNavigate()
  const [form,    setForm]         = useState(INIT)
  const [loading, setLoading]      = useState(false)
  const [tiket,   setTiket]        = useState(null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // Generate nomor antrian hari ini: A-001
  const getNextAntrianNo = async () => {
    const today = todayString()
    const { data } = await supabase
      .from('antrian')
      .select('no')
      .eq('tanggal', today)
      .order('no', { ascending: false })
      .limit(1)
    if (!data || data.length === 0) return 'A-001'
    const last = parseInt(data[0].no?.split('-')[1] || '0')
    return `A-${String(last + 1).padStart(3, '0')}`
  }

  const getNextPPIDNo = async () => {
    const { count } = await supabase.from('ppid_permohonan').select('*', { count: 'exact', head: true })
    return (count || 0) + 1
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validasi
    const wajib = ['nama_lengkap', 'no_identitas', 'no_wa', 'rincian_informasi', 'tujuan_penggunaan', 'alamat', 'pekerjaan']
    for (const key of wajib) {
      if (!form[key] || form[key].trim() === '') {
        return toast.warning(`Mohon lengkapi semua field bertanda *`)
      }
    }

    const digits = form.no_wa.replace(/\D/g, '')
    if (digits.length < 10 || digits.length > 13) return toast.error('Nomor WA harus 10–13 digit.')

    setLoading(true)
    try {
      const no_urut   = await getNextPPIDNo()
      const noAntrian = await getNextAntrianNo()
      const now       = new Date().toISOString()
      const today     = todayString()
      const waktu     = timeString(new Date())

      // 1. Simpan ke ppid_permohonan
      const payload = {
        no_urut,
        nama_lengkap: form.nama_lengkap,
        no_identitas: form.no_identitas,
        no_wa: digits,
        instansi: form.instansi,
        pekerjaan: form.pekerjaan,
        alamat: form.alamat,
        rincian_informasi: form.rincian_informasi,
        tujuan_penggunaan: form.tujuan_penggunaan,
        cara_memperoleh: form.cara_memperoleh,
        cara_salinan: form.cara_salinan,
        waktu_masuk: now,
        waktu_selesai: now,
        status: 'menunggu'
      }
      const { error: errPPID } = await supabase.from('ppid_permohonan').insert([payload])
      if (errPPID) throw errPPID

      // 2. Buat nomor antrian baru
      const antrianPayload = {
        no: noAntrian,
        nama: form.nama_lengkap.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' '),
        keperluan: 'PPID',
        loket: '1',
        tanggal: today,
        waktu,
        status: 'menunggu',
        timestamp: now,
      }
      const { error: antrianErr } = await supabase.from('antrian').insert([antrianPayload])
      if (antrianErr) throw antrianErr

      setTiket({
        no: noAntrian,
        nama: form.nama_lengkap,
      })
      setForm(INIT)
    } catch (err) {
      toast.error('Gagal menyimpan: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (tiket) {
    return (
      <div className="max-w-2xl mx-auto">
        <Toasts toasts={toasts} onDismiss={dismiss} />
        <SuccessScreen tiket={tiket} onBack={() => navigate('/')} />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Toasts toasts={toasts} onDismiss={dismiss} />

      <RevealText>
        <div className="flex items-center gap-3">
          <div>
            <h1 className="page-title">Form Permohonan Informasi Publik</h1>
            <p className="page-subtitle">Lengkapi data kunjungan anda</p>
          </div>
        </div>
      </RevealText>

      <AnimatedCard className="glass-md rounded-2xl p-6 border border-white/8">
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="input-label">Nama Lengkap *</label>
            <input className="input-field" placeholder="Nama lengkap pemohon"
              value={form.nama_lengkap} onChange={e => set('nama_lengkap', e.target.value)} required />
          </div>

          <div>
            <label className="input-label">No. Identitas (KTP/SIM) *</label>
            <input className="input-field" placeholder="Nomor Identitas"
              value={form.no_identitas} onChange={e => set('no_identitas', e.target.value)} required />
          </div>

          <div>
            <label className="input-label">No WA *</label>
            <input className="input-field" placeholder="08xxxxxxxxxx" maxLength={15}
              value={form.no_wa} onChange={e => set('no_wa', e.target.value)} required />
          </div>

          <div>
            <label className="input-label">Asal Instansi</label>
            <input className="input-field" placeholder="Nama instansi / lembaga (opsional)"
              value={form.instansi} onChange={e => set('instansi', e.target.value)} />
          </div>

          <div>
            <label className="input-label">Pekerjaan *</label>
            <input className="input-field" placeholder="Jabatan / profesi"
              value={form.pekerjaan} onChange={e => set('pekerjaan', e.target.value)} required />
          </div>

          <div>
            <label className="input-label">Alamat Lengkap *</label>
            <textarea className="input-field resize-none" rows={2} placeholder="Alamat lengkap pemohon"
              value={form.alamat} onChange={e => set('alamat', e.target.value)} required />
          </div>

          <div className="border-t border-white/8 pt-1" />

          <div>
            <label className="input-label">Rincian Informasi *</label>
            <textarea className="input-field resize-none" rows={3} placeholder="Rincian informasi yang dibutuhkan..."
              value={form.rincian_informasi} onChange={e => set('rincian_informasi', e.target.value)} required />
          </div>

          <div>
            <label className="input-label">Tujuan Penggunaan *</label>
            <textarea className="input-field resize-none" rows={2} placeholder="Tujuan penggunaan informasi..."
              value={form.tujuan_penggunaan} onChange={e => set('tujuan_penggunaan', e.target.value)} required />
          </div>

          <div>
            <label className="input-label">Cara Memperoleh Informasi *</label>
            <select className="input-field" value={form.cara_memperoleh} onChange={e => set('cara_memperoleh', e.target.value)}>
              {CARA_MEMPEROLEH_LIST.map(l => <option key={l} value={l} className="bg-surface-2">{l}</option>)}
            </select>
          </div>

          <div>
            <label className="input-label">Mendapatkan Salinan Informasi *</label>
            <select className="input-field" value={form.cara_salinan} onChange={e => set('cara_salinan', e.target.value)}>
              {CARA_SALINAN_LIST.map(l => <option key={l} value={l} className="bg-surface-2">{l}</option>)}
            </select>
          </div>

          <motion.button type="submit" disabled={loading}
            className="btn-primary w-full py-3.5 text-sm font-bold mt-4"
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          >
            {loading
              ? <><motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> Memproses...</>
              : <><Ticket size={16} /> Daftar &amp; Dapatkan Nomor Antrian</>}
          </motion.button>
        </form>
      </AnimatedCard>
    </div>
  )
}
