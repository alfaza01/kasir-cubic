import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Utility untuk mencegah kebocoran data multi-toko (tenant leakage) pada query Supabase
export const applyStoreFilter = (query: any, storeId: string | 'all' | null) => {
  if (storeId === null) {
    // Jika specifically null, filter by is null
    return query.is('store_id', null)
  }
  if (storeId && storeId !== 'all') {
    // Memfilter langsung ke branch yang aktif
    return query.eq('store_id', storeId)
  }
  // Bila 'all', kembalikan query mentah tanpa filter store_id
  return query
}

import type { WalletNode } from '../types';

export const LEGACY_MAP: Record<string, string> = {
  'BANK BRI': 'Bank01',
  'BANK BNI': 'Bank02',
  'BANK BCA': 'Bank03',
  'SEA BANK': 'Bank04',
  'DANA': 'Bank05',
  'SHOPEEPAY': 'Bank05', // Shopeepay mapped to dana or something? Map it to Bank05 if users had it, wait, just map SHOPEEPAY to Bank03 maybe? No, let's keep them uniquely if we need to. But we only have 9 slots now!
  'APLIKASI PPOB': 'Bank06',
  'ORDER KUOTA': 'Bank07',
  'ORDERKUOTA': 'Bank07',
  'LACI KASIR': 'Bank08',
  'DOMPET PENAMPUNG': 'Bank09',
  'NON TUNAI': 'Bank09',
};

export const DEFAULT_WALLETS: WalletNode[] = [
  { id: 'Bank01', name: 'BANK BRI', isHidden: false, isLocked: false, format: 'nominal_admin' },
  { id: 'Bank02', name: 'BANK BNI', isHidden: false, isLocked: false, format: 'nominal_admin' },
  { id: 'Bank03', name: 'BANK BCA', isHidden: false, isLocked: false, format: 'nominal_admin' },
  { id: 'Bank04', name: 'SEA BANK', isHidden: false, isLocked: false, format: 'nominal_admin' },
  { id: 'Bank05', name: 'DANA', isHidden: false, isLocked: false, format: 'nominal_admin' },
  { id: 'Bank06', name: 'APLIKASI PPOB', isHidden: false, isLocked: false, format: 'nominal_admin' },
  { id: 'Bank07', name: 'ORDER KUOTA', isHidden: false, isLocked: false, format: 'modal_jual' },
  { id: 'Bank08', name: 'LACI KASIR', isHidden: false, isLocked: true, format: 'nominal_admin' },
  { id: 'Bank09', name: 'DOMPET PENAMPUNG', isHidden: false, isLocked: true, format: 'nominal_admin' }
];

export const getWallets = (): WalletNode[] => {
  const saved = localStorage.getItem('alphaPro_wallets_v2');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {}
  }
  return DEFAULT_WALLETS;
};

export const resolveWalletId = (nameOrId: string): string => {
  if (!nameOrId) return '';
  const upper = nameOrId.toUpperCase();
  if (LEGACY_MAP[upper]) return LEGACY_MAP[upper];
  if (nameOrId.startsWith('Bank0')) return nameOrId;
  return nameOrId; // if unknown, return as is
};

export const getWalletName = (id: string, walletsList?: WalletNode[]): string => {
  if (!id) return '';
  const wList = walletsList || getWallets();
  const found = wList.find(w => w.id === id);
  if (found) return found.name;
  return id; 
};

// Aliases for compatibility right now, until we fully refactor:
export const getCategories = (): string[] => {
  return getWallets().filter(w => !w.isHidden).map(w => w.id);
};

export const getCategoriesConfig = (): Record<string, string> => {
  const cfg: Record<string, string> = {};
  getWallets().forEach(w => {
    cfg[w.id] = w.format || 'nominal_admin';
  });
  return cfg;
};

export const isDigitalPenjualan = (kategori: string) => {
  if (!kategori) return false;
  const katLower = kategori.toLowerCase().trim();
  
  // Penjual digital adalah selain TARIK TUNAI \ DOMPET PENAMPUNG \ LACI KASIR, Aksesoris, and Isi / Tambah actions
  if (
    katLower.includes('tarik tunai') || 
    katLower.includes('non tunai') || 
    katLower.includes('dompet penampung') || 
    katLower.includes('laci kasir') || 
    katLower.includes('aksesoris') ||
    katLower.startsWith('isi ') ||
    katLower.startsWith('tambah ') ||
    katLower.includes('modal') ||
    katLower.includes('inject saldo') ||
    katLower.includes('mutasi') ||
    katLower.includes('setor tunai') ||
    katLower.includes('operan shift') ||
    katLower.includes('tutup shift') ||
    katLower === '___system___'
  ) {
    return false;
  }
  
  return true;
}

export const formatRupiah = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const parseNominal = (value: string) => {
  return parseInt(value.replace(/[^0-9]/g, ''), 10) || 0;
};

export const formatInputRupiah = (value: string) => {
  if (!value) return '';
  const nominal = value.replace(/[^0-9]/g, '');
  return nominal.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

// Mendapatkan string ISO dalam waktu lokal (WIB) tanpa akhiran 'Z'
export const getLocalISOString = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000; // offset dalam milidetik
  const localISOTime = new Date(now.getTime() - offset).toISOString().slice(0, -1);
  return localISOTime;
};

// Mendapatkan tanggal lokal saja (YYYY-MM-DD)
export const getLocalDateString = () => {
  return getLocalISOString().split('T')[0];
};

// Memparsing string ISO lokal kembali menjadi objek Date di timezone lokal
export const parseLocalISO = (iso: string) => {
  if (!iso) return new Date();
  const [datePart, timePart] = iso.split('T');
  if (!datePart) return new Date(iso);
  
  const [y, m, d] = datePart.split('-').map(Number);
  
  if (!timePart) {
    // Jika hanya tanggal (YYYY-MM-DD), buat objek date di jam 00:00 local
    return new Date(y, m - 1, d, 0, 0, 0);
  }
  
  const [h, min, sec] = timePart.split(':').map(v => parseFloat(v));
  return new Date(y, m - 1, d, h || 0, min || 0, Math.floor(sec || 0));
};

// Fungsi Rekap Harian Otomatis
export interface DailyStats {
  kasModal: number;
  isiBank: number;
  
  penjualanDigital: number;
  penjualanAksesoris: number;
  tarikTunai: number;
  
  totalAdminCash: number;
  
  adminDalam: number;
  totalKhusus: number;
  totalNonTunai: number;
  aksesorisNonTunai: number;
  
  totalVolume: number;
  totalTransaksi: number;

  saldoLaciKasir: number;
  saldoBank: number;
  saldoReal: number;
  bankOut: number;
}

export const calculateDailyStats = (txs: any[]): DailyStats => {
  let kasModal = 0;
  let isiBank = 0;
  let saldoReal = 0;
  
  let penjualanDigital = 0;
  let penjualanAksesoris = 0;
  let tarikTunai = 0;
  
  let totalAdminCash = 0;
  let adminDalam = 0;
  let totalKhusus = 0;
  let totalNonTunai = 0;
  let aksesorisNonTunai = 0;
  
  let totalVolume = 0;
  let totalTransaksi = 0;

  let bankOut = 0;
  
  let saldoLaciKasir = 0;
  const walletBalances: Record<string, number> = {};

  txs.forEach(t => {
    // Basic volume and transaction counts for purely informative stats
    const ket = (t.keterangan || '').toUpperCase();
    const katLower = t.kategori.toLowerCase();
    
    // We update stats specifically for informational displays (like cards)
    const isDigital = isDigitalPenjualan(t.kategori);

    if (t.kategori === 'Isi Saldo Bank' || katLower === 'inject saldo') {
      isiBank += t.nominal;
    } 
    if (t.kategori === 'Isi Modal Tunai Kasir' || katLower.includes('modal awal') || katLower.includes('modal tunai')) {
      kasModal += t.nominal;
    }
    if (t.kategori === 'Isi Saldo Real Aplikasi' || katLower === 'saldo real aplikasi') {
      saldoReal += t.nominal;
    }
    
    // Process purely financial transfer records for BALANCE (Double-Entry)
    if (t.sumber_dana) {
      const src = resolveWalletId(t.sumber_dana);
      walletBalances[src] = (walletBalances[src] || 0) - t.nominal;
    }
    
    if (t.tujuan_dana) {
      const dst = resolveWalletId(t.tujuan_dana);
      walletBalances[dst] = (walletBalances[dst] || 0) + (t.nominal + (t.admin_fee || t.adminFee || 0));
    }
    
    // Some stats bypass logic if it's purely a system / modal insertion
    if (t.kategori.startsWith('Isi') || t.kategori.startsWith('Tambah') || katLower.includes('operan shift') || katLower.includes('mutasi') || katLower.includes('setor tunai') || katLower === '___system___') {
      return; 
    }

    totalTransaksi++;
    totalVolume += t.nominal;

    // Aset Digital yang terpotong (legacy tracking)
    if (isDigital) bankOut += t.nominal;

    const isKhusus = ket.includes('[KHUSUS]');
    const isAksesoris = t.kategori === 'Aksesoris';
    const isNonTunai = ket.includes('[NON_TUNAI]') || (isAksesoris && (t.tujuan_dana || '').toUpperCase().includes('PENAMPUNG'));
    const isAdminDalam = ket.includes('[ADMIN_DALAM]');

    if (isKhusus) {
      totalKhusus += (t.nominal + (t.adminFee || 0));
      if (isAdminDalam) adminDalam += (t.adminFee || 0);
    } else {
      if (isAksesoris) {
        if (isNonTunai) {
          aksesorisNonTunai += t.nominal;
        } else {
          penjualanAksesoris += t.nominal;
        }
      } else if (t.kategori === 'Tarik Tunai') {
        tarikTunai += t.nominal; 
      } else if (isDigital) {
        penjualanDigital += t.nominal;
      }
      
      if (isNonTunai) {
        totalNonTunai += (t.adminFee || 0);
        if (isAdminDalam) adminDalam += (t.adminFee || 0);
      } else {
        if (isAdminDalam) {
          adminDalam += (t.adminFee || 0);
        } else {
          totalAdminCash += (t.adminFee || 0); 
        }
      }
    }
  });

  // Saldo Laci Kasir strictly tied to the wallet balance calculation!
  saldoLaciKasir = walletBalances['Bank08'] || 0;
  
  // Saldo Bank strictly tied to non-Laci, non-Tarik
  const saldoBank = Object.entries(walletBalances)
    .filter(([name]) => name !== 'Bank08' && name !== 'Bank09')
    .reduce((sum, [_, bal]) => sum + bal, 0);

  return {
    kasModal,
    isiBank,
    penjualanDigital,
    penjualanAksesoris,
    tarikTunai,
    totalAdminCash,
    adminDalam,
    totalKhusus,
    totalNonTunai,
    aksesorisNonTunai,
    totalVolume,
    totalTransaksi,
    saldoLaciKasir,
    saldoBank,
    saldoReal,
    bankOut
  };
};

export const compressImage = (file: File, maxWidth = 800, maxHeight = 800, quality = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};
