import { createClient } from '@supabase/supabase-js'

const getEnv = (key: string) => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key]
  }
  return ''
}

const supabaseUrl = getEnv('VITE_SUPABASE_URL')
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY')

const hasBypass = typeof window !== 'undefined' && 
  (window.location.search.includes('bypass=true') || 
   localStorage.getItem('alphaPro_bypass') === 'true')

class QueryChain {
  table: string
  filters: Array<{ field: string; operator: string; value: any }> = []
  orderBy: { field: string; ascending: boolean } | null = null
  limitCount: number | null = null

  constructor(table: string) {
    this.table = table
  }

  select(fields?: string) {
    return this
  }

  eq(field: string, value: any) {
    this.filters.push({ field, operator: 'eq', value })
    return this
  }

  neq(field: string, value: any) {
    this.filters.push({ field, operator: 'neq', value })
    return this
  }

  order(field: string, options: { ascending: boolean } = { ascending: true }) {
    this.orderBy = { field, ascending: options.ascending }
    return this
  }

  limit(count: number) {
    this.limitCount = count
    return this
  }

  async getResult(singleMode: 'maybeSingle' | 'single' | 'many' = 'many'): Promise<{ data: any; error: any }> {
    try {
      let items = JSON.parse(localStorage.getItem(`cubic_db_${this.table}`) || '[]')
      
      // Khusus untuk lisensi, buat 1 lisensi demo secara otomatis jika tabel kosong agar tidak macet
      if (this.table === 'cubic_licenses' && items.length === 0) {
        items = [{ id: 'lic_demo', code: 'CUBIC-DEMO-2026', active: true, user_id: 'bypass-google-uid', name: 'Demo License' }]
        localStorage.setItem(`cubic_db_cubic_licenses`, JSON.stringify(items))
      }

      // Khusus untuk store_settings, buat pengaturan bawaan jika belum ada tapi toko sudah ada
      if (this.table === 'store_settings') {
        const storeIdFilter = this.filters.find(f => f.field === 'store_id')?.value
        if (storeIdFilter) {
          const exists = items.some((item: any) => item.store_id === storeIdFilter)
          if (!exists) {
            const defaultSettings = {
              id: `local_settings_${storeIdFilter}`,
              store_id: storeIdFilter,
              cashiers: {
                'owner': { pin: '0000', role: 'owner', name: 'Owner' },
                'kasir1': { pin: '1234', role: 'kasir', name: 'Kasir 1' },
                'kasir2': { pin: '5678', role: 'kasir', name: 'Kasir 2' },
              },
              presets: [],
              running_texts: Array(15).fill(''),
              main_announcement: `Selamat Datang`,
              is_pin_enabled: true,
            }
            items.push(defaultSettings)
            localStorage.setItem(`cubic_db_store_settings`, JSON.stringify(items))
          }
        }
      }

      // Apply filters
      for (const filter of this.filters) {
        if (filter.operator === 'eq') {
          items = items.filter((item: any) => item[filter.field] === filter.value)
        } else if (filter.operator === 'neq') {
          items = items.filter((item: any) => item[filter.field] !== filter.value)
        }
      }

      // Apply sorting
      if (this.orderBy) {
        const { field, ascending } = this.orderBy
        items.sort((a: any, b: any) => {
          const valA = a[field]
          const valB = b[field]
          if (valA === undefined) return 1
          if (valB === undefined) return -1
          if (valA < valB) return ascending ? -1 : 1
          if (valA > valB) return ascending ? 1 : -1
          return 0
        })
      }

      if (this.limitCount !== null) {
        items = items.slice(0, this.limitCount)
      }

      if (singleMode === 'single') {
        if (items.length === 0) {
          return { data: null, error: { message: 'Row not found' } }
        }
        return { data: items[0], error: null }
      } else if (singleMode === 'maybeSingle') {
        return { data: items.length > 0 ? items[0] : null, error: null }
      }
      return { data: items, error: null }
    } catch (err: any) {
      return { data: null, error: err }
    }
  }

  then(onfulfilled: any, onrejected?: any) {
    return this.getResult('many').then(onfulfilled, onrejected)
  }

  async single() {
    return this.getResult('single')
  }

  async maybeSingle() {
    return this.getResult('maybeSingle')
  }

  insert(rowOrRows: any) {
    try {
      const items = JSON.parse(localStorage.getItem(`cubic_db_${this.table}`) || '[]')
      const isArray = Array.isArray(rowOrRows)
      const rowsToInsert = isArray ? rowOrRows : [rowOrRows]

      const inserted: any[] = []
      for (const row of rowsToInsert) {
        const newRow = {
          id: row.id || `local_${Math.random().toString(36).substr(2, 9)}`,
          created_at: new Date().toISOString(),
          timestamp: row.timestamp || new Date().toISOString(),
          ...row
        }
        items.push(newRow)
        inserted.push(newRow)
      }

      localStorage.setItem(`cubic_db_${this.table}`, JSON.stringify(items))
      
      const chainResult: any = {
        data: isArray ? inserted : inserted[0],
        error: null,
        select: () => chainResult,
        single: async () => ({ data: inserted[0], error: null }),
        maybeSingle: async () => ({ data: inserted[0], error: null }),
        then: (onfulfilled: any) => onfulfilled({ data: isArray ? inserted : inserted[0], error: null })
      }
      return chainResult
    } catch (err: any) {
      return { data: null, error: err, select: () => ({ then: (cb: any) => cb({data: null, error: err}) }) } as any
    }
  }

  update(updates: any) {
    try {
      let items = JSON.parse(localStorage.getItem(`cubic_db_${this.table}`) || '[]')
      const updated: any[] = []
      
      items = items.map((item: any) => {
        let match = true
        for (const filter of this.filters) {
          if (filter.operator === 'eq' && item[filter.field] !== filter.value) {
            match = false
          } else if (filter.operator === 'neq' && item[filter.field] === filter.value) {
            match = false
          }
        }
        if (match) {
          const newItem = { ...item, ...updates }
          updated.push(newItem)
          return newItem
        }
        return item
      })

      localStorage.setItem(`cubic_db_${this.table}`, JSON.stringify(items))
      
      const chainResult: any = {
        data: updated,
        error: null,
        select: () => chainResult,
        single: async () => ({ data: updated[0], error: null }),
        maybeSingle: async () => ({ data: updated[0], error: null }),
        then: (onfulfilled: any) => onfulfilled({ data: updated, error: null })
      }
      return chainResult
    } catch (err: any) {
      return { data: null, error: err, select: () => ({ then: (cb: any) => cb({data: null, error: err}) }) } as any
    }
  }

  delete() {
    const self = this;
    const deleteChain = {
      eq: (field: string, value: any) => {
        try {
          let items = JSON.parse(localStorage.getItem(`cubic_db_${self.table}`) || '[]')
          items = items.filter((item: any) => item[field] !== value)
          localStorage.setItem(`cubic_db_${self.table}`, JSON.stringify(items))
          const res = { data: null, error: null }
          return { ...res, then: (cb: any) => cb(res) }
        } catch (err: any) {
          const res = { data: null, error: err }
          return { ...res, then: (cb: any) => cb(res) }
        }
      },
      neq: (field: string, value: any) => {
        try {
          let items = JSON.parse(localStorage.getItem(`cubic_db_${self.table}`) || '[]')
          items = items.filter((item: any) => item[field] === value)
          localStorage.setItem(`cubic_db_${self.table}`, JSON.stringify(items))
          const res = { data: null, error: null }
          return { ...res, then: (cb: any) => cb(res) }
        } catch (err: any) {
          const res = { data: null, error: err }
          return { ...res, then: (cb: any) => cb(res) }
        }
      },
      then: (onfulfilled: any) => onfulfilled({ data: null, error: null })
    }
    return deleteChain
  }

  upsert(rowOrRows: any) {
    try {
      const items = JSON.parse(localStorage.getItem(`cubic_db_${this.table}`) || '[]')
      const isArray = Array.isArray(rowOrRows)
      const rows = isArray ? rowOrRows : [rowOrRows]

      for (const row of rows) {
        let matchedIndex = -1
        if (row.id) {
          matchedIndex = items.findIndex((item: any) => item.id === row.id)
        } else if (this.table === 'store_settings' && row.store_id) {
          matchedIndex = items.findIndex((item: any) => item.store_id === row.store_id)
        }

        if (matchedIndex > -1) {
          items[matchedIndex] = { ...items[matchedIndex], ...row }
        } else {
          items.push({
            id: row.id || `local_${Math.random().toString(36).substr(2, 9)}`,
            created_at: new Date().toISOString(),
            ...row
          })
        }
      }

      localStorage.setItem(`cubic_db_${this.table}`, JSON.stringify(items))
      
      const chainResult: any = {
        data: rowOrRows,
        error: null,
        select: () => chainResult,
        single: async () => ({ data: Array.isArray(rowOrRows)? rowOrRows[0]: rowOrRows, error: null }),
        maybeSingle: async () => ({ data: Array.isArray(rowOrRows)? rowOrRows[0]: rowOrRows, error: null }),
        then: (onfulfilled: any) => onfulfilled({ data: rowOrRows, error: null })
      }
      return chainResult
    } catch (err: any) {
      return { data: null, error: err, select: () => ({ then: (cb: any) => cb({data: null, error: err}) }) } as any
    }
  }
}

const makeChannel = (): any => {
  const channel = {
    on: () => channel,
    subscribe: () => channel,
  }
  return channel
}

const localSupabase = {
  auth: {
    getSession: async () => {
      const email = localStorage.getItem('alphaPro_email') || 'demo@alfaza.com';
      const actuallyBypassed = localStorage.getItem('alphaPro_bypass') === 'true' || window.location.search.includes('bypass=true')
      
      if (!actuallyBypassed) {
        return { data: { session: null }, error: null }
      }

      return {
        data: {
          session: {
            user: { id: 'bypass-google-uid', email }
          }
        },
        error: null
      }
    },
    onAuthStateChange: (callback: any) => {
      const email = localStorage.getItem('alphaPro_email') || 'demo@alfaza.com';
      const actuallyBypassed = localStorage.getItem('alphaPro_bypass') === 'true' || window.location.search.includes('bypass=true')
      
      const session = actuallyBypassed ? {
        user: { id: 'bypass-google-uid', email }
      } : null

      setTimeout(() => {
        callback(actuallyBypassed ? 'SIGNED_IN' : 'SIGNED_OUT', session)
      }, 50)
      return { data: { subscription: { unsubscribe: () => {} } } }
    },
    signOut: async () => {
      localStorage.removeItem('alphaPro_bypass')
      localStorage.removeItem('alphaPro_loggedIn')
      localStorage.removeItem('alphaPro_username')
      localStorage.removeItem('alphaPro_active_role')
      localStorage.removeItem('alphaPro_active_store_id')
      localStorage.removeItem('alphaPro_active_store')
      window.location.reload()
    },
    signInWithOAuth: async () => ({ data: { url: null }, error: null }),
    exchangeCodeForSession: async () => ({ data: { session: null }, error: null }),
    setSession: async () => ({ data: { session: null }, error: null }),
  },
  from: (table: string) => {
    return new QueryChain(table)
  },
  channel: () => makeChannel(),
  removeChannel: () => {}
}

let client: any

// Use real Supabase ONLY if not in bypass/offline mode and URL is present
if (supabaseUrl && supabaseAnonKey && !hasBypass) {
  try {
    // Only attempt to start real client if the URL is somewhat valid looking
    if (supabaseUrl.startsWith('http')) {
      client = createClient(supabaseUrl, supabaseAnonKey)
    }
  } catch (err) {
    console.error('Failed to create real Supabase client:', err)
  }
}

if (!client) {
  client = localSupabase
}

export const supabase = client

