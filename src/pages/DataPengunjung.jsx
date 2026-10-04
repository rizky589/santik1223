import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, RefreshCw, TrendingUp, Calendar, CalendarCheck, ChevronLeft, ChevronRight, ChevronDown, X, PieChart } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { formatDate, MONTHS_ID } from '../lib/utils'
import { RevealText, AnimatedCard } from '../components/animations/Motion'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

const HARI_SINGKAT = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB']

const pad = (n) => String(n).padStart(2, '0')
const keyOf = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`
const toLocalDate = (ts) => { const d = new Date(ts); return keyOf(d.getFullYear(), d.getMonth(), d.getDate()) }

export default function DataPengunjung() {
  const [rowsPST, setRowsPST] = useState([])
  const [rowsPPID, setRowsPPID] = useState([])
  const [loading, setLoading] = useState(true)
  const now = new Date()
  const todayKey = keyOf(now.getFullYear(), now.getMonth(), now.getDate())

  const [view, setView]               = useState({ y: now.getFullYear(), m: now.getMonth() })
  const [selectedDay, setSelectedDay] = useState(null)   // null = hari ini untuk kartu
  const [pickerOpen, setPickerOpen]   = useState(false)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    const [pstRes, ppidRes] = await Promise.all([
      supabase
        .from('buku_tamu')
        .select('waktu_selesai')
        .not('waktu_selesai', 'is', null)
        .order('waktu_selesai', { ascending: true }),
      supabase
        .from('ppid_permohonan')
        .select('waktu_selesai')
        .not('waktu_selesai', 'is', null)
        .order('waktu_selesai', { ascending: true })
    ])
    setRowsPST(pstRes.data || [])
    setRowsPPID(ppidRes.data || [])
    setLoading(false)
  }

  // Rekap PST dan PPID
  const dayMap = useMemo(() => {
    const m = {}
    rowsPST.forEach(r => {
      const k = toLocalDate(r.waktu_selesai)
      if (!m[k]) m[k] = { pst: 0, ppid: 0 }
      m[k].pst += 1
    })
    rowsPPID.forEach(r => {
      const k = toLocalDate(r.waktu_selesai)
      if (!m[k]) m[k] = { pst: 0, ppid: 0 }
      m[k].ppid += 1
    })
    return m
  }, [rowsPST, rowsPPID])

  const monthKey = `${view.y}-${pad(view.m + 1)}`
  const cardDay  = selectedDay || todayKey
  const cardInfo = dayMap[cardDay] || { pst: 0, ppid: 0 }
  const cardTotal = cardInfo.pst + cardInfo.ppid

  const dailyRows = useMemo(() => {
    return Object.entries(dayMap)
      .filter(([tgl]) => {
        const g = new Date(tgl + 'T00:00:00').getDay()
        if (g < 1 || g > 5) return false
        return selectedDay ? tgl === selectedDay : tgl.startsWith(monthKey)
      })
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([tanggal, v], i) => ({ no: i + 1, tanggal, pst: v.pst, ppid: v.ppid, total: v.pst + v.ppid }))
  }, [dayMap, monthKey, selectedDay])

  const sum = dailyRows.reduce((a, r) => ({ pst: a.pst + r.pst, ppid: a.ppid + r.ppid, total: a.total + r.total }), { pst: 0, ppid: 0, total: 0 })

  const monthlyMap = {}
  const allRows = [...rowsPST, ...rowsPPID]
  allRows.forEach(r => {
    const d = new Date(r.waktu_selesai)
    const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
    monthlyMap[key] = (monthlyMap[key] || 0) + 1
  })
  const monthlyRows = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([bulan, jumlah], i) => {
      const [y, m] = bulan.split('-')
      return { no: i + 1, bulan: `${MONTHS_ID[parseInt(m) - 1]} ${y}`, jumlah }
    })

  // ── Kalender (minggu mulai Senin, hari di luar bulan diredupkan) ──
  const calendarCells = useMemo(() => {
    const { y, m } = view
    const lead = (new Date(y, m, 1).getDay() + 6) % 7
    const total = Math.ceil((lead + new Date(y, m + 1, 0).getDate()) / 7) * 7
    return Array.from({ length: total }, (_, i) => {
      const d = new Date(y, m, 1 - lead + i)
      return { key: keyOf(d.getFullYear(), d.getMonth(), d.getDate()), day: d.getDate(), inMonth: d.getMonth() === m }
    })
  }, [view])

  const shiftMonth = (delta) => {
    const d = new Date(view.y, view.m + delta, 1)
    setView({ y: d.getFullYear(), m: d.getMonth() })
  }

  const pickDay = (cell) => {
    setSelectedDay(cell.key)
    const d = new Date(cell.key + 'T00:00:00')
    setView({ y: d.getFullYear(), m: d.getMonth() })
    setPickerOpen(false)
  }

  const shiftDay = (delta) => {
    const d = new Date(cardDay + 'T00:00:00')
    d.setDate(d.getDate() + delta)
    const k = keyOf(d.getFullYear(), d.getMonth(), d.getDate())
    if (k > todayKey) return
    setSelectedDay(k)
    setView({ y: d.getFullYear(), m: d.getMonth() })
  }

  const goToday = () => {
    setSelectedDay(todayKey)
    setView({ y: now.getFullYear(), m: now.getMonth() })
    setPickerOpen(false)
  }

  if (loading) return (
    <div className="space-y-4">
      {[...Array(2)].map((_, i) => <div key={i} className="h-64 rounded-2xl shimmer" />)}
    </div>
  )

  const cards = [
    { label: 'Total Kunjungan',     value: cardTotal,    icon: Users,     color: 'text-brand-400',   bg: 'bg-brand-500/10' },
    { label: 'Layanan Data (PST)',  value: cardInfo.pst,  icon: PieChart,  color: 'text-orange-400',  bg: 'bg-orange-500/10' },
    { label: 'Layanan Data (PPID)', value: cardInfo.ppid, icon: PieChart,  color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  ]

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <RevealText>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <Users size={20} className="text-cyan-400" />
            </div>
            <div>
              <h1 className="page-title">Data Pengunjung</h1>
              <p className="page-subtitle">Rekap harian &amp; bulanan (hari kerja)</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-2xl bg-white shadow-md px-1.5 py-1">
              <button onClick={() => shiftDay(-1)} className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100" aria-label="Hari sebelumnya">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => setPickerOpen(true)} className="flex items-center gap-2 px-3 h-8 rounded-xl text-sm font-bold text-slate-800 hover:bg-slate-100">
                <CalendarCheck size={14} className="text-orange-500" />
                {cardDay === todayKey ? 'Hari Ini' : formatDate(cardDay, 'dd MMM yyyy')}
                <ChevronDown size={14} className="text-slate-400" />
              </button>
              <button onClick={() => shiftDay(1)} disabled={cardDay >= todayKey}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 disabled:text-slate-300 disabled:hover:bg-transparent disabled:cursor-default" aria-label="Hari berikutnya">
                <ChevronRight size={16} />
              </button>
            </div>
            <button onClick={fetchData} className="btn-secondary gap-2 text-xs">
              <RefreshCw size={13} /> Refresh
            </button>
          </div>
        </div>
      </RevealText>

      {/* Pelayanan Hari Ini */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 rounded-full bg-orange-400" />
          <h2 className="font-display font-bold text-white text-base">
            {cardDay === todayKey ? 'Pelayanan Hari Ini' : `Pelayanan ${formatDate(cardDay)}`}
          </h2>
          {selectedDay && selectedDay !== todayKey && (
            <button onClick={() => setSelectedDay(null)} className="badge badge-info gap-1 cursor-pointer ml-2">
              Reset <X size={11} />
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {cards.map(({ label, value, icon: Icon, color, bg }, i) => (
            <motion.div key={label} className="stat-card relative overflow-hidden"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            >
              <p className={`text-[11px] font-bold uppercase tracking-wider ${color}`}>{label}</p>
              <div className="flex items-end justify-between mt-2">
                <p className={`text-4xl font-display font-black ${color}`}>{value}</p>
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                  <Icon size={20} className={color} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Daily Table */}
      <AnimatedCard className="glass-md rounded-2xl border border-white/8 overflow-hidden">
        <div className="flex items-center gap-2 p-5 border-b border-white/8 flex-wrap">
          <Calendar size={15} className="text-brand-400" />
          <h3 className="font-semibold text-sm text-white">Tabel Pengunjung Harian (Hari Kerja)</h3>
          {selectedDay ? (
            <button onClick={() => setSelectedDay(null)} className="badge badge-info gap-1 cursor-pointer">
              {formatDate(selectedDay)} <X size={11} />
            </button>
          ) : (
            <span className="badge badge-default">{MONTHS_ID[view.m]} {view.y}</span>
          )}
          <span className="badge badge-default ml-auto">{dailyRows.length} hari</span>
        </div>
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>No</th><th>Tanggal</th><th>Total Kunjungan</th>
                <th>Layanan Data PST</th><th>Layanan Data PPID</th>
              </tr>
            </thead>
            <tbody>
              {dailyRows.length === 0 ? (
                <tr><td colSpan={5} className="text-center text-white/30 py-8">Belum ada data</td></tr>
              ) : dailyRows.map(r => (
                <tr key={r.tanggal}>
                  <td>{r.no}</td>
                  <td>{formatDate(r.tanggal)}</td>
                  <td><span className="badge badge-info">{r.total} orang</span></td>
                  <td><span className="badge badge-success">{r.pst}</span></td>
                  <td><span className="badge badge-warning">{r.ppid}</span></td>
                </tr>
              ))}
            </tbody>
            {dailyRows.length > 0 && (
              <tfoot>
                <tr className="font-bold">
                  <td colSpan={2} className="text-right text-white/60">Jumlah</td>
                  <td>{sum.total}</td><td>{sum.pst}</td><td>{sum.ppid}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </AnimatedCard>

      {/* Monthly Chart */}
      <AnimatedCard className="glass-md rounded-2xl border border-white/8 overflow-hidden" delay={0.1}>
        <div className="flex items-center gap-2 p-5 border-b border-white/8">
          <TrendingUp size={15} className="text-emerald-400" />
          <h3 className="font-semibold text-sm text-white">Grafik Pengunjung Bulanan</h3>
          <span className="badge badge-default ml-auto">{monthlyRows.length} bulan</span>
        </div>
        <div className="p-5">
          {monthlyRows.length === 0 ? (
            <p className="text-center text-white/30 py-8">Belum ada data</p>
          ) : (
            <div className="h-72">
              <Bar
                data={{
                  labels: monthlyRows.map(r => r.bulan),
                  datasets: [{
                    label: 'Pengunjung',
                    data: monthlyRows.map(r => r.jumlah),
                    backgroundColor: 'rgba(52, 211, 153, 0.55)',
                    borderColor: 'rgb(52, 211, 153)',
                    borderWidth: 1,
                    borderRadius: 8,
                    maxBarThickness: 56,
                  }],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: { label: (c) => ` ${c.parsed.y} orang` } },
                  },
                  scales: {
                    x: { ticks: { color: 'rgba(255,255,255,0.5)' }, grid: { display: false } },
                    y: {
                      beginAtZero: true,
                      ticks: { color: 'rgba(255,255,255,0.5)', precision: 0 },
                      grid: { color: 'rgba(255,255,255,0.06)' },
                    },
                  },
                }}
              />
            </div>
          )}
        </div>
      </AnimatedCard>

      {/* Popup kalender */}
      <AnimatePresence>
        {pickerOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setPickerOpen(false)}
            />
            <motion.div
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6"
              initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
            >
              <div className="flex items-center justify-between mb-5">
                <button onClick={() => shiftMonth(-1)} className="w-9 h-9 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-600 hover:bg-slate-100">
                  <ChevronLeft size={16} />
                </button>
                <span className="font-bold text-slate-800">{MONTHS_ID[view.m]} {view.y}</span>
                <button onClick={() => shiftMonth(1)} className="w-9 h-9 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-600 hover:bg-slate-100">
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="grid grid-cols-7 mb-1">
                {HARI_SINGKAT.map(h => (
                  <div key={h} className="text-center text-[10px] font-bold tracking-wider text-slate-400 py-1">{h}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-y-1">
                {calendarCells.map(c => {
                  const active = selectedDay === c.key
                  const has = dayMap[c.key]
                  return (
                    <button
                      key={c.key}
                      onClick={() => pickDay(c)}
                      className={`relative h-10 rounded-xl text-sm font-medium transition-colors
                        ${active ? 'bg-[#03346E] text-white'
                          : c.inMonth ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-300 hover:bg-slate-50'}
                        ${c.key === todayKey && !active ? 'ring-1 ring-[#03346E]/40' : ''}`}
                    >
                      {c.day}
                      {has && c.inMonth && !active && (
                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-500" />
                      )}
                    </button>
                  )
                })}
              </div>

              <div className="flex gap-3 mt-5 pt-4 border-t border-slate-100">
                <button onClick={goToday} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-sm font-semibold hover:bg-slate-100">
                  <CalendarCheck size={14} /> Hari Ini
                </button>
                <button onClick={() => setPickerOpen(false)} className="px-6 py-2.5 rounded-xl bg-[#03346E] text-white text-sm font-semibold hover:opacity-90">
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
