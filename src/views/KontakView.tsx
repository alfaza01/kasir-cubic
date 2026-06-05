import React, { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { cn } from '../lib/utils'
import { ArrowLeft, Plus, Search, Trash2, Send, Phone, User, Tag, HelpCircle, FileText, Copy } from 'lucide-react'

interface KontakViewProps {
  active: boolean
  isPc: boolean
  setActiveView: (view: string) => void
  kasirName: string
  showToast: (msg: string) => void
  onConfirm: (title: string, message: string, onConfirm: () => void) => void
  activeStoreId: string
}

interface Contact {
  id: string
  name: string
  phone: string
  tipe: 'PELANGGAN' | 'AGEN' | 'SALES' | 'LAINNYA'
  keterangan: string
  created_at: string
  kasirName?: string
}

export const KontakView: React.FC<KontakViewProps> = (props) => {
  const [contacts, setContacts] = useState<Contact[]>([])
  
  // Search State
  const [search, setSearch] = useState('')
  
  // Form State
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [tipe, setTipe] = useState<'PELANGGAN' | 'AGEN' | 'SALES' | 'LAINNYA'>('PELANGGAN')
  const [keterangan, setKeterangan] = useState('')
  const [editingContactId, setEditingContactId] = useState<string | null>(null)

  useEffect(() => {
    if (props.active) {
      const stored = localStorage.getItem(`alphaPro_${props.activeStoreId}_kontak_list`)
      if (stored) {
        try {
          setContacts(JSON.parse(stored))
        } catch (e) {
          setContacts([])
        }
      } else {
        setContacts([])
      }
    }
  }, [props.active, props.activeStoreId])

  const saveList = (list: Contact[]) => {
    setContacts(list)
    localStorage.setItem(`alphaPro_${props.activeStoreId}_kontak_list`, JSON.stringify(list))
  }

  const handleEditClick = (contact: Contact) => {
    setEditingContactId(contact.id)
    setName(contact.name)
    setPhone(contact.phone)
    setTipe(contact.tipe)
    setKeterangan(contact.keterangan === '-' ? '' : contact.keterangan)
  }

  const handleCancelEdit = () => {
    setEditingContactId(null)
    setName('')
    setPhone('')
    setKeterangan('')
  }

  const handleCreateContact = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !phone.trim()) {
      props.showToast('HARAP LENGKAPI NAMA & NOMOR!')
      return
    }

    if (editingContactId) {
      const updated = contacts.map(c => {
        if (c.id === editingContactId) {
          return {
            ...c,
            name: name.trim().toUpperCase(),
            phone: phone.trim().replace(/[^0-9]/g, ''),
            tipe,
            keterangan: keterangan.trim() || '-',
            kasirName: props.kasirName
          }
        }
        return c
      })
      saveList(updated)
      props.showToast('KONTAK BERHASIL DIPERBARUI!')
      setEditingContactId(null)
    } else {
      const newContact: Contact = {
        id: 'contact_' + Date.now(),
        name: name.trim().toUpperCase(),
        phone: phone.trim().replace(/[^0-9]/g, ''),
        tipe,
        keterangan: keterangan.trim() || '-',
        created_at: new Date().toISOString(),
        kasirName: props.kasirName
      }
      const updated = [newContact, ...contacts]
      saveList(updated)
      props.showToast('KONTAK BARU DISIMPAN!')
    }

    // Reset Form
    setName('')
    setPhone('')
    setKeterangan('')
  }

  const handleDeleteContact = (id: string, contactName: string) => {
    props.onConfirm('HAPUS KONTAK', `Hapus kontak ${contactName}?`, () => {
      const updated = contacts.filter(c => c.id !== id)
      saveList(updated)
      props.showToast('KONTAK BERHASIL DIHAPUS!')
    })
  }

  // Filter contacts by search
  const filteredContacts = contacts.filter(contact => {
    const term = search.toLowerCase()
    return (
      contact.name.toLowerCase().includes(term) ||
      contact.phone.includes(term) ||
      contact.keterangan.toLowerCase().includes(term) ||
      contact.tipe.toLowerCase().includes(term)
    )
  })

  return (
    <div className={cn(`flex-1 flex flex-col bg-slate-50 font-sans text-slate-900 ${props.isPc ? 'h-full overflow-hidden p-6' : 'overflow-y-auto p-4 pb-24'}`, !props.active && 'hidden')}>
      {/* Top Bar */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200 shrink-0">
        <button
          onClick={() => props.setActiveView('view-beranda')}
          className="w-9 h-9 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-500 hover:text-slate-700 shadow-sm transition-all active:scale-90"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h3 className="font-extrabold text-[11px] text-blue-600 uppercase tracking-widest leading-none">
            Buku Kontak Pelanggan / Agen
          </h3>
          <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
            Daftar Kontak Cepat Relasi Toko
          </p>
        </div>
      </div>

      {/* Grid: Form + List */}
      <div className={cn("flex-1 grid gap-6", props.isPc ? "grid-cols-3 overflow-hidden pb-14" : "grid-cols-1 pb-6")}>
        
        {/* Form Column */}
        <div className={cn("bg-white border border-slate-200 shadow-sm rounded-2xl p-5 space-y-4 h-fit", props.isPc && "col-span-1")}>
          <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-2">
            {editingContactId ? <i className="fa-solid fa-pen text-blue-500" /> : <Plus size={12} className="text-blue-500" />}
            <span>{editingContactId ? 'Edit Detail Kontak' : 'Tambah Kontak Baru'}</span>
          </h4>

          <form onSubmit={handleCreateContact} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[8px] font-black text-slate-500 uppercase tracking-wider pl-1 block font-mono">Nama Lengkap</label>
              <div className="relative">
                <User size={14} className="absolute left-3.5 top-3 text-slate-600" />
                <input
                  type="text"
                  required
                  placeholder="CONTOH: REHAN CELL / AMIR"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 uppercase placeholder-slate-400 font-extrabold focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[8px] font-black text-slate-500 uppercase tracking-wider pl-1 block font-mono">NO WA, NO PPOB, NO TOKEN</label>
              <div className="relative">
                <Phone size={14} className="absolute left-3.5 top-3 text-slate-600" />
                <input
                  type="text"
                  required
                  placeholder="Contoh: 0812345678 atau 32018273"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 font-bold focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[8px] font-black text-slate-500 uppercase tracking-wider pl-1 block font-mono">Tipe Kontak</label>
              <div className="relative">
                <Tag size={14} className="absolute left-3.5 top-3 text-slate-600" />
                <select
                  value={tipe}
                  onChange={e => setTipe(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 font-bold focus:outline-none appearance-none"
                >
                  <option value="PELANGGAN">PELANGGAN</option>
                  <option value="AGEN">AGEN / RESELLER</option>
                  <option value="SALES">SALES DISTRIBUTOR</option>
                  <option value="LAINNYA">LAIN-LAIN</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[8px] font-black text-slate-500 uppercase tracking-wider pl-1 block font-mono">Keterangan Tambahan</label>
              <div className="relative">
                <FileText size={14} className="absolute left-3.5 top-3 text-slate-600" />
                <input
                  type="text"
                  placeholder="Contoh: Toko sebelah / Langganan BRI"
                  value={keterangan}
                  onChange={e => setKeterangan(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 font-bold focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] tracking-widest uppercase rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/10 active:scale-95 transition-all"
              >
                {editingContactId ? <i className="fa-solid fa-check text-[11px]" /> : <Plus size={13} className="stroke-[3]" />}
                <span>{editingContactId ? 'Simpan' : 'Simpan Kontak'}</span>
              </button>
              {editingContactId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-[10px] tracking-widest uppercase rounded-xl active:scale-95 transition-all"
                >
                  Batal
                </button>
              )}
            </div>
          </form>
        </div>

        {/* List Column */}
        <div className={cn("flex flex-col", props.isPc ? "col-span-2 overflow-hidden h-full" : "h-auto")}>
          {/* Search Box */}
          <div className="relative mb-4 shrink-0">
            <Search size={16} className="absolute left-4 top-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Cari nama, no. HP, tag, maupun keterangan relasi..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-2xl pl-12 pr-4 py-3.5 text-xs uppercase font-extrabold focus:outline-none text-slate-800 placeholder-slate-400 shadow-sm"
            />
          </div>

          {/* Directory Box */}
          <div className={cn("bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden flex flex-col", props.isPc ? "flex-1 min-h-0" : "h-[400px]")}>
            <div className="p-3.5 bg-slate-50/50 border-b border-slate-100 font-black text-[8px] uppercase tracking-wider text-slate-500 select-none flex justify-between">
              <span>Buku Telepon ({filteredContacts.length})</span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 pr-1 hide-scrollbar">
              {filteredContacts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-1.5 py-10 text-center">
                  <User size={20} className="text-slate-300" />
                  <p className="text-[9px] font-bold uppercase tracking-wider">Tidak ada kontak ditemukan</p>
                </div>
              ) : (
                filteredContacts.map(contact => (
                  <div key={contact.id} className={cn("p-4 flex gap-3", props.isPc ? "items-center justify-between" : "flex-col items-start")}>
                    <div className="min-w-0 flex-1 w-full text-left">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-xs font-black text-slate-800 uppercase tracking-wider break-words">{contact.name}</span>
                        <span className={`text-[6px] px-1.5 py-0.5 rounded-md font-black tracking-widest shrink-0 ${
                          contact.tipe === 'PELANGGAN'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : contact.tipe === 'AGEN'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-550/20'
                            : contact.tipe === 'SALES'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        }`}>
                          {contact.tipe}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs font-extrabold text-blue-500 tracking-wide">NO: {contact.phone}</p>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(contact.phone);
                            props.showToast('NOMOR HP BERHASIL DISALIN!');
                          }}
                          className="w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-sm border border-blue-100"
                          title="Salin Nomor"
                        >
                          <Copy size={15} className="stroke-[2.5]" />
                        </button>
                      </div>
                      <div className="text-[8px] text-slate-500 font-bold uppercase mt-1.5 tracking-wider space-y-0.5">
                        <div>📝 Ket: {contact.keterangan}</div>
                        {contact.kasirName && <div>👤 By: {contact.kasirName}</div>}
                      </div>
                    </div>

                    <div className={cn("flex gap-2 shrink-0", !props.isPc && "w-full justify-end pt-2 border-t border-slate-100")}>
                      <a
                        href={`https://wa.me/${contact.phone.startsWith('0') ? '62' + contact.phone.slice(1) : contact.phone}`}
                        target="_blank"
                        rel="noreferrer referrer"
                        className="w-7.5 h-7.5 rounded-lg bg-emerald-950/30 border border-emerald-900/30 hover:bg-emerald-900/35 text-emerald-400 flex items-center justify-center transition-all active:scale-90"
                        title="Kirim Pesan WA"
                      >
                        <Send size={13} />
                      </a>

                      <button
                        onClick={() => handleEditClick(contact)}
                        className="w-7.5 h-7.5 rounded-lg bg-blue-950/30 border border-blue-900/30 hover:bg-blue-900/35 text-blue-400 flex items-center justify-center transition-all active:scale-90"
                        title="Edit Kontak"
                      >
                        <i className="fa-solid fa-pen text-[10px]"></i>
                      </button>

                      <button
                        onClick={() => handleDeleteContact(contact.id, contact.name)}
                        className="w-7.5 h-7.5 rounded-lg bg-red-950/30 border border-red-900/30 hover:bg-red-900/40 text-red-400 hover:text-red-300 flex items-center justify-center transition-all active:scale-95"
                        title="Hapus"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}

export default KontakView
