'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { Kaldik } from '@/types'
import { formatTanggal } from '@/lib/utils'
import toast from 'react-hot-toast'
import { Plus, Trash2, CalendarX } from 'lucide-react'
import BottomSheet from '@/components/BottomSheet'
import EmptyState from '@/components/EmptyState'

export default function KaldikPage() {
  const supabase = createClient()
  const [items, setItems] = useState<Kaldik[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ tanggal: '', keterangan: '' })
  const [saving, setSaving] = useState(false)

  const loadData = useCallback(async () => {
    const { data } = await supabase
      .from('kaldik')
      .select('*')
      .order('tanggal')
    if (data) setItems(data)
    setLoading(false)
  }, [supabase])

  useEffect(() => { loadData() }, [loadData])

  async function handleDelete(id: string) {
    if (!confirm('Hapus tanggal libur ini?')) return
    const { error } = await supabase.from('kaldik').delete().eq('id', id)
    if (error) toast.error('Gagal menghapus')
    else {
      toast.success('Dihapus')
      setItems(prev => prev.filter(i => i.id !== id))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.tanggal) return toast.error('Tanggal wajib diisi')
    setSaving(true)
    const { error } = await supabase.from('kaldik').insert({
      tanggal: form.tanggal,
      keterangan: form.keterangan || null,
    })
    setSaving(false)
    if (error) {
      if (error.code === '23505') toast.error('Tanggal ini sudah ada')
      else toast.error('Gagal: ' + error.message)
    } else {
      toast.success('Tanggal libur ditambahkan')
      setShowForm(false)
      setForm({ tanggal: '', keterangan: '' })
      loadData()
    }
  }

  // Group by year-month
  const grouped: Record<string, Kaldik[]> = {}
  items.forEach(item => {
    const d = new Date(item.tanggal)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(item)
  })

  const BULAN = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']

  return (
    <div className="animate-fade-in">
      <div className="mb-4">
        <h1 className="section-title text-xl">Kalender Akademik</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {items.length} hari libur/khusus · tidak dihitung sebagai hari kerja
        </p>
      </div>

      {/* Info banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex gap-2">
        <CalendarX className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700">
          Tanggal di sini akan dilewati saat generate laporan. 
          Tambahkan hari libur nasional, libur sekolah, dll.
        </p>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="h-3 bg-slate-200 rounded w-1/3 mb-2" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<CalendarX className="w-12 h-12 text-slate-300" />}
          title="Belum ada tanggal libur"
          desc="Tambahkan hari libur atau tanggal khusus"
        />
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([monthKey, monthItems]) => {
            const [yr, mo] = monthKey.split('-')
            return (
              <div key={monthKey}>
                <div className="flex items-center gap-2 mb-2 px-1">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {BULAN[parseInt(mo) - 1]} {yr}
                  </span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>
                <div className="space-y-2">
                  {monthItems.map(item => (
                    <div key={item.id} className="card p-3.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-red-600">
                            {new Date(item.tanggal).getDate()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">
                            {formatTanggal(item.tanggal)}
                          </p>
                          {item.keterangan && (
                            <p className="text-xs text-slate-500">{item.keterangan}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 active:scale-95 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setShowForm(true)}
        className="fixed bottom-20 right-4 w-14 h-14 gradient-primary rounded-full shadow-xl
                   flex items-center justify-center active:scale-95 transition-all z-30"
      >
        <Plus className="w-6 h-6 text-white" />
      </button>

      {/* Form Sheet */}
      <BottomSheet
        open={showForm}
        onClose={() => setShowForm(false)}
        title="Tambah Tanggal Libur"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Tanggal</label>
            <input
              type="date"
              value={form.tanggal}
              onChange={e => setForm(f => ({ ...f, tanggal: e.target.value }))}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="label">Keterangan (opsional)</label>
            <input
              value={form.keterangan}
              onChange={e => setForm(f => ({ ...f, keterangan: e.target.value }))}
              placeholder="Contoh: Hari Raya Idul Fitri"
              className="input-field"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Batal</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </BottomSheet>
    </div>
  )
}
