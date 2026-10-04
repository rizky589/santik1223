import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { LogIn, Users, FileText, ClipboardList, Calendar, MapPin, Phone, Mail, Clock, Maximize, X } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import Background3D from '../components/three/Background3D'
import AccessibilityWidget from '../components/AccessibilityWidget'

const SITE_URL = 'https://santik1223.vercel.app/'

export default function Landing() {
  const navigate = useNavigate()
  const [qrOpen, setQrOpen] = useState(false)

  const services = [
    {
      title: 'Antrian',
      description: 'Sistem manajemen antrian pengunjung yang terintegrasi dan efisien.',
      icon: <Users size={24} className="text-brand-400" />
    },
    {
      title: 'Buku Tamu Digital',
      description: 'Pencatatan data pengunjung dan tujuan kedatangan secara digital.',
      icon: <FileText size={24} className="text-violet-400" />
    },
    {
      title: 'Survey',
      description: 'Fasilitas untuk memberikan feedback dan penilaian layanan (SKM).',
      icon: <ClipboardList size={24} className="text-cyan-400" />
    },
    {
      title: 'Jadwal Piket',
      description: 'Informasi jadwal petugas piket pelayanan PST & PPID.',
      icon: <Calendar size={24} className="text-emerald-400" />
    }
  ]

  const scrollToSection = (id) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

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
            <div className="flex items-left">
              <img src="/assets/logo_bps.png" alt="Logo BPS" className="h-6 md:h-7 w-auto object-contain -mr-1" />
              <span className="font-display font-bold text-xl text-gradient">SANTIK</span>
            </div>
            
            <div className="flex items-center gap-8">
            <div className="hidden md:flex items-center gap-8">
                <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-white/70 hover:text-white text-sm font-medium transition-colors cursor-pointer">
                  Beranda
                </button>
                <button onClick={() => scrollToSection('layanan')} className="text-white/70 hover:text-white text-sm font-medium transition-colors cursor-pointer">
                  Layanan
                </button>
                <button onClick={() => navigate('/buku-tamu')} className="text-white/70 hover:text-white text-sm font-medium transition-colors cursor-pointer">
                  Buku Tamu Digital
                </button>
                <button onClick={() => navigate('/ppid')} className="text-white/70 hover:text-white text-sm font-medium transition-colors cursor-pointer">
                  PPID (Informasi Publik)
                </button>
                <button onClick={() => navigate('/data-pengunjung')} className="text-white/70 hover:text-white text-sm font-medium transition-colors cursor-pointer">
                  Statistik Data Pengunjung
                </button>
                <button onClick={() => scrollToSection('kontak')} className="text-white/70 hover:text-white text-sm font-medium transition-colors cursor-pointer">
                  Kontak
                </button>
              </div>


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
      <div className="relative z-10 pt-16">
        
        {/* Hero Section */}
        <section className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center">
          <div className="max-w-3xl">
            <div className="flex items-center justify-center gap-6 mb-8">
              <img src="/assets/ppid.png" alt="PPID" className="h-16 md:h-20 object-contain" />
              <img src="/assets/pst2.png" alt="PST2" className="h-20 md:h-28 object-contain" />
            </div>
            
            <motion.div
              initial={{ opacity: 0, x: "-100vw" }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, type: "spring", bounce: 0.2 }}
            >
              <h1 className="text-5xl md:text-5xl font-display font-black mb-6">
                PeLayanan <span className="text-gradient">Statistik</span> Terpadu
              </h1>
              <p className="text-lg md:text-xl text-white/70 mb-10 max-w-2xl mx-auto">
                Sistem Antrian Statistik (SANTIK) memberikan kemudahan akses layanan PST dan PPID di BPS Kabupaten Labuhanbatu Utara.
                Di website ini Anda dapat menemukan berbagai layanan yang kami sediakan dan informasi kontak yang dapat dihubungi. #MelayaniDenganHati❤️
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                
              </div>
            </motion.div>
          </div>
        </section>

        {/* Layanan Section */}
        <section id="layanan" className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Layanan Kami</h2>
              <p className="text-white/60">Kami Siap Melayani dengan Profesional, Integritas, dan Amanah.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {services.map((service, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -5, boxShadow: "0 20px 40px rgba(0,0,0,0.4)", transition: { type: "spring", stiffness: 400, damping: 25 } }}
                  className="card cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6">
                    {service.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{service.title}</h3>
                  <p className="text-sm text-white/60 leading-relaxed">
                    {service.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Kontak Section */}
        <section id="kontak" className="py-20 px-4 bg-white/[0.02] border-t border-white/5">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-3xl md:text-4xl font-display font-bold mb-4"
              >
                Hubungi Kami
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-white/60"
              >
                Kunjungi atau hubungi kami untuk informasi lebih lanjut.
              </motion.p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card Alamat */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                whileHover={{ scale: 1.05, y: -5, boxShadow: "0 20px 40px rgba(0,0,0,0.4)", transition: { type: "spring", stiffness: 400, damping: 25 } }}
                className="glass-md p-6 rounded-2xl flex flex-col items-center text-center cursor-pointer"
              >
                <div className="w-14 h-14 rounded-full bg-brand-500/20 flex items-center justify-center mb-4 text-brand-400">
                  <MapPin size={28} />
                </div>
                <h4 className="font-bold text-lg mb-2">Alamat</h4>
                <p className="text-sm text-white/60">Jl. Lintas Sumatra<br/>Gunting Saga, Kualuh Selatan, Labura</p>
              </motion.div>

              {/* Card Jam */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                whileHover={{ scale: 1.05, y: -5, boxShadow: "0 20px 40px rgba(0,0,0,0.4)", transition: { type: "spring", stiffness: 400, damping: 25 } }}
                className="glass-md p-6 rounded-2xl flex flex-col items-center text-center cursor-pointer"
              >
                <div className="w-14 h-14 rounded-full bg-violet-500/20 flex items-center justify-center mb-4 text-violet-400">
                  <Clock size={28} />
                </div>
                <h4 className="font-bold text-lg mb1">Jam Layanan</h4>
                <p className="text-sm text-white/60"><br/>Senin (08.30 - 15.30)<br/>Jumat (08.30 - 16.00)</p>
              </motion.div>

              {/* Card Email */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                whileHover={{ scale: 1.05, y: -5, boxShadow: "0 20px 40px rgba(0,0,0,0.4)", transition: { type: "spring", stiffness: 400, damping: 25 } }}
                className="glass-md p-6 rounded-2xl flex flex-col items-center text-center cursor-pointer"
              >
                <div className="w-14 h-14 rounded-full bg-cyan-500/20 flex items-center justify-center mb-4 text-cyan-400">
                  <Mail size={28} />
                </div>
                <h4 className="font-bold text-lg mb-3">Email</h4>
                <p className="text-sm text-white/60">bps1223@bps.go.id<br/></p>
              </motion.div>

              {/* Card QR Code */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                whileHover={{ scale: 1.05, y: -5, boxShadow: "0 20px 40px rgba(0,0,0,0.4)", transition: { type: "spring", stiffness: 400, damping: 25 } }}
                className="bg-white p-6 rounded-2xl flex flex-col items-center text-center cursor-pointer justify-center gap-4 relative overflow-hidden"
                onClick={() => setQrOpen(true)}
              >
                <div className="bg-white p-2 rounded-xl">
                  <QRCodeSVG 
                    value={SITE_URL} 
                    size={110} 
                    bgColor={"#ffffff"}
                    fgColor={"#03346E"} // Biru BPS / dark blue
                    level={"Q"}
                  />
                </div>
                <div className="flex items-center gap-1.5 text-slate-500 font-medium bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 w-full justify-center hover:bg-slate-100 transition-colors">
                  <Maximize size={15} />
                  <span>Perbesar</span>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-6 text-center border-t border-white/10 bg-black/20">
          <p className="text-sm text-white/40">
            © {new Date().getFullYear()} TIM IPDS | BPS Kabupaten Labuhanbatu Utara
          </p>
        </footer>
      </div>

      {/* Aksesibilitas Widget */}
      <AccessibilityWidget />

      {/* Modal QR Code */}
      <AnimatePresence>
        {qrOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setQrOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white rounded-3xl p-8 sm:p-12 shadow-2xl flex flex-col items-center max-w-md w-full"
            >
              <button 
                onClick={() => setQrOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
              
              <div className="flex items-center gap-2 mb-8">
                <img src="/assets/logo_bps.png" alt="Logo" className="h-8 object-contain" />
                <h3 className="text-slate-800 font-display font-black text-2xl">SANTIK</h3>
              </div>
              
              <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 mb-6 w-full aspect-square flex items-center justify-center">
                <QRCodeSVG 
                  value={SITE_URL} 
                  size={250} 
                  bgColor={"#ffffff"}
                  fgColor={"#03346E"}
                  level={"Q"}
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
              
              <p className="text-slate-500 text-center font-medium">
                Scan QR Code untuk membuka aplikasi SANTIK di perangkat Anda.
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
