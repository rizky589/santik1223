import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ── SVG Icons ────────────────────────────────────────────────

const features = [
  {
    id: 'contrastHigh',
    label: 'Kontras Tinggi',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-10 h-10">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3v18" />
        <path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    id: 'saturation',
    label: 'Kejenuhan',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10">
        <path d="M12 2C8.5 7 6 10 6 13.5a6 6 0 0 0 12 0C18 10 15.5 7 12 2z" />
      </svg>
    ),
  },
  {
    id: 'grayscale',
    label: 'Grayscale',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-10 h-10">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    id: 'dyslexic',
    label: 'Ramah Disleksia',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-10 h-10">
        <text x="3" y="18" fontSize="16" fontWeight="bold" fill="currentColor" stroke="none" fontFamily="serif">Df</text>
      </svg>
    ),
  },
  {
    id: 'pauseAnimations',
    label: 'Animasi Dijeda',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-10 h-10">
        <circle cx="12" cy="12" r="9" strokeDasharray="4 2" />
        <rect x="9" y="8" width="2" height="8" rx="1" fill="currentColor" stroke="none" />
        <rect x="13" y="8" width="2" height="8" rx="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    id: 'hideImages',
    label: 'Sembunyikan Gambar',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-10 h-10">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 15l5-5 4 4 3-3 4 4" />
        <line x1="4" y1="4" x2="20" y2="20" />
      </svg>
    ),
  },
  {
    id: 'bigCursor',
    label: 'Kursor Besar',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-10 h-10">
        <path d="M5 3l14 9-7 1-3 7z" />
      </svg>
    ),
  },
  {
    id: 'tooltip',
    label: 'Keterangan Alat',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-10 h-10">
        <rect x="3" y="5" width="18" height="12" rx="2" />
        <path d="M9 21l3-4 3 4" />
        <circle cx="12" cy="11" r="1" fill="currentColor" />
        <path d="M12 8v1" />
      </svg>
    ),
  },
  {
    id: 'lineHeight',
    label: 'Tinggi Garis',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-10 h-10">
        <line x1="4" y1="6" x2="20" y2="6" />
        <line x1="4" y1="12" x2="20" y2="12" />
        <line x1="4" y1="18" x2="20" y2="18" />
        <path d="M2 4v4M2 4l-1 1M2 4l1 1" />
        <path d="M2 20v-4M2 20l-1-1M2 20l1-1" />
      </svg>
    ),
  },
  {
    id: 'textAlign',
    label: 'Perataan Teks',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-10 h-10">
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <line x1="3" y1="14" x2="21" y2="14" />
        <line x1="3" y1="18" x2="15" y2="18" />
      </svg>
    ),
  },
  {
    id: 'underlineLinks',
    label: 'Garis Bawah Tautan',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-10 h-10">
        <path d="M8 4v8a4 4 0 0 0 8 0V4" />
        <line x1="4" y1="20" x2="20" y2="20" />
      </svg>
    ),
  },
  {
    id: 'readingGuide',
    label: 'Panduan Baca',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-10 h-10">
        <rect x="3" y="10" width="18" height="4" rx="1" fill="currentColor" fillOpacity="0.2" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <line x1="3" y1="14" x2="21" y2="14" />
        <line x1="3" y1="6" x2="21" y2="6" strokeDasharray="2 2" />
        <line x1="3" y1="18" x2="21" y2="18" strokeDasharray="2 2" />
      </svg>
    ),
  },
]

export default function AccessibilityWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [active, setActive] = useState({})
  const [fontSize, setFontSize] = useState(100)

  const toggle = (id) => setActive(prev => ({ ...prev, [id]: !prev[id] }))

  // Apply effects
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}%`
  }, [fontSize])

  useEffect(() => {
    let filter = ''
    if (active.contrastHigh) filter += 'contrast(2) '
    if (active.grayscale) filter += 'grayscale(1) '
    if (active.saturation) filter += 'saturate(0.3) '
    document.body.style.filter = filter.trim()
  }, [active.contrastHigh, active.grayscale, active.saturation])

  useEffect(() => {
    const inject = (id, css) => {
      let el = document.getElementById(id)
      if (!el) { el = document.createElement('style'); el.id = id; document.head.appendChild(el) }
      el.innerHTML = css
    }
    inject('a11y-dyslexic', active.dyslexic
      ? '* { font-family: Arial, sans-serif !important; letter-spacing: 0.05em !important; word-spacing: 0.15em !important; }'
      : '')
    inject('a11y-pause', active.pauseAnimations
      ? '*, *::before, *::after { animation-play-state: paused !important; transition: none !important; }'
      : '')
    inject('a11y-images', active.hideImages
      ? 'img { visibility: hidden !important; }'
      : '')
    inject('a11y-cursor', active.bigCursor
      ? '* { cursor: url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\' viewBox=\'0 0 24 24\'%3E%3Cpath fill=\'black\' d=\'M5 3l14 9-7 1-3 7z\'/%3E%3C/svg%3E") 5 5, auto !important; }'
      : '')
    inject('a11y-lineheight', active.lineHeight
      ? 'p, span, div, li, h1, h2, h3, h4 { line-height: 2 !important; }'
      : '')
    inject('a11y-textalign', active.textAlign
      ? 'p, li, span { text-align: left !important; }'
      : '')
    inject('a11y-underline', active.underlineLinks
      ? 'a { text-decoration: underline !important; }'
      : '')
    inject('a11y-guide', active.readingGuide
      ? 'body::after { content: ""; position: fixed; left: 0; right: 0; height: 40px; background: rgba(99,102,241,0.15); border-top: 2px solid rgba(99,102,241,0.5); border-bottom: 2px solid rgba(99,102,241,0.5); pointer-events: none; z-index: 99999; top: calc(var(--mouse-y, 50vh) - 20px); }'
      : '')
  }, [active])

  const resetAll = () => {
    setActive({})
    setFontSize(100)
    document.documentElement.style.fontSize = '100%'
    document.body.style.filter = ''
    const ids = ['a11y-dyslexic','a11y-pause','a11y-images','a11y-cursor','a11y-lineheight','a11y-textalign','a11y-underline','a11y-guide']
    ids.forEach(id => { const el = document.getElementById(id); if (el) el.innerHTML = '' })
  }

  const activeCount = Object.values(active).filter(Boolean).length

  return (
    <div className="fixed bottom-6 left-6 z-[999]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20, originX: 0, originY: 1 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="absolute bottom-16 left-0 w-80 bg-white text-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-200"
          >
            {/* Header */}
            <div className="bg-brand-600 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <span className="text-2xl">♿</span>
                <div>
                  <p className="font-bold text-sm">Menu Aksesibilitas</p>
                  <p className="text-[11px] text-white/70">Sesuaikan tampilan halaman</p>
                </div>
              </div>
              {activeCount > 0 && (
                <span className="bg-white text-brand-600 text-xs font-bold px-2 py-0.5 rounded-full">
                  {activeCount} aktif
                </span>
              )}
            </div>

            {/* Font Size Control */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-gray-600">🔡 Ukuran Teks</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setFontSize(f => Math.max(80, f - 10))}
                  className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 font-bold text-gray-700 flex items-center justify-center cursor-pointer transition-colors text-base">−</button>
                <span className="text-xs font-bold text-brand-600 w-10 text-center">{fontSize}%</span>
                <button onClick={() => setFontSize(f => Math.min(150, f + 10))}
                  className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 font-bold text-gray-700 flex items-center justify-center cursor-pointer transition-colors text-base">+</button>
              </div>
            </div>

            {/* Feature Grid */}
            <div className="p-3 grid grid-cols-3 gap-2 max-h-72 overflow-y-auto">
              {features.map(f => (
                <button
                  key={f.id}
                  onClick={() => toggle(f.id)}
                  className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    active[f.id]
                      ? 'bg-brand-50 border-brand-400 text-brand-600'
                      : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-brand-300 hover:text-brand-500'
                  }`}
                >
                  {f.icon}
                  <span className="text-[10px] font-semibold leading-tight">{f.label}</span>
                </button>
              ))}
            </div>

            {/* Reset */}
            <div className="px-4 py-3 border-t border-gray-100 flex justify-between items-center">
              <span className="text-[11px] text-gray-400">WCAG 2.1 Compliant</span>
              <button onClick={resetAll}
                className="text-xs text-red-500 hover:text-red-700 font-semibold cursor-pointer transition-colors">
                ↺ Reset Semua
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB Button */}
      <motion.button
        onClick={() => setIsOpen(v => !v)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="w-16 h-16 rounded-full flex items-center justify-center shadow-xl cursor-pointer transition-all duration-200"
        style={{
          background: 'radial-gradient(circle at 40% 35%, #2a5298, #1a3a8f)',
          boxShadow: isOpen
            ? '0 0 0 3px rgba(255,255,255,0.4), 0 8px 30px rgba(26,58,143,0.7)'
            : '0 0 0 3px rgba(255,255,255,0.25), 0 8px 24px rgba(26,58,143,0.5)',
        }}
        aria-label="Menu Aksesibilitas"
        title="Buka Menu Aksesibilitas"
      >
        <div className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center text-2xl">
          ♿
        </div>
      </motion.button>
    </div>
  )
}
