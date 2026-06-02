export type TransactionCategory = 
  | 'TRANSFER BANK' 
  | 'DANA' 
  | 'APLIKASI PPOB' 
  | 'ORDERKUOTA' 
  | 'Tarik Tunai' 
  | 'Aksesoris'
  | 'Isi Saldo Bank'
  | 'Isi Saldo Real Aplikasi'
  | 'Isi Modal Tunai Kasir'
  | 'Isi Total Penjualan';

export interface WalletNode {
  id: string;
  name: string;
  isHidden: boolean;
  isLocked: boolean;
  format?: 'nominal_admin' | 'modal_jual';
}

export interface Transaction {
  id: string;
  kategori: TransactionCategory | string;
  sumber_dana?: string;
  tujuan_dana?: string;
  nominal: number;
  adminFee: number;
  admin_fee?: number;
  keterangan: string;
  timestamp: string;
  isEdited?: boolean;
  originalNominal?: number;
  originalAdminFee?: number;
  originalKategori?: string;
  kasir_id?: string;
  store_id?: string;
}

export interface AppState {
  saldoBank: number;
  totalPenjualan: number;
  transactions: Transaction[];
}

export interface Absensi {
  id?: number;
  username: string;
  nama: string;
  tanggal: string; // YYYY-MM-DD
  jam_masuk: string; // HH:mm:ss
  status: 'Hadir' | 'Libur';
  store_id?: string; // Menyimpan ID toko absensi ini
}

export interface PresetOtomatis {
  id: string;
  kategori?: string;
  keterangan: string;
  modal: number;
  jual: number;
}

export interface Store {
  id: string;
  user_id: string;
  name: string;
  subtext?: string;
  photo_url?: string;
  created_at?: string;
}

export interface StoreSettings {
  store_id: string;
  cashiers: Record<string, any>;
  presets: PresetOtomatis[];
  running_texts: string[];
  main_announcement: string;
  is_pin_enabled: boolean;
}

