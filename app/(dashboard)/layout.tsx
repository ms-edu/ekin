import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase-server'
import BottomNav from '@/components/BottomNav'
import TopBar from '@/components/TopBar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  const { data: userProfile } = await supabase
    .from('users')
    .select('nama, jabatan')
    .eq('id', session.user.id)
    .single()

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <TopBar 
        userEmail={session.user.email || ''} 
        userName={userProfile?.nama}
      />
      <main className="flex-1 pb-24 px-4 pt-4 max-w-2xl mx-auto w-full">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
