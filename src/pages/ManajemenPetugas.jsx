import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, UserPlus, Edit2, Trash2, RefreshCw, Shield,
  Eye, EyeOff, Key, CheckCircle2, X, Search
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { RevealText, AnimatedCard } from '../components/animations/Motion'
import { useToast } from '../hooks/useToast'
import { Toasts } from '../components/animations/Motion'
import { useNavigate } from 'react-router-dom'

// SHA-256 via SubtleCrypto (sama seperti authStore)
async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2,'0')).join('')
}

const INIT_FORM = { username: '', password: '', role: 'operator' }

export default function ManajemenPetugas() {
  const { role, user: currentUser } = useAuthStore()
  const navigate = useNavigate()
  const { toasts, toast, dismiss } = useToast()

  const [users,    setUsers]   = useState([])
  const [loading,  setLoading] = useState(true)
  const [search,   setSearch]  = useState('')
  const [showPass, setShowPass] = useState(false)
  const [modal,    setModal]   = useState(null) // null | 'add' | 'edit' | 'reset'
  const [selUser,  setSelUser] = useState(null)
  const [form,     setForm]    = useState(INIT_FORM)
  const [submitting, setSubmitting] = useState(false)

  // Guard: admin only
  useEffect(() => {
    if (role !== 'admin') { navigate('/home'); return }
    fetchUsers()
  }, [role])

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.from('users').select('id,username,role,created_at').order('created_at')
    if (error) toast.error('Gagal memuat data petugas.')
    setUsers(data || [])
    setLoading(false)
  }, [])

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  )

  // ── Tambah Petugas ────────────────────────────────────────────
  const handleAdd = async () => {
    if (!form.username.trim()) return toast.warning('Nama tidak boleh kosong.')
    if (form.password.length < 4) return toast.warning('Password minimal 4 karakter.')
    if (users.find(u => u.username.toLowerCase() === form.username.toLowerCase()))
      return toast.warning('Username sudah terdaftar.')

    setSubmitting(true)
    const hashed = await sha256(form.password)
    const { error } = await supabase.from('users').insert([{
      username: form.username.trim(), password: hashed, role: form.role
    }])
    if (error) { toast.error('Gagal menambah: ' + error.message); setSubmitting(false); return }
    toast.success(`Petugas "${form.username}" berhasil ditambahkan!`)
    setModal(null); setForm(INIT_FORM)
    fetchUsers()
    setSubmitting(false)
  }

  // ── Edit Role ─────────────────────────────────────────────────
  const handleEdit = async () => {
    if (!selUser) return
    setSubmitting(true)
    const { error } = await supabase.from('users').update({ role: form.role }).eq('id', selUser.id)
    if (error) { toast.error('Gagal mengubah: ' + error.message); setSubmitting(false); return }
    toast.success(`Role "${selUser.username}" diubah ke ${form.role}.`)
    setModal(null); fetchUsers()
    setSubmitting(false)
  }

  // ── Reset Password ────────────────────────────────────────────
  const handleReset = async () => {
    if (!form.password || form.password.length < 4) return toast.warning('Password baru minimal 4 karakter.')
    setSubmitting(true)
    const hashed = await sha256(form.password)
    const { error } = await supabase.from('users').update({ password: hashed }).eq('id', selUser.id)
    if (error) { toast.error('Gagal reset: ' + error.message); setSubmitting(false); return }
    toast.success(`Password "${selUser.username}" berhasil direset.`)
    setModal(null); setForm(INIT_FORM)
    setSubmitting(false)
  }

  // ── Hapus Petugas ─────────────────────────────────────────────
  const handleDelete = async (u) => {
    if (u.username === currentUser) return toast.warning('Tidak bisa menghapus akun sendiri.')
    if (!confirm(`Hapus petugas "${u.username}"? Tindakan ini tidak bisa dibatalkan.`)) return
    const { error } = await supabase.from('users').delete().eq('id', u.id)
    if (error) { toast.error('Gagal menghapus: ' + error.message); return }
    toast.success(`Petugas "${u.username}" dihapus.`)
    fetchUsers()
  }

  const openEdit = (u) => { setSelUser(u); setForm({ ...INIT_FORM, role: u.role }); setModal('edit') }
  const openReset = (u) => { setSelUser(u); setForm(INIT_FORM); setModal('reset') }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Toasts toasts={toasts} onDismiss={dismiss} />

      <RevealText>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center">
              <Users size={20} className="text-brand-400" />
            </div>
            <div>
              <h1 className="page-title">Manajemen Petugas</h1>
              <p className="page-subtitle">Kelola akun operator & admin PST/PPID</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchUsers} className="btn-icon"><RefreshCw size={14} /></button>
            <motion.button onClick={() => { setForm(INIT_FORM); setModal('add') }}
              className="btn-primary gap-2 text-sm"
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <UserPlus size={15} /> Tambah Petugas
            </motion.button>
          </div>
        </div>
      </RevealText>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
        <input className="input-field pl-9" placeholder="Cari nama atau role..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Total Petugas', value: users.length, color: 'text-brand-400', bg: 'bg-brand-500/10' },
          { label: 'Admin',         value: users.filter(u => u.role === 'admin').length,    color: 'text-amber-400',   bg: 'bg-amber-500/10'   },
          { label: 'Operator',      value: users.filter(u => u.role === 'operator').length, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        ].map(s => (
          <AnimatedCard key={s.label} className="stat-card py-4">
            <p className={`text-2xl font-display font-black ${s.color}`}>{s.value}</p>
            <p className="text-white/40 text-xs mt-1">{s.label}</p>
          </AnimatedCard>
        ))}
      </div>

      {/* Table */}
      <AnimatedCard className="glass-md rounded-2xl border border-white/[0.08] overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{[...Array(5)].map((_,i) => <div key={i} className="h-10 rounded-lg shimmer" />)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr><th>No</th><th>Nama Petugas</th><th>Role</th><th>Dibuat</th><th>Aksi</th></tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} className="text-center text-white/30 py-10">Tidak ada data</td></tr>
                ) : filtered.map((u, i) => (
                  <motion.tr key={u.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}>
                    <td className="text-white/40">{i + 1}</td>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-violet-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                          {u.username[0].toUpperCase()}
                        </div>
                        <span className="font-medium text-white text-sm">{u.username}</span>
                        {u.username === currentUser && (
                          <span className="badge badge-default text-[10px]">Anda</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={u.role === 'admin' ? 'badge badge-purple' : 'badge badge-info'}>
                        {u.role === 'admin' && <Shield size={9} className="mr-1" />}{u.role}
                      </span>
                    </td>
                    <td className="text-white/40 text-xs">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString('id-ID') : '-'}
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <motion.button onClick={() => openEdit(u)} whileTap={{ scale: 0.9 }}
                          className="btn-icon text-cyan-400 hover:bg-cyan-500/15" title="Edit Role">
                          <Edit2 size={13} />
                        </motion.button>
                        <motion.button onClick={() => openReset(u)} whileTap={{ scale: 0.9 }}
                          className="btn-icon text-amber-400 hover:bg-amber-500/15" title="Reset Password">
                          <Key size={13} />
                        </motion.button>
                        <motion.button onClick={() => handleDelete(u)} whileTap={{ scale: 0.9 }}
                          className="btn-icon text-red-400 hover:bg-red-500/15" title="Hapus">
                          <Trash2 size={13} />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AnimatedCard>

      {/* ── Modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {modal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/70" onClick={() => setModal(null)} />
            <motion.div className="relative glass-strong rounded-2xl border border-white/[0.12] p-6 w-full max-w-md shadow-glow"
              initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }}>

              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  {modal === 'add'   && <><UserPlus size={18} className="text-brand-400" /><h3 className="font-bold text-white">Tambah Petugas Baru</h3></>}
                  {modal === 'edit'  && <><Edit2    size={18} className="text-cyan-400"  /><h3 className="font-bold text-white">Edit Role — {selUser?.username}</h3></>}
                  {modal === 'reset' && <><Key      size={18} className="text-amber-400" /><h3 className="font-bold text-white">Reset Password — {selUser?.username}</h3></>}
                </div>
                <button onClick={() => setModal(null)} className="btn-icon text-white/50"><X size={16} /></button>
              </div>

              <div className="space-y-4">
                {/* Tambah: Nama + Password + Role */}
                {modal === 'add' && (
                  <>
                    <div>
                      <label className="input-label">Nama Lengkap</label>
                      <input className="input-field" placeholder="Nama petugas baru..." value={form.username}
                        onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
                    </div>
                    <div>
                      <label className="input-label">Password Awal</label>
                      <div className="relative">
                        <input className="input-field pr-10" type={showPass ? 'text' : 'password'}
                          placeholder="Minimal 4 karakter..." value={form.password}
                          onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                        <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                          onClick={() => setShowPass(s => !s)}>
                          {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="input-label">Role</label>
                      <div className="flex gap-2">
                        {['operator', 'admin'].map(r => (
                          <motion.button key={r} type="button" whileTap={{ scale: 0.96 }}
                            onClick={() => setForm(f => ({ ...f, role: r }))}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border capitalize transition-all
                              ${form.role === r
                                ? r === 'admin' ? 'bg-amber-500/25 border-amber-500/50 text-amber-300'
                                               : 'bg-brand-500/25 border-brand-500/50 text-brand-300'
                                : 'glass border-white/10 text-white/50'}`}>
                            {r === 'admin' && <Shield size={12} className="inline mr-1" />}{r}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                    <motion.button onClick={handleAdd} disabled={submitting}
                      className="btn-primary w-full py-3" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                      {submitting ? 'Menyimpan...' : <><UserPlus size={15} /> Tambah Petugas</>}
                    </motion.button>
                  </>
                )}

                {/* Edit Role */}
                {modal === 'edit' && (
                  <>
                    <div>
                      <label className="input-label">Role Baru</label>
                      <div className="flex gap-2">
                        {['operator', 'admin'].map(r => (
                          <motion.button key={r} type="button" whileTap={{ scale: 0.96 }}
                            onClick={() => setForm(f => ({ ...f, role: r }))}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border capitalize transition-all
                              ${form.role === r
                                ? r === 'admin' ? 'bg-amber-500/25 border-amber-500/50 text-amber-300'
                                               : 'bg-brand-500/25 border-brand-500/50 text-brand-300'
                                : 'glass border-white/10 text-white/50'}`}>
                            {r === 'admin' && <Shield size={12} className="inline mr-1" />}{r}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                    <motion.button onClick={handleEdit} disabled={submitting}
                      className="btn-primary w-full py-3" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                      {submitting ? 'Menyimpan...' : <><CheckCircle2 size={15} /> Simpan Perubahan</>}
                    </motion.button>
                  </>
                )}

                {/* Reset Password */}
                {modal === 'reset' && (
                  <>
                    <div>
                      <label className="input-label">Password Baru untuk {selUser?.username}</label>
                      <div className="relative">
                        <input className="input-field pr-10" type={showPass ? 'text' : 'password'}
                          placeholder="Minimal 4 karakter..." value={form.password}
                          onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                        <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                          onClick={() => setShowPass(s => !s)}>
                          {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                    <motion.button onClick={handleReset} disabled={submitting}
                      className="btn-warning w-full py-3" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                      {submitting ? 'Mereset...' : <><Key size={15} /> Reset Password</>}
                    </motion.button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
