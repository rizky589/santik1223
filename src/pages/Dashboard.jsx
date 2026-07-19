import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, BarElement,
  ArcElement, Tooltip, Legend, Filler
} from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import { TrendingUp, Users, Calendar, Activity } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { MONTHS_ID, formatDate } from '../lib/utils'
import { AnimatedCard, StaggerList, RevealText } from '../components/animations/Motion'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Tooltip, Legend, Filler)

const CHART_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: 'rgba(255,255,255,0.6)', font: { family: 'Inter', size: 11 } } },
    tooltip: {
      backgroundColor: 'rgba(15,15,35,0.95)',
      borderColor: 'rgba(99,102,241,0.3)',
      borderWidth: 1,
      titleColor: '#fff',
      bodyColor: 'rgba(255,255,255,0.7)',
    },
  },
  scales: {
    x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 11 } } },
    y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 11 } } },
  },
}

export default function Dashboard() {
  const [bukuTamu, setBukuTamu] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('buku_tamu')
      .select('waktu_selesai, layanan')
      .order('waktu_selesai', { ascending: true })
    setBukuTamu(data || [])
    setLoading(false)
  }

  // ── Daily chart ──────────────────────────────────────────
  const dailyMap = {}
  bukuTamu.forEach(r => {
    const d = r.waktu_selesai?.slice(0, 10)
    if (d) dailyMap[d] = (dailyMap[d] || 0) + 1
  })
  const dailyLabels = Object.keys(dailyMap).slice(-14)
  const dailyData   = dailyLabels.map(k => dailyMap[k])

  // ── Monthly 2025 ─────────────────────────────────────────
  const monthly = new Array(12).fill(0)
  bukuTamu.forEach(r => {
    const d = r.waktu_selesai ? new Date(r.waktu_selesai) : null
    if (d && d.getFullYear() === new Date().getFullYear()) monthly[d.getMonth()]++
  })

  // ── Layanan pie ──────────────────────────────────────────
  const layananMap = {}
  bukuTamu.forEach(r => {
    const l = r.layanan || 'Lainnya'
    layananMap[l] = (layananMap[l] || 0) + 1
  })

  const COLORS = ['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444']

  const lineData = {
    labels: dailyLabels.map(d => formatDate(d, 'dd MMM')),
    datasets: [{
      label: 'Pengunjung',
      data: dailyData,
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99,102,241,0.1)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#6366f1',
      pointRadius: 4,
    }],
  }

  const barData = {
    labels: MONTHS_ID,
    datasets: [{
      label: 'Pengunjung',
      data: monthly,
      backgroundColor: monthly.map((_, i) =>
        i === new Date().getMonth() ? '#6366f1' : 'rgba(99,102,241,0.25)'
      ),
      borderRadius: 6,
    }],
  }

  const doughnutData = {
    labels: Object.keys(layananMap),
    datasets: [{
      data: Object.values(layananMap),
      backgroundColor: COLORS,
      borderColor: 'transparent',
      hoverOffset: 8,
    }],
  }

  const statsCards = [
    { label: 'Total Pengunjung', value: bukuTamu.length, icon: Users,      color: 'text-brand-400',   bg: 'bg-brand-500/10'   },
    { label: 'Bulan Ini',        value: monthly[new Date().getMonth()], icon: Calendar, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Hari Ini',         value: dailyMap[new Date().toISOString().slice(0,10)] || 0, icon: Activity, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { label: 'Jenis Layanan',    value: Object.keys(layananMap).length, icon: TrendingUp, color: 'text-violet-400', bg: 'bg-violet-500/10' },
  ]

  if (loading) return (
    <div className="space-y-4">
      {[...Array(3)].map((_,i) => (
        <div key={i} className="h-40 rounded-2xl shimmer" />
      ))}
    </div>
  )

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <RevealText>
        <div>
          <h1 className="page-title">Dashboard Statistik Pengunjung</h1>
          <p className="page-subtitle">Rekap kunjungan PST & PPID BPS Kabupaten Labuhanbatu Utara</p>
        </div>
      </RevealText>

      {/* Stat cards */}
      <StaggerList className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map(({ label, value, icon: Icon, color, bg }, i) => (
          <motion.div
            key={label}
            className="stat-card"
            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, delay: i * 0.07 } } }}
          >
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon size={18} className={color} />
            </div>
            <p className={`text-3xl font-display font-black ${color}`}>{value}</p>
            <p className="text-white/40 text-xs font-medium mt-1">{label}</p>
          </motion.div>
        ))}
      </StaggerList>

      {/* Line chart */}
      <AnimatedCard className="glass-md rounded-2xl p-5 border border-white/8">
        <h3 className="font-semibold text-white mb-4 text-sm">Tren Kunjungan Harian (14 Hari Terakhir)</h3>
        <div className="h-56">
          <Line data={lineData} options={{ ...CHART_OPTS, plugins: { ...CHART_OPTS.plugins, legend: { display: false } } }} />
        </div>
      </AnimatedCard>

      {/* Bar + Doughnut */}
      <div className="grid lg:grid-cols-2 gap-4">
        <AnimatedCard className="glass-md rounded-2xl p-5 border border-white/8" delay={0.1}>
          <h3 className="font-semibold text-white mb-4 text-sm">Kunjungan Bulanan {new Date().getFullYear()}</h3>
          <div className="h-56">
            <Bar data={barData} options={{ ...CHART_OPTS, plugins: { ...CHART_OPTS.plugins, legend: { display: false } } }} />
          </div>
        </AnimatedCard>

        <AnimatedCard className="glass-md rounded-2xl p-5 border border-white/8" delay={0.15}>
          <h3 className="font-semibold text-white mb-4 text-sm">Persentase Jenis Layanan</h3>
          {Object.keys(layananMap).length > 0 ? (
            <div className="h-56">
              <Doughnut data={doughnutData} options={{
                responsive: true, maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'right', labels: { color: 'rgba(255,255,255,0.6)', font: { size: 10 } } },
                  tooltip: CHART_OPTS.plugins.tooltip,
                },
              }} />
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center text-white/30 text-sm">
              Belum ada data layanan
            </div>
          )}
        </AnimatedCard>
      </div>
    </div>
  )
}
