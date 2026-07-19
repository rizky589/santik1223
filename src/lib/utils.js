import { format, parseISO } from 'date-fns'
import { id } from 'date-fns/locale'

// ─── Date / Time ─────────────────────────────────────────────
export const WIB_OFFSET = 7 * 60 * 60 * 1000

export function nowWIB() {
  return new Date(Date.now() + WIB_OFFSET)
}

export function formatDate(date, fmt = 'dd MMMM yyyy') {
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, fmt, { locale: id })
  } catch { return '-' }
}

export function formatDateTime(date) {
  return formatDate(date, 'dd MMM yyyy, HH:mm')
}

export function todayString() {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`
}

export function timeString(date = new Date()) {
  return `${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}:${String(date.getSeconds()).padStart(2,'0')}`
}

export function fullDateID(date = new Date()) {
  const HARI = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu']
  const BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']
  return `${HARI[date.getDay()]}, ${date.getDate()} ${BULAN[date.getMonth()]} ${date.getFullYear()}`
}

// ─── Queue Number ────────────────────────────────────────────
export function padQueue(n) {
  return `PST-${String(n).padStart(3,'0')}`
}

// ─── Status helper ───────────────────────────────────────────
export const STATUS_CONFIG = {
  menunggu:  { label: 'Menunggu',  color: 'badge-warning',  dot: 'text-amber-400'  },
  melayani:  { label: 'Melayani',  color: 'badge-success',  dot: 'text-emerald-400' },
  selesai:   { label: 'Selesai',   color: 'badge-info',     dot: 'text-cyan-400'    },
  dilewati:  { label: 'Dilewati',  color: 'badge-danger',   dot: 'text-red-400'     },
  pause:     { label: 'Pause',     color: 'badge-default',  dot: 'text-white/40'    },
}

// ─── Attendance status ───────────────────────────────────────
export function getAttendanceStatus(jamPresensi, batasWaktu = '09:00') {
  if (!jamPresensi) return { status: 'Absen', menitTelat: 0 }
  const [jh, jm] = jamPresensi.split(':').map(Number)
  const [bh, bm] = batasWaktu.split(':').map(Number)
  const diff = (jh * 60 + jm) - (bh * 60 + bm)
  if (diff <= 0) return { status: 'Hadir', menitTelat: 0 }
  return { status: `Telat ${diff} menit`, menitTelat: diff }
}

// ─── Class merge helper ───────────────────────────────────────
export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

// ─── Truncate text ────────────────────────────────────────────
export function truncate(str, n = 30) {
  return str && str.length > n ? str.slice(0, n) + '…' : str
}

// ─── Debounce ─────────────────────────────────────────────────
export function debounce(fn, ms = 300) {
  let t
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms) }
}

// ─── PDF download helper ──────────────────────────────────────
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href    = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Months ID ───────────────────────────────────────────────
export const MONTHS_ID = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember'
]
