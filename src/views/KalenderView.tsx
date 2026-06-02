import React, { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { cn } from '../lib/utils'
import { ArrowLeft, ChevronLeft, ChevronRight, Calendar as CalIcon, Plus, Trash2, Clock, MapPin } from 'lucide-react'

interface KalenderViewProps {
  active: boolean
  isPc: boolean
  setActiveView: (view: string) => void
  showToast: (msg: string) => void
  onConfirm: (title: string, message: string, onConfirm: () => void) => void
}

interface CalendarNote {
  id: string
  dateString: string // YYYY-MM-DD
  text: string
  time: string
}

export const KalenderView: React.FC<KalenderViewProps> = (props) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState<CalendarNote[]>([])
  
  // Note Form State
  const [newNote, setNewNote] = useState('')
  const [newNoteTime, setNewNoteTime] = useState('08:00')

  useEffect(() => {
    if (props.active) {
      const stored = localStorage.getItem('alphaPro_calendar_notes')
      if (stored) {
        try {
          setNotes(JSON.parse(stored))
        } catch (e) {
          setNotes([])
        }
      } else {
        setNotes([])
      }
    }
  }, [props.active])

  const saveNotes = (list: CalendarNote[]) => {
    setNotes(list)
    localStorage.setItem('alphaPro_calendar_notes', JSON.stringify(list))
  }

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNote.trim()) return

    const item: CalendarNote = {
      id: 'note_' + Date.now(),
      dateString: selectedDateStr,
      text: newNote.trim().toUpperCase(),
      time: newNoteTime
    }

    const updated = [...notes, item].sort((a, b) => a.time.localeCompare(b.time))
    saveNotes(updated)
    props.showToast('CATATAN JADWAL BERHASIL DISIMPAN!')
    setNewNote('')
  }

  const handleDeleteNote = (id: string) => {
    const updated = notes.filter(n => n.id !== id)
    saveNotes(updated)
    props.showToast('CATATAN JADWAL DIHAPUS!')
  }

  // Monthly dates computation helper
  const renderCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const firstDayIndex = new Date(year, month, 1).getDay()
    const totalDays = new Date(year, month + 1, 0).getDate()

    // Pad first day offsets
    const daysArr = []
    
    // Day offsets from prev month
    const prevMonthTotalDays = new Date(year, month, 0).getDate()
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      daysArr.push({
        dayNum: prevMonthTotalDays - i,
        isCurrentMonth: false,
        fullDateStr: ''
      })
    }

    // Days for current month
    for (let d = 1; d <= totalDays; d++) {
      const mm = String(month + 1).padStart(2, '0')
      const dd = String(d).padStart(2, '0')
      const fullDateStr = `${year}-${mm}-${dd}`
      
      daysArr.push({
        dayNum: d,
        isCurrentMonth: true,
        fullDateStr
      })
    }

    return daysArr
  }

  const days = renderCalendarDays()
  const monthName = currentDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' })
  const selectedDateFriendly = new Date(selectedDateStr).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  // Filter notes on chosen date
  const selectedNotes = notes.filter(n => n.dateString === selectedDateStr)

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
            Kalender & Catatan Kerja
          </h3>
          <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
            Agenda Kegiatan & Memo Penting Toko
          </p>
        </div>
      </div>

      {/* Grid: Calendar + Date Notes */}
      <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 gap-6 pb-14">
        
        {/* Calendar Box (Left) */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 md:col-span-7 flex flex-col h-fit">
          {/* Calendar Header with controller */}
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-[11px] font-black text-white uppercase tracking-wider">
              {monthName}
            </h4>
            <div className="flex gap-2">
              <button
                onClick={handlePrevMonth}
                className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-750 flex items-center justify-center text-slate-400 active:scale-90"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={handleNextMonth}
                className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-750 flex items-center justify-center text-slate-400 active:scale-90"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 text-center text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2 py-1 bg-slate-950/20 border-y border-slate-850/50">
            {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((w, idx) => (
              <span key={idx}>{w}</span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5 text-center">
            {days.map((day, idx) => {
              const itemNotes = day.fullDateStr ? notes.filter(n => n.dateString === day.fullDateStr) : []
              const hasNotes = itemNotes.length > 0
              const isSelected = selectedDateStr === day.fullDateStr
              
              return (
                <button
                  key={idx}
                  disabled={!day.isCurrentMonth}
                  onClick={() => day.fullDateStr && setSelectedDateStr(day.fullDateStr)}
                  className={`aspect-square rounded-xl text-[10px] font-black flex flex-col items-center justify-center relative transition-all active:scale-90 focus:outline-none ${
                    !day.isCurrentMonth
                      ? 'text-slate-800 pointer-events-none'
                      : isSelected
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/10'
                      : 'bg-slate-950/40 border border-slate-850 hover:border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>{day.dayNum}</span>
                  {/* Notes indicator dot */}
                  {hasNotes && (
                    <span className={`w-1 h-1 rounded-full absolute bottom-1 ${
                      isSelected ? 'bg-white' : 'bg-blue-500'
                    }`} />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Schedule/Notes list (Right) */}
        <div className="md:col-span-5 flex flex-col overflow-hidden h-full">
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 mb-4 shrink-0">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <CalIcon size={12} className="text-blue-500" />
              <span>Agenda Tanggal {selectedDateFriendly}</span>
            </h4>

            {/* Note form block */}
            <form onSubmit={handleAddNote} className="flex gap-2">
              <input
                type="time"
                required
                value={newNoteTime}
                onChange={e => setNewNoteTime(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-300 font-extrabold text-[10px] focus:outline-none appearance-none"
              />
              <input
                type="text"
                required
                placeholder="Rapat, Shift Kasir, Target..."
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-1.5 text-[10px] text-white uppercase placeholder-slate-700 font-extrabold focus:outline-none"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl text-[10px] uppercase shadow-lg shadow-blue-600/10 transition-all active:scale-95 shrink-0"
              >
                Simpan
              </button>
            </form>
          </div>

          {/* Notes display */}
          <div className="flex-1 bg-slate-900/10 border border-slate-805 rounded-2xl overflow-hidden flex flex-col min-h-0">
            <div className="p-3.5 bg-slate-950/40 border-b border-slate-800/60 font-black text-[8px] uppercase tracking-wider text-slate-505 select-none text-left">
              Kegiatan Terjadwal
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40 pr-1 hide-scrollbar">
              {selectedNotes.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 py-10 text-center gap-1">
                  <Clock size={16} className="text-slate-755" />
                  <p className="text-[9px] font-bold uppercase tracking-wider">Belum ada agenda kegiatan</p>
                </div>
              ) : (
                selectedNotes.map(note => (
                  <div key={note.id} className="p-3.5 flex items-center justify-between gap-3 text-left">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-1 text-blue-400">
                        <Clock size={10} />
                        <span className="text-[9px] font-black tracking-wider leading-none font-mono">{note.time} WIB</span>
                      </div>
                      <p className="text-xs font-black text-white leading-tight uppercase break-words">{note.text}</p>
                    </div>

                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="w-7 h-7 rounded-lg bg-red-950/30 border border-red-900/30 hover:bg-red-900/45 text-red-400 hover:text-red-300 flex items-center justify-center transition-all active:scale-95 shrink-0"
                      title="Hapus Agenda"
                    >
                      <Trash2 size={12} />
                    </button>
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

export default KalenderView
