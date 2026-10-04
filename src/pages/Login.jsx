import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogIn, Eye, EyeOff, Lock, User, Sparkles, Sun, Moon, Monitor } from 'lucide-react'
import Lottie from 'lottie-react'
import Background3D from '../components/three/Background3D'
import { useAuthStore } from '../store/authStore'
import { Turnstile } from '@marsidev/react-turnstile'

// Inline minimal Lottie JSON (wave animation) — replaced by real file in /public
const fallbackLottie = {
  v: '5.5.7', fr: 30, ip: 0, op: 60, w: 200, h: 200,
  layers: [],
}

export default function Login() {
  const navigate = useNavigate()
  const { login, isLoading, error, isLoggedIn } = useAuthStore()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [lottieData, setLottieData] = useState(null)
  const [captchaToken, setCaptchaToken] = useState(null)
  
  // Theme toggle state (UI only for now)
  const [theme, setTheme] = useState('dark')

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn()) navigate('/home', { replace: true })
  }, [])

  // Load statistik lottie
  useEffect(() => {
    fetch('/assets/statistik.json')
      .then(r => r.json())
      .then(setLottieData)
      .catch(() => setLottieData(fallbackLottie))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username.trim() || !password) return
    const ok = await login(username.trim(), password)
    if (ok) navigate('/home', { replace: true })
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      <Background3D />

      {/* Ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md flex flex-col items-center gap-4 lg:gap-5">
        
        {/* Top: Branding */}
        <motion.div
          className="flex flex-col items-center text-center gap-1.5"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="text-5xl font-display font-black text-gradient mb-2">SANTIK</h1>
          <p className="text-white/80 text-lg font-medium">Sistem Antrian Statistik</p>
          <p className="text-white/50 text-sm">BPS Kabupaten Labuhanbatu Utara</p>
        </motion.div>

        {/* Bottom: Login form */}
        <motion.div
          className="gradient-border p-[1px] rounded-2xl w-full"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="glass-strong rounded-2xl p-5 sm:p-7">
            {/* Header Centered */}
            <div className="flex flex-col items-center text-center gap-2 mb-5">
              <div className="w-14 h-14 flex items-center justify-center mb-1">
                <img src="/assets/logo_bps.png" alt="Logo BPS" className="w-full h-full object-contain drop-shadow-md" />
              </div>
              <div>
                <h2 className="font-display font-bold text-white text-xl leading-none">Login Petugas</h2>
                <p className="text-white/40 text-xs mt-1.5">PST & PPID · BPS Labura</p>
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm flex items-center justify-center gap-2"
              >
                <span>❌</span> {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div>
                <label className="input-label text-center block mb-1">USERNAME</label>
                <div className="relative">
                  <input
                    id="login-username"
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Masukkan username"
                    required
                    className="input-field text-center px-10"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="input-label text-center block mb-1">PASSWORD</label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Masukkan password"
                    required
                    className="input-field text-center px-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  >
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Turnstile Captcha */}
              <div className="flex justify-center mt-2">
                <Turnstile
                  siteKey="1x00000000000000000000AA" // GANTI DENGAN SITEKEY CLOUDFLARE ASLI MILIKMU
                  onSuccess={(token) => setCaptchaToken(token)}
                  onError={() => setCaptchaToken(null)}
                  onExpire={() => setCaptchaToken(null)}
                  options={{ theme: 'dark' }}
                />
              </div>

              {/* Submit */}
              <motion.button
                id="login-submit"
                type="submit"
                disabled={isLoading || !captchaToken}
                className="btn-primary w-full py-3 mt-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                    />
                    Memverifikasi...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <LogIn size={16} /> Masuk
                  </span>
                )}
              </motion.button>
            </form>

            <p className="text-center text-[11px] text-white/20 mt-6">
              © {new Date().getFullYear()} TIM IPDS | SANTIK v2.0
            </p>
          </div>
        </motion.div>


      </div>
    </div>
  )
}
