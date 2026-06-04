import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

type TodoItem = {
  id: string;
  text: string;
  completed: boolean;
};

type Note = {
  id: string;
  store_id: string;
  title: string;
  content: string;
  is_todo: boolean;
  todo_items: TodoItem[];
  is_pinned: boolean;
  created_at: string;
};

const CatatanView: React.FC<{
  active: boolean;
  isPc: boolean;
  setActiveView: (view: string) => void;
  activeStoreId: string;
}> = ({ active, isPc, setActiveView, activeStoreId }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newIsTodo, setNewIsTodo] = useState(false);
  const [newTodoText, setNewTodoText] = useState('');
  const [newTodoItems, setNewTodoItems] = useState<TodoItem[]>([]);

  // Detail view
  const [detailNote, setDetailNote] = useState<Note | null>(null);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<Note | null>(null);

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('owner_notes')
        .select('*')
        .eq('store_id', activeStoreId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      setNotes(data as unknown as Note[]);
      localStorage.setItem('catatan_notes_' + activeStoreId, JSON.stringify(data));
    } catch {
      const cached = localStorage.getItem('catatan_notes_' + activeStoreId);
      if (cached) setNotes(JSON.parse(cached));
    }
  };

  useEffect(() => {
    if (active) fetchNotes();
  }, [active, activeStoreId]);

  const handleAddNote = async () => {
    if (!newTitle.trim()) return;
    const payload: Partial<Note> = {
      store_id: activeStoreId,
      title: newTitle.trim(),
      content: newContent.trim(),
      is_todo: newIsTodo,
      todo_items: newIsTodo ? newTodoItems : [],
      is_pinned: false,
    };
    let inserted: Note | null = null;
    try {
      const { data, error } = await supabase.from('owner_notes').insert([payload]).select();
      if (error) throw error;
      inserted = data[0] as Note;
    } catch {
      inserted = { ...(payload as Note), id: `temp-${Date.now()}`, created_at: new Date().toISOString() };
    }
    setNotes([inserted!, ...notes]);
    setShowModal(false);
    setNewTitle('');
    setNewContent('');
    setNewIsTodo(false);
    setNewTodoItems([]);
    setNewTodoText('');
  };

  const addTodoItem = () => {
    if (!newTodoText.trim()) return;
    setNewTodoItems([...newTodoItems, { id: Date.now().toString(), text: newTodoText.trim(), completed: false }]);
    setNewTodoText('');
  };

  const togglePin = async (id: string) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    const updated = { ...note, is_pinned: !note.is_pinned };
    setNotes(notes.map(n => (n.id === id ? updated : n)).sort((a, b) => Number(b.is_pinned) - Number(a.is_pinned)));
    if (detailNote?.id === id) setDetailNote(updated);
    try {
      await supabase.from('owner_notes').update({ is_pinned: updated.is_pinned }).eq('id', id);
    } catch {}
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setNotes(notes.filter(n => n.id !== deleteTarget.id));
    if (detailNote?.id === deleteTarget.id) setDetailNote(null);
    try {
      await supabase.from('owner_notes').delete().eq('id', deleteTarget.id);
    } catch {}
    setDeleteTarget(null);
  };

  const toggleTodoItem = async (noteId: string, itemId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    const newItems = note.todo_items.map(it => (it.id === itemId ? { ...it, completed: !it.completed } : it));
    const updated = { ...note, todo_items: newItems };
    setNotes(notes.map(n => (n.id === noteId ? updated : n)));
    if (detailNote?.id === noteId) setDetailNote(updated);
    try {
      await supabase.from('owner_notes').update({ todo_items: newItems }).eq('id', noteId);
    } catch {}
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (!active) return null;

  return (
    <div className={cn('flex flex-col bg-slate-50', isPc ? 'h-full' : 'absolute inset-0 z-[100]')}>
      {/* Header */}
      <div className="bg-gradient-to-br from-yellow-600 to-amber-500 px-5 pt-6 pb-8 shadow-lg text-white shrink-0">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setActiveView('view-beranda')}
            className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center hover:bg-white/30 transition active:scale-90"
          >
            <i className="fa-solid fa-arrow-left text-sm" />
          </button>
          <div className="text-center">
            <h1 className="text-base font-black tracking-widest uppercase leading-none">📋 Catatan Owner</h1>
            <p className="text-[10px] text-white/70 mt-1 font-bold uppercase tracking-widest">{notes.length} catatan tersimpan</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center hover:bg-white/30 transition active:scale-90"
          >
            <i className="fa-solid fa-plus text-sm" />
          </button>
        </div>
      </div>

      {/* Note List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5 pb-24" style={{ marginTop: '-1rem' }}>
        {notes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mb-4 border-2 border-yellow-100">
              <i className="fa-solid fa-clipboard text-3xl text-yellow-300" />
            </div>
            <p className="text-[12px] font-black text-slate-500 uppercase tracking-widest">Belum Ada Catatan</p>
            <p className="text-[10px] text-slate-400 mt-1">Klik + untuk membuat catatan baru</p>
          </div>
        )}

        {notes.map(note => (
          <button
            key={note.id}
            onClick={() => setDetailNote(note)}
            className="w-full text-left bg-white rounded-2xl shadow-sm border border-slate-100 p-4 hover:border-yellow-200 hover:shadow-md transition-all active:scale-[0.99]"
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-1.5 min-w-0">
                {note.is_pinned && (
                  <i className="fa-solid fa-thumbtack text-yellow-500 text-[10px] shrink-0" />
                )}
                <h3 className="text-[13px] font-black text-slate-800 truncate">{note.title}</h3>
              </div>
              <span className={cn(
                'text-[8px] font-black px-2 py-0.5 rounded-full shrink-0 uppercase',
                note.is_todo ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
              )}>
                {note.is_todo ? 'Checklist' : 'Teks'}
              </span>
            </div>

            {/* Excerpt */}
            {note.is_todo ? (
              <p className="text-[11px] text-slate-500 font-medium line-clamp-1">
                {note.todo_items.length > 0
                  ? `${note.todo_items.filter(t => t.completed).length}/${note.todo_items.length} selesai · ${note.todo_items[0]?.text}`
                  : 'Belum ada item'}
              </p>
            ) : (
              <p className="text-[11px] text-slate-500 font-medium line-clamp-2 leading-relaxed">
                {note.content || <span className="italic text-slate-300">Tidak ada isi</span>}
              </p>
            )}

            <p className="text-[9px] text-slate-300 font-bold mt-2 uppercase tracking-widest">{formatDate(note.created_at)}</p>
          </button>
        ))}
      </div>

      {/* ── DETAIL MODAL ── */}
      {detailNote && (
        <div className="fixed inset-0 z-[200] bg-black/40 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh]">
            {/* Detail Header */}
            <div className="bg-gradient-to-br from-yellow-600 to-amber-500 rounded-t-3xl sm:rounded-3xl sm:rounded-b-none p-5 text-white shrink-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-black text-white/60 uppercase tracking-widest mb-1">{formatDate(detailNote.created_at)}</p>
                  <h2 className="text-lg font-black leading-tight">{detailNote.title}</h2>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => togglePin(detailNote.id)}
                    className={cn(
                      'w-9 h-9 rounded-xl flex items-center justify-center transition active:scale-90',
                      detailNote.is_pinned ? 'bg-white/30' : 'bg-white/10 hover:bg-white/20'
                    )}
                    title={detailNote.is_pinned ? 'Lepas Pin' : 'Pinkan'}
                  >
                    <i className="fa-solid fa-thumbtack text-sm" />
                  </button>
                  <button
                    onClick={() => { setDeleteTarget(detailNote); setDetailNote(null); }}
                    className="w-9 h-9 rounded-xl bg-red-400/30 hover:bg-red-400/50 flex items-center justify-center transition active:scale-90"
                    title="Hapus"
                  >
                    <i className="fa-solid fa-trash text-sm" />
                  </button>
                  <button
                    onClick={() => setDetailNote(null)}
                    className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition active:scale-90"
                  >
                    <i className="fa-solid fa-xmark text-sm" />
                  </button>
                </div>
              </div>
            </div>

            {/* Detail Body */}
            <div className="flex-1 overflow-y-auto p-5">
              {detailNote.is_todo ? (
                <div className="space-y-2">
                  {detailNote.todo_items.length === 0 && (
                    <p className="text-xs text-slate-400 italic text-center py-6">Belum ada item checklist</p>
                  )}
                  {detailNote.todo_items.map(item => (
                    <label
                      key={item.id}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition"
                    >
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => toggleTodoItem(detailNote.id, item.id)}
                        className="w-5 h-5 rounded-lg accent-yellow-500 shrink-0"
                      />
                      <span className={cn(
                        'text-sm font-medium flex-1',
                        item.completed ? 'line-through text-slate-400' : 'text-slate-700'
                      )}>
                        {item.text}
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {detailNote.content || <span className="italic text-slate-300">Tidak ada isi catatan</span>}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRM DIALOG ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[300] bg-black/50 flex items-center justify-center px-6">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs p-6 text-center">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-red-100">
              <i className="fa-solid fa-triangle-exclamation text-2xl text-red-500" />
            </div>
            <h3 className="text-sm font-black text-slate-800 mb-1 uppercase tracking-wide">Hapus Catatan?</h3>
            <p className="text-[11px] text-slate-500 mb-1">Catatan berikut akan dihapus permanen:</p>
            <p className="text-[12px] font-black text-yellow-700 bg-yellow-50 rounded-xl px-3 py-2 mb-5">
              "{deleteTarget.title}"
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase tracking-widest transition active:scale-95"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black text-xs uppercase tracking-widest transition active:scale-95"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD NOTE MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 z-[200] bg-black/40 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Catatan Baru</h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                <i className="fa-solid fa-xmark text-sm text-slate-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Judul *</label>
                <input
                  type="text"
                  placeholder="Judul catatan..."
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-yellow-400 transition"
                />
              </div>

              {/* Toggle type */}
              <div className="flex gap-2">
                <button
                  onClick={() => setNewIsTodo(false)}
                  className={cn(
                    'flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition',
                    !newIsTodo ? 'bg-yellow-500 text-white' : 'bg-slate-100 text-slate-500'
                  )}
                >
                  <i className="fa-solid fa-align-left mr-1" /> Teks
                </button>
                <button
                  onClick={() => setNewIsTodo(true)}
                  className={cn(
                    'flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition',
                    newIsTodo ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'
                  )}
                >
                  <i className="fa-solid fa-list-check mr-1" /> Checklist
                </button>
              </div>

              {!newIsTodo ? (
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Isi Catatan</label>
                  <textarea
                    placeholder="Tulis catatan di sini..."
                    value={newContent}
                    onChange={e => setNewContent(e.target.value)}
                    rows={5}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-yellow-400 transition resize-none"
                  />
                </div>
              ) : (
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Item Checklist</label>
                  <div className="space-y-1.5 mb-2">
                    {newTodoItems.map((item, idx) => (
                      <div key={item.id} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                        <i className="fa-regular fa-square text-slate-300 text-sm shrink-0" />
                        <span className="text-sm font-medium text-slate-700 flex-1">{item.text}</span>
                        <button
                          onClick={() => setNewTodoItems(newTodoItems.filter((_, i) => i !== idx))}
                          className="text-red-400 hover:text-red-600 transition"
                        >
                          <i className="fa-solid fa-xmark text-xs" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Tambah item..."
                      value={newTodoText}
                      onChange={e => setNewTodoText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addTodoItem()}
                      className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium outline-none focus:border-blue-400 transition"
                    />
                    <button
                      onClick={addTodoItem}
                      className="px-4 py-2 rounded-xl bg-blue-500 text-white font-black text-xs transition hover:bg-blue-600 active:scale-95"
                    >
                      <i className="fa-solid fa-plus" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-slate-100 shrink-0">
              <button
                onClick={handleAddNote}
                disabled={!newTitle.trim()}
                className="w-full py-3 rounded-2xl bg-yellow-500 hover:bg-yellow-600 disabled:opacity-40 text-white font-black text-sm uppercase tracking-widest transition active:scale-95"
              >
                <i className="fa-solid fa-floppy-disk mr-2" /> Simpan Catatan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CatatanView;
