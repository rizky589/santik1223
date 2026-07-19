import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Menu, Clock, ChevronDown } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { timeString, fullDateID } from '../../lib/utils'

export default function Navbar({ onMenuToggle }) {
  const { user, role } = useAuthStore()
  const [time, setTime] = useState(timeString())
  const [date, setDate] = useState(fullDateID())

  useEffect(() => {
    const t = setInterval(() => {
      setTime(timeString())
      setDate(fullDateID())
    }, 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <motion.header
      className="sticky top-0 z-30 glass border-b border-white/8 px-4 lg:px-6 py-3"
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Left: hamburger + brand (mobile) */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="lg:hidden btn-icon"
            aria-label="Toggle menu"
          >
            <Menu size={18} />
          </button>
          <div className="lg:hidden">
            <span className="text-sm font-display font-bold text-gradient">SANTIK</span>
          </div>
        </div>

        {/* Center: clock */}
        <div className="hidden sm:flex items-center gap-2 glass px-4 py-2 rounded-xl border border-white/8">
          <Clock size={14} className="text-brand-400" />
          <div className="text-center">
            <p className="text-xs font-bold text-white tabular-nums tracking-widest">{time}</p>
            <p className="text-[10px] text-white/40">{date}</p>
          </div>
        </div>

        {/* Right: user pill */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 glass px-3 py-2 rounded-xl border border-white/8 cursor-default">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-brand-400 to-violet-500 flex items-center justify-center text-[10px] font-bold text-white">
              {user?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="text-right leading-none">
              <p className="text-xs font-semibold text-white">{user || 'User'}</p>
              <p className="text-[10px] text-white/40 capitalize">{role}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  )
}
