'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { Jadwal, TUPOKSI_LIST } from '@/types'
import { hariToString } from '@/lib/utils'
import toast from 'react-hot-toast'
import { Plus, Edit2, Trash2, Calendar, ChevronDown } from 'lucide-react'
import BottomSheet from '@/components/BottomSheet'
import EmptyState from '@/components/EmptyState'

const HARI_KERJA = [1, 2, 3, 4, 5] // Senin-Jumat

export default function JadwalPage() {
  const supabase = createClient()
  const [items, setItems] = useState<Jadwal[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<Jadwal | null>(null)
  const [form, setForm] = useState({
    hari: '1',
    tupoksi: '',
    kegiatan: '',
    output: '',
    volume: '1',
    satuan: '',
  })
  const [saving, setSaving] = useState(false)

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('jadwal')
      .select('*')
      .eq('user_id', user.id)
      .order('hari')
    if (data) setItems(data)
    setLoading(false)
  }, [supabase])

  useEffect(() => { loadData() }, [loadData])

  function handleNew() {
    setEditItem(null)
    setForm({ hari: '1', tupoksi: '', kegiatan: '', output: '', volume: '1', satuan: '' })
    setShowForm(true)
  }

  function handleEdit(item: Jadwal) {
    setEditItem(item)
    setForm({
      hari: String(item.hari),
      tupoksi: item.tupoksi,
      kegiatan: item.kegiatan,
      output: item.output,
      volume: String(item.volume),
      satuan: item.satuan,
    })
    setShowForm(true)
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus jadwal ini?')) return
    const { error } = await supabase.from('jadwal').delete().eq('id', id)
    if (error) toast.error('Gagal menghapus')
    else {
      toast.success('Jadwal dihapus')
      setItems(prev => prev.filter(i => i.id !== id))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.tupoksi || !form.kegiatan || !form.output || !form.satuan) {
      return toast.error('Semua field wajib diisi')
    }
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const payload = {
      hari: parseInt(form.hari),
      tupoksi: form.tupoksi,
      kegiatan: form.kegiatan,
      output: form.output,
      volume: parseFloat(form.volume) || 1,
      satuan: form.satuan,
      user_id: user.id,
    }

    let error
    if (editItem) {
      ;({ error } = await supabase.from('jadwal').update(payload).eq('id', editItem.id))
    } else {
      ;({ error } = await supabase.from('jadwal').insert(payload))
    }

    setSaving(false)
    if (error) toast.error('Gagal: ' + error.message)
    else {
      toast.success(editItem ? 'Jadwal diperbarui' : 'Jadwal ditambahkan')
      setShowForm(false)
      loadData()
    }
  }

  // Group by hari
  const grouped: Record<number, Jadwal[]> = {}
  items.forEach(item => {
    if (!grouped[item.hari]) grouped[item.hari] = []
    grouped[item.hari].push(item)
  })

  return (
    <div className="animate-fade-in">
      <div className="mb-4">
        <h1 className="section-title text-xl">Jadwal Mingguan</h1>
        <p className="text-xs text-slate-500 mt-0.5">Template kegiatan per hari kerja</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/4 mb-3" />
              <div className="h-3 bg-slate-100 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Calendar className="w-12 h-12 text-slate-300" />}
          title="Belum ada jadwal"
          desc="Tambahkan template kegiatan per hari"
        />
      ) : (
        <div className="space-y-4">
          {HARI_KERJA.map(hari => {
            const hariItems = grouped[hari] || []
            if (hariItems.length === 0) return null
            return (
              <div key={hari}>
                <div className="flex items-center gap-2 mb-2 px-1">
                  <div className="w-6 h-6 rounded-lg bg-primary-100 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary-700">{hari}</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-700">{hariToString(hari)}</span>
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-xs text-slate-400">{hariItems.length} kegiatan</span>
                </div>
                <div className="space-y-2">
                  {hariItems.map(item => (
                    <div key={item.id} className="card p-3.5 flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{item.kegiatan}</p>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{item.tupoksi}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Output: {item.output} · {item.volume} {item.satuan}
                        </p>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100 active:scale-95 transition-all"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 active:scale-95 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
        onClick={handleNew}
        className="fixed bottom-20 right-4 w-14 h-14 gradient-primary rounded-full shadow-xl
                   flex items-center justify-center active:scale-95 transition-all z-30"
      >
        <Plus className="w-6 h-6 text-white" />
      </button>

      {/* Form Sheet */}
      <BottomSheet
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editItem ? 'Edit Jadwal' : 'Tambah Jadwal'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Hari */}
          <div>
            <label className="label">Hari</label>
            <div className="relative">
              <select
                value={form.hari}
                onChange={e => setForm(f => ({ ...f, hari: e.target.value }))}
                className="select-field pr-10"
              >
                {HARI_KERJA.map(h => (
                  <option key={h} value={h}>{hariToString(h)}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Tupoksi */}
          <div>
            <label className="label">Tupoksi</label>
            <div className="relative">
              <select
                value={form.tupoksi}
                onChange={e => setForm(f => ({ ...f, tupoksi: e.target.value }))}
                className="select-field pr-10"
                required
              >
                <option value="">Pilih Tupoksi</option>
                {TUPOKSI_LIST.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="label">Kegiatan</label>
            <textarea
              value={form.kegiatan}
              onChange={e => setForm(f => ({ ...f, kegiatan: e.target.value }))}
              className="input-field resize-none"
              rows={2}
              required
            />
          </div>

          <div>
            <label className="label">Output</label>
            <input
              value={form.output}
              onChange={e => setForm(f => ({ ...f, output: e.target.value }))}
              className="input-field"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Volume</label>
              <input
                type="number"
                value={form.volume}
                onChange={e => setForm(f => ({ ...f, volume: e.target.value }))}
                className="input-field"
                min="0" step="0.5" required
              />
            </div>
            <div>
              <label className="label">Satuan</label>
              <input
                value={form.satuan}
                onChange={e => setForm(f => ({ ...f, satuan: e.target.value }))}
                placeholder="JP / Keg"
                className="input-field"
                required
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Batal</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {saving ? 'Menyimpan...' : editItem ? 'Perbarui' : 'Simpan'}
            </button>
          </div>
        </form>
      </BottomSheet>
    </div>
  )
}
