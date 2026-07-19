import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CalendarDays, ChevronLeft, ChevronRight, Plus, Printer,
  ArrowLeftRight, Clock, CheckCircle2, XCircle, Info,
  RefreshCw, Trash2, X, Shield
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { MONTHS_ID, todayString } from '../lib/utils'
import { RevealText, AnimatedCard } from '../components/animations/Motion'
import { useToast } from '../hooks/useToast'
import { Toasts } from '../components/animations/Motion'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// Loket / Posisi piket
const POSISI = ['PST Loket 1', 'PST Loket 2', 'PPID', 'Supervisor']

// Nama hari dalam bahasa Indonesia
const HARI_ID = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
const HARI_FULL = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu']

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay()
}

function formatTanggal(dateStr) {
  const d = new Date(dateStr)
  return `${HARI_FULL[d.getDay()]}, ${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`
}

export default function JadwalPiket() {
  const { user, role, isAdmin } = useAuthStore()
  const { toasts, toast, dismiss } = useToast()

  const now = new Date()
  const [tahun,  setTahun]  = useState(now.getFullYear())
  const [bulan,  setBulan]  = useState(now.getMonth())   // 0-indexed

  const [jadwal,    setJadwal]   = useState([])         // jadwal_piket rows
  const [petugas,   setPetugas]  = useState([])         // all users
  const [tukarList, setTukarList] = useState([])        // tukar_jadwal rows
  const [loading,   setLoading]  = useState(false)

  // Modal states
  const [addModal,   setAddModal]   = useState(null)    // { tanggal }
  const [tukarModal, setTukarModal] = useState(null)    // { jadwal row }
  const [inboxModal, setInboxModal] = useState(false)

  // Form add jadwal
  const [addForm,  setAddForm]  = useState({ user_piket: '', posisi: POSISI[0] })
  const [tukarForm, setTukarForm] = useState({ penerima: '', alasan: '' })
  const [submitting, setSubmitting] = useState(false)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const startDate = `${tahun}-${String(bulan + 1).padStart(2,'0')}-01`
    const endDate   = `${tahun}-${String(bulan + 1).padStart(2,'0')}-${String(getDaysInMonth(tahun, bulan)).padStart(2,'0')}`

    const [{ data: j }, { data: u }, { data: t }] = await Promise.all([
      supabase.from('jadwal_piket').select('*').gte('tanggal', startDate).lte('tanggal', endDate).order('tanggal'),
      supabase.from('users').select('id,username,role').order('username'),
      supabase.from('tukar_jadwal').select('*').order('created_at', { ascending: false }),
    ])
    setJadwal(j || [])
    setPetugas(u || [])
    setTukarList(t || [])
    setLoading(false)
  }, [tahun, bulan])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── Get jadwal for a date ─────────────────────────────────────
  const getJadwalForDate = (dateStr) => jadwal.filter(j => j.tanggal === dateStr)

  // ── Tambah Jadwal (Admin) ─────────────────────────────────────
  const handleAdd = async () => {
    if (!addForm.user_piket) return toast.warning('Pilih nama petugas.')
    setSubmitting(true)

    // Check duplicate
    const existing = jadwal.find(j => j.tanggal === addModal.tanggal && j.user_piket === addForm.user_piket)
    if (existing) { toast.warning('Petugas ini sudah dijadwalkan pada hari tersebut.'); setSubmitting(false); return }

    const { error } = await supabase.from('jadwal_piket').insert([{
      tanggal:    addModal.tanggal,
      user_piket: addForm.user_piket,
      posisi:     addForm.posisi,
      bulan:      bulan + 1,
      tahun,
      status:     'aktif',
      created_by: user,
    }])
    if (error) { toast.error('Gagal menyimpan jadwal.'); setSubmitting(false); return }
    toast.success('Jadwal berhasil ditambahkan!')
    setAddModal(null)
    setAddForm({ user_piket: '', posisi: POSISI[0] })
    fetchAll()
    setSubmitting(false)
  }

  // ── Hapus Jadwal (Admin) ──────────────────────────────────────
  const handleDeleteJadwal = async (id) => {
    if (!confirm('Hapus jadwal ini?')) return
    const { error } = await supabase.from('jadwal_piket').delete().eq('id', id)
    if (error) { toast.error('Gagal menghapus.'); return }
    toast.success('Jadwal dihapus.')
    fetchAll()
  }

  // ── Ajukan Tukar Jadwal ───────────────────────────────────────
  const handleTukar = async () => {
    if (!tukarForm.penerima) return toast.warning('Pilih petugas penerima.')
    if (!tukarForm.alasan.trim()) return toast.warning('Alasan wajib diisi.')
    if (tukarForm.penerima === tukarModal.user_piket) return toast.warning('Tidak bisa tukar dengan diri sendiri.')
    setSubmitting(true)
    const { error } = await supabase.from('tukar_jadwal').insert([{
      jadwal_id:    tukarModal.id,
      pengaju:      tukarModal.user_piket,
      penerima:     tukarForm.penerima,
      tanggal_asal: tukarModal.tanggal,
      posisi:       tukarModal.posisi,
      alasan:       tukarForm.alasan.trim(),
      status:       'menunggu',
      created_at:   new Date().toISOString(),
    }])
    if (error) { toast.error('Gagal mengajukan tukar.'); setSubmitting(false); return }
    toast.success('Pengajuan tukar jadwal berhasil dikirim!')
    setTukarModal(null)
    setTukarForm({ penerima: '', alasan: '' })
    setSubmitting(false)
    fetchAll()
  }

  // ── Approve / Reject Tukar (Admin) ────────────────────────────
  const handleApprove = async (t) => {
    // Update jadwal - ganti user ke penerima
    await supabase.from('jadwal_piket').update({ user_piket: t.penerima }).eq('id', t.jadwal_id)
    await supabase.from('tukar_jadwal').update({ status: 'disetujui' }).eq('id', t.id)
    toast.success('Tukar jadwal disetujui!')
    fetchAll()
  }
  const handleReject = async (t) => {
    await supabase.from('tukar_jadwal').update({ status: 'ditolak' }).eq('id', t.id)
    toast.warning('Tukar jadwal ditolak.')
    fetchAll()
  }

  // ── Print PDF ─────────────────────────────────────────────────
  const printPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(13)
    doc.text(`JADWAL PIKET PST & PPID — ${MONTHS_ID[bulan].toUpperCase()} ${tahun}`, 105, 14, { align: 'center' })
    doc.setFontSize(9)
    doc.text('BADAN PUSAT STATISTIK — KAB. LABUHANBATU UTARA', 105, 20, { align: 'center' })
    autoTable(doc, {
      head: [['No','Tanggal','Hari','Nama Petugas','Posisi','Status']],
      body: jadwal.map((j,i) => {
        const d = new Date(j.tanggal)
        return [i+1, j.tanggal, HARI_FULL[d.getDay()], j.user_piket, j.posisi, j.status]
      }),
      startY: 26,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [99, 102, 241] },
    })
    doc.save(`Jadwal_Piket_${MONTHS_ID[bulan]}_${tahun}.pdf`)
  }

  // ── Calendar render ───────────────────────────────────────────
  const daysInMonth = getDaysInMonth(tahun, bulan)
  const firstDay    = getFirstDayOfMonth(tahun, bulan)
  const today       = todayString()

  const prevMonth = () => { if (bulan === 0) { setBulan(11); setTahun(y => y-1) } else setBulan(b => b-1) }
  const nextMonth = () => { if (bulan === 11) { setBulan(0);  setTahun(y => y+1) } else setBulan(b => b+1) }

  // Pending tukar untuk user ini (sebagai penerima)
  const myPendingTukar = tukarList.filter(t => t.penerima === user && t.status === 'menunggu')
  const allPending     = tukarList.filter(t => t.status === 'menunggu')

  // Jadwal saya bulan ini
  const myJadwal = jadwal.filter(j => j.user_piket === user)

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      <Toasts toasts={toasts} onDismiss={dismiss} />

      {/* Header */}
      <RevealText>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <CalendarDays size={20} className="text-emerald-400" />
            </div>
            <div>
              <h1 className="page-title">Jadwal Piket</h1>
              <p className="page-subtitle">Kalender piket bulanan PST & PPID</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {/* Inbox tukar */}
            <motion.button onClick={() => setInboxModal(true)}
              className="btn-secondary gap-2 text-xs relative"
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <ArrowLeftRight size={13} /> Tukar Jadwal
              {(isAdmin() ? allPending.length : myPendingTukar.length) > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold px-1">
                  {isAdmin() ? allPending.length : myPendingTukar.length}
                </span>
              )}
            </motion.button>
            <motion.button onClick={printPDF}
              className="btn-secondary gap-2 text-xs"
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Printer size={13} /> PDF
            </motion.button>
            <button onClick={fetchAll} className="btn-icon"><RefreshCw size={14} /></button>
          </div>
        </div>
      </RevealText>

      {/* Calendar Navigation */}
      <AnimatedCard className="glass-md rounded-2xl p-5 border border-white/[0.08]">
        <div className="flex items-center justify-between mb-5">
          <motion.button onClick={prevMonth} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            className="btn-icon"><ChevronLeft size={16} /></motion.button>
          <div className="text-center">
            <h2 className="font-display font-black text-white text-xl">
              {MONTHS_ID[bulan]} <span className="text-brand-400">{tahun}</span>
            </h2>
            {myJadwal.length > 0 && (
              <p className="text-xs text-white/40 mt-0.5">
                Jadwal Anda: <span className="text-emerald-400 font-semibold">{myJadwal.length} hari</span>
              </p>
            )}
          </div>
          <motion.button onClick={nextMonth} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            className="btn-icon"><ChevronRight size={16} /></motion.button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {HARI_ID.map((h, i) => (
            <div key={h} className={`text-center text-[11px] font-bold pb-1
              ${i === 0 ? 'text-red-400/70' : i === 6 ? 'text-blue-400/70' : 'text-white/30'}`}>{h}</div>
          ))}
        </div>

        {/* Calendar grid */}
        {loading ? (
          <div className="grid grid-cols-7 gap-1">
            {[...Array(35)].map((_,i) => <div key={i} className="h-16 rounded-xl shimmer" />)}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells before first day */}
            {[...Array(firstDay)].map((_,i) => <div key={`e${i}`} />)}

            {/* Days */}
            {[...Array(daysInMonth)].map((_, i) => {
              const day        = i + 1
              const dateStr    = `${tahun}-${String(bulan+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
              const dayJadwal  = getJadwalForDate(dateStr)
              const isToday    = dateStr === today
              const dayOfWeek  = new Date(dateStr).getDay()
              const isWeekend  = dayOfWeek === 0 || dayOfWeek === 6
              const myPiket    = dayJadwal.find(j => j.user_piket === user)

              return (
                <motion.div key={day}
                  whileHover={{ scale: 1.04 }}
                  className={`min-h-[72px] sm:min-h-[80px] rounded-xl p-1.5 border transition-all duration-200 cursor-pointer
                    ${isToday
                      ? 'border-brand-500/60 bg-brand-500/15 shadow-glow-sm'
                      : isWeekend
                        ? 'border-white/[0.04] bg-white/[0.02] opacity-60'
                        : 'border-white/[0.05] hover:border-brand-500/30 hover:bg-brand-500/5'
                    }`}
                  onClick={() => isAdmin() && !isWeekend && setAddModal({ tanggal: dateStr })}
                >
                  <div className={`text-xs font-bold mb-1 leading-none
                    ${isToday ? 'text-brand-300' : isWeekend ? 'text-white/25' : 'text-white/60'}`}>
                    {day}
                  </div>
                  <div className="space-y-0.5">
                    {dayJadwal.slice(0, 3).map(j => (
                      <div key={j.id}
                        className={`text-[9px] sm:text-[10px] leading-tight px-1 py-0.5 rounded-md truncate font-medium cursor-pointer
                          ${j.user_piket === user
                            ? 'bg-brand-500/40 text-brand-200 border border-brand-500/30'
                            : 'bg-white/[0.08] text-white/60'}`}
                        onClick={e => { e.stopPropagation(); setTukarModal(j) }}
                        title={`${j.user_piket} — ${j.posisi}`}
                      >
                        {j.user_piket.split(' ')[0]}
                      </div>
                    ))}
                    {dayJadwal.length > 3 && (
                      <div className="text-[9px] text-white/30 px-1">+{dayJadwal.length - 3}</div>
                    )}
                    {isAdmin() && !isWeekend && dayJadwal.length === 0 && (
                      <div className="flex items-center justify-center h-6 opacity-0 hover:opacity-100 transition-opacity">
                        <Plus size={10} className="text-white/30" />
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/[0.06] flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-brand-500/40 border border-brand-500/30" />
            <span className="text-[11px] text-white/40">Jadwal Anda</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-white/[0.08]" />
            <span className="text-[11px] text-white/40">Petugas lain</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-brand-500/15 border border-brand-500/60" />
            <span className="text-[11px] text-white/40">Hari ini</span>
          </div>
          {isAdmin() && (
            <span className="text-[11px] text-white/30 ml-auto">✏️ Klik tanggal untuk menambah jadwal</span>
          )}
        </div>
      </AnimatedCard>

      {/* Jadwal saya bulan ini */}
      <AnimatedCard className="glass-md rounded-2xl border border-white/[0.08] overflow-hidden" delay={0.1}>
        <div className="flex items-center gap-2 p-4 border-b border-white/[0.06]">
          <Clock size={14} className="text-emerald-400" />
          <h3 className="font-semibold text-sm text-white">
            Jadwal {isAdmin() ? 'Semua Petugas' : 'Anda'} — {MONTHS_ID[bulan]} {tahun}
          </h3>
          <span className="badge badge-default ml-auto">{isAdmin() ? jadwal.length : myJadwal.length} jadwal</span>
        </div>
        <div className="overflow-x-auto max-h-72 overflow-y-auto">
          <table className="data-table">
            <thead><tr><th>No</th><th>Tanggal</th><th>Hari</th><th>Petugas</th><th>Posisi</th>{isAdmin() && <th>Aksi</th>}</tr></thead>
            <tbody>
              {(isAdmin() ? jadwal : myJadwal).length === 0 ? (
                <tr><td colSpan={6} className="text-center text-white/30 py-8">Tidak ada jadwal bulan ini</td></tr>
              ) : (isAdmin() ? jadwal : myJadwal).map((j, i) => {
                const d = new Date(j.tanggal)
                return (
                  <tr key={j.id}>
                    <td>{i+1}</td>
                    <td className="font-mono text-xs">{j.tanggal}</td>
                    <td className="text-white/60">{HARI_FULL[d.getDay()]}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${j.user_piket === user ? 'bg-brand-400' : 'bg-white/20'}`} />
                        <span className="text-sm font-medium">{j.user_piket}</span>
                      </div>
                    </td>
                    <td><span className="badge badge-info text-[10px]">{j.posisi}</span></td>
                    {isAdmin() && (
                      <td>
                        <motion.button onClick={() => handleDeleteJadwal(j.id)} whileTap={{ scale: 0.9 }}
                          className="btn-icon text-red-400/60 hover:text-red-400 hover:bg-red-500/10">
                          <Trash2 size={12} />
                        </motion.button>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </AnimatedCard>

      {/* ── Modal: Tambah Jadwal (Admin) ─────────────────────── */}
      <AnimatePresence>
        {addModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/70" onClick={() => setAddModal(null)} />
            <motion.div className="relative glass-strong rounded-2xl border border-white/[0.12] p-6 w-full max-w-sm shadow-glow"
              initial={{ scale: 0.92 }} animate={{ scale: 1 }} exit={{ scale: 0.92 }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <Plus size={16} className="text-brand-400" /> Tambah Jadwal Piket
                  </h3>
                  <p className="text-xs text-white/40 mt-0.5">{formatTanggal(addModal.tanggal)}</p>
                </div>
                <button onClick={() => setAddModal(null)} className="btn-icon text-white/50"><X size={16} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="input-label">Petugas</label>
                  <select className="input-field" value={addForm.user_piket}
                    onChange={e => setAddForm(f => ({ ...f, user_piket: e.target.value }))}>
                    <option value="" className="bg-surface-2">-- Pilih Petugas --</option>
                    {petugas.map(p => (
                      <option key={p.id} value={p.username} className="bg-surface-2">{p.username}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="input-label">Posisi / Loket</label>
                  <select className="input-field" value={addForm.posisi}
                    onChange={e => setAddForm(f => ({ ...f, posisi: e.target.value }))}>
                    {POSISI.map(p => <option key={p} value={p} className="bg-surface-2">{p}</option>)}
                  </select>
                </div>
                <motion.button onClick={handleAdd} disabled={submitting}
                  className="btn-primary w-full py-3" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                  {submitting ? 'Menyimpan...' : <><Plus size={14} /> Tambah ke Jadwal</>}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modal: Detail Jadwal & Ajukan Tukar ─────────────── */}
      <AnimatePresence>
        {tukarModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/70" onClick={() => setTukarModal(null)} />
            <motion.div className="relative glass-strong rounded-2xl border border-white/[0.12] p-6 w-full max-w-sm shadow-glow"
              initial={{ scale: 0.92 }} animate={{ scale: 1 }} exit={{ scale: 0.92 }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Info size={16} className="text-cyan-400" /> Detail Jadwal
                </h3>
                <button onClick={() => setTukarModal(null)} className="btn-icon text-white/50"><X size={16} /></button>
              </div>
              <div className="glass rounded-xl p-4 mb-4 space-y-2">
                {[
                  ['Tanggal',  formatTanggal(tukarModal.tanggal)],
                  ['Petugas',  tukarModal.user_piket],
                  ['Posisi',   tukarModal.posisi],
                ].map(([k,v]) => (
                  <div key={k} className="flex gap-2 text-sm">
                    <span className="text-white/40 w-20">{k}</span>
                    <span className="text-white font-medium">: {v}</span>
                  </div>
                ))}
              </div>

              {/* Hanya petugas yang bersangkutan yang bisa mengajukan tukar */}
              {tukarModal.user_piket === user ? (
                <div className="space-y-3">
                  <p className="text-xs text-amber-400 font-semibold flex items-center gap-1.5">
                    <ArrowLeftRight size={12} /> Ajukan Tukar Jadwal
                  </p>
                  <div>
                    <label className="input-label">Tukar dengan Petugas</label>
                    <select className="input-field" value={tukarForm.penerima}
                      onChange={e => setTukarForm(f => ({ ...f, penerima: e.target.value }))}>
                      <option value="" className="bg-surface-2">-- Pilih Petugas --</option>
                      {petugas.filter(p => p.username !== user).map(p => (
                        <option key={p.id} value={p.username} className="bg-surface-2">{p.username}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="input-label">Alasan Tukar</label>
                    <textarea className="input-field resize-none" rows={2}
                      placeholder="Tuliskan alasan pengajuan..."
                      value={tukarForm.alasan} onChange={e => setTukarForm(f => ({ ...f, alasan: e.target.value }))} />
                  </div>
                  <motion.button onClick={handleTukar} disabled={submitting}
                    className="btn-warning w-full py-2.5" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                    {submitting ? 'Mengirim...' : <><ArrowLeftRight size={14} /> Kirim Pengajuan</>}
                  </motion.button>
                </div>
              ) : (
                <p className="text-xs text-white/30 text-center">Hanya petugas yang dijadwalkan yang bisa mengajukan tukar.</p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modal: Inbox Tukar Jadwal ────────────────────────── */}
      <AnimatePresence>
        {inboxModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/70" onClick={() => setInboxModal(false)} />
            <motion.div className="relative glass-strong rounded-2xl border border-white/[0.12] p-6 w-full max-w-lg shadow-glow max-h-[80vh] flex flex-col"
              initial={{ scale: 0.92 }} animate={{ scale: 1 }} exit={{ scale: 0.92 }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <ArrowLeftRight size={16} className="text-amber-400" />
                  {isAdmin() ? 'Semua Pengajuan Tukar Jadwal' : 'Permintaan Tukar untuk Saya'}
                </h3>
                <button onClick={() => setInboxModal(false)} className="btn-icon text-white/50"><X size={16} /></button>
              </div>
              <div className="overflow-y-auto flex-1 space-y-3 pr-1">
                {(isAdmin() ? tukarList : tukarList.filter(t => t.penerima === user)).length === 0 ? (
                  <div className="text-center py-10 text-white/30">
                    <ArrowLeftRight size={28} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Tidak ada pengajuan tukar jadwal</p>
                  </div>
                ) : (isAdmin() ? tukarList : tukarList.filter(t => t.penerima === user)).map(t => (
                  <div key={t.id} className="glass rounded-xl p-4 border border-white/[0.06]">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {t.pengaju} → <span className="text-emerald-400">{t.penerima}</span>
                        </p>
                        <p className="text-xs text-white/40 mt-0.5">
                          {formatTanggal(t.tanggal_asal)} · {t.posisi}
                        </p>
                        <p className="text-xs text-white/50 mt-1 italic">"{t.alasan}"</p>
                      </div>
                      <span className={`badge flex-shrink-0 text-[10px]
                        ${t.status === 'menunggu' ? 'badge-warning' :
                          t.status === 'disetujui' ? 'badge-success' : 'badge-danger'}`}>
                        {t.status}
                      </span>
                    </div>
                    {t.status === 'menunggu' && isAdmin() && (
                      <div className="flex gap-2 mt-2">
                        <motion.button onClick={() => handleApprove(t)} whileTap={{ scale: 0.95 }}
                          className="btn-success text-xs py-1.5 flex-1 gap-1.5">
                          <CheckCircle2 size={12} /> Setujui
                        </motion.button>
                        <motion.button onClick={() => handleReject(t)} whileTap={{ scale: 0.95 }}
                          className="btn-danger text-xs py-1.5 flex-1 gap-1.5">
                          <XCircle size={12} /> Tolak
                        </motion.button>
                      </div>
                    )}
                    {t.status === 'menunggu' && !isAdmin() && t.penerima === user && (
                      <p className="text-xs text-amber-400 mt-1">⏳ Menunggu persetujuan Admin</p>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
