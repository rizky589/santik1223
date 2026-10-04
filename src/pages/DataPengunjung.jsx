import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, RefreshCw, TrendingUp, Calendar } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { formatDate, MONTHS_ID } from '../lib/utils'
import { RevealText, AnimatedCard, StaggerList } from '../components/animations/Motion'

export default function DataPengunjung() {
  const [rows,    setRows]    = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('buku_tamu')
      .select('waktu_selesai, nama_lengkap')
      .not('waktu_selesai', 'is', null)
      .order('waktu_selesai', { ascending: true })
    setRows(data || [])
    setLoading(false)
  }

  // Only weekdays
  const weekdays = rows.filter(r => {
    const d = new Date(r.waktu_selesai)
    return d.getDay() >= 1 && d.getDay() <= 5
  })

  // Daily
  const dailyMap = {}
  weekdays.forEach(r => {
    const d = r.waktu_selesai?.slice(0,10)
    if (d) dailyMap[d] = (dailyMap[d] || 0) + 1
  })
  const dailyRows = Object.entries(dailyMap)
    .sort(([a],[b]) => a.localeCompare(b))
    .map(([tanggal, jumlah], i) => ({ no: i+1, tanggal, jumlah }))

  // Monthly
  const monthlyMap = {}
  rows.forEach(r => {
    const d = new Date(r.waktu_selesai)
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
    monthlyMap[key] = (monthlyMap[key] || 0) + 1
  })
  const monthlyRows = Object.entries(monthlyMap)
    .sort(([a],[b]) => a.localeCompare(b))
    .map(([bulan, jumlah], i) => {
      const [y, m] = bulan.split('-')
      return { no: i+1, bulan: `${MONTHS_ID[parseInt(m)-1]} ${y}`, jumlah }
    })

  if (loading) return (
    <div className="space-y-4">
      {[...Array(2)].map((_,i) => <div key={i} className="h-64 rounded-2xl shimmer" />)}
    </div>
  )

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <RevealText>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <Users size={20} className="text-cyan-400" />
            </div>
            <div>
              <h1 className="page-title">Statistik Data Pengunjung</h1>
              <p className="page-subtitle">Rekap harian & bulanan (hari kerja)</p>
            </div>
          </div>
          <button onClick={fetchData} className="btn-secondary gap-2 text-xs">
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </RevealText>

      {/* Summary */}
      <StaggerList className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label:'Total Pengunjung', value: rows.length,       icon: Users,      color: 'text-brand-400',   bg: 'bg-brand-500/10'   },
          { label:'Hari Kerja',       value: dailyRows.length,  icon: Calendar,   color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label:'Bulan Terekam',    value: monthlyRows.length,icon: TrendingUp, color: 'text-cyan-400',    bg: 'bg-cyan-500/10'    },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <motion.div key={label} className="stat-card"
            variants={{ hidden:{ opacity:0, y:20 }, show:{ opacity:1, y:0, transition:{ duration:0.35 } } }}
          >
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon size={17} className={color} />
            </div>
            <p className={`text-3xl font-display font-black ${color}`}>{value}</p>
            <p className="text-white/40 text-xs mt-1">{label}</p>
          </motion.div>
        ))}
      </StaggerList>

      {/* Daily Table */}
      <AnimatedCard className="glass-md rounded-2xl border border-white/8 overflow-hidden">
        <div className="flex items-center gap-2 p-5 border-b border-white/8">
          <Calendar size={15} className="text-brand-400" />
          <h3 className="font-semibold text-sm text-white">Tabel Pengunjung Harian (Hari Kerja)</h3>
          <span className="badge badge-default ml-auto">{dailyRows.length} hari</span>
        </div>
        <div className="overflow-x-auto max-h-72 overflow-y-auto">
          <table className="data-table">
            <thead>
              <tr><th>No</th><th>Tanggal</th><th>Jumlah Pengunjung</th></tr>
            </thead>
            <tbody>
              {dailyRows.length === 0 ? (
                <tr><td colSpan={3} className="text-center text-white/30 py-8">Belum ada data</td></tr>
              ) : dailyRows.map(r => (
                <tr key={r.tanggal}>
                  <td>{r.no}</td>
                  <td>{formatDate(r.tanggal)}</td>
                  <td><span className="badge badge-info">{r.jumlah} orang</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AnimatedCard>

      {/* Monthly Table */}
      <AnimatedCard className="glass-md rounded-2xl border border-white/8 overflow-hidden" delay={0.1}>
        <div className="flex items-center gap-2 p-5 border-b border-white/8">
          <TrendingUp size={15} className="text-emerald-400" />
          <h3 className="font-semibold text-sm text-white">Tabel Pengunjung Bulanan</h3>
          <span className="badge badge-default ml-auto">{monthlyRows.length} bulan</span>
        </div>
        <div className="overflow-x-auto max-h-72 overflow-y-auto">
          <table className="data-table">
            <thead>
              <tr><th>No</th><th>Bulan</th><th>Jumlah Pengunjung</th></tr>
            </thead>
            <tbody>
              {monthlyRows.length === 0 ? (
                <tr><td colSpan={3} className="text-center text-white/30 py-8">Belum ada data</td></tr>
              ) : monthlyRows.map(r => (
                <tr key={r.bulan}>
                  <td>{r.no}</td>
                  <td className="font-medium">{r.bulan}</td>
                  <td><span className="badge badge-success">{r.jumlah} orang</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AnimatedCard>
    </div>
  )
}
