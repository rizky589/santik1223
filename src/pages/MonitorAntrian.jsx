import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Monitor, CheckCircle, RefreshCw } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { todayString, timeString, fullDateID } from '../lib/utils'
import { useToast } from '../hooks/useToast'
import { Toasts } from '../components/animations/Motion'

const STATUS_COLS = [
  { key: 'menunggu', label: '🟠 Menunggu',  cls: 'badge-warning' },
  { key: 'melayani', label: '🟢 Melayani',  cls: 'badge-success' },
  { key: 'selesai',  label: '🔵 Selesai',   cls: 'badge-info'    },
]

export default function MonitorAntrian() {
  const { toasts, toast, dismiss } = useToast()
  const [current, setCurrent]   = useState(null)
  const [allRows, setAllRows]   = useState([])
  const [time, setTime]         = useState(timeString())
  const [dateStr, setDateStr]   = useState(fullDateID())
  const today = todayString()

  const fetchData = useCallback(async () => {
    const { data: cur } = await supabase
      .from('antrian').select('*')
      .eq('status', 'melayani').eq('tanggal', today)
      .order('timestamp', { ascending: false }).limit(1)
    setCurrent(cur?.[0] || null)

    const { data: all } = await supabase
      .from('antrian').select('*').eq('tanggal', today)
      .order('timestamp', { ascending: true })
    setAllRows(all || [])
  }, [today])

  // Auto-refresh every 5s
  useEffect(() => {
    fetchData()
    const iv = setInterval(fetchData, 5000)
    return () => clearInterval(iv)
  }, [fetchData])

  // Clock
  useEffect(() => {
    const iv = setInterval(() => {
      setTime(timeString())
      setDateStr(fullDateID())
    }, 1000)
    return () => clearInterval(iv)
  }, [])

  // Real-time
  useEffect(() => {
    const channel = supabase
      .channel('antrian-monitor')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'antrian' }, fetchData)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [fetchData])

  const handleSelesai = async () => {
    if (!current) return
    const now = new Date()
    const { error } = await supabase.from('antrian').update({
      status: 'selesai',
      waktu_selesai: now.toISOString(),
      timestamp_selesai: now.toISOString(),
    }).eq('id', current.id)
    if (error) { toast.error('Gagal menandai selesai.'); return }
    toast.success('Antrian ditandai selesai.')
    fetchData()
  }

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <Toasts toasts={toasts} onDismiss={dismiss} />

      {/* Running text */}
      <div className="glass rounded-xl px-5 py-3 border border-brand-500/20 overflow-hidden">
        <div className="marquee-container">
          <div className="marquee-text text-sm font-semibold text-brand-300">
            🟢 SELAMAT DATANG DI LAYANAN ANTRIAN STATISTIK &nbsp;&nbsp;|&nbsp;&nbsp;
            <span className="text-white/70">{dateStr.toUpperCase()}</span>
            &nbsp;&nbsp;|&nbsp;&nbsp;
            <span className="text-cyan-400 font-mono">{time}</span>
            &nbsp;&nbsp;|&nbsp;&nbsp;BPS KABUPATEN LABUHANBATU UTARA
          </div>
        </div>
      </div>

      {/* Current serving */}
      <AnimatePresence mode="wait">
        {current ? (
          <motion.div
            key={current.id}
            className="glass-md rounded-3xl p-8 lg:p-12 border border-brand-500/20 text-center shadow-glow"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
          >
            <p className="text-white/40 text-sm font-semibold uppercase tracking-widest mb-3">Sedang Dilayani</p>
            <motion.h2
              className="text-5xl lg:text-7xl font-display font-black text-gradient"
              animate={{ opacity: [1, 0.7, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {current.no}
            </motion.h2>
            <p className="text-2xl font-bold text-white mt-3">{current.nama}</p>
            <div className="flex justify-center gap-4 mt-3 flex-wrap">
              <span className="badge badge-info">PST {current.loket}</span>
              <span className="badge badge-purple">{current.keperluan}</span>
              <span className="badge badge-default font-mono">{time}</span>
            </div>
            <motion.button
              onClick={handleSelesai}
              className="btn-success mt-6 px-8 py-3 text-base"
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            >
              <CheckCircle size={18} /> Tandai Selesai
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key="idle"
            className="glass-md rounded-3xl p-10 border border-white/8 text-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          >
            <Monitor size={40} className="text-white/20 mx-auto mb-3" />
            <p className="text-white/40 font-medium">Tidak ada antrian yang sedang dilayani</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status columns */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {STATUS_COLS.map(({ key, label, cls }) => {
          const rows = allRows.filter(r => r.status === key)
          return (
            <motion.div
              key={key}
              className="glass-md rounded-2xl p-4 border border-white/8"
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm text-white">{label}</h3>
                <span className={`badge ${cls}`}>{rows.length}</span>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {rows.length === 0 ? (
                  <p className="text-white/30 text-xs text-center py-4">Tidak ada data</p>
                ) : rows.map(r => (
                  <div key={r.id} className="glass rounded-lg px-3 py-2 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white">{r.no}</p>
                      <p className="text-[11px] text-white/50 truncate max-w-[120px]">{r.nama}</p>
                    </div>
                    <span className="text-[10px] text-white/30 font-mono">{r.waktu}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )
        })}
      </div>

      <div className="flex justify-end">
        <button onClick={fetchData} className="btn-secondary text-xs gap-2">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>
    </div>
  )
}
