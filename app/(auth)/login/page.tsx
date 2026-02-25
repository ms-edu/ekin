'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { BookOpen, Mail, Lock, Eye, EyeOff, ArrowRight, KeyRound } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [magicSent, setMagicSent] = useState(false)

  async function handleLogin() {
    if (!email || !password) return toast.error('Email dan password wajib diisi')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      toast.error('Email atau password salah')
    } else {
      toast.success('Selamat datang!')
      router.push('/kegiatan')
      router.refresh()
    }
  }

  async function handleRegister() {
    if (!email || !password) return toast.error('Email dan password wajib diisi')
    if (password.length < 6) return toast.error('Password minimal 6 karakter')
    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    setLoading(false)
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Akun dibuat! Silakan cek email untuk verifikasi.')
      setMode('login')
    }
  }

  async function handleForgot() {
    if (!email) return toast.error('Masukkan email Anda')
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)
    if (error) {
      toast.error(error.message)
    } else {
      setMagicSent(true)
      toast.success('Link reset password telah dikirim!')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (mode === 'login') handleLogin()
    else if (mode === 'register') handleRegister()
    else handleForgot()
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute top-1/4 -left-20 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute bottom-20 right-10 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>

      {/* Header */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 pt-16">
        {/* Logo */}
        <div className="mb-8 text-center animate-slide-up">
          <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-sm border border-white/20 
                         flex items-center justify-center mx-auto mb-4 shadow-xl">
            <img src="https://i.imgur.com/dYwR4Jp.png" alt="Emes EduTech" className="w-full h-full object-contain" />
          </div>
          <h1 className="font-display text-3xl font-bold text-white tracking-wide">E-Kinerja</h1>
          <p className="text-primary-200 text-sm mt-1">Laporan Kinerja Harian Guru</p>
          <p className="text-primary-300 text-xs mt-1">Kementerian Agama RI</p>
        </div>

        {/* Card */}
        <div className="w-full max-w-sm animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="bg-white rounded-3xl shadow-2xl p-7">
            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              {(['login', 'register'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                    mode === m
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {m === 'login' ? 'Masuk' : 'Daftar'}
                </button>
              ))}
            </div>

            {magicSent ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="font-semibold text-slate-800 mb-2">Cek Email Anda</h3>
                <p className="text-slate-500 text-sm">
                  Link reset password telah dikirim ke <strong>{email}</strong>
                </p>
                <button
                  onClick={() => { setMagicSent(false); setMode('login') }}
                  className="mt-4 text-primary-600 text-sm font-medium"
                >
                  Kembali ke Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div>
                  <label className="label">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="guru@example.com"
                      className="input-field pl-10"
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                {/* Password */}
                {mode !== 'forgot' && (
                  <div>
                    <label className="label">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type={showPass ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="input-field pl-10 pr-10"
                        required
                        minLength={6}
                        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                      >
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Forgot link */}
                {mode === 'login' && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-xs text-primary-600 font-medium"
                    >
                      Lupa password?
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? (
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : mode === 'forgot' ? (
                    <>
                      <KeyRound className="w-4 h-4" />
                      Kirim Link Reset
                    </>
                  ) : (
                    <>
                      {mode === 'login' ? 'Masuk' : 'Buat Akun'}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {mode === 'forgot' && (
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="w-full text-center text-sm text-slate-500"
                  >
                    ← Kembali ke Login
                  </button>
                )}
              </form>
            )}
          </div>
        </div>

        <p className="text-primary-300/60 text-xs mt-8">
          © {new Date().getFullYear()} E-Kinerja Guru
        </p>
      </div>
    </div>
  )
}
