import React, { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { cn } from '../lib/utils'
import { ArrowLeft, Plus, Search, Trash2, Send, Phone, User, Tag, HelpCircle, FileText } from 'lucide-react'

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

  const handleCreateContact = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !phone.trim()) {
      props.showToast('HARAP LENGKAPI NAMA & NOMOR TELEPON!')
      return
    }

    // Standardize phone format (e.g. 08xx -> 628xx)
    let formattedPhone = phone.trim().replace(/[^0-9]/g, '')
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '62' + formattedPhone.slice(1)
    } else if (!formattedPhone.startsWith('62') && formattedPhone.length > 5) {
      formattedPhone = '62' + formattedPhone
    }

    const newContact: Contact = {
      id: 'contact_' + Date.now(),
      name: name.trim().toUpperCase(),
      phone: formattedPhone,
      tipe,
      keterangan: keterangan.trim() || '-',
      created_at: new Date().toISOString()
    }

    const updated = [newContact, ...contacts]
    saveList(updated)
    props.showToast('KONTAK BARU DISIMPAN!')

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
    <div className={cn(`flex-1 flex flex-col h-full overflow-hidden bg-slate-950 font-sans text-white ${props.isPc ? 'p-6' : 'p-4'}`, !props.active && 'hidden')}>
      {/* Top Bar */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800/80 shrink-0">
        <button
          onClick={() => props.setActiveView('view-beranda')}
          className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-90"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h3 className="font-extrabold text-[11px] text-blue-400 uppercase tracking-widest leading-none">
            Buku Kontak Pelanggan / Agen
          </h3>
          <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
            Daftar Kontak Cepat Relasi Toko
          </p>
        </div>
      </div>

      {/* Grid: Form + List */}
      <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-3 gap-6 pb-14">
        
        {/* Form Column */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 space-y-4 h-fit md:col-span-1">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Plus size={12} className="text-blue-500" />
            <span>Tambah Kontak Baru</span>
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
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white uppercase placeholder-slate-700 font-extrabold focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[8px] font-black text-slate-500 uppercase tracking-wider pl-1 block font-mono">No. HP / WhatsApp (Indonesia)</label>
              <div className="relative">
                <Phone size={14} className="absolute left-3.5 top-3 text-slate-600" />
                <input
                  type="tel"
                  required
                  placeholder="Contoh: 0812345678"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-700 font-bold focus:outline-none"
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
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-300 font-bold focus:outline-none appearance-none"
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
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-700 font-bold focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] tracking-widest uppercase rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/10 active:scale-95 transition-all"
            >
              <Plus size={13} className="stroke-[3]" />
              <span>Simpan Kontak</span>
            </button>
          </form>
        </div>

        {/* List Column */}
        <div className="md:col-span-2 flex flex-col overflow-hidden h-full">
          {/* Search Box */}
          <div className="relative mb-4 shrink-0">
            <Search size={16} className="absolute left-4 top-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Cari nama, no. HP, tag, maupun keterangan relasi..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-850 focus:border-blue-500 rounded-2xl pl-12 pr-4 py-3.5 text-xs uppercase font-extrabold focus:outline-none text-white placeholder-slate-600 shadow-md"
            />
          </div>

          {/* Directory Box */}
          <div className="flex-1 bg-slate-900/10 border border-slate-805 rounded-2xl overflow-hidden flex flex-col min-h-0">
            <div className="p-3.5 bg-slate-950/40 border-b border-slate-800/60 font-black text-[8px] uppercase tracking-wider text-slate-500 select-none flex justify-between">
              <span>Buku Telepon ({filteredContacts.length})</span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40 pr-1 hide-scrollbar">
              {filteredContacts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-1.5 py-10 text-center">
                  <User size={20} className="text-slate-700" />
                  <p className="text-[9px] font-bold uppercase tracking-wider">Tidak ada kontak ditemukan</p>
                </div>
              ) : (
                filteredContacts.map(contact => (
                  <div key={contact.id} className="p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-xs font-black text-white uppercase tracking-wider truncate">{contact.name}</span>
                        <span className={`text-[6px] px-1.5 py-0.5 rounded-md font-black tracking-widest shrink-0 ${
                          contact.tipe === 'PELANGGAN'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : contact.tipe === 'AGEN'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : contact.tipe === 'SALES'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        }`}>
                          {contact.tipe}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-400 tracking-wide">+{contact.phone}</p>
                      <p className="text-[8px] text-slate-500 font-bold uppercase mt-1 tracking-wider">
                        Ket: {contact.keterangan}
                      </p>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <a
                        href={`https://wa.me/${contact.phone}`}
                        target="_blank"
                        rel="noreferrer referrer"
                        className="w-7.5 h-7.5 rounded-lg bg-emerald-950/30 border border-emerald-900/30 hover:bg-emerald-900/35 text-emerald-400 flex items-center justify-center transition-all active:scale-90"
                        title="Kirim Pesan WA"
                      >
                        <Send size={13} />
                      </a>

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
