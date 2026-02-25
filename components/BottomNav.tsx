'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ClipboardList, Calendar, CalendarX, Settings, FileText } from 'lucide-react'

const navItems = [
  { href: '/kegiatan', icon: ClipboardList, label: 'Kegiatan' },
  { href: '/jadwal', icon: Calendar, label: 'Jadwal' },
  { href: '/kaldik', icon: CalendarX, label: 'Kaldik' },
  { href: '/laporan', icon: FileText, label: 'Laporan' },
  { href: '/pengaturan', icon: Settings, label: 'Pengaturan' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md 
                    border-t border-slate-100 shadow-lg bottom-nav-safe">
      <div className="max-w-2xl mx-auto flex">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 
                         transition-all active:scale-95 relative ${
                active ? 'text-primary-600' : 'text-slate-400'
              }`}
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 
                                 bg-primary-600 rounded-full" />
              )}
              <Icon className={`w-5 h-5 transition-transform ${active ? 'scale-110' : ''}`} />
              <span className={`text-[10px] font-medium transition-all ${
                active ? 'text-primary-600' : 'text-slate-400'
              }`}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
