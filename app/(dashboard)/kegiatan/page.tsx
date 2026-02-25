'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { Kegiatan, TUPOKSI_LIST } from '@/types'
import { formatTanggal, getNamaHari } from '@/lib/utils'
import toast from 'react-hot-toast'
import {
  Plus, Search, Edit2, Trash2, ChevronDown, ChevronUp,
  Calendar, Tag, FileText, Package, CheckCircle2, Circle,
  Filter, X, SlidersHorizontal
} from 'lucide-react'
import BottomSheet from '@/components/BottomSheet'
import KegiatanForm from '@/components/forms/KegiatanForm'
import EmptyState from '@/components/EmptyState'

export default function KegiatanPage() {
  const supabase = createClient()
  const [items, setItems] = useState<Kegiatan[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterTupoksi, setFilterTupoksi] = useState('')
  const [showFilter, setShowFilter] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<Kegiatan | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('kegiatan')
      .select('*')
      .eq('user_id', user.id)
      .order('tanggal', { ascending: false })

    if (!error && data) setItems(data)
    setLoading(false)
  }, [supabase])

  useEffect(() => { loadData() }, [loadData])

  async function handleDelete(id: string) {
    if (!confirm('Hapus kegiatan ini?')) return
    const { error } = await supabase.from('kegiatan').delete().eq('id', id)
    if (error) toast.error('Gagal menghapus')
    else {
      toast.success('Kegiatan dihapus')
      setItems(prev => prev.filter(i => i.id !== id))
    }
  }

  function handleEdit(item: Kegiatan) {
    setEditItem(item)
    setShowForm(true)
  }

  function handleNew() {
    setEditItem(null)
    setShowForm(true)
  }

  function handleSaved() {
    setShowForm(false)
    setEditItem(null)
    loadData()
  }

  const filtered = items.filter(item => {
    const matchSearch = !search || 
      item.kegiatan.toLowerCase().includes(search.toLowerCase()) ||
      item.tupoksi.toLowerCase().includes(search.toLowerCase()) ||
      item.output.toLowerCase().includes(search.toLowerCase())
    const matchTupoksi = !filterTupoksi || item.tupoksi === filterTupoksi
    return matchSearch && matchTupoksi
  })

  // Group by month
  const grouped: Record<string, Kegiatan[]> = {}
  filtered.forEach(item => {
    const d = new Date(item.tanggal)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(item)
  })

  const BULAN = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="mb-4">
        <h1 className="section-title text-xl">Kegiatan Harian</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {items.length} kegiatan tercatat
        </p>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari kegiatan..."
            className="input-field pl-9 pr-4"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-3.5 h-3.5 text-slate-400" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilter(!showFilter)}
          className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-all flex items-center gap-1.5 ${
            filterTupoksi 
              ? 'bg-primary-600 text-white border-primary-600' 
              : 'bg-white text-slate-600 border-slate-200'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          {filterTupoksi ? '1' : 'Filter'}
        </button>
      </div>

      {/* Filter drawer */}
      {showFilter && (
        <div className="card p-3 mb-4 animate-slide-up">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">Filter Tupoksi</span>
            {filterTupoksi && (
              <button onClick={() => setFilterTupoksi('')} className="text-xs text-red-500">
                Hapus Filter
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {TUPOKSI_LIST.map(t => (
              <button
                key={t}
                onClick={() => { setFilterTupoksi(t === filterTupoksi ? '' : t); setShowFilter(false) }}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                  filterTupoksi === t
                    ? 'bg-primary-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/3 mb-2" />
              <div className="h-3 bg-slate-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Calendar className="w-12 h-12 text-slate-300" />}
          title={search || filterTupoksi ? 'Tidak ada hasil' : 'Belum ada kegiatan'}
          desc={search || filterTupoksi ? 'Coba kata kunci lain' : 'Tap tombol + untuk menambah kegiatan'}
        />
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a)).map(([monthKey, monthItems]) => {
            const [yr, mo] = monthKey.split('-')
            return (
              <div key={monthKey}>
                <div className="flex items-center gap-2 mb-2 px-1">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {BULAN[parseInt(mo) - 1]} {yr}
                  </span>
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-xs text-slate-400">{monthItems.length}</span>
                </div>
                <div className="space-y-2">
                  {monthItems.map(item => {
                    const expanded = expandedId === item.id
                    return (
                      <div
                        key={item.id}
                        className="card overflow-hidden card-hover"
                      >
                        <div
                          className="p-4 cursor-pointer"
                          onClick={() => setExpandedId(expanded ? null : item.id)}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              {/* Tanggal + Fullday badge */}
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
                                  {getNamaHari(item.tanggal)}, {formatTanggal(item.tanggal)}
                                </span>
                                {item.fullday && (
                                  <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                                    Fullday
                                  </span>
                                )}
                              </div>
                              <p className="text-sm font-medium text-slate-800 truncate">
                                {item.kegiatan}
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5 truncate">
                                {item.tupoksi}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="font-mono text-sm font-semibold text-slate-700">
                                {item.volume} <span className="text-xs text-slate-400 font-normal">{item.satuan}</span>
                              </span>
                              {expanded 
                                ? <ChevronUp className="w-4 h-4 text-slate-400" />
                                : <ChevronDown className="w-4 h-4 text-slate-400" />
                              }
                            </div>
                          </div>
                        </div>

                        {/* Expanded details */}
                        {expanded && (
                          <div className="px-4 pb-4 pt-0 border-t border-slate-50 animate-slide-up">
                            <div className="bg-slate-50 rounded-xl p-3 mb-3 space-y-2">
                              <div className="flex gap-2">
                                <Tag className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-xs text-slate-400">Tupoksi</p>
                                  <p className="text-sm text-slate-700">{item.tupoksi}</p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <FileText className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-xs text-slate-400">Output</p>
                                  <p className="text-sm text-slate-700">{item.output}</p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Package className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-xs text-slate-400">Volume</p>
                                  <p className="text-sm text-slate-700">{item.volume} {item.satuan}</p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                {item.fullday 
                                  ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                                  : <Circle className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                                }
                                <p className="text-sm text-slate-700">
                                  {item.fullday ? 'Kegiatan Fullday' : 'Bukan Fullday'}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEdit(item)}
                                className="flex-1 btn-secondary py-2 flex items-center justify-center gap-1.5 text-xs"
                              >
                                <Edit2 className="w-3.5 h-3.5" /> Edit
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="flex-1 btn-danger py-2 flex items-center justify-center gap-1.5 text-xs"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Hapus
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
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
                   flex items-center justify-center active:scale-95 transition-all z-30
                   hover:shadow-2xl"
      >
        <Plus className="w-6 h-6 text-white" />
      </button>

      {/* Form Sheet */}
      <BottomSheet
        open={showForm}
        onClose={() => { setShowForm(false); setEditItem(null) }}
        title={editItem ? 'Edit Kegiatan' : 'Tambah Kegiatan'}
      >
        <KegiatanForm
          item={editItem}
          onSaved={handleSaved}
          onCancel={() => { setShowForm(false); setEditItem(null) }}
        />
      </BottomSheet>
    </div>
  )
}
