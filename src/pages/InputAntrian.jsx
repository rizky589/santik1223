import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ClipboardList, Plus, Download, CheckCircle2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { todayString, timeString, padQueue } from '../lib/utils'
import { RevealText, AnimatedCard, StaggerList } from '../components/animations/Motion'
import { useToast } from '../hooks/useToast'
import { Toasts } from '../components/animations/Motion'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const LAYANAN = ['Statistik','Data Mikro','Konsultasi Statistik','Pengaduan Masyarakat','Lainnya']
const LOKET   = ['1','2','3']

export default function InputAntrian() {
  const { setAntrianId } = useAuthStore()
  const { toasts, toast, dismiss } = useToast()

  const [form,    setForm]    = useState({ nama:'', keperluan: LAYANAN[0], loket: LOKET[0] })
  const [loading, setLoading] = useState(false)
  const [tiket,   setTiket]   = useState(null)

  const getNextNo = async () => {
    const today = todayString()
    const { data } = await supabase
      .from('antrian')
      .select('no')
      .eq('tanggal', today)
      .order('no', { ascending: false })
      .limit(1)
    if (!data || data.length === 0) return 'PST-001'
    const last = data[0].no?.split('-')[1]
    return padQueue((parseInt(last || '0') + 1))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const nama = form.nama.trim()
    if (!nama) return toast.warning('Nama tidak boleh kosong.')
    if (!/^[a-zA-ZÀ-ÿ\s.''-]+$/.test(nama)) return toast.warning('Nama hanya boleh berisi huruf.')

    setLoading(true)
    try {
      const no    = await getNextNo()
      const today = todayString()
      const now   = new Date()
      const time  = timeString(now)

      const payload = {
        no,
        nama: nama.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' '),
        keperluan: form.keperluan,
        loket:     form.loket,
        tanggal:   today,
        waktu:     time,
        status:    'menunggu',
        timestamp: now.toISOString(),
      }

      const { data, error } = await supabase.from('antrian').insert([payload]).select().single()
      if (error) throw error

      setAntrianId(data.id)
      setTiket({ ...payload, id: data.id })
      toast.success(`Antrian ${no} berhasil ditambahkan!`)
      setForm({ nama: '', keperluan: LAYANAN[0], loket: LOKET[0] })
    } catch (err) {
      toast.error('Gagal menambah antrian: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const downloadPDF = () => {
    if (!tiket) return
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: [100, 150] })
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('BADAN PUSAT STATISTIK', 50, 18, { align: 'center' })
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('KAB. LABUHANBATU UTARA', 50, 24, { align: 'center' })
    doc.text('Layanan Statistik', 50, 30, { align: 'center' })
    doc.line(10, 33, 90, 33)
    doc.setFontSize(28)
    doc.setFont('helvetica', 'bold')
    doc.text(tiket.no, 50, 50, { align: 'center' })
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(`Nama     : ${tiket.nama}`, 12, 62)
    doc.text(`PST      : ${tiket.loket}`, 12, 69)
    doc.text(`Layanan  : ${tiket.keperluan}`, 12, 76)
    doc.text(`Tanggal  : ${tiket.tanggal}`, 12, 83)
    doc.text(`Waktu    : ${tiket.waktu}`, 12, 90)
    doc.line(10, 94, 90, 94)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    doc.text('Harap menunggu panggilan. Terima kasih.', 50, 100, { align: 'center' })
    doc.save(`tiket_${tiket.no}.pdf`)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Toasts toasts={toasts} onDismiss={dismiss} />

      <RevealText>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center">
            <ClipboardList size={20} className="text-brand-400" />
          </div>
          <div>
            <h1 className="page-title">Form Antrian</h1>
            <p className="page-subtitle">Daftarkan pengunjung ke sistem antrian PST</p>
          </div>
        </div>
      </RevealText>

      {/* Form */}
      <AnimatedCard className="glass-md rounded-2xl p-6 border border-white/8">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nama */}
          <div>
            <label className="input-label">Nama Lengkap</label>
            <input
              id="antrian-nama"
              className="input-field"
              placeholder="Masukkan nama lengkap..."
              value={form.nama}
              onChange={e => setForm(f => ({ ...f, nama: e.target.value }))}
              maxLength={60}
              required
            />
          </div>

          {/* Layanan */}
          <div>
            <label className="input-label">Jenis Layanan</label>
            <select
              id="antrian-layanan"
              className="input-field"
              value={form.keperluan}
              onChange={e => setForm(f => ({ ...f, keperluan: e.target.value }))}
            >
              {LAYANAN.map(l => <option key={l} value={l} className="bg-surface-2">{l}</option>)}
            </select>
          </div>

          {/* Loket */}
          <div>
            <label className="input-label">Pilih PST (Loket)</label>
            <div className="flex gap-2">
              {LOKET.map(l => (
                <motion.button
                  key={l}
                  type="button"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setForm(f => ({ ...f, loket: l }))}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all duration-200
                    ${form.loket === l
                      ? 'bg-brand-500/30 border-brand-500/60 text-brand-300 shadow-glow-sm'
                      : 'glass border-white/10 text-white/50 hover:border-white/25'}`}
                >
                  PST {l}
                </motion.button>
              ))}
            </div>
          </div>

          <motion.button
            id="antrian-submit"
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                Menyimpan...
              </span>
            ) : (
              <span className="flex items-center gap-2"><Plus size={16} /> Tambah ke Antrian</span>
            )}
          </motion.button>
        </form>
      </AnimatedCard>

      {/* Tiket */}
      {tiket && (
        <motion.div
          className="glass-md rounded-2xl p-6 border border-emerald-500/30"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 size={18} className="text-emerald-400" />
            <h3 className="font-semibold text-emerald-400 text-sm">Tiket Antrian Berhasil</h3>
          </div>
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="flex-1 space-y-2">
              <div className="text-5xl font-display font-black text-gradient mb-3">{tiket.no}</div>
              {[
                ['Nama',    tiket.nama],
                ['PST',     tiket.loket],
                ['Layanan', tiket.keperluan],
                ['Tanggal', tiket.tanggal],
                ['Waktu',   tiket.waktu],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-2 text-sm">
                  <span className="text-white/40 w-20 flex-shrink-0">{k}</span>
                  <span className="text-white font-medium">: {v}</span>
                </div>
              ))}
            </div>
          </div>
          <motion.button
            onClick={downloadPDF}
            className="btn-success mt-5 w-full"
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          >
            <Download size={15} /> Download Tiket PDF
          </motion.button>
        </motion.div>
      )}
    </div>
  )
}
