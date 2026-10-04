import { Outlet } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { LogIn, ArrowLeft } from 'lucide-react'
import Background3D from '../three/Background3D'
import AccessibilityWidget from '../AccessibilityWidget'
import { PageTransition } from '../animations/Motion'

export default function PublicLayout() {
  const navigate = useNavigate()

  return (
    <div className="relative min-h-screen bg-bg text-white overflow-x-hidden">
      <Background3D />

      {/* Ambient glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1 text-white/70 hover:text-white transition-colors cursor-pointer"
            >
              <img src="/assets/logo_bps.png" alt="Logo BPS" className="h-6 md:h-7 w-auto object-contain -mr-1" />
              <span className="font-display font-bold text-xl text-gradient">SANTIK</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="btn-secondary py-2 px-4 text-sm gap-2"
              >
                <ArrowLeft size={15} />
                Kembali
              </button>
              <button
                onClick={() => navigate('/login')}
                className="btn-primary py-2 px-4"
              >
                <LogIn size={16} /> Login
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 text-center border-t border-white/10 bg-black/20 relative z-10">
        <p className="text-sm text-white/40">
          © {new Date().getFullYear()} TIM IPDS | BPS Kabupaten Labuhanbatu Utara
        </p>
      </footer>

      <AccessibilityWidget />
    </div>
  )
}
