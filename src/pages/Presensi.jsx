import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, CheckCircle2, Clock, Shield, Download, RefreshCw } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { todayString, timeString, MONTHS_ID } from '../lib/utils'
import { RevealText, AnimatedCard, StaggerList } from '../components/animations/Motion'
import { useToast } from '../hooks/useToast'
import { Toasts } from '../components/animations/Motion'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const JAM_BUKA   = { h: 8,  m: 0 }
const JAM_BATAS  = { h: 8,  m: 0 }

function isPresensiOpen() {
  const now = new Date()
  return now.getHours() > JAM_BUKA.h || (now.getHours() === JAM_BUKA.h && now.getMinutes() >= JAM_BUKA.m)
}

function calcStatus(jamStr) {
  if (!jamStr) return { status: 'Hadir', menitTelat: 0 }
  const [h, m] = jamStr.split(':').map(Number)
  const diff   = (h * 60 + m) - (JAM_BATAS.h * 60 + JAM_BATAS.m)
  if (diff <= 0) return { status: 'Hadir', menitTelat: 0 }
  return { status: `Telat ${diff} menit`, menitTelat: diff }
}

export default function Presensi() {
  const { user, isAdmin } = useAuthStore()
  const { toasts, toast, dismiss } = useToast()

  const [kegiatan,  setKegiatan]  = useState('')
  const [loading,   setLoading]   = useState(false)
  const [myHistory, setMyHistory] = useState([])
  const [allData,   setAllData]   = useState([])
  const [selBulan,  setSelBulan]  = useState(new Date().getMonth())
  const [selTahun,  setSelTahun]  = useState(new Date().getFullYear())
  const [sudahAbsen, setSudahAbsen] = useState(false)
  const [clock,     setClock]     = useState(timeString())

  const today = todayString()

  useEffect(() => {
    const iv = setInterval(() => setClock(timeString()), 1000)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => { fetchMyHistory(); checkSudah() }, [user])
  useEffect(() => { if (isAdmin()) fetchAllData() }, [selBulan, selTahun])

  const checkSudah = async () => {
    const { data } = await supabase.from('presensi')
      .select('id').eq('user', user).eq('tanggal', today).limit(1)
    setSudahAbsen((data?.length || 0) > 0)
  }

  const fetchMyHistory = async () => {
    const { data } = await supabase.from('presensi')
      .select('*').eq('user', user).order('timestamp', { ascending: false })
    setMyHistory(data || [])
  }

  const fetchAllData = async () => {
    const { data } = await supabase.from('presensi').select('*').order('timestamp', { ascending: false })
    const bulan = selBulan + 1
    setAllData((data || []).filter(d => {
      const dt = new Date(d.tanggal)
      return dt.getMonth() + 1 === bulan && dt.getFullYear() === selTahun
    }))
  }

  const handlePresensi = async () => {
    if (!kegiatan.trim()) return toast.warning('Kegiatan hari ini wajib diisi.')
    if (!isPresensiOpen()) return toast.warning('Presensi belum dibuka. Mulai 08:00 WIB.')
    if (sudahAbsen) return toast.warning('Anda sudah presensi hari ini.')

    setLoading(true)
    const now    = new Date()
    const jamStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
    const { status, menitTelat } = calcStatus(jamStr)

    const keg = kegiatan.toLowerCase()
    const jabatan = keg.includes('ppid') ? 'Petugas PPID' : keg.includes('pst') ? 'Petugas PST' : 'Petugas'

    const { error } = await supabase.from('presensi').insert([{
      user:         user,
      nama_petugas: user,
      jabatan,
      tanggal:      today,
      jam_presensi: jamStr,
      status,
      menit_telat:  menitTelat,
      kegiatan:     kegiatan.trim(),
      timestamp:    now.toISOString(),
    }])

    if (error) { toast.error('Gagal menyimpan: ' + error.message); setLoading(false); return }

    toast.success(`Presensi berhasil! ${status}`)
    setKegiatan('')
    setSudahAbsen(true)
    fetchMyHistory()
    setLoading(false)
  }

  const downloadPDF = async () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    const W = doc.internal.pageSize.getWidth()

    try {
      // Trying to add image if it exists in public
      const img = new Image()
      img.src = '/assets/logo_bps.png'
      await new Promise((resolve) => {
        img.onload = () => {
          doc.addImage(img, 'PNG', 12, 10, 20, 16)
          resolve()
        }
        img.onerror = () => resolve()
      })
    } catch(e) {}

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('BADAN PUSAT STATISTIK', 35, 15)
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(11)
    doc.text('KABUPATEN LABUHANBATU UTARA', 35, 21)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('REKAP PRESENSI PETUGAS PST & PPID', W / 2, 32, { align: 'center' })
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(`Bulan: ${MONTHS_ID[selBulan]} ${selTahun}`, W / 2, 38, { align: 'center' })

    autoTable(doc, {
      head: [['No', 'Tanggal', 'Nama Petugas', 'Jabatan', 'Waktu Presensi', 'Status', 'Terlambat (mnt)']],
      body: allData.map((r, i) => [
        i + 1, 
        r.tanggal, 
        r.nama_petugas, 
        r.jabatan, 
        r.jam_presensi, 
        r.status, 
        r.menit_telat || 0
      ]),
      startY: 45,
      styles: { fontSize: 8, halign: 'center' },
      headStyles: { fillColor: [99, 102, 241], fontStyle: 'bold' },
      columnStyles: { 2: { halign: 'left' } },
    })

    const finalY = doc.lastAutoTable.finalY + 12
    const tglStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(`Gunting Saga, ${tglStr}`, W - 70, finalY, { align: 'center' })
    doc.text('Kepala BPS Kabupaten Labuhanbatu Utara', W - 70, finalY + 6, { align: 'center' })
    
    doc.setFont('helvetica', 'bold')
    doc.text('Saip Iskandar Hasibuan, SST, M.Si', W - 70, finalY + 24, { align: 'center' })

    doc.save(`Rekap_Presensi_${MONTHS_ID[selBulan]}_${selTahun}.pdf`)
  }

  const presensiOpen = isPresensiOpen()

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Toasts toasts={toasts} onDismiss={dismiss} />

      <RevealText>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <Calendar size={20} className="text-amber-400" />
          </div>
          <div>
            <h1 className="page-title">Presensi Harian</h1>
            <p className="page-subtitle">Catat kehadiran petugas PST & PPID</p>
          </div>
          <div className="ml-auto glass px-4 py-2 rounded-xl border border-white/8 text-center hidden sm:block">
            <p className="text-xs font-mono font-bold text-white tabular-nums">{clock}</p>
            <p className="text-[10px] text-white/40">WIB</p>
          </div>
        </div>
      </RevealText>

      {/* Presensi form */}
      <AnimatedCard className="glass-md rounded-2xl p-6 border border-white/8">
        <h3 className="font-semibold text-sm text-white mb-4 flex items-center gap-2">
          <Clock size={15} className="text-amber-400" /> Presensi Hari Ini — {today}
        </h3>

        {!presensiOpen ? (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm">
            Presensi belum dibuka. Mulai pukul 08:00 WIB.
          </div>
        ) : sudahAbsen ? (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
            <CheckCircle2 size={16} /> Anda sudah melakukan presensi hari ini.
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="input-label">Kegiatan Hari Ini *</label>
              <textarea className="input-field resize-none" rows={3}
                placeholder="Tuliskan kegiatan Anda hari ini (sertakan PST / PPID)..."
                value={kegiatan} onChange={e => setKegiatan(e.target.value)} />
            </div>
            <motion.button onClick={handlePresensi} disabled={loading}
              className="btn-primary w-full py-3"
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            >
              {loading
                ? <><motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease:'linear' }}
                    className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> Menyimpan...</>
                : <><CheckCircle2 size={16} /> Konfirmasi Presensi</>}
            </motion.button>
          </div>
        )}
      </AnimatedCard>

      {/* My history */}
      <AnimatedCard className="glass-md rounded-2xl border border-white/8 overflow-hidden" delay={0.1}>
        <div className="flex items-center justify-between p-5 border-b border-white/8">
          <h3 className="font-semibold text-sm text-white">Riwayat Presensi Saya</h3>
          <button onClick={fetchMyHistory} className="btn-icon"><RefreshCw size={13} /></button>
        </div>
        <div className="overflow-x-auto max-h-64 overflow-y-auto">
          <table className="data-table">
            <thead><tr><th>No</th><th>Tanggal</th><th>Jam</th><th>Status</th><th>Kegiatan</th></tr></thead>
            <tbody>
              {myHistory.length === 0
                ? <tr><td colSpan={5} className="text-center text-white/30 py-6">Belum ada data presensi</td></tr>
                : myHistory.map((r,i) => (
                  <tr key={r.id}>
                    <td>{i+1}</td>
                    <td>{r.tanggal}</td>
                    <td className="font-mono text-xs">{r.jam_presensi}</td>
                    <td>
                      <span className={r.status === 'Hadir' ? 'badge-success badge' : 'badge-danger badge'}>
                        {r.status}
                      </span>
                    </td>
                    <td className="max-w-[200px] truncate text-white/60">{r.kegiatan}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </AnimatedCard>

      {/* Admin: all data */}
      {isAdmin() && (
        <AnimatedCard className="glass-md rounded-2xl border border-white/8 overflow-hidden" delay={0.2}>
          <div className="flex flex-wrap items-center gap-3 p-5 border-b border-white/8">
            <Shield size={15} className="text-brand-400" />
            <h3 className="font-semibold text-sm text-white">Rekap Semua Petugas</h3>
            <div className="ml-auto flex items-center gap-2 flex-wrap">
              <select className="input-field w-auto py-1.5 text-xs" value={selBulan} onChange={e => setSelBulan(+e.target.value)}>
                {MONTHS_ID.map((m,i) => <option key={i} value={i} className="bg-surface-2">{m}</option>)}
              </select>
              <input type="number" className="input-field w-20 py-1.5 text-xs" value={selTahun}
                onChange={e => setSelTahun(+e.target.value)} min={2020} max={2100} />
              <button onClick={fetchAllData} className="btn-icon"><RefreshCw size={13} /></button>
              <button onClick={downloadPDF} className="btn-secondary text-xs gap-1.5">
                <Download size={13} /> PDF
              </button>
            </div>
          </div>
          <div className="overflow-x-auto max-h-72 overflow-y-auto">
            <table className="data-table">
              <thead><tr><th>No</th><th>Nama</th><th>Jabatan</th><th>Tanggal</th><th>Jam</th><th>Status</th><th>Terlambat</th></tr></thead>
              <tbody>
                {allData.length === 0
                  ? <tr><td colSpan={7} className="text-center text-white/30 py-6">Tidak ada data bulan ini</td></tr>
                  : allData.map((r,i) => (
                    <tr key={r.id}>
                      <td>{i+1}</td>
                      <td className="font-medium">{r.nama_petugas}</td>
                      <td>{r.jabatan}</td>
                      <td>{r.tanggal}</td>
                      <td className="font-mono text-xs">{r.jam_presensi}</td>
                      <td><span className={r.status === 'Hadir' ? 'badge badge-success' : 'badge badge-danger'}>{r.status}</span></td>
                      <td className="text-white/50 text-xs">{r.menit_telat || 0} mnt</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </AnimatedCard>
      )}
    </div>
  )
}
