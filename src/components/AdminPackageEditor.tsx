import React, { useState, useEffect } from 'react';
import { getSubscriptionPackages, setSubscriptionPackages, SubscriptionPackage } from '../lib/supabase';
import { Save, Plus, Trash2, Edit2, Check, X, ShieldAlert } from 'lucide-react';

export default function AdminPackageEditor({ showToast }: { showToast?: (m: string) => void }) {
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Temporary state for the currently edited package
  const [editForm, setEditForm] = useState<SubscriptionPackage | null>(null);

  useEffect(() => {
    getSubscriptionPackages().then(pkgs => {
      setPackages(pkgs);
      setLoading(false);
    });
  }, []);

  const handleEdit = (pkg: SubscriptionPackage) => {
    setEditingId(pkg.id);
    setEditForm(JSON.parse(JSON.stringify(pkg))); // deep copy
  };

  const handleSave = async () => {
    if (!editForm) return;
    
    setLoading(true);
    const updatedPackages = packages.map(p => p.id === editForm.id ? editForm : p);
    await setSubscriptionPackages(updatedPackages);
    setPackages(updatedPackages);
    setEditingId(null);
    setEditForm(null);
    setLoading(false);
    if (showToast) showToast('✅ Paket Langganan berhasil diperbarui!');
  };

  const addFeature = () => {
    if (!editForm) return;
    setEditForm({
      ...editForm,
      features: [...editForm.features, { text: 'Fitur Baru', included: true }]
    });
  };

  const updateFeature = (index: number, key: string, value: any) => {
    if (!editForm) return;
    const newFeatures = [...editForm.features];
    newFeatures[index] = { ...newFeatures[index], [key]: value };
    setEditForm({ ...editForm, features: newFeatures });
  };

  const removeFeature = (index: number) => {
    if (!editForm) return;
    const newFeatures = editForm.features.filter((_, i) => i !== index);
    setEditForm({ ...editForm, features: newFeatures });
  };

  if (loading && packages.length === 0) {
    return <div className="p-4 text-center text-slate-400 text-xs">Memuat data paket...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-950/30 border border-blue-900/50 p-4 rounded-xl flex gap-3">
        <ShieldAlert className="text-blue-400 shrink-0 mt-0.5" size={18} />
        <div>
          <h4 className="text-[10px] font-black uppercase text-blue-400 mb-1 tracking-widest">Informasi Sistem</h4>
          <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
            Terdapat 4 slot paket dasar yang tidak bisa dihapus karena terikat dengan durasi (1 bln, 4 bln, 1 thn, lifetime) pada sistem lisensi offline. Namun Anda bebas mengedit Harga, Nama Tampilan, dan Daftar Fitur.
          </p>
        </div>
      </div>

      {packages.map(pkg => {
        if (editingId === pkg.id && editForm) {
          // Editing Mode
          return (
            <div key={pkg.id} className="bg-slate-900 border-2 border-blue-500/50 rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="text-xs font-black uppercase text-white tracking-widest">Edit Mode: {pkg.id}</h3>
                <div className="flex gap-2">
                  <button onClick={() => setEditingId(null)} className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-[10px] font-bold uppercase hover:bg-slate-700">Batal</button>
                  <button onClick={handleSave} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-bold uppercase hover:bg-blue-500 shadow-lg shadow-blue-900/20">
                    <Save size={12} /> Simpan
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Nama Tampilan</label>
                  <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Harga (Teks)</label>
                  <input type="text" value={editForm.price} onChange={e => setEditForm({...editForm, price: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Deskripsi Singkat</label>
                  <input type="text" value={editForm.desc} onChange={e => setEditForm({...editForm, desc: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Badge (Opsional)</label>
                  <input type="text" value={editForm.badge || ''} onChange={e => setEditForm({...editForm, badge: e.target.value})} placeholder="Misal: POPULER" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white" />
                </div>
              </div>

              <div className="pt-2">
                <div className="flex justify-between items-center mb-2 border-t border-slate-800/50 pt-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Daftar Fitur</label>
                  <button onClick={addFeature} className="flex items-center gap-1 text-[9px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-950/30 px-2 py-1 rounded">
                    <Plus size={10} /> Tambah Fitur
                  </button>
                </div>
                
                <div className="space-y-2">
                  {editForm.features.map((feat, idx) => (
                    <div key={idx} className="flex gap-2 items-center bg-slate-950 border border-slate-800 p-2 rounded-xl">
                      <select 
                        value={feat.included === false ? 'false' : feat.info ? 'info' : 'true'}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'false') updateFeature(idx, 'included', false);
                          else if (val === 'info') {
                            updateFeature(idx, 'included', true);
                            updateFeature(idx, 'info', true);
                          } else {
                            updateFeature(idx, 'included', true);
                            updateFeature(idx, 'info', false);
                          }
                        }}
                        className="bg-slate-900 border border-slate-700 text-[10px] rounded p-1.5 text-white w-20"
                      >
                        <option value="true">Centang</option>
                        <option value="false">Silang</option>
                        <option value="info">Info</option>
                      </select>
                      
                      <input 
                        type="text" 
                        value={feat.text} 
                        onChange={e => updateFeature(idx, 'text', e.target.value)}
                        className="flex-1 bg-transparent border-none text-xs text-white focus:outline-none focus:ring-1 focus:ring-slate-700 rounded px-2 py-1"
                        placeholder="Teks fitur..."
                      />
                      
                      {feat.info && (
                        <label className="flex items-center gap-1 text-[9px] text-slate-400 cursor-pointer">
                          <input type="checkbox" checked={!!feat.infinite} onChange={e => updateFeature(idx, 'infinite', e.target.checked)} />
                          Tak Terbatas (∞)
                        </label>
                      )}
                      
                      <button onClick={() => removeFeature(idx)} className="p-1.5 text-red-400 hover:bg-red-950/50 rounded">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        }

        // View Mode
        return (
          <div key={pkg.id} className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 flex flex-col relative overflow-hidden group">
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest bg-slate-800 px-2 py-1 rounded mb-2 inline-block">Slot ID: {pkg.id}</span>
                <h3 className="text-sm font-black text-white uppercase tracking-widest">{pkg.name}</h3>
                <div className="text-xl font-black text-blue-400 tracking-tight">{pkg.price}</div>
                {pkg.desc && <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{pkg.desc}</p>}
              </div>
              <div className="flex flex-col items-end gap-2">
                {pkg.badge && <span className="bg-emerald-950/50 border border-emerald-900 text-emerald-400 text-[9px] font-black px-2 py-1 rounded uppercase tracking-widest">{pkg.badge}</span>}
                <button 
                  onClick={() => handleEdit(pkg)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[10px] font-bold uppercase transition-colors"
                >
                  <Edit2 size={10} /> Edit
                </button>
              </div>
            </div>
            
            <div className="w-full h-px bg-slate-800/50 mb-3"></div>
            
            <div className="space-y-1.5">
              {pkg.features.map((feat, i) => (
                <div key={i} className="flex items-center gap-2">
                  {feat.included === false ? (
                    <X className="w-3 h-3 text-red-500 shrink-0" />
                  ) : feat.info ? (
                    <span className="w-3 text-center text-[10px] font-black text-blue-400 shrink-0">{feat.infinite ? '∞' : 'i'}</span>
                  ) : (
                    <Check className="w-3 h-3 text-emerald-500 shrink-0" strokeWidth={3} />
                  )}
                  <span className={`text-[10px] uppercase font-bold tracking-wider ${feat.included === false ? 'text-slate-600 line-through' : 'text-slate-300'}`}>
                    {feat.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
