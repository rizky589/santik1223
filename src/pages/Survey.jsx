import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SmilePlus, Star, Send, CheckCircle2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { todayString, timeString } from '../lib/utils'
import { RevealText, AnimatedCard, StaggerList } from '../components/animations/Motion'
import { useToast } from '../hooks/useToast'
import { Toasts } from '../components/animations/Motion'

const EMOJI_OPTIONS = [
  { value: 1, emoji: '😞', label: 'Sangat Tidak Puas' },
  { value: 2, emoji: '😕', label: 'Tidak Puas'        },
  { value: 3, emoji: '😐', label: 'Cukup'             },
  { value: 4, emoji: '😊', label: 'Puas'              },
  { value: 5, emoji: '😄', label: 'Sangat Puas'       },
]

const ASPEK = [
  'Kecepatan Pelayanan',
  'Keramahan Petugas',
  'Kelengkapan Informasi',
  'Kenyamanan Ruangan',
  'Kemudahan Akses',
]

export default function Survey() {
  const { toasts, toast, dismiss } = useToast()
  const [ratings,  setRatings]  = useState({})
  const [overall,  setOverall]  = useState(0)
  const [saran,    setSaran]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [done,     setDone]     = useState(false)

  const allFilled = ASPEK.every(a => ratings[a]) && overall > 0

  const handleSubmit = async () => {
    if (!allFilled) return toast.warning('Mohon isi semua penilaian.')
    setLoading(true)
    const avg = (Object.values(ratings).reduce((a,b) => a+b, 0) / ASPEK.length).toFixed(2)
    const { error } = await supabase.from('survey_kepuasan').insert([{
      tanggal:     todayString(),
      waktu:       timeString(),
      penilaian:   ratings,
      nilai_overall: overall,
      rata_rata:   parseFloat(avg),
      saran:       saran.trim(),
      timestamp:   new Date().toISOString(),
    }])
    if (error) { toast.error('Gagal menyimpan survey.'); setLoading(false); return }
    setDone(true)
    setLoading(false)
  }

  if (done) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
      <motion.div initial={{ scale:0 }} animate={{ scale:1 }} transition={{ type:'spring', bounce:0.5 }}>
        <div className="w-24 h-24 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto">
          <CheckCircle2 size={40} className="text-emerald-400" />
        </div>
      </motion.div>
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}>
        <h2 className="text-2xl font-display font-bold text-white">Terima Kasih! 🎉</h2>
        <p className="text-white/50 mt-2 text-sm">Penilaian Anda telah berhasil disimpan.<br />Masukan Anda sangat berharga bagi kami.</p>
        <button onClick={() => { setDone(false); setRatings({}); setOverall(0); setSaran('') }}
          className="btn-primary mt-6">Isi Survey Lagi</button>
      </motion.div>
    </div>
  )

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Toasts toasts={toasts} onDismiss={dismiss} />

      <RevealText>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
            <SmilePlus size={20} className="text-pink-400" />
          </div>
          <div>
            <h1 className="page-title">Survey Kepuasan</h1>
            <p className="page-subtitle">Berikan penilaian terhadap layanan PST & PPID</p>
          </div>
        </div>
      </RevealText>

      {/* Aspek ratings */}
      <AnimatedCard className="glass-md rounded-2xl p-6 border border-white/8 space-y-6">
        {ASPEK.map((aspek, ai) => (
          <motion.div key={aspek}
            initial={{ opacity:0, x:-16 }} whileInView={{ opacity:1, x:0 }}
            viewport={{ once:true }} transition={{ delay: ai * 0.07 }}
          >
            <p className="text-sm font-semibold text-white mb-3">{aspek}</p>
            <div className="flex gap-2 flex-wrap">
              {EMOJI_OPTIONS.map(({ value, emoji, label }) => (
                <motion.button key={value} type="button"
                  whileHover={{ scale:1.12 }} whileTap={{ scale:0.9 }}
                  onClick={() => setRatings(r => ({ ...r, [aspek]: value }))}
                  title={label}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-all duration-200
                    ${ratings[aspek] === value
                      ? 'bg-brand-500/30 border-brand-500/60 shadow-glow-sm'
                      : 'glass border-white/10 hover:border-white/25'}`}
                >
                  <span className="text-2xl">{emoji}</span>
                  <span className="text-[9px] text-white/40 hidden sm:block">{label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        ))}
      </AnimatedCard>

      {/* Overall */}
      <AnimatedCard className="glass-md rounded-2xl p-6 border border-white/8" delay={0.1}>
        <p className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Star size={14} className="text-amber-400" /> Penilaian Keseluruhan
        </p>
        <div className="flex gap-3">
          {[1,2,3,4,5].map(n => (
            <motion.button key={n} type="button"
              whileHover={{ scale:1.15 }} whileTap={{ scale:0.85 }}
              onClick={() => setOverall(n)}
              className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl border transition-all duration-200
                ${n <= overall
                  ? 'bg-amber-500/25 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                  : 'glass border-white/10 hover:border-amber-500/30'}`}
            >
              <Star size={18} className={n <= overall ? 'text-amber-400 fill-amber-400' : 'text-white/30'} />
            </motion.button>
          ))}
          {overall > 0 && (
            <span className="self-center text-xs text-amber-400 font-semibold ml-2">
              {['','Sangat Buruk','Buruk','Cukup','Baik','Sangat Baik'][overall]}
            </span>
          )}
        </div>
      </AnimatedCard>

      {/* Saran */}
      <AnimatedCard className="glass-md rounded-2xl p-6 border border-white/8" delay={0.15}>
        <label className="input-label">Saran / Masukan (opsional)</label>
        <textarea className="input-field resize-none" rows={3}
          placeholder="Tuliskan saran atau masukan Anda untuk layanan kami..."
          value={saran} onChange={e => setSaran(e.target.value)} />
      </AnimatedCard>

      <motion.button onClick={handleSubmit} disabled={loading || !allFilled}
        className="btn-primary w-full py-3"
        whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
      >
        {loading
          ? <><motion.span animate={{ rotate:360 }} transition={{ duration:1, repeat:Infinity, ease:'linear' }}
              className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> Mengirim...</>
          : <><Send size={16} /> Kirim Penilaian</>}
      </motion.button>
    </div>
  )
}
