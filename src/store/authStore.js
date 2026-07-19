import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../lib/supabase'

// Simple SHA-256 using SubtleCrypto (no npm dep)
async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      role: null,
      isLoading: false,
      error: null,
      antrianId: null,

      login: async (username, password) => {
        set({ isLoading: true, error: null })
        try {
          const hashed = await sha256(password)
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .eq('password', hashed)
            .single()

          if (error || !data) {
            set({ isLoading: false, error: 'Username atau password salah.' })
            return false
          }

          set({ user: data.username, role: data.role, isLoading: false, error: null })
          return true
        } catch (e) {
          set({ isLoading: false, error: 'Terjadi kesalahan koneksi.' })
          return false
        }
      },

      logout: () => {
        set({ user: null, role: null, antrianId: null })
      },

      setAntrianId: (id) => set({ antrianId: id }),

      isAdmin: () => get().role === 'admin',
      isLoggedIn: () => !!get().user,
    }),
    {
      name: 'santik-auth',
      partialize: (s) => ({ user: s.user, role: s.role }),
    }
  )
)
