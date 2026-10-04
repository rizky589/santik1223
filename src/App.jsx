import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'

import Layout        from './components/layout/Layout'
import PublicLayout  from './components/layout/PublicLayout'
import Landing       from './pages/Landing'
import Login         from './pages/Login'
import Home          from './pages/Home'
import Dashboard     from './pages/Dashboard'
import InputAntrian      from './pages/InputAntrian'
import PanggilAntrian    from './pages/PanggilAntrian'
import MonitorAntrian    from './pages/MonitorAntrian'
import BukuTamu          from './pages/BukuTamu'
import DataPengunjung    from './pages/DataPengunjung'
import Presensi          from './pages/Presensi'
import Laporan           from './pages/Laporan'
import Survey            from './pages/Survey'
import JadwalPiket       from './pages/JadwalPiket'
import RekapPiket        from './pages/RekapPiket'
import ManajemenPetugas  from './pages/ManajemenPetugas'

// ── Protected route ───────────────────────────────────────────
function PrivateRoute({ children }) {
  const { isLoggedIn } = useAuthStore()
  return isLoggedIn() ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/"      element={<Landing />} />
        <Route path="/login" element={<Login />} />

        {/* Public pages – accessible without login */}
        <Route element={<PublicLayout />}>
          <Route path="/buku-tamu"       element={<BukuTamu />} />
          <Route path="/data-pengunjung" element={<DataPengunjung />} />
        </Route>

        {/* Protected – wrapped in sidebar+navbar Layout */}
        <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route path="/home"               element={<Home />} />
          <Route path="/dashboard"          element={<Dashboard />} />
          <Route path="/input-antrian"      element={<InputAntrian />} />
          <Route path="/panggil-antrian"    element={<PanggilAntrian />} />
          <Route path="/monitor-antrian"    element={<MonitorAntrian />} />
          <Route path="/presensi"           element={<Presensi />} />
          <Route path="/laporan"            element={<Laporan />} />
          <Route path="/rekap-piket"        element={<RekapPiket />} />
          <Route path="/survey"             element={<Survey />} />
          <Route path="/jadwal-piket"       element={<JadwalPiket />} />
          <Route path="/manajemen-petugas"  element={<ManajemenPetugas />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
