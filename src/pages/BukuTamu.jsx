import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, CheckCircle2, PenLine, Trash2, Hash, Globe, ArrowLeft, Ticket } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { RevealText, AnimatedCard } from '../components/animations/Motion'
import { useToast } from '../hooks/useToast'
import { Toasts } from '../components/animations/Motion'
import { todayString, timeString } from '../lib/utils'
import { useNavigate } from 'react-router-dom'

const LAYANAN_LIST = [
  'Konsultasi Statistik', 'Perpustakaan',
  'Akses Produk Statistik pada Website',
  'Data Mikro', 'Pengaduan Masyarakat', 'Lainnya',
]
const PENDIDIKAN_LIST = ['SMA', 'D1/D2/D3', 'S1', 'S2', 'S3']

const PEGAWAI_LIST = [
  'Saip Iskandar Hasibuan SST, M.Si',
  'Ruslan Abdi SE',
  'Darmansyah',
  'Awaluddin Sipahutar',
  'Sri Irmayani SE',
  'Deliana Derita Bulolo SE',
  'Zulkifli S.Si, MM',
  'Sukur Dalimunthe S.Si',
  'Emmy Khairani Ritonga S.E.',
  'Muhammad Iqbal S.E',
  'Chandra Onita Situmorang S.Si.',
  'Siti Hajijah A.Md.',
  'Darajatin Syarifah Sebayang S.Stat',
  'Rizky Ananda Parinduri A.Md.',
  'Khairun Nisa SST',
  'Lidia Harni Pratiwi Aceh SST',
  'Devi Nadia Limbong S.Tr.Stat.',
  'Ihdayani Banun Afa S.Stat.',
  'Gracilia Stevi Martha S.Tr.Stat.',
  'Fandi Muhammad Saputra S.Tr.Stat.',
  'Paulina Siallagan S.Tr.Stat.',
]

const INIT = {
  nama: '', email: '', jenis_kelamin: 'Laki-laki', pendidikan: 'S1',
  instansi: '', pekerjaan: '', alamat: '', kontak: '',
  layanan: LAYANAN_LIST[0], pegawai_tujuan: PEGAWAI_LIST[0], keperluan: '', catatan: '',
}

// ── Signature Canvas Component ──────────────────────────────────
function SignatureCanvas({ canvasRef }) {
  const isDrawing = useRef(false)

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect()
    const src  = e.touches ? e.touches[0] : e
    return {
      x: (src.clientX - rect.left) * (canvas.width  / rect.width),
      y: (src.clientY - rect.top)  * (canvas.height / rect.height),
    }
  }

  const startDraw = useCallback((e) => {
    e.preventDefault()
    isDrawing.current = true
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')
    const pos    = getPos(e, canvas)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
  }, [canvasRef])

  const draw = useCallback((e) => {
    if (!isDrawing.current) return
    e.preventDefault()
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')
    const pos    = getPos(e, canvas)
    ctx.lineWidth   = 2.5
    ctx.lineCap     = 'round'
    ctx.lineJoin    = 'round'
    ctx.strokeStyle = '#a78bfa'
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
  }, [canvasRef])

  const stopDraw = useCallback(() => {
    isDrawing.current = false
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.addEventListener('mousedown',  startDraw)
    canvas.addEventListener('mousemove',  draw)
    canvas.addEventListener('mouseup',    stopDraw)
    canvas.addEventListener('mouseleave', stopDraw)
    canvas.addEventListener('touchstart', startDraw, { passive: false })
    canvas.addEventListener('touchmove',  draw,      { passive: false })
    canvas.addEventListener('touchend',   stopDraw)
    return () => {
      canvas.removeEventListener('mousedown',  startDraw)
      canvas.removeEventListener('mousemove',  draw)
      canvas.removeEventListener('mouseup',    stopDraw)
      canvas.removeEventListener('mouseleave', stopDraw)
      canvas.removeEventListener('touchstart', startDraw)
      canvas.removeEventListener('touchmove',  draw)
      canvas.removeEventListener('touchend',   stopDraw)
    }
  }, [startDraw, draw, stopDraw, canvasRef])

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={600}
        height={160}
        className="w-full rounded-xl border border-white/15 bg-white/5 cursor-crosshair touch-none"
        style={{ height: '160px' }}
      />
      <div className="absolute bottom-6 left-6 right-6 border-b border-white/10 pointer-events-none" />
      <p className="absolute bottom-2 left-0 right-0 text-center text-[10px] text-white/20 pointer-events-none">
        Tanda tangan di sini
      </p>
    </div>
  )
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
      {/* Toast-like banner */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30"
      >
        <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />
        <p className="text-sm font-semibold text-emerald-300">
          Selamat Datang! Nomor Antrian Anda: <span className="font-black">{tiket.no}</span>
        </p>
      </motion.div>

      {/* Card */}
      <div className="glass-md rounded-3xl border border-white/10 overflow-hidden shadow-card">
        {/* Top gradient bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-brand-500 via-violet-500 to-cyan-500" />

        <div className="p-8 text-center">
          {/* Check icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 20 }}
            className="w-20 h-20 rounded-full bg-emerald-500/15 border-2 border-emerald-500/30 flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle2 size={40} className="text-emerald-400" />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="text-2xl font-display font-black text-white mb-2"
          >
            Registrasi Berhasil!
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-white/50 text-sm mb-8"
          >
            Silakan menunggu panggilan petugas.
          </motion.p>

          {/* Nomor Antrian Box */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="glass rounded-2xl border border-brand-500/25 p-6 mb-6"
          >
            <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-3">
              Nomor Antrian Anda
            </p>
            <motion.div
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="text-6xl font-display font-black text-gradient mb-4"
            >
              {tiket.no}
            </motion.div>
            <div className="border-t border-white/8 pt-4 space-y-1.5">
              <p className="text-xs text-white/40">Jenis Layanan:</p>
              <p className="text-sm font-semibold text-brand-300 flex items-center justify-center gap-1.5">
                <Globe size={13} />
                {tiket.layanan}
              </p>
              {tiket.pegawai && (
                <p className="text-xs text-white/40 mt-1 italic">
                  &ldquo;{tiket.pegawai}&rdquo;
                </p>
              )}
            </div>
          </motion.div>

          {/* Info */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="text-xs text-brand-300/80 leading-relaxed mb-8"
          >
            Mohon duduk di ruang tunggu. Nomor antrian akan
            ditampilkan di layar monitor.
          </motion.p>

          {/* Kembali button */}
          <motion.button
            onClick={onBack}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="btn-primary w-full py-3.5 text-sm font-bold"
          >
            Kembali ke Halaman Utama
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

// ── Main Page ───────────────────────────────────────────────────
export default function BukuTamu() {
  const { antrianId }              = useAuthStore()
  const { toasts, toast, dismiss } = useToast()
  const navigate                   = useNavigate()
  const [form,    setForm]         = useState(INIT)
  const [loading, setLoading]      = useState(false)
  const [tiket,   setTiket]        = useState(null)   // null = show form, object = show sukses
  const canvasRef                  = useRef(null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const validateEmail = (e) => /^[^@]+@[^@]+\.[^@]+$/.test(e)

  const isCanvasEmpty = () => {
    const canvas = canvasRef.current
    if (!canvas) return true
    const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data
    return !data.some(v => v !== 0)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
  }

  // Generate nomor antrian hari ini: A-001, A-002, dst
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

  const getNextBukuNo = async () => {
    const { count } = await supabase.from('buku_tamu').select('*', { count: 'exact', head: true })
    return (count || 0) + 1
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const { nama, email, instansi, kontak, pekerjaan, alamat, pegawai_tujuan, keperluan } = form
    if (!nama || !email || !instansi || !kontak)  return toast.warning('Semua field wajib diisi.')
    if (!pekerjaan)                                return toast.warning('Pekerjaan wajib diisi.')
    if (!alamat)                                   return toast.warning('Alamat wajib diisi.')
    if (!keperluan)                                return toast.warning('Keperluan kunjungan wajib diisi.')
    if (!validateEmail(email))                     return toast.error('Format email tidak valid.')
    const digits = kontak.replace(/\D/g, '')
    if (digits.length < 10 || digits.length > 13) return toast.error('Nomor WA harus 10–13 digit.')
    if (isCanvasEmpty())                           return toast.warning('Tanda tangan wajib diisi.')

    const ttd = canvasRef.current.toDataURL('image/png')

    setLoading(true)
    try {
      const no_urut  = await getNextBukuNo()
      const noAntrian = await getNextAntrianNo()
      const now      = new Date().toISOString()
      const today    = todayString()
      const waktu    = timeString(new Date())

      // 1. Simpan buku tamu
      const bukuPayload = {
        no_urut,
        nama_lengkap:   nama,
        email,
        jenis_kelamin:  form.jenis_kelamin,
        pendidikan:     form.pendidikan,
        instansi,
        pekerjaan,
        alamat,
        kontak:         digits,
        layanan:        form.layanan,
        pegawai_tujuan,
        keperluan,
        catatan:        form.catatan,
        tanda_tangan:   ttd,
        waktu_masuk:    now,
        waktu_selesai:  now,
        status:         'menunggu',
      }
      const { error: bukuErr } = await supabase.from('buku_tamu').insert([bukuPayload])
      if (bukuErr) throw bukuErr

      // 2. Buat nomor antrian baru
      const antrianPayload = {
        no:        noAntrian,
        nama:      nama.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' '),
        keperluan: form.layanan,
        loket:     '1',
        tanggal:   today,
        waktu,
        status:    'menunggu',
        timestamp: now,
      }
      const { data: antrianData, error: antrianErr } = await supabase
        .from('antrian').insert([antrianPayload]).select().single()
      if (antrianErr) throw antrianErr

      setTiket({
        no:      noAntrian,
        layanan: form.layanan,
        pegawai: pegawai_tujuan,
        nama,
      })
      setForm(INIT)
      clearCanvas()
    } catch (err) {
      toast.error('Gagal menyimpan: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Tampilkan halaman sukses
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
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
            <BookOpen size={20} className="text-violet-400" />
          </div>
          <div>
            <h1 className="page-title">Buku Tamu Digital</h1>
            <p className="page-subtitle">Isi data pengunjung layanan PST &amp; PPID</p>
          </div>
        </div>
      </RevealText>

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
                {['Laki-laki', 'Perempuan'].map(j => (
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

          {/* Pekerjaan */}
          <div>
            <label className="input-label">Pekerjaan *</label>
            <input className="input-field" placeholder="Jabatan / profesi Anda"
              value={form.pekerjaan} onChange={e => set('pekerjaan', e.target.value)} required />
          </div>

          {/* Alamat */}
          <div>
            <label className="input-label">Alamat *</label>
            <textarea className="input-field resize-none" rows={2} placeholder="Alamat lengkap pengunjung"
              value={form.alamat} onChange={e => set('alamat', e.target.value)} required />
          </div>

          {/* Kontak */}
          <div>
            <label className="input-label">Nomor Telepon / WA *</label>
            <input className="input-field" placeholder="08xxxxxxxxxx" maxLength={15}
              value={form.kontak} onChange={e => set('kontak', e.target.value)} required />
          </div>

          <div className="border-t border-white/8 pt-1" />

          {/* Layanan */}
          <div>
            <label className="input-label">Jenis Layanan *</label>
            <select className="input-field" value={form.layanan} onChange={e => set('layanan', e.target.value)}>
              {LAYANAN_LIST.map(l => <option key={l} value={l} className="bg-surface-2">{l}</option>)}
            </select>
          </div>

          {/* Pegawai Tujuan */}
          <div>
            <label className="input-label">Pegawai Tujuan *</label>
            <select className="input-field" value={form.pegawai_tujuan} onChange={e => set('pegawai_tujuan', e.target.value)} required>
              {PEGAWAI_LIST.map(p => <option key={p} value={p} className="bg-surface-2">{p}</option>)}
            </select>
          </div>

          {/* Keperluan Kunjungan */}
          <div>
            <label className="input-label">Keperluan Kunjungan *</label>
            <textarea className="input-field resize-none" rows={3} placeholder="Jelaskan keperluan kunjungan Anda..."
              value={form.keperluan} onChange={e => set('keperluan', e.target.value)} required />
          </div>

          {/* Catatan */}
          <div>
            <label className="input-label">Catatan (opsional)</label>
            <textarea className="input-field resize-none" rows={2} placeholder="Keterangan tambahan..."
              value={form.catatan} onChange={e => set('catatan', e.target.value)} />
          </div>

          <div className="border-t border-white/8 pt-1" />

          {/* Tanda Tangan */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <label className="input-label flex items-center gap-1.5">
                  <PenLine size={13} className="text-violet-400" />
                  Tanda Tangan Persetujuan *
                </label>
                <p className="text-[11px] text-white/40 mt-0.5 leading-relaxed">
                  Tanda tangan Anda sebagai persetujuan bahwa data dan keperluan kunjungan di atas adalah benar.
                </p>
              </div>
              <motion.button
                type="button"
                onClick={clearCanvas}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                  text-red-400/80 hover:text-red-400 hover:bg-red-500/10 border border-red-500/20
                  hover:border-red-500/40 transition-all duration-200 flex-shrink-0 ml-3"
              >
                <Trash2 size={12} />
                Bersihkan
              </motion.button>
            </div>
            <SignatureCanvas canvasRef={canvasRef} />
          </div>

          {/* Submit */}
          <motion.button type="submit" disabled={loading}
            className="btn-primary w-full py-3.5 text-sm font-bold"
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
