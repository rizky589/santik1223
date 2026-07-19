import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import Background3D from '../three/Background3D'
import { PageTransition } from '../animations/Motion'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen flex">
      <Background3D />

      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:ml-[260px] min-w-0">
        <Navbar onMenuToggle={() => setSidebarOpen(v => !v)} />
        <main className="flex-1 p-4 lg:p-6">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
        <footer className="text-center text-[11px] text-white/20 py-3 border-t border-white/5">
          © {new Date().getFullYear()} TIM IPDS | SANTIK v2.0
        </footer>
      </div>
    </div>
  )
}
