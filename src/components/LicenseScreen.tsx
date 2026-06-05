import React, { useState, useEffect } from 'react';
import { 
  Lock, RefreshCw, Smartphone, Key, CreditCard, Bell, 
  AlertCircle, X, History as HistoryIcon, Trash2, 
  AlertTriangle, Check, Users, Sparkles, CheckCircle2, ShieldAlert, MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { validateLicenseCode } from '../lib/license';

interface LicenseScreenProps {
  onSecretTap: () => void;
  onValid: () => void;
  onBack?: () => void;
}

export default function LicenseScreen({ onSecretTap, onValid, onBack }: LicenseScreenProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [hasNotification, setHasNotification] = useState(true);
  const [showPushNotif, setShowPushNotif] = useState(false);
  
  const deviceId = localStorage.getItem('cubic_device_id') || 'ID-UNKNOWN';
  const [waNumber, setWaNumberState] = useState(localStorage.getItem('cubic_owner_wa') || '6287824889706');

  // License State
  const [licenseKey, setLicenseKey] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [secretTapCount, setSecretTapCount] = useState(0);

  const [devices, setDevices] = useState([
    { id: deviceId, name: 'Perangkat Saat Ini', current: true },
  ]);
  const [deviceToDelete, setDeviceToDelete] = useState<{id: string, name: string} | null>(null);

  useEffect(() => {
    // Fetch nomor WA dari config online (public/config.json)
    fetch('/config.json?t=' + Date.now())
      .then(r => r.json())
      .then(cfg => {
        if (cfg?.owner_wa) {
          localStorage.setItem('cubic_owner_wa', cfg.owner_wa);
          setWaNumberState(cfg.owner_wa);
        }
      })
      .catch(() => {}); // fallback ke localStorage/hardcode jika offline

    // Simulasi push notification
    const timer = setTimeout(() => {
      setShowPushNotif(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanedKey = licenseKey.trim().toUpperCase();
    if (!cleanedKey) {
      setError('HARAP MASUKKAN KODE AKTIVASI!');
      return;
    }

    const res = validateLicenseCode(deviceId, cleanedKey);
    if (res.valid && res.days) {
      const now = new Date();
      const expires = new Date();
      expires.setDate(now.getDate() + res.days);
      
      const licData = {
        code: cleanedKey,
        packageType: res.packageType,
        activatedAt: now.toISOString(),
        expiresAt: expires.toISOString()
      };
      localStorage.setItem('cubic_license_info', JSON.stringify(licData));
      setSuccess(true);
      
      setTimeout(() => {
        onValid();
      }, 1500);
    } else {
      setError(res.error || 'KODE LISENSI TIDAK VALID ATAU KADALUARSA!');
    }
  };

  const confirmRemoveDevice = () => {
    if (deviceToDelete) {
      setDevices(devices.filter(device => device.id !== deviceToDelete.id));
      setDeviceToDelete(null);
    }
  };

  const activities = [
    { id: 1, title: 'Lisensi Diperiksa', description: `Sistem memeriksa status lisensi pada ${deviceId}.`, time: 'Baru saja', icon: Smartphone, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  ];

  const packages = [
    {
      name: 'Pemula',
      price: 'Rp 15.000',
      desc: 'Aktif selama 1 Bulan',
      features: [
        { text: 'Lisensi untuk 1 Perangkat', included: true },
        { text: 'Kelola 1 toko aktif', included: true },
        { text: '1 kasir aktif', included: true },
      ]
    },
    {
      name: 'Paket 2',
      price: 'Rp 50.000',
      desc: 'Aktif selama 4 Bulan',
      badge: 'HEMAT',
      features: [
        { text: 'Lisensi untuk 1 Perangkat', included: true },
        { text: 'Kelola 1 toko aktif', included: true },
        { text: '2 kasir aktif', included: true },
      ]
    },
    {
      name: 'Paket 3',
      price: 'Rp 150.000',
      badge: 'POPULER',
      desc: 'Aktif selama 1 Tahun',
      features: [
        { text: 'Lisensi untuk 3 Perangkat', included: true },
        { text: 'Kelola 2 toko aktif', included: true },
        { text: 'Kasir bebas', info: true, infinite: true },
      ]
    },
    {
      name: 'Lifetime',
      price: 'Rp 399.000',
      desc: 'Paket Selamanya',
      features: [
        { text: 'Lisensi untuk 6 Perangkat', included: true },
        { text: 'Kelola 5 toko aktif', included: true },
        { text: 'Kasir bebas', info: true, infinite: true },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex justify-center text-slate-800">
      <div className="w-full max-w-[420px] bg-slate-50 min-h-[100dvh] relative flex flex-col overflow-hidden">
        
        {/* Top Navbar */}
        <header className="bg-white px-5 py-4 flex items-center justify-between sticky top-0 z-40 border-b border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            {onBack && (
              <button onClick={onBack} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors">
                <i className="fa-solid fa-arrow-left"></i>
              </button>
            )}
            <button 
              onClick={() => setActiveTab('dashboard')} 
              className="flex items-center gap-3 text-left"
            >
              <div className="w-9 h-9 bg-blue-600 rounded-xl text-white flex items-center justify-center shadow-md">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[17px] font-black text-slate-800 tracking-tight leading-none block">Manajer Lisensi</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Kasir Cuba</span>
              </div>
            </button>
          </div>
          
          <button 
            onClick={() => { setActiveTab('riwayat'); setHasNotification(false); }}
            className="relative p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors"
          >
            <Bell className="w-[22px] h-[22px]" />
            {hasNotification && (
              <span className="absolute top-1.5 right-2 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border border-white"></span>
              </span>
            )}
          </button>
        </header>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto p-4 pb-28 custom-scrollbar">
          
          {/* Quick Actions Grid */}
          <div className="grid grid-cols-3 gap-3 mb-6 mt-2">
            <button 
               onClick={() => {
                 setActiveTab(activeTab === 'riwayat' ? 'dashboard' : 'riwayat');
                 setHasNotification(false);
               }}
               className={`relative p-3 rounded-2xl shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] border flex flex-col items-center justify-center gap-2.5 transition-colors ${activeTab === 'riwayat' ? 'bg-blue-600 border-blue-600 text-white shadow-blue-500/20' : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'}`}
            >
              {hasNotification && activeTab !== 'riwayat' && (
                <span className="absolute top-2.5 right-2.5 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white"></span>
                </span>
              )}
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${activeTab === 'riwayat' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                <HistoryIcon className="w-5 h-5" />
              </div>
              <span className={`text-[10px] font-black text-center leading-[1.25] uppercase tracking-wide ${activeTab === 'riwayat' ? 'text-white' : 'text-slate-600'}`}>Riwayat<br/>Aktivitas</span>
            </button>
            
            <button 
              onClick={() => setActiveTab(activeTab === 'info-lisensi' ? 'dashboard' : 'info-lisensi')}
              className={`p-3 rounded-2xl shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] border flex flex-col items-center justify-center gap-2.5 transition-colors ${activeTab === 'info-lisensi' ? 'bg-blue-600 border-blue-600 text-white shadow-blue-500/20' : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'}`}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${activeTab === 'info-lisensi' ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-500'}`}>
                <Key className="w-5 h-5" />
              </div>
              <span className={`text-[10px] font-black text-center leading-[1.25] uppercase tracking-wide ${activeTab === 'info-lisensi' ? 'text-white' : 'text-slate-600'}`}>Info<br/>Lisensi</span>
            </button>

            <button 
               onClick={() => setActiveTab(activeTab === 'daftar-berlangganan' ? 'dashboard' : 'daftar-berlangganan')}
               className={`p-3 rounded-2xl shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] border flex flex-col items-center justify-center gap-2.5 transition-colors ${activeTab === 'daftar-berlangganan' ? 'bg-blue-600 border-blue-600 text-white shadow-blue-500/20' : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'}`}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${activeTab === 'daftar-berlangganan' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-500'}`}>
                <CreditCard className="w-5 h-5" />
              </div>
              <span className={`text-[10px] font-black text-center leading-[1.25] uppercase tracking-wide ${activeTab === 'daftar-berlangganan' ? 'text-white' : 'text-slate-600'}`}>Paket<br/>Langganan</span>
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-8 pb-4">
                  <div className="px-6 pt-8 pb-6 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-5 border border-blue-100 shadow-inner">
                      <Lock className="w-7 h-7 text-blue-600 fill-current" />
                    </div>
                    
                    <h2 
                      className="text-lg font-black text-slate-800 uppercase tracking-widest mb-2 cursor-pointer select-none"
                      onClick={() => {
                        const newCount = secretTapCount + 1;
                        if (newCount >= 7) {
                          const pw = prompt('Developer Access Password:');
                          if (pw === 'Umbui123@') {
                            onSecretTap();
                          }
                          setSecretTapCount(0);
                        } else {
                          setSecretTapCount(newCount);
                        }
                      }}
                    >
                      Aktivasi Aplikasi
                    </h2>
                    <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider leading-relaxed max-w-[260px] mb-6">
                      Masukkan Kode Lisensi yang Anda miliki untuk mulai menggunakan sistem Kasir Cuba.
                    </p>
                    
                    {success ? (
                      <div className="space-y-4 py-4 w-full bg-emerald-50 border border-emerald-100 rounded-2xl mb-6 p-4">
                        <div className="text-emerald-500 flex flex-col items-center gap-2">
                          <CheckCircle2 size={36} className="animate-bounce" />
                          <p className="text-xs font-black uppercase tracking-wider">AKTIVASI BERHASIL!</p>
                        </div>
                        <p className="text-[9px] text-emerald-700 font-bold uppercase tracking-wider">
                          Lisensi terdeteksi aktif. Memuat ulang sistem...
                        </p>
                      </div>
                    ) : (
                      <form onSubmit={handleActivate} className="w-full text-left mb-5">
                        {error && (
                          <div className="mb-4 px-3 py-3 bg-red-50 border border-red-100 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-xl flex items-start gap-2 shadow-sm">
                            <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                            <span className="leading-tight flex-1">{error}</span>
                          </div>
                        )}
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 text-center">
                          KODE LISENSI / SERIAL NUMBER
                        </label>
                        <input 
                          type="text" 
                          placeholder="XXXX-XXXX-XXXX" 
                          value={licenseKey}
                          onChange={e => setLicenseKey(e.target.value.toUpperCase())}
                          className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-center font-black text-sm tracking-[0.2em] text-slate-800 placeholder:text-slate-300 transition-all uppercase bg-slate-50 mb-4"
                        />
                        <button type="submit" className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-[11px] uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2">
                          <Sparkles size={16} className="stroke-[2.5]" /> Aktivasi Sekarang
                        </button>
                      </form>
                    )}
                    
                    <div className="w-full flex flex-col items-center border-t border-slate-100 pt-6 mt-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Belum punya lisensi?</p>
                      <button onClick={() => setActiveTab('daftar-berlangganan')} className="text-blue-600 font-black text-[11px] uppercase tracking-widest mb-6 hover:text-blue-700 transition-colors">
                        Beli Lisensi Di Sini
                      </button>
                      
                      <button onClick={() => setActiveTab('info-lisensi')} className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-amber-500 hover:text-amber-600 mb-4 group transition-colors">
                        <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                        Cek Status Langganan
                      </button>
                      <div className="bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                          Device ID: <span className="text-slate-600 font-mono tracking-wider">{deviceId}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'riwayat' && (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 mb-8">
                   <h2 className="text-[14px] font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                     <HistoryIcon className="w-5 h-5 text-blue-500" /> Riwayat Aktivitas
                   </h2>
                   <div className="space-y-6 relative">
                      <div className="absolute left-6 top-2 bottom-2 w-px bg-slate-100 z-0"></div>
                      {activities.map((activity) => {
                        const Icon = activity.icon;
                        return (
                          <div key={activity.id} className="relative z-10 flex gap-4 items-start">
                            <div className={`w-12 h-12 rounded-full ${activity.bgColor} ${activity.color} flex items-center justify-center shrink-0 shadow-sm border-[4px] border-white`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0 pt-1.5">
                              <p className="text-xs font-black text-slate-800 uppercase tracking-wide truncate">{activity.title}</p>
                              <p className="text-[11px] font-bold text-slate-500 leading-relaxed mt-1">{activity.description}</p>
                              <p className="text-[9px] font-black text-slate-400 mt-2 uppercase tracking-widest">{activity.time}</p>
                            </div>
                          </div>
                        );
                      })}
                   </div>
                </div>
              )}

              {activeTab === 'info-lisensi' && (
                <div className="space-y-4 mb-8">
                  <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
                    <h2 className="text-[14px] font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                      <Key className="w-5 h-5 text-amber-500" /> Info Lisensi
                    </h2>
                    
                    <div className="space-y-5">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Kode Lisensi Saat Ini</p>
                        <p className="font-black text-sm tracking-widest text-slate-800 uppercase">
                          {JSON.parse(localStorage.getItem('cubic_license_info') || '{}')?.code || 'BELUM ADA'}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Device ID Anda</p>
                        <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg">
                          <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                          <p className="font-mono text-xs font-black text-slate-600 tracking-wider">{deviceId}</p>
                        </div>
                      </div>

                      <div className="flex items-end justify-between pb-4 border-b border-slate-100">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Masa Aktif Sampai</p>
                          <p className="font-black text-sm tracking-widest text-blue-600 uppercase">
                            {JSON.parse(localStorage.getItem('cubic_license_info') || '{}')?.expiresAt ? new Date(JSON.parse(localStorage.getItem('cubic_license_info') || '{}').expiresAt).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'}) : '-'}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button 
                          onClick={() => setActiveTab('dashboard')}
                          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-blue-600 text-blue-600 font-black hover:bg-blue-50 transition-colors text-[10px] uppercase tracking-widest"
                        >
                          <Lock className="w-[14px] h-[14px] fill-current" />
                          Aktivasi
                        </button>
                        <button 
                          onClick={() => setActiveTab('daftar-berlangganan')}
                          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-blue-600 text-white font-black hover:bg-blue-700 transition-colors shadow-md text-[10px] uppercase tracking-widest"
                        >
                          <Key className="w-[14px] h-[14px] -rotate-45" />
                          Perpanjang
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
                    <div className="flex justify-between items-center mb-5">
                      <h2 className="text-[14px] font-black text-slate-800 uppercase tracking-widest">Perangkat Terhubung</h2>
                      <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md border border-blue-100 tracking-widest">{devices.length} / 2 Device</span>
                    </div>
                    
                    <div className="space-y-3">
                      {devices.map(device => (
                        <div key={device.id} className="flex items-center justify-between p-3.5 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="bg-slate-100 p-2.5 rounded-xl text-slate-500 shrink-0">
                              <Smartphone className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 pr-2">
                              <p className="text-xs font-black text-slate-800 truncate uppercase tracking-wide">{device.name}</p>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 mt-1">
                                <p className="text-[10px] font-mono font-bold text-slate-500 truncate">{device.id}</p>
                                {device.current && <span className="inline-block w-fit text-emerald-600 font-sans font-black bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-widest">Perangkat Ini</span>}
                              </div>
                            </div>
                          </div>
                          <button 
                            onClick={() => setDeviceToDelete({id: device.id, name: device.name})}
                            className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'daftar-berlangganan' && (
                <div className="pb-10 space-y-4">
                  
                  {/* Banner Kontak Developer */}
                  <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-3xl p-6 text-white shadow-xl shadow-blue-900/20 relative overflow-hidden flex items-center justify-between mb-2 border border-blue-500/30">
                    <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                    <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-blue-400/20 rounded-full blur-2xl"></div>
                    
                    <div className="relative z-10 flex-1 pr-5">
                      <div className="flex items-center gap-2.5 mb-2.5">
                        <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center border border-white/20 shadow-inner">
                          <MessageCircle className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="text-xs font-black uppercase tracking-widest text-white/95">Pusat Layanan & Pembelian</h3>
                      </div>
                      <p className="text-[11px] font-bold leading-relaxed text-blue-100/90 mb-4 max-w-[240px]">
                        Silakan hubungi WhatsApp Developer kami untuk melakukan pembelian paket lisensi Kasir Cuba.
                      </p>
                      <div className="inline-flex items-center gap-2.5 bg-black/20 border border-white/10 px-3.5 py-2 rounded-xl backdrop-blur-md shadow-inner">
                        <span className="font-mono text-xs font-black tracking-widest text-emerald-400">{waNumber}</span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => window.open(`https://wa.me/${waNumber}?text=Halo%20Admin%20Developer,%20saya%20tertarik%20untuk%20membeli%20lisensi%20Kasir%20Cuba.%20Mohon%20info%20lebih%20lanjut.%20Device%20ID:%20${deviceId}`, '_blank')}
                      className="relative z-10 shrink-0 w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all border border-emerald-300"
                    >
                      <MessageCircle className="w-6 h-6 fill-current" />
                    </button>
                  </div>

                  {packages.map((pkg) => (
                    <div key={pkg.name} className="bg-white rounded-3xl shadow-sm border border-slate-200 p-5 flex flex-col relative overflow-hidden group hover:border-blue-300 transition-colors">
                      {pkg.badge && (
                        <span className="absolute top-0 right-0 bg-emerald-100 text-emerald-600 text-[9px] font-black px-4 py-1.5 rounded-bl-2xl uppercase tracking-widest border-b border-l border-emerald-200">
                          {pkg.badge}
                        </span>
                      )}
                      
                      <div className="mb-4 pt-1">
                        <h3 className="text-[15px] font-black text-slate-800 mb-1 uppercase tracking-widest">{pkg.name}</h3>
                        <div className="text-2xl font-black text-blue-600 tracking-tight leading-none mb-2">{pkg.price}</div>
                        {pkg.desc && <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{pkg.desc}</p>}
                      </div>
                      
                      <div className="w-full h-px bg-slate-100 mb-4"></div>
                      
                      <ul className="space-y-3 mb-6">
                        {pkg.features.map((feat, i) => (
                          <li key={i} className="flex items-center gap-3">
                            {feat.included && !feat.iconUsers ? (
                              <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                                <Check className="w-3 h-3 text-emerald-500" strokeWidth={4} />
                              </div>
                            ) : feat.iconUsers ? (
                              <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                                <Users className="w-3 h-3 text-blue-500" strokeWidth={3} />
                              </div>
                            ) : feat.info ? (
                              feat.infinite ? (
                                <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                                  <div className="text-blue-600 font-black text-sm leading-none mt-0.5">∞</div>
                                </div>
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                                  <span className="text-[9px] font-black text-blue-600">i</span>
                                </div>
                              )
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                                <X className="w-3 h-3 text-red-500" strokeWidth={4} />
                              </div>
                            )}
                            <span className={`text-[11px] font-bold uppercase tracking-wider ${feat.included === false ? 'text-slate-400 line-through' : 'text-slate-600'}`}>
                              {feat.text}
                            </span>
                          </li>
                        ))}
                      </ul>
                      
                      <button 
                        onClick={() => window.open(`https://wa.me/${waNumber}?text=Halo%20Admin,%20saya%20ingin%20beli%20lisensi%20Paket%20${pkg.name}.%20Device%20ID:%20${deviceId}`, '_blank')}
                        className="w-full py-3.5 rounded-xl font-black text-[11px] uppercase tracking-widest transition-colors border-2 bg-white border-blue-600 text-blue-600 group-hover:bg-blue-600 group-hover:text-white shadow-sm mt-auto"
                      >
                        PILIH PAKET
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <AnimatePresence>
        {deviceToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
              onClick={() => setDeviceToDelete(null)} 
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-[320px] relative z-10 overflow-hidden border border-slate-100"
            >
              <div className="p-6 flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-5 border border-red-100 shadow-inner">
                  <AlertTriangle className="w-7 h-7 text-red-500" />
                </div>
                <h3 className="text-sm font-black text-slate-800 mb-2 uppercase tracking-wide">Hapus {deviceToDelete.name}?</h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-6 leading-relaxed">
                  Menghapus perangkat ini akan membebaskan slot lisensi, tapi aplikasi di perangkat ini akan kembali ke mode gratis.
                </p>
                
                <div className="flex w-full gap-3">
                  <button 
                    onClick={() => setDeviceToDelete(null)}
                    className="flex-1 py-3.5 rounded-xl bg-slate-100 text-slate-600 font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-colors"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={confirmRemoveDevice}
                    className="flex-1 py-3.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black text-[10px] uppercase tracking-widest transition-colors shadow-md shadow-red-500/20"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
