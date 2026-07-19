import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ClipboardCheck, RefreshCw, FileDown, ChevronLeft, ChevronRight,
  Trophy, Medal, Star, Award, CheckCircle2, XCircle, Clock,
  Users, TrendingUp, Sparkles, Download, X
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { MONTHS_ID } from '../lib/utils'
import { RevealText, AnimatedCard, StaggerList } from '../components/animations/Motion'
import { useToast } from '../hooks/useToast'
import { Toasts } from '../components/animations/Motion'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// ── Konstanta ─────────────────────────────────────────────────
const KEPALA_BPS   = 'Saip Iskandar Hasibuan, SST, M.Si'
const KOTA         = 'Gunting Saga'
const INSTANSI     = 'BPS Kabupaten Labuhanbatu Utara'
const HARI_FULL    = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu']

function getDaysInMonth(y, m) { return new Date(y, m + 1, 0).getDate() }
function formatTgl(str) {
  const d = new Date(str)
  return `${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`
}

// ── Komponen Sertifikat Modal ─────────────────────────────────
function SertifikatModal({ winner, posisi, bulanLabel, tahun, onClose }) {
  const generateSertifikatPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    const W = doc.internal.pageSize.getWidth()
    const H = doc.internal.pageSize.getHeight()

    // Background gradient border
    doc.setDrawColor(99, 102, 241)
    doc.setLineWidth(8)
    doc.rect(5, 5, W - 10, H - 10)
    doc.setDrawColor(167, 139, 250)
    doc.setLineWidth(2)
    doc.rect(10, 10, W - 20, H - 20)

    // Header
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(100, 100, 100)
    doc.text(INSTANSI.toUpperCase(), W / 2, 28, { align: 'center' })

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text('Jl. Jend. Sudirman No. 1 Aek Kanopan, Labuhanbatu Utara', W / 2, 35, { align: 'center' })

    // Judul sertifikat
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(28)
    doc.setTextColor(99, 102, 241)
    doc.text('SERTIFIKAT PENGHARGAAN', W / 2, 58, { align: 'center' })

    doc.setFontSize(12)
    doc.setTextColor(120, 120, 120)
    doc.text('Certificate of Achievement', W / 2, 67, { align: 'center' })

    // Garis dekoratif
    doc.setDrawColor(167, 139, 250)
    doc.setLineWidth(0.5)
    doc.line(60, 72, W - 60, 72)

    // Teks penghargaan
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
    doc.setTextColor(80, 80, 80)
    doc.text('Diberikan kepada:', W / 2, 84, { align: 'center' })

    // Nama pemenang
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(26)
    doc.setTextColor(30, 30, 30)
    doc.text(winner.username, W / 2, 100, { align: 'center' })

    // Garis bawah nama
    const namaWidth = doc.getTextWidth(winner.username)
    doc.setDrawColor(99, 102, 241)
    doc.setLineWidth(1)
    doc.line(W / 2 - namaWidth / 2, 103, W / 2 + namaWidth / 2, 103)

    // Keterangan penghargaan
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(13)
    doc.setTextColor(80, 80, 80)
    doc.text('Sebagai', W / 2, 115, { align: 'center' })

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.setTextColor(99, 102, 241)
    doc.text(`PETUGAS ${posisi} TERBAIK`, W / 2, 126, { align: 'center' })

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(13)
    doc.setTextColor(80, 80, 80)
    doc.text(`Bulan ${bulanLabel} ${tahun}`, W / 2, 136, { align: 'center' })

    // Detail skor
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(120, 120, 120)
    doc.text(
      `Kehadiran: ${winner.pctHadir}%  |  Rating Pengunjung: ${winner.avgRating.toFixed(1)}/5  |  Skor Total: ${winner.skorTotal}`,
      W / 2, 148, { align: 'center' }
    )

    // Garis dekoratif bawah
    doc.setDrawColor(167, 139, 250)
    doc.setLineWidth(0.5)
    doc.line(60, 155, W - 60, 155)

    // Tanda tangan
    const tglStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(80, 80, 80)
    doc.text(`${KOTA}, ${tglStr}`, W - 70, 167, { align: 'center' })
    doc.text('Kepala BPS Kabupaten Labuhanbatu Utara', W - 70, 174, { align: 'center' })
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(30, 30, 30)
    doc.text(KEPALA_BPS, W - 70, 192, { align: 'center' })

    doc.save(`Sertifikat_${posisi}_Terbaik_${winner.username}_${bulanLabel}_${tahun}.pdf`)
  }

  const medalColor = posisi === 'PPID' ? 'from-violet-500 to-purple-600' : 'from-cyan-500 to-blue-600'

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      <motion.div
        className="relative glass-strong rounded-3xl border border-white/[0.12] w-full max-w-lg overflow-hidden shadow-glow-lg"
        initial={{ scale: 0.85, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.85, y: 30 }}>

        {/* Top gradient bar */}
        <div className={`h-1.5 w-full bg-gradient-to-r ${medalColor}`} />

        <div className="p-8 text-center">
          <button onClick={onClose} className="absolute top-4 right-4 btn-icon text-white/40"><X size={16} /></button>

          {/* Medal icon */}
          <motion.div
            animate={{ rotate: [0, -10, 10, -5, 5, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 1.2, delay: 0.3 }}
            className={`w-20 h-20 rounded-full bg-gradient-to-br ${medalColor} flex items-center justify-center mx-auto mb-4 shadow-glow-lg`}>
            <Trophy size={36} className="text-white" />
          </motion.div>

          {/* Sparkles */}
          <motion.div className="flex justify-center gap-1 mb-3"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
            ))}
          </motion.div>

          <p className="text-white/50 text-xs uppercase tracking-widest mb-1">Sertifikat Penghargaan</p>
          <h2 className="font-display font-black text-2xl text-white mb-1">{winner.username}</h2>
          <p className="text-brand-300 font-bold text-lg mb-1">Petugas {posisi} Terbaik</p>
          <p className="text-white/40 text-sm mb-6">Bulan {bulanLabel} {tahun}</p>

          {/* Score breakdown */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'Kehadiran Piket', value: `${winner.pctHadir}%`, icon: CheckCircle2, color: 'text-emerald-400' },
              { label: 'Rating Tamu', value: `${winner.avgRating.toFixed(1)}/5`, icon: Star, color: 'text-amber-400' },
              { label: 'Skor Total', value: winner.skorTotal, icon: TrendingUp, color: 'text-brand-400' },
            ].map(s => (
              <div key={s.label} className="glass rounded-xl p-3">
                <s.icon size={16} className={`${s.color} mx-auto mb-1`} />
                <p className={`font-display font-black text-lg ${s.color}`}>{s.value}</p>
                <p className="text-white/40 text-[10px]">{s.label}</p>
              </div>
            ))}
          </div>

          <motion.button onClick={generateSertifikatPDF}
            className="btn-primary w-full py-3 gap-2 text-sm"
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
            <Download size={16} /> Unduh Sertifikat PDF
          </motion.button>

          <p className="text-white/20 text-[10px] mt-3">
            {INSTANSI} · {KOTA}
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Halaman Utama ─────────────────────────────────────────────
export default function RekapPiket() {
  const { role } = useAuthStore()
  const { toasts, toast, dismiss } = useToast()

  const now = new Date()
  const [tahun, setTahun] = useState(now.getFullYear())
  const [bulan, setBulan] = useState(now.getMonth())

  const [jadwal,   setJadwal]   = useState([])
  const [presensi, setPresensi] = useState([])
  const [survey,   setSurvey]   = useState([])
  const [loading,  setLoading]  = useState(false)
  const [sertModal, setSertModal] = useState(null) // { winner, posisi }

  const bulanLabel = MONTHS_ID[bulan]

  const fetchData = useCallback(async () => {
    setLoading(true)
    const start = `${tahun}-${String(bulan + 1).padStart(2,'0')}-01`
    const end   = `${tahun}-${String(bulan + 1).padStart(2,'0')}-${String(getDaysInMonth(tahun, bulan)).padStart(2,'0')}`

    const [{ data: j }, { data: p }, { data: s }] = await Promise.all([
      supabase.from('jadwal_piket').select('*').gte('tanggal', start).lte('tanggal', end),
      supabase.from('presensi').select('*').gte('tanggal', start).lte('tanggal', end),
      supabase.from('survey_kepuasan').select('*').gte('created_at', start).lte('created_at', end + 'T23:59:59'),
    ])
    setJadwal(j || [])
    setPresensi(p || [])
    setSurvey(s || [])
    setLoading(false)
  }, [tahun, bulan])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Hitung rekap per petugas ──────────────────────────────
  const hitung = () => {
    // Group jadwal by user
    const byUser = {}
    for (const j of jadwal) {
      if (!byUser[j.user_piket]) byUser[j.user_piket] = { posisi: j.posisi, jadwalTgl: [], hadirTgl: [], ratingList: [], avgRating: 0, pctHadir: 0, skorTotal: 0 }
      byUser[j.user_piket].jadwalTgl.push(j.tanggal)
      // Gunakan posisi terakhir yang diketahui
      byUser[j.user_piket].posisi = j.posisi
    }

    // Cross-reference dengan presensi
    for (const p of presensi) {
      if (byUser[p.nama_petugas || p.user]) {
        byUser[p.nama_petugas || p.user].hadirTgl.push(p.tanggal)
      }
    }

    // Cross-reference dengan survey
    for (const s of survey) {
      const petugas = s.nama_petugas || s.user_piket || null
      if (petugas && byUser[petugas]) {
        const rating = s.rating_overall || s.rating || 0
        byUser[petugas].ratingList.push(rating)
      }
    }

    // Hitung skor
    for (const [username, d] of Object.entries(byUser)) {
      const totalJadwal = d.jadwalTgl.length
      const totalHadir  = d.jadwalTgl.filter(t => d.hadirTgl.includes(t)).length
      d.pctHadir  = totalJadwal > 0 ? Math.round((totalHadir / totalJadwal) * 100) : 0
      d.avgRating = d.ratingList.length > 0
        ? d.ratingList.reduce((a, b) => a + b, 0) / d.ratingList.length : 0
      // Skor = 40% kehadiran + 35% rating + 25% bonus hadir semua
      const bonusFullHadir = d.pctHadir === 100 ? 10 : 0
      d.skorTotal = Math.round(
        (d.pctHadir * 0.40) +
        (d.avgRating * 7 * 0.35) +
        bonusFullHadir
      )
      d.username     = username
      d.totalJadwal  = totalJadwal
      d.totalHadir   = totalHadir
    }

    return byUser
  }

  const rekapData = hitung()

  const byPosisi = (posisi) =>
    Object.values(rekapData)
      .filter(d => d.posisi === posisi)
      .sort((a, b) => b.skorTotal - a.skorTotal)

  const ppidList = byPosisi('PPID')
  const pstList  = byPosisi('PST')
  const allList  = Object.values(rekapData).sort((a, b) => b.skorTotal - a.skorTotal)

  // ── Export PDF Rekap ──────────────────────────────────────
  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    const W = doc.internal.pageSize.getWidth()

    // Header
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.text('BADAN PUSAT STATISTIK', W / 2, 14, { align: 'center' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(INSTANSI, W / 2, 20, { align: 'center' })
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('REKAP KEHADIRAN PIKET PST & PPID', W / 2, 30, { align: 'center' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(`Bulan: ${bulanLabel} ${tahun}`, W / 2, 36, { align: 'center' })

    autoTable(doc, {
      head: [['No', 'Nama Petugas', 'Posisi', 'Dijadwal', 'Hadir', 'Absen', 'Kehadiran %', 'Rating Tamu', 'Skor Total', 'Keterangan']],
      body: allList.map((d, i) => [
        i + 1,
        d.username,
        d.posisi,
        d.totalJadwal,
        d.totalHadir,
        d.totalJadwal - d.totalHadir,
        `${d.pctHadir}%`,
        d.avgRating > 0 ? `${d.avgRating.toFixed(1)}/5` : '-',
        d.skorTotal,
        d.pctHadir === 100 ? '✓ Hadir Penuh' : d.pctHadir >= 80 ? 'Baik' : d.pctHadir >= 60 ? 'Cukup' : 'Perlu Perhatian',
      ]),
      startY: 42,
      styles: { fontSize: 8, halign: 'center' },
      headStyles: { fillColor: [99, 102, 241], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 255] },
      columnStyles: { 1: { halign: 'left' } },
    })

    // Tanda tangan
    const finalY = doc.lastAutoTable.finalY + 12
    const tglStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    doc.setFontSize(10)
    doc.text(`${KOTA}, ${tglStr}`, W - 70, finalY, { align: 'center' })
    doc.text('Kepala BPS Kabupaten Labuhanbatu Utara', W - 70, finalY + 7, { align: 'center' })
    doc.setFont('helvetica', 'bold')
    doc.text(KEPALA_BPS, W - 70, finalY + 25, { align: 'center' })

    doc.save(`Rekap_Piket_${bulanLabel}_${tahun}.pdf`)
    toast.success('PDF rekap berhasil diunduh!')
  }

  const prevMonth = () => { if (bulan === 0) { setBulan(11); setTahun(y => y - 1) } else setBulan(b => b - 1) }
  const nextMonth = () => { if (bulan === 11) { setBulan(0);  setTahun(y => y + 1) } else setBulan(b => b + 1) }

  const RankBadge = ({ rank }) => {
    if (rank === 0) return <span className="text-amber-400 font-black text-lg">🥇</span>
    if (rank === 1) return <span className="text-slate-300 font-black text-lg">🥈</span>
    if (rank === 2) return <span className="text-amber-600 font-black text-lg">🥉</span>
    return <span className="text-white/40 text-sm font-bold">{rank + 1}</span>
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <Toasts toasts={toasts} onDismiss={dismiss} />

      {/* Header */}
      <RevealText>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Trophy size={20} className="text-amber-400" />
            </div>
            <div>
              <h1 className="page-title">Rekap & Leaderboard Piket</h1>
              <p className="page-subtitle">Absensi kehadiran + petugas terbaik bulan ini</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchData} className="btn-icon"><RefreshCw size={14} /></button>
            <motion.button onClick={exportPDF}
              className="btn-primary gap-2 text-sm"
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <FileDown size={14} /> Export PDF
            </motion.button>
          </div>
        </div>
      </RevealText>

      {/* Navigasi Bulan */}
      <AnimatedCard className="glass-md rounded-2xl p-4 border border-white/[0.08]">
        <div className="flex items-center justify-between">
          <motion.button onClick={prevMonth} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="btn-icon">
            <ChevronLeft size={16} />
          </motion.button>
          <div className="text-center">
            <h2 className="font-display font-black text-xl text-white">
              {bulanLabel} <span className="text-brand-400">{tahun}</span>
            </h2>
            <p className="text-xs text-white/40">{allList.length} petugas terjadwal</p>
          </div>
          <motion.button onClick={nextMonth} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="btn-icon">
            <ChevronRight size={16} />
          </motion.button>
        </div>
      </AnimatedCard>

      {/* ── Leaderboard PPID & PST ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {[
          { posisi: 'PPID', list: ppidList, color: 'from-violet-500 to-purple-600', icon: Medal },
          { posisi: 'PST',  list: pstList,  color: 'from-cyan-500 to-blue-600',    icon: Award },
        ].map(({ posisi, list, color, icon: Icon }) => (
          <AnimatedCard key={posisi} className="glass-md rounded-2xl border border-white/[0.08] overflow-hidden">
            <div className={`bg-gradient-to-r ${color} p-4`}>
              <div className="flex items-center gap-2">
                <Icon size={18} className="text-white" />
                <h3 className="font-display font-black text-white">Leaderboard {posisi}</h3>
                <span className="badge bg-white/20 text-white border-white/30 text-[10px] ml-auto">{list.length} petugas</span>
              </div>
            </div>

            {loading ? (
              <div className="p-4 space-y-3">{[...Array(3)].map((_,i) => <div key={i} className="h-14 rounded-xl shimmer" />)}</div>
            ) : list.length === 0 ? (
              <div className="p-8 text-center text-white/30">
                <Icon size={24} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Belum ada data jadwal bulan ini</p>
              </div>
            ) : (
              <div className="p-3 space-y-2">
                {list.map((d, i) => (
                  <motion.div key={d.username}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all
                      ${i === 0
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : 'glass border-white/[0.06] hover:border-white/[0.12]'}`}>

                    <div className="w-8 flex-shrink-0 text-center"><RankBadge rank={i} /></div>

                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-violet-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                      {d.username[0].toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{d.username}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-emerald-400">{d.pctHadir}% hadir</span>
                        <span className="text-white/20">·</span>
                        <span className="text-[10px] text-amber-400">
                          {d.avgRating > 0 ? `★ ${d.avgRating.toFixed(1)}` : 'belum dinilai'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="font-display font-black text-brand-400 text-sm">{d.skorTotal}</p>
                      <p className="text-[10px] text-white/30">skor</p>
                    </div>

                    {i === 0 && (
                      <motion.button
                        onClick={() => setSertModal({ winner: d, posisi })}
                        className="flex-shrink-0 btn-primary text-[10px] px-2.5 py-1.5 gap-1"
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Sparkles size={10} /> Sertifikat
                      </motion.button>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatedCard>
        ))}
      </div>

      {/* ── Tabel Rekap Lengkap ───────────────────────────── */}
      <AnimatedCard className="glass-md rounded-2xl border border-white/[0.08] overflow-hidden" delay={0.1}>
        <div className="flex items-center gap-2 p-4 border-b border-white/[0.06]">
          <ClipboardCheck size={14} className="text-brand-400" />
          <h3 className="font-semibold text-sm text-white">Rekap Kehadiran Piket Semua Petugas</h3>
          <span className="badge badge-default ml-auto">{allList.length} petugas</span>
        </div>
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Nama Petugas</th>
                <th>Posisi</th>
                <th>Dijadwal</th>
                <th>Hadir</th>
                <th>Absen</th>
                <th>Kehadiran</th>
                <th>Rating Tamu</th>
                <th>Skor</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="text-center py-8"><div className="h-4 shimmer rounded mx-auto w-48" /></td></tr>
              ) : allList.length === 0 ? (
                <tr><td colSpan={10} className="text-center text-white/30 py-10">Tidak ada data bulan ini</td></tr>
              ) : allList.map((d, i) => {
                const absen = d.totalJadwal - d.totalHadir
                const status = d.pctHadir === 100 ? { label: 'Hadir Penuh', cls: 'badge-success' }
                  : d.pctHadir >= 80 ? { label: 'Baik', cls: 'badge-info' }
                  : d.pctHadir >= 60 ? { label: 'Cukup', cls: 'badge-warning' }
                  : { label: 'Perlu Perhatian', cls: 'badge-danger' }

                return (
                  <motion.tr key={d.username} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                    <td>{i + 1}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-400 to-violet-500 flex items-center justify-center text-[10px] font-bold text-white">
                          {d.username[0].toUpperCase()}
                        </div>
                        <span className="text-sm font-medium">{d.username}</span>
                      </div>
                    </td>
                    <td><span className={`badge ${d.posisi === 'PPID' ? 'badge-purple' : 'badge-info'} text-[10px]`}>{d.posisi}</span></td>
                    <td className="text-center font-mono">{d.totalJadwal}</td>
                    <td className="text-center"><span className="text-emerald-400 font-bold">{d.totalHadir}</span></td>
                    <td className="text-center"><span className={absen > 0 ? 'text-red-400 font-bold' : 'text-white/30'}>{absen}</span></td>
                    <td className="text-center">
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${d.pctHadir >= 80 ? 'bg-emerald-400' : d.pctHadir >= 60 ? 'bg-amber-400' : 'bg-red-400'}`}
                            style={{ width: `${d.pctHadir}%` }} />
                        </div>
                        <span className="text-xs font-mono w-10">{d.pctHadir}%</span>
                      </div>
                    </td>
                    <td className="text-center text-amber-400">
                      {d.avgRating > 0 ? `★ ${d.avgRating.toFixed(1)}` : <span className="text-white/20">-</span>}
                    </td>
                    <td className="text-center"><span className="font-display font-black text-brand-400">{d.skorTotal}</span></td>
                    <td><span className={`badge ${status.cls} text-[10px]`}>{status.label}</span></td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Keterangan scoring */}
        <div className="p-4 border-t border-white/[0.06]">
          <p className="text-[11px] text-white/30">
            <span className="text-white/50 font-semibold">Formula skor:</span> Kehadiran (40%) + Rating Tamu (35%) + Bonus Hadir Penuh (25%)
          </p>
        </div>
      </AnimatedCard>

      {/* ── Modal Sertifikat ───────────────────────────────── */}
      <AnimatePresence>
        {sertModal && (
          <SertifikatModal
            winner={sertModal.winner}
            posisi={sertModal.posisi}
            bulanLabel={bulanLabel}
            tahun={tahun}
            onClose={() => setSertModal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
