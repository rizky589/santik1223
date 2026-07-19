import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, SkipForward, Pause, Trash2, Volume2, RefreshCw } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { todayString } from '../lib/utils'
import { RevealText, AnimatedCard } from '../components/animations/Motion'
import { useToast } from '../hooks/useToast'
import { Toasts } from '../components/animations/Motion'

export default function PanggilAntrian() {
  const { setAntrianId } = useAuthStore()
  const { toasts, toast, dismiss } = useToast()

  const [next,    setNext]    = useState(null)
  const [loading, setLoading] = useState(false)
  const [ringing, setRinging] = useState(false)

  const today = todayString()

  const fetchNext = useCallback(async () => {
    const { data } = await supabase
      .from('antrian')
      .select('*')
      .eq('tanggal', today)
      .eq('status', 'menunggu')
      .order('waktu', { ascending: true })
      .limit(1)
    setNext(data?.[0] || null)
  }, [today])

  useEffect(() => { fetchNext() }, [fetchNext])

  // TTS via browser SpeechSynthesis
  const speak = (text) => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(text)
    utt.lang = 'id-ID'
    utt.rate = 0.9
    window.speechSynthesis.speak(utt)
  }

  const handlePanggil = async () => {
    if (!next) return
    setLoading(true)
    try {
      const { error } = await supabase
        .from('antrian')
        .update({ status: 'melayani', timestamp: new Date().toISOString() })
        .eq('id', next.id)
      if (error) throw error

      setAntrianId(next.id)
      setRinging(true)
      speak(`Nomor antrian ${next.no}. Atas nama ${next.nama}. Silakan ke P S T ${next.loket}.`)
      setTimeout(() => setRinging(false), 3000)
      toast.success(`Antrian ${next.no} dipanggil!`)
      fetchNext()
    } catch (e) { toast.error('Gagal memanggil: ' + e.message) }
    finally { setLoading(false) }
  }

  const handleSkip = async () => {
    if (!next) return
    await supabase.from('antrian').update({ status: 'dilewati' }).eq('id', next.id)
    toast.warning(`Antrian ${next.no} dilewati.`)
    fetchNext()
  }

  const handlePause = async () => {
    if (!next) return
    await supabase.from('antrian').update({ status: 'pause' }).eq('id', next.id)
    toast.info(`Antrian ${next.no} di-pause.`)
    fetchNext()
  }

  const handleReset = async () => {
    if (!confirm('Reset semua antrian hari ini?')) return
    const { data } = await supabase.from('antrian').select('id').eq('tanggal', today)
    if (!data) return
    await Promise.all(data.map(d => supabase.from('antrian').delete().eq('id', d.id)))
    toast.success(`${data.length} antrian dihapus.`)
    fetchNext()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Toasts toasts={toasts} onDismiss={dismiss} />

      <RevealText>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
            <Bell size={20} className="text-cyan-400" />
          </div>
          <div>
            <h1 className="page-title">Panggil Antrian</h1>
            <p className="page-subtitle">Kelola pemanggilan antrian PST hari ini</p>
          </div>
          <button onClick={fetchNext} className="btn-icon ml-auto">
            <RefreshCw size={15} />
          </button>
        </div>
      </RevealText>

      {/* Next queue card */}
      <AnimatePresence mode="wait">
        {next ? (
          <motion.div
            key={next.id}
            className={`glass-md rounded-2xl p-7 border transition-all duration-500
              ${ringing ? 'border-brand-500/60 shadow-glow' : 'border-white/8'}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            {/* Bell ring animation */}
            <AnimatePresence>
              {ringing && (
                <motion.div
                  className="flex items-center justify-center gap-2 mb-4"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                >
                  <motion.div
                    animate={{ rotate: [0, -15, 15, -15, 15, 0] }}
                    transition={{ duration: 0.6, repeat: 3 }}
                  >
                    <Volume2 size={22} className="text-brand-400" />
                  </motion.div>
                  <span className="text-brand-400 font-semibold text-sm">Sedang Dipanggil...</span>
                </motion.div>
              )}
            </AnimatePresence>

            <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-2">Antrian Berikutnya</p>
            <div className="text-6xl font-display font-black text-gradient mb-4">{next.no}</div>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                ['Nama',    next.nama],
                ['PST',     `Loket ${next.loket}`],
                ['Layanan', next.keperluan],
                ['Waktu',   next.waktu],
              ].map(([k, v]) => (
                <div key={k} className="glass rounded-xl p-3">
                  <p className="text-[10px] text-white/35 uppercase tracking-wide">{k}</p>
                  <p className="text-sm font-semibold text-white mt-0.5 truncate">{v}</p>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-3 gap-3">
              <motion.button
                onClick={handlePanggil} disabled={loading}
                className="btn-primary py-3 col-span-1"
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              >
                <Bell size={16} /> Panggil
              </motion.button>
              <motion.button
                onClick={handleSkip}
                className="btn-warning py-3"
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              >
                <SkipForward size={16} /> Skip
              </motion.button>
              <motion.button
                onClick={handlePause}
                className="btn-secondary py-3"
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              >
                <Pause size={16} /> Pause
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            className="glass-md rounded-2xl p-10 border border-emerald-500/20 text-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <div className="text-4xl mb-3">✅</div>
            <p className="font-semibold text-emerald-400">Tidak ada antrian menunggu saat ini</p>
            <p className="text-white/40 text-sm mt-1">Semua pengunjung telah dilayani</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset button */}
      <div className="divider" />
      <motion.button
        onClick={handleReset}
        className="btn-danger w-full"
        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
      >
        <Trash2 size={16} /> Reset Antrian Hari Ini
      </motion.button>
    </div>
  )
}
