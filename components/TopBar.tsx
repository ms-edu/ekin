'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { LogOut } from 'lucide-react'
import toast from 'react-hot-toast'

interface TopBarProps {
  userEmail: string
  userName?: string
}

export default function TopBar({ userEmail, userName }: TopBarProps) {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    toast.success('Berhasil keluar')
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://i.imgur.com/dYwR4Jp.png"
              alt="Emes EduTech"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <span className="font-display font-bold text-primary-700 text-base leading-none">E-Kinerja</span>
            <p className="text-xs text-slate-400 leading-none mt-0.5 truncate max-w-[160px]">
              {userName || userEmail}
            </p>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-red-500 transition-all active:scale-95"
          title="Keluar"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
