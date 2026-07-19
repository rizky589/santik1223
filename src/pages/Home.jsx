import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Lottie from 'lottie-react'
import { Users, ClipboardList, Calendar, TrendingUp, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { StaggerList, AnimatedCard, RevealText, FloatingBadge } from '../components/animations/Motion'
import { supabase } from '../lib/supabase'
import { todayString, fullDateID } from '../lib/utils'

const QUICK_LINKS = [
  { to: '/input-antrian',   icon: ClipboardList, label: 'Input Antrian',   color: 'from-brand-500 to-violet-600',   desc: 'Daftarkan pengunjung baru' },
  { to: '/panggil-antrian', icon: Users,         label: 'Panggil Antrian', color: 'from-cyan-500 to-blue-600',      desc: 'Panggil antrian berikutnya' },
  { to: '/monitor-antrian', icon: TrendingUp,    label: 'Monitor',         color: 'from-emerald-500 to-teal-600',   desc: 'Layar display antrian' },
  { to: '/presensi',        icon: Calendar,      label: 'Presensi',        color: 'from-amber-500 to-orange-600',   desc: 'Catat kehadiran harian' },
]

export default function Home() {
  const navigate = useNavigate()
  const { user, role } = useAuthStore()
  const [lottie, setLottie]   = useState(null)
  const [stats, setStats]     = useState({ antrian: 0, selesai: 0, menunggu: 0 })
  const today = todayString()

  useEffect(() => {
    fetch('/assets/statistik.json').then(r => r.json()).then(setLottie).catch(() => {})
    fetchStats()
  }, [])

  const fetchStats = async () => {
    const { data } = await supabase.from('antrian').select('status').eq('tanggal', today)
    if (!data) return
    setStats({
      antrian:  data.length,
      selesai:  data.filter(d => d.status === 'selesai').length,
      menunggu: data.filter(d => d.status === 'menunggu').length,
    })
  }

  const STAT_CARDS = [
    { label: 'Total Antrian Hari Ini', value: stats.antrian,  icon: ClipboardList, color: 'text-brand-400',   bg: 'bg-brand-500/10'   },
    { label: 'Sudah Dilayani',         value: stats.selesai,  icon: TrendingUp,    color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Menunggu',               value: stats.menunggu, icon: Users,         color: 'text-amber-400',   bg: 'bg-amber-500/10'   },
  ]

  return (
    <div className="space-y-8 max-w-6xl mx-auto">

      {/* Hero banner */}
      <motion.div
        className="relative overflow-hidden glass-md rounded-3xl p-6 sm:p-8 border border-white/8"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Glow */}
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row items-center gap-6">
          {/* Text */}
          <div className="flex-1 text-center sm:text-left">
            <RevealText>
              <div className="flex items-center gap-2 justify-center sm:justify-start mb-2">
                <span className="">
                  
                </span>
              </div>
            </RevealText>
            <RevealText delay={0.05}>
              <h1 className="text-3xl sm:text-4xl font-display font-black text-white mb-1">
                Selamat Datang, <span className="text-gradient">{user?.split(' ')[0]}</span>
              </h1>
            </RevealText>
            <RevealText delay={0.1}>
              <p className="text-white/50 text-sm sm:text-base mt-2">{fullDateID()} · PST & PPID BPS Labura</p>
            </RevealText>
            <RevealText delay={0.15}>
              <div className="flex flex-wrap gap-2 mt-4 justify-center sm:justify-start">
                
              </div>
            </RevealText>
          </div>


        </div>
      </motion.div>

      {/* Stat cards */}
      <StaggerList className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {STAT_CARDS.map(({ label, value, icon: Icon, color, bg }) => (
          <motion.div
            key={label}
            className="stat-card"
            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}
            whileHover={{ y: -4 }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-white/40 text-xs font-semibold uppercase tracking-wide">{label}</p>
                <p className={`text-4xl font-display font-black mt-2 ${color}`}>{value}</p>
              </div>
              <div className={`w-11 h-11 rounded-2xl ${bg} flex items-center justify-center flex-shrink-0`}>
                <Icon size={20} className={color} />
              </div>
            </div>
            <div className="progress-bar mt-4">
              <motion.div
                className="progress-fill"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((value / Math.max(stats.antrian, 1)) * 100, 100)}%` }}
                transition={{ duration: 0.8, delay: 0.3 }}
              />
            </div>
          </motion.div>
        ))}
      </StaggerList>

      {/* Quick access */}
      <div>
        <RevealText>
          <h2 className="text-lg font-display font-bold text-white mb-4">Akses Cepat</h2>
        </RevealText>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {QUICK_LINKS.map(({ to, icon: Icon, label, color, desc }, i) => (
            <AnimatedCard key={to} delay={i * 0.07}>
              <motion.button
                onClick={() => navigate(to)}
                className="w-full glass-md rounded-2xl p-5 border border-white/8 text-left
                  hover:border-brand-500/30 transition-all duration-300 group"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color}
                  flex items-center justify-center mb-3 shadow-glow group-hover:shadow-glow-lg transition-shadow`}>
                  <Icon size={20} className="text-white" />
                </div>
                <p className="font-semibold text-sm text-white">{label}</p>
                <p className="text-[11px] text-white/40 mt-1">{desc}</p>
                <div className="flex items-center gap-1 mt-3 text-brand-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[11px] font-semibold">Buka</span>
                  <ArrowRight size={11} />
                </div>
              </motion.button>
            </AnimatedCard>
          ))}
        </div>
      </div>


    </div>
  )
}
