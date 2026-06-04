export const SECRET_SALT = "CUBA_PRO_2026_SECRET_XYZ"

// A simple deterministic hash function for strings
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Packages definition
export const LICENSE_PACKAGES = {
  'STARTER': 30, // days
  'BRONZE': 150,
  'GOLD': 365,
  'DIAMOND': 36500 // lifetime
}

/**
 * Generate a 16-character license code
 */
export function generateLicenseCode(deviceId: string, packageType: keyof typeof LICENSE_PACKAGES): string {
  const pkgKeys = Object.keys(LICENSE_PACKAGES)
  const pkgIndex = pkgKeys.indexOf(packageType)
  const pkgId = String(pkgIndex + 1).padStart(2, '0')
  
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let salt = ''
  for(let i=0; i<4; i++) salt += chars.charAt(Math.floor(Math.random() * chars.length))
  
  const payload = `${deviceId}|${packageType}|${salt}|${SECRET_SALT}`
  const hash1 = simpleHash(payload).toString(36).toUpperCase().padStart(6, '0')
  const hash2 = simpleHash(payload + "REVERSE").toString(36).toUpperCase().padStart(6, '0')
  
  const hashCombined = (hash1 + hash2).substring(0, 10)
  const rawCode = `${pkgId}${salt}${hashCombined}`
  
  return rawCode.match(/.{1,4}/g)?.join('-') || rawCode
}

export interface LicenseValidation {
  valid: boolean
  packageType?: string
  days?: number
  error?: string
}

export function validateLicenseCode(deviceId: string, code: string): LicenseValidation {
  const rawCode = code.replace(/-/g, '').toUpperCase()
  if (rawCode.length !== 16) return { valid: false, error: 'Kode tidak valid (harus 16 karakter)' }
  
  const pkgIdStr = rawCode.substring(0, 2)
  const salt = rawCode.substring(2, 6)
  const providedHash = rawCode.substring(6, 16)
  
  const pkgIndex = parseInt(pkgIdStr, 10) - 1
  const pkgKeys = Object.keys(LICENSE_PACKAGES)
  if (pkgIndex < 0 || pkgIndex >= pkgKeys.length) return { valid: false, error: 'Tipe paket tidak dikenali' }
  
  const packageType = pkgKeys[pkgIndex] as keyof typeof LICENSE_PACKAGES
  
  const payload = `${deviceId}|${packageType}|${salt}|${SECRET_SALT}`
  const hash1 = simpleHash(payload).toString(36).toUpperCase().padStart(6, '0')
  const hash2 = simpleHash(payload + "REVERSE").toString(36).toUpperCase().padStart(6, '0')
  const expectedHash = (hash1 + hash2).substring(0, 10)
  
  if (providedHash !== expectedHash) {
    return { valid: false, error: 'Kode lisensi tidak cocok dengan perangkat ini' }
  }
  
  return {
    valid: true,
    packageType,
    days: LICENSE_PACKAGES[packageType]
  }
}

export type LicenseStatus = 
  | { state: 'TRIAL'; daysLeft: number }
  | { state: 'ACTIVE'; packageType: string; daysLeft: number }
  | { state: 'EXPIRED'; reason: string }

export function checkAppLicenseStatus(): LicenseStatus {
  const now = Date.now();
  
  // Anti-cheat: Check if clock was moved backwards
  const lastActiveStr = localStorage.getItem('cubic_last_active_time');
  if (lastActiveStr) {
    const lastActive = parseInt(lastActiveStr, 10);
    // If the current time is mysteriously older than the last recorded time by more than 1 hour (allowing minor tz changes), block!
    if (now < lastActive - 3600000) {
      return { state: 'EXPIRED', reason: 'Terdeteksi manipulasi waktu (Jam mundur).' };
    }
  }
  localStorage.setItem('cubic_last_active_time', now.toString());

  // Check Purchased License first
  const savedLic = localStorage.getItem('cubic_license_info');
  if (savedLic) {
    try {
      const licData = JSON.parse(savedLic);
      const expiresAt = new Date(licData.expiresAt).getTime();
      const daysLeft = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));
      
      if (now > expiresAt) {
        return { state: 'EXPIRED', reason: 'Masa lisensi telah habis.' };
      }
      
      return { state: 'ACTIVE', packageType: licData.packageType, daysLeft: Math.max(0, daysLeft) };
    } catch(e) {}
  }
  
  // If no valid purchased license, check Trial
  let installDateStr = localStorage.getItem('cubic_install_date');
  if (!installDateStr) {
    // First time open
    installDateStr = now.toString();
    localStorage.setItem('cubic_install_date', installDateStr);
  }
  
  const installDate = parseInt(installDateStr, 10);
  const trialDays = 7;
  const trialExpiresAt = installDate + (trialDays * 24 * 60 * 60 * 1000);
  
  if (now > trialExpiresAt) {
    return { state: 'EXPIRED', reason: 'Masa percobaan (Trial 7 Hari) telah habis.' };
  }
  
  const trialDaysLeft = Math.ceil((trialExpiresAt - now) / (1000 * 60 * 60 * 24));
  return { state: 'TRIAL', daysLeft: Math.max(0, trialDaysLeft) };
}
