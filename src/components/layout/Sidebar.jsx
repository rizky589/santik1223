import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home, LayoutDashboard, ClipboardList, Bell, Monitor,
  BookOpen, Users, Calendar, FileText, SmilePlus,
  LogOut, ChevronRight, X, Shield, CalendarDays, UserCog,
  ArrowLeftRight, Trophy
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { cn } from '../../lib/utils'

const NAV = [
  { to: '/home',              icon: Home,           label: 'Beranda',           group: 'menu'    },
  { to: '/dashboard',         icon: LayoutDashboard, label: 'Dashboard',        group: 'antrian' },
  { to: '/input-antrian',     icon: ClipboardList,  label: 'Input Antrian',     group: 'antrian' },
  { to: '/panggil-antrian',   icon: Bell,           label: 'Panggil Antrian',   group: 'antrian' },
  { to: '/monitor-antrian',   icon: Monitor,        label: 'Monitor Antrian',   group: 'antrian' },
  { to: '/buku-tamu',         icon: BookOpen,       label: 'Buku Tamu',         group: 'layanan' },
  { to: '/data-pengunjung',   icon: Users,          label: 'Data Pengunjung',   group: 'layanan' },
  { to: '/presensi',          icon: Calendar,       label: 'Presensi',          group: 'layanan' },
  { to: '/jadwal-piket',      icon: CalendarDays,   label: 'Jadwal Piket',      group: 'layanan' },
  { to: '/laporan',           icon: FileText,       label: 'Laporan Antrian',   group: 'laporan' },
  { to: '/rekap-piket',       icon: Trophy,         label: 'Rekap & Leaderboard',group: 'laporan' },
  { to: '/survey',            icon: SmilePlus,      label: 'Survey Kepuasan',   group: 'laporan' },
  { to: '/manajemen-petugas', icon: UserCog,        label: 'Manajemen Petugas', group: 'admin', adminOnly: true },
]

const GROUPS = {
  menu:    'Menu Utama',
  antrian: 'Antrian',
  layanan: 'Layanan',
  laporan: 'Laporan',
  admin:   'Administrasi',
}

export default function Sidebar({ open, onClose }) {
  const { user, role, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Set default all groups to expanded
  const [expanded, setExpanded] = useState(
    Object.keys(GROUPS).reduce((acc, key) => ({ ...acc, [key]: true }), {})
  )

  const toggleGroup = (key) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }))

  const grouped = Object.entries(GROUPS).map(([key, label]) => ({
    key, label,
    items: NAV.filter(n => n.group === key && (!n.adminOnly || role === 'admin')),
  })).filter(g => g.items.length > 0)

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar panel */}
      <motion.aside
        className={cn(
          'fixed top-0 left-0 h-full z-50 flex flex-col',
          'glass border-r border-white/8 shadow-card',
          'w-[260px]',
          // Desktop: always visible
          'lg:translate-x-0',
        )}
        initial={false}
        animate={{ x: open ? 0 : (typeof window !== 'undefined' && window.innerWidth < 1024 ? -260 : 0) }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-1 py-1 border-b border-white/8">
          <div className="flex items-center gap-1">
            <div className="w-8 h-8 flex items-center justify-center">
              <img src="/assets/logo_bps.png" alt="Logo BPS" className="w-full h-full object-contain drop-shadow-md" />
            </div>
            <div>
              <p className="font-display font-bold text-white text-sm leading-none">SANTIK</p>
              <p className="text-[10px] text-white/40 mt-0.5">Sistem Antrian Statistik</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden btn-icon">
            <X size={16} />
          </button>
        </div>


        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin">
          {grouped.map(({ key, label, items }) => (
            <div key={key} className="mb-2">
              <button 
                onClick={() => toggleGroup(key)}
                className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-bold text-white/30 uppercase tracking-widest hover:text-white/60 transition-colors group"
              >
                <span>{label}</span>
                <ChevronRight 
                  size={12} 
                  className={cn("transition-transform duration-200", expanded[key] ? "rotate-90" : "rotate-0")} 
                />
              </button>
              
              <AnimatePresence initial={false}>
                {expanded[key] && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-0.5 mt-1.5">
                      {items.map(({ to, icon: Icon, label: lbl }) => (
                        <NavLink key={to} to={to} onClick={onClose}
                          className={({ isActive }) => cn('nav-item', isActive && 'active')}
                        >
                          <Icon size={16} className="flex-shrink-0" />
                          <span className="flex-1 text-[13px]">{lbl}</span>
                        </NavLink>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-white/8">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
              text-red-400/80 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
          >
            <LogOut size={16} />
            <span>Keluar</span>
          </button>
        </div>
      </motion.aside>
    </>
  )
}
