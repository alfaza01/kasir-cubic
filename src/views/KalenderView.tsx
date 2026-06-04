import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'motion/react'
import { cn } from '../lib/utils'
import { ArrowLeft, ChevronLeft, ChevronRight, Calendar as CalIcon, Plus, Trash2, Clock, MapPin, Flag } from 'lucide-react'

// --- HOLIDAY DEFINITIONS ---
const ID_HOLIDAYS_FIXED: Record<string, { name: string, isCutiBersama: boolean }> = {
  '01-01': { name: 'Tahun Baru Masehi', isCutiBersama: false },
  '05-01': { name: 'Hari Buruh Internasional', isCutiBersama: false },
  '06-01': { name: 'Hari Lahir Pancasila', isCutiBersama: false },
  '08-17': { name: 'Hari Kemerdekaan RI', isCutiBersama: false },
  '12-25': { name: 'Hari Raya Natal', isCutiBersama: false },
  '12-24': { name: 'Cuti Bersama Natal', isCutiBersama: true },
};

// Based on ~2024 to ~2027 dynamic holidays (Estimates/Approximations for demo)
const ID_HOLIDAYS_DYNAMIC: Record<string, { name: string, isCutiBersama: boolean }> = {
  // 2026
  '2026-02-14': { name: 'Isra Mikraj Nabi Muhammad SAW', isCutiBersama: false },
  '2026-02-17': { name: 'Tahun Baru Imlek', isCutiBersama: false },
  '2026-03-20': { name: 'Hari Raya Nyepi', isCutiBersama: false },
  '2026-03-21': { name: 'Hari Raya Idul Fitri', isCutiBersama: false },
  '2026-03-22': { name: 'Hari Raya Idul Fitri', isCutiBersama: false },
  '2026-03-19': { name: 'Cuti Bersama Idul Fitri', isCutiBersama: true },
  '2026-03-23': { name: 'Cuti Bersama Idul Fitri', isCutiBersama: true },
  '2026-03-24': { name: 'Cuti Bersama Idul Fitri', isCutiBersama: true },
  '2026-04-03': { name: 'Wafat Isa Al Masih', isCutiBersama: false },
  '2026-05-14': { name: 'Kenaikan Isa Al Masih', isCutiBersama: false },
  '2026-05-31': { name: 'Hari Raya Waisak', isCutiBersama: false },
  '2026-06-01': { name: 'Cuti Bersama Waisak', isCutiBersama: true },
  '2026-05-27': { name: 'Hari Raya Idul Adha', isCutiBersama: false },
  '2026-06-16': { name: 'Tahun Baru Islam', isCutiBersama: false },
  '2026-08-25': { name: 'Maulid Nabi Muhammad SAW', isCutiBersama: false },

  // 2024
  '2024-02-08': { name: 'Isra Mikraj', isCutiBersama: false },
  '2024-02-10': { name: 'Tahun Baru Imlek', isCutiBersama: false },
  '2024-03-11': { name: 'Hari Suci Nyepi', isCutiBersama: false },
  '2024-03-29': { name: 'Wafat Yesus Kristus', isCutiBersama: false },
  '2024-04-10': { name: 'Hari Raya Idul Fitri', isCutiBersama: false },
  '2024-04-11': { name: 'Hari Raya Idul Fitri', isCutiBersama: false },
  '2024-05-09': { name: 'Kenaikan Yesus Kristus', isCutiBersama: false },
  '2024-05-23': { name: 'Hari Raya Waisak', isCutiBersama: false },
  '2024-06-17': { name: 'Hari Raya Idul Adha', isCutiBersama: false },
  '2024-07-07': { name: 'Tahun Baru Islam', isCutiBersama: false },
  '2024-09-16': { name: 'Maulid Nabi Muhammad', isCutiBersama: false },

  // 2025
  '2025-01-27': { name: 'Isra Mikraj Nabi Muhammad SAW', isCutiBersama: false },
  '2025-01-29': { name: 'Tahun Baru Imlek', isCutiBersama: false },
  '2025-03-29': { name: 'Hari Raya Nyepi', isCutiBersama: false },
  '2025-03-31': { name: 'Hari Raya Idul Fitri', isCutiBersama: false },
  '2025-04-01': { name: 'Hari Raya Idul Fitri', isCutiBersama: false },
  '2025-04-18': { name: 'Wafat Isa Al Masih', isCutiBersama: false },
  '2025-05-12': { name: 'Hari Raya Waisak', isCutiBersama: false },
  '2025-05-29': { name: 'Kenaikan Isa Al Masih', isCutiBersama: false },
  '2025-06-06': { name: 'Hari Raya Idul Adha', isCutiBersama: false },
  '2025-06-27': { name: 'Tahun Baru Islam', isCutiBersama: false },
  '2025-09-05': { name: 'Maulid Nabi Muhammad SAW', isCutiBersama: false },
};

const getHolidayDef = (dateStr: string) => { // format YYYY-MM-DD
  if (!dateStr) return null;
  if (ID_HOLIDAYS_DYNAMIC[dateStr]) return ID_HOLIDAYS_DYNAMIC[dateStr];
  const mmdd = dateStr.substring(5); // MM-DD
  if (ID_HOLIDAYS_FIXED[mmdd]) return ID_HOLIDAYS_FIXED[mmdd];
  return null;
};

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
  
  const HIJRI_MONTHS = [
    'Muharram', 'Safar', 'Rabi\'ul Awal', 'Rabi\'ul Akhir', 'Jumadil Awal', 'Jumadil Akhir',
    'Rajab', 'Sya\'ban', 'Ramadhan', 'Syawal', 'Dzulqa\'dah', 'Dzulhijjah'
  ]

  const getHijriDetails = (date: Date) => {
    try {
      if (isNaN(date.getTime())) return null;
      const formatter = new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric'
      });
      const parts = formatter.formatToParts(date);
      const day = parts.find(p => p.type === 'day')?.value || '1';
      const monthStr = parts.find(p => p.type === 'month')?.value || '1';
      const yearStr = parts.find(p => p.type === 'year')?.value || '';
      
      const mIndex = parseInt(monthStr, 10) - 1;
      const monthName = HIJRI_MONTHS[mIndex] || monthStr;
      const year = yearStr.replace(/\D/g, '');
      
      return { day, monthName, year };
    } catch {
      return null;
    }
  }

  const getHijriMonthYear = (date: Date) => {
    const details = getHijriDetails(date)
    if (!details) return ''
    return `${details.monthName} ${details.year} H`
  }

  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
  const hijriStart = getHijriMonthYear(firstDay)
  const hijriEnd = getHijriMonthYear(lastDay)
  
  let hijriMonthDisplay = hijriStart
  if (hijriStart && hijriEnd && hijriStart !== hijriEnd) {
    const startMonth = hijriStart.replace(/ \d+ H$/, '')
    hijriMonthDisplay = `${startMonth} - ${hijriEnd}`
  }

  const selectedDateFriendly = new Date(selectedDateStr).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  
  const getHijriDate = (dateStr: string) => {
    const details = getHijriDetails(new Date(dateStr))
    if (!details) return ''
    return `${details.day} ${details.monthName} ${details.year} H`
  }

  const selectedHijriFriendly = getHijriDate(selectedDateStr)

  // Filter notes on chosen date
  const selectedNotes = notes.filter(n => n.dateString === selectedDateStr)

  const selectedHoliday = getHolidayDef(selectedDateStr)
  
  const holidaysInMonth = useMemo(() => {
    return days.filter(d => d.isCurrentMonth && d.fullDateStr && getHolidayDef(d.fullDateStr))
      .map(d => ({ date: d.fullDateStr, def: getHolidayDef(d.fullDateStr!)!, dayNum: d.dayNum }))
  }, [days])

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
            Kalender & Catatan Kerja
          </h3>
          <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
            Agenda Kegiatan & Memo Penting Toko
          </p>
        </div>
      </div>

      {/* Grid: Calendar + Date Notes */}
      <div className={cn("flex-1 grid gap-6", props.isPc ? "grid-cols-12 overflow-hidden pb-14" : "grid-cols-1 pb-6")}>
        
        {/* Calendar Box (Left) */}
        <div className={cn("bg-white border border-slate-200 shadow-sm rounded-2xl p-5 flex flex-col h-fit", props.isPc && "col-span-7")}>
          {/* Calendar Header with controller */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-wider">
                {monthName}
              </h4>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
                {hijriMonthDisplay}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePrevMonth}
                className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600 active:scale-90"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={handleNextMonth}
                className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600 active:scale-90"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 text-center text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2 py-1 bg-slate-50 border-y border-slate-100">
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
              
              const holiday = day.fullDateStr ? getHolidayDef(day.fullDateStr) : null;
              const isSunday = idx % 7 === 0;
              const isTanggalMerah = isSunday || (holiday && !holiday.isCutiBersama);
              const isCutiBersama = holiday && holiday.isCutiBersama;
              
              let hijriDay = '';
              if (day.fullDateStr) {
                const hDate = getHijriDate(day.fullDateStr);
                hijriDay = hDate.split(' ')[0] || '';
              }
              
              let textColorClass = 'text-slate-600';
              if (!day.isCurrentMonth) textColorClass = 'text-slate-300';
              else if (isTanggalMerah) textColorClass = 'text-red-500';
              else if (isCutiBersama) textColorClass = 'text-orange-500';

              let bgClass = 'bg-white border hover:border-blue-500';
              if (isSelected) {
                bgClass = 'bg-blue-600 border-blue-600 shadow-md';
                textColorClass = 'text-white';
              } else {
                if (isTanggalMerah) {
                  bgClass += ' border-red-100';
                } else if (isCutiBersama) {
                  bgClass += ' border-orange-100';
                } else {
                  bgClass += ' border-slate-200';
                }
              }
              
              return (
                <button
                  key={idx}
                  disabled={!day.isCurrentMonth}
                  onClick={() => day.fullDateStr && setSelectedDateStr(day.fullDateStr)}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-start pt-1.5 md:pt-2 relative transition-all active:scale-90 focus:outline-none ${bgClass} ${textColorClass}`}
                >
                  <span className="text-[12px] font-black leading-none">{day.dayNum}</span>
                  {hijriDay && day.isCurrentMonth && (
                    <span className="text-[7.5px] font-bold opacity-60 mt-0.5 leading-none">{hijriDay}</span>
                  )}
                  {/* Notes indicator dot */}
                  {hasNotes && (
                    <span className={`w-1 h-1 rounded-full absolute bottom-1.5 ${
                      isSelected ? 'bg-white' : 'bg-blue-500'
                    }`} />
                  )}
                </button>
              )
            })}
          </div>

          {/* Month's Holidays List */}
          {holidaysInMonth.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <h5 className="text-[9px] font-black uppercase text-slate-400 mb-2.5 flex items-center gap-1.5">
                <Flag size={10} />
                <span>Hari Besar {monthName}</span>
              </h5>
              <div className="space-y-2">
                {holidaysInMonth.map((h, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <span className={`w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center text-[8px] font-black ${h.def.isCutiBersama ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                      {h.dayNum}
                    </span>
                    <span className="text-[9px] font-bold text-slate-600 leading-tight">
                      {h.def.isCutiBersama && <span className="text-orange-500 uppercase font-black mr-1">Cuti Bersama:</span>}
                      {h.def.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Schedule/Notes list (Right) */}
        <div className={cn("flex flex-col", props.isPc ? "col-span-5 overflow-hidden h-full" : "h-auto")}>
          {selectedHoliday && (
            <div className={`mb-3 p-3 text-center rounded-xl border ${selectedHoliday.isCutiBersama ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
              <p className="text-[8px] font-black uppercase tracking-wider mb-0.5">
                {selectedHoliday.isCutiBersama ? 'Cuti Bersama' : 'Tanggal Merah / Hari Libur'}
              </p>
              <h5 className="text-xs font-bold leading-tight">{selectedHoliday.name}</h5>
            </div>
          )}

          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 mb-4 shrink-0">
            <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-2">
              <CalIcon size={12} className="text-blue-500" />
              <span>Agenda Tanggal {selectedDateFriendly}</span>
            </h4>
            {selectedHijriFriendly && (
              <p className="text-[9px] font-bold text-slate-400 mb-3 pl-5">
                {selectedHijriFriendly}
              </p>
            )}

            {/* Note form block */}
            <form onSubmit={handleAddNote} className={cn("gap-2", props.isPc ? "flex" : "flex flex-col")}>
              <div className={cn("gap-2", props.isPc ? "contents" : "flex w-full")}>
                <input
                  type="time"
                  required
                  value={newNoteTime}
                  onChange={e => setNewNoteTime(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 font-extrabold text-[10px] focus:outline-none appearance-none shrink-0"
                />
                <input
                  type="text"
                  required
                  placeholder="Rapat, Shift Kasir, Target..."
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-1.5 text-[10px] text-slate-800 uppercase placeholder-slate-400 font-extrabold focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl text-[10px] uppercase shadow-lg shadow-blue-600/10 transition-all active:scale-95 shrink-0"
              >
                Simpan
              </button>
            </form>
          </div>

          {/* Notes display */}
          <div className={cn("bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden flex flex-col", props.isPc ? "flex-1 min-h-0" : "h-[300px]")}>
            <div className="p-3.5 bg-slate-50 border-b border-slate-100 font-black text-[8px] uppercase tracking-wider text-slate-500 select-none text-left">
              Kegiatan Terjadwal
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 pr-1 hide-scrollbar">
              {selectedNotes.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10 text-center gap-1">
                  <Clock size={16} className="text-slate-300" />
                  <p className="text-[9px] font-bold uppercase tracking-wider">Belum ada agenda kegiatan</p>
                </div>
              ) : (
                selectedNotes.map(note => (
                  <div key={note.id} className={cn("p-3.5 flex gap-3 text-left", props.isPc ? "items-center justify-between" : "flex-col items-start")}>
                    <div className="min-w-0 flex-1 w-full">
                      <div className="flex items-center gap-1.5 mb-1 text-blue-600">
                        <Clock size={10} />
                        <span className="text-[9px] font-black tracking-wider leading-none font-mono">{note.time} WIB</span>
                      </div>
                      <p className="text-xs font-black text-slate-800 leading-tight uppercase break-words">{note.text}</p>
                    </div>

                    <div className={cn("shrink-0", !props.isPc && "w-full flex justify-end pt-1.5 border-t border-slate-100")}>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="w-7.5 h-7.5 rounded-lg bg-red-950/30 border border-red-900/30 hover:bg-red-900/40 text-red-400 hover:text-red-300 flex items-center justify-center transition-all active:scale-95"
                        title="Hapus Agenda"
                      >
                        <Trash2 size={12} />
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

export default KalenderView
