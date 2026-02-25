'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Kegiatan, TUPOKSI_LIST } from '@/types'
import toast from 'react-hot-toast'
import { ChevronDown } from 'lucide-react'

interface KegiatanFormProps {
  item: Kegiatan | null
  onSaved: () => void
  onCancel: () => void
}

export default function KegiatanForm({ item, onSaved, onCancel }: KegiatanFormProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    tanggal: '',
    tupoksi: '',
    kegiatan: '',
    output: '',
    volume: '1',
    satuan: '',
    fullday: false,
  })

  useEffect(() => {
    if (item) {
      setForm({
        tanggal: item.tanggal.split('T')[0],
        tupoksi: item.tupoksi,
        kegiatan: item.kegiatan,
        output: item.output,
        volume: String(item.volume),
        satuan: item.satuan,
        fullday: item.fullday,
      })
    } else {
      const today = new Date().toISOString().split('T')[0]
      setForm(f => ({ ...f, tanggal: today }))
    }
  }, [item])

  const set = (field: string, value: string | boolean) =>
    setForm(prev => ({ ...prev, [field]: value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.tanggal || !form.tupoksi || !form.kegiatan || !form.output || !form.satuan) {
      return toast.error('Semua field wajib diisi')
    }

    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const payload = {
      tanggal: form.tanggal,
      tupoksi: form.tupoksi,
      kegiatan: form.kegiatan,
      output: form.output,
      volume: parseFloat(form.volume) || 1,
      satuan: form.satuan,
      fullday: form.fullday,
      user_id: user.id,
    }

    let error
    if (item) {
      ;({ error } = await supabase
        .from('kegiatan')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', item.id)
        .eq('user_id', user.id))
    } else {
      ;({ error } = await supabase.from('kegiatan').insert(payload))
    }

    setLoading(false)
    if (error) {
      toast.error('Gagal menyimpan: ' + error.message)
    } else {
      toast.success(item ? 'Kegiatan diperbarui' : 'Kegiatan disimpan')
      onSaved()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Tanggal */}
      <div>
        <label className="label">Tanggal</label>
        <input
          type="date"
          value={form.tanggal}
          onChange={e => set('tanggal', e.target.value)}
          className="input-field"
          required
        />
      </div>

      {/* Tupoksi */}
      <div>
        <label className="label">Tupoksi</label>
        <div className="relative">
          <select
            value={form.tupoksi}
            onChange={e => set('tupoksi', e.target.value)}
            className="select-field pr-10"
            required
          >
            <option value="">Pilih Tupoksi</option>
            {TUPOKSI_LIST.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Kegiatan */}
      <div>
        <label className="label">Uraian Kegiatan</label>
        <textarea
          value={form.kegiatan}
          onChange={e => set('kegiatan', e.target.value)}
          placeholder="Deskripsikan kegiatan yang dilakukan..."
          className="input-field resize-none"
          rows={3}
          required
        />
      </div>

      {/* Output */}
      <div>
        <label className="label">Output / Hasil</label>
        <input
          type="text"
          value={form.output}
          onChange={e => set('output', e.target.value)}
          placeholder="Contoh: RPP Semester 1"
          className="input-field"
          required
        />
      </div>

      {/* Volume & Satuan */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Volume</label>
          <input
            type="number"
            value={form.volume}
            onChange={e => set('volume', e.target.value)}
            min="0"
            step="0.5"
            className="input-field"
            required
          />
        </div>
        <div>
          <label className="label">Satuan</label>
          <input
            type="text"
            value={form.satuan}
            onChange={e => set('satuan', e.target.value)}
            placeholder="Dokumen / JP / Keg"
            className="input-field"
            required
          />
        </div>
      </div>

      {/* Fullday */}
      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
        <div>
          <p className="text-sm font-medium text-slate-700">Kegiatan Fullday</p>
          <p className="text-xs text-slate-500 mt-0.5">Menggantikan jadwal reguler hari ini</p>
        </div>
        <button
          type="button"
          onClick={() => set('fullday', !form.fullday)}
          className={`w-12 h-6 rounded-full transition-all relative ${
            form.fullday ? 'bg-primary-600' : 'bg-slate-300'
          }`}
        >
          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            form.fullday ? 'translate-x-6' : 'translate-x-0.5'
          }`} />
        </button>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">
          Batal
        </button>
        <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
          {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
          {loading ? 'Menyimpan...' : item ? 'Perbarui' : 'Simpan'}
        </button>
      </div>
    </form>
  )
}
