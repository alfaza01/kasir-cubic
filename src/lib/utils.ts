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
    katLower.startsWith('penarikan ') ||
    katLower.startsWith('koreksi ') ||
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
  walletBalances: Record<string, number>;
  walletRealBalances: Record<string, number>;
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
  const saldoRealMap: Record<string, number> = {};
  const walletRealBalances: Record<string, number> = {};

  txs.forEach(t => {
    // Basic volume and transaction counts for purely informative stats
    const ket = (t.keterangan || '').toUpperCase();
    const katLower = t.kategori.toLowerCase();
    
    // We update stats specifically for informational displays (like cards)
    const isDigital = isDigitalPenjualan(t.kategori);

    if (t.kategori === 'Isi Saldo Bank' || katLower === 'inject saldo' || (katLower.includes('modal awal') && t.tujuan_dana !== 'Bank08')) {
      isiBank += t.nominal;
    } else if (t.kategori === 'Penarikan Saldo Bank') {
      isiBank -= t.nominal;
    }
    
    if (t.kategori === 'Isi Modal Tunai Kasir' || (katLower.includes('modal awal') && (!t.tujuan_dana || t.tujuan_dana === 'Bank08')) || (katLower.includes('modal tunai') && !katLower.includes('penarikan'))) {
      kasModal += t.nominal;
    } else if (t.kategori === 'Penarikan Modal Tunai Kasir' || (katLower.includes('modal tunai') && katLower.includes('penarikan'))) {
      kasModal -= t.nominal;
    }
    if (t.kategori === 'Isi Saldo Real Aplikasi' || katLower === 'saldo real aplikasi') {
      const appName = ket || 'UNKNOWN';
      saldoRealMap[appName] = (saldoRealMap[appName] || 0) + t.nominal;
      // also put it in walletRealBalances using the appName exactly like AsetSaldoView does
      const cleanAppName = appName.trim().toUpperCase();
      if (cleanAppName) {
        walletRealBalances[cleanAppName] = (walletRealBalances[cleanAppName] || 0) + t.nominal;
      }
    }
    
    let sumber = t.sumber_dana ? resolveWalletId(t.sumber_dana) : null;
    let tujuan = t.tujuan_dana ? resolveWalletId(t.tujuan_dana) : null;

    if (!t.sumber_dana && !t.tujuan_dana) {
      // BACKWARD COMPATIBILITY: Legacy transactions without explicit wallets
      if (t.kategori === 'Isi Saldo Bank') {
        tujuan = 'Bank01';
      } else if (t.kategori === 'Isi Modal Tunai Kasir') {
        tujuan = 'Bank08';
      } else if (isDigital) {
        sumber = 'Bank01';
        tujuan = 'Bank08';
      } else if (t.kategori === 'Tarik Tunai') {
        sumber = 'Bank08';
        tujuan = 'Bank09';
      } else if (t.kategori === 'Aksesoris') {
        tujuan = 'Bank08';
      }
    }

    if (sumber) {
      walletBalances[sumber] = (walletBalances[sumber] || 0) - t.nominal;
    }
    
    const isAksesorisTx = t.kategori === 'Aksesoris';
    const isNonTunaiTx = ket.includes('[NON_TUNAI]') || (isAksesorisTx && (t.tujuan_dana || '').toUpperCase().includes('PENAMPUNG'));
    const adminFee = t.admin_fee || t.adminFee || 0;

    if (tujuan) {
      walletBalances[tujuan] = (walletBalances[tujuan] || 0) + t.nominal;
    }

    if (isNonTunaiTx) {
      walletBalances['Bank09'] = (walletBalances['Bank09'] || 0) + adminFee;
    } else {
      walletBalances['Bank08'] = (walletBalances['Bank08'] || 0) + adminFee;
    }
    
    const isLayananPelanggan = ['transfer', 'tarik tunai', 'aksesoris', 'topup', 'pembayaran'].some(cat => katLower.includes(cat));
    const isKhusus = ket.includes('[KHUSUS]');
    const isTambahSaldo = t.kategori.startsWith('Isi') || t.kategori.startsWith('Tambah') || t.kategori.startsWith('Penarikan') || t.kategori.startsWith('Koreksi') || katLower.includes('inject saldo');
    const isMutasiMode = katLower.includes('mutasi') || katLower.includes('setor tunai');
    const isModal = katLower.includes('modal awal') || katLower.includes('modal tunai');
    const isSistem = t.kategori === '___SYSTEM___' || !!katLower.match(/operan shift|tutup shift|pindah saldo/);
    
    const isPureSales = isLayananPelanggan || (!isKhusus && !isTambahSaldo && !isMutasiMode && !isModal && !isSistem);

    if (isPureSales) {
      totalTransaksi++;
      totalVolume += t.nominal;
    }

    // Aset Digital yang terpotong (legacy tracking)
    if (isDigital && isPureSales) bankOut += t.nominal;

    const isAksesoris = t.kategori === 'Aksesoris';
    const isNonTunai = ket.includes('[NON_TUNAI]') || (isAksesoris && (t.tujuan_dana || '').toUpperCase().includes('PENAMPUNG'));
    const isAdminDalam = ket.includes('[ADMIN_DALAM]');

    if (isKhusus) {
      totalKhusus += (t.nominal + (t.adminFee || 0));
      if (isAdminDalam) adminDalam += (t.adminFee || 0);
    } else if (isPureSales) {
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

  saldoReal = Object.values(saldoRealMap).reduce((sum, val) => sum + val, 0);

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
    bankOut,
    walletBalances,
    walletRealBalances: walletRealBalances
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

export const printReceiptToRawBT = (
  storeName: string,
  storeAddress: string,
  kasirName: string,
  transactionId: string,
  items: { name: string; qty: number; price: number }[],
  grandTotal: number,
  paid: number,
  change: number,
  tanggal: string
) => {
  const isNative = !!(window as any).bluetoothSerial;
  const macAddress = localStorage.getItem('bluetooth_printer_mac');

  if (isNative && macAddress) {
    // NATIVE BLUETOOTH PRINTER LOGIC (ESC/POS Plain text with 32 char limit)
    const MAX_CHAR = 32;
    const centerText = (text: string) => {
      const trimmed = text.substring(0, MAX_CHAR);
      const spaces = Math.max(0, Math.floor((MAX_CHAR - trimmed.length) / 2));
      return ' '.repeat(spaces) + trimmed + '\n';
    };
    
    const leftRightText = (left: string, right: string) => {
      const spaceLen = Math.max(0, MAX_CHAR - left.length - right.length);
      return left + ' '.repeat(spaceLen) + right + '\n';
    };

    let text = "";
    text += "\n";
    text += centerText(storeName || "NAMA TOKO");
    if (storeAddress) text += centerText(storeAddress);
    text += "-".repeat(MAX_CHAR) + "\n";
    text += leftRightText("Tgl: " + tanggal, "");
    if (kasirName) text += leftRightText("Ksr: " + kasirName, "");
    if (transactionId) text += leftRightText("Trx: " + transactionId, "");
    text += "-".repeat(MAX_CHAR) + "\n";
    
    items.forEach(it => {
      const name = it.name.length > MAX_CHAR ? it.name.substring(0, MAX_CHAR) : it.name;
      text += name + "\n";
      const left = `${it.qty}x ${formatRupiah(it.price).replace('Rp', '')}`;
      const right = formatRupiah(it.qty * it.price).replace('Rp', '');
      text += leftRightText(left, right);
    });
    
    text += "-".repeat(MAX_CHAR) + "\n";
    text += leftRightText("TOTAL", formatRupiah(grandTotal));
    if (paid > 0) text += leftRightText("TUNAI", formatRupiah(paid));
    if (change > 0) text += leftRightText("KEMBALI", formatRupiah(change));
    text += "-".repeat(MAX_CHAR) + "\n";
    text += centerText("Terima Kasih");
    text += "\n\n\n";

    (window as any).bluetoothSerial.write(
      text,
      () => console.log('Print success'),
      (err: any) => alert('Print error: ' + err)
    );
  } else {
    // PWA RAWBT INTENT LOGIC
    let text = "";
    text += "[C]<b>" + (storeName || "NAMA TOKO") + "</b>\n";
    if (storeAddress) text += "[C]" + storeAddress + "\n";
    text += "[C]--------------------------------\n";
    text += "[L]Tgl: " + tanggal + "\n";
    if (kasirName) text += "[L]Ksr: " + kasirName + "\n";
    if (transactionId) text += "[L]Trx: " + transactionId + "\n";
    text += "[C]--------------------------------\n";
    
    items.forEach(it => {
      text += "[L]" + it.name + "\n";
      text += "[L]" + it.qty + "x " + formatRupiah(it.price).replace('Rp', '') + " [R]" + formatRupiah(it.qty * it.price).replace('Rp', '') + "\n";
    });
    
    text += "[C]--------------------------------\n";
    text += "[L]<b>TOTAL</b> [R]<b>" + formatRupiah(grandTotal) + "</b>\n";
    if (paid > 0) text += "[L]TUNAI [R]" + formatRupiah(paid) + "\n";
    if (change > 0) text += "[L]KEMBALI [R]" + formatRupiah(change) + "\n";
    text += "[C]--------------------------------\n";
    text += "[C]Terima Kasih\n\n\n";

    const intentUrl = "intent:" + encodeURIComponent(text) + "#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;";
    window.location.href = intentUrl;
  }
};
