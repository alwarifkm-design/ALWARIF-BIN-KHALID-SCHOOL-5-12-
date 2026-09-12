// Local auth/client implementation for the school system.
// This keeps the app usable outside the Base44 runtime and supports:
// - admin-managed accounts
// - role-based access
// - manager-only secret code reset flow

import { supabase, hasSupabaseConfig } from '../lib/supabase.js'

const ACCOUNTS_KEY = 'school_accounts'
const CURRENT_USER_KEY = 'school_current_user'
const SCHOOL_SETTINGS_KEY = 'school_settings'
const REGISTRATION_CODE_KEY = 'school_registration_code'
const DEFAULT_MANAGER_SECRET = '123456'
const DEFAULT_MANAGER_PASSWORD = 'Admin@123'

function safeStorageGet(key, fallback) {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : fallback
  } catch {
    return fallback
  }
}

function safeStorageSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Ignore storage issues in restricted browsers
  }
}

function makeId(prefix = 'id') {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return `${prefix}_${crypto.randomUUID()}`
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

function hashPassword(password) {
  return btoa(unescape(encodeURIComponent(password)))
}

function passwordMatches(account, candidatePassword) {
  if (!account || !candidatePassword) return false
  const candidate = String(candidatePassword)
  return (
    String(account.password || '') === candidate ||
    String(account.plain_password || '') === candidate ||
    String(account.password || '') === hashPassword(candidate) ||
    String(account.plain_password || '') === hashPassword(candidate)
  )
}

function normalizeAccount(account) {
  if (!account) return null
  return {
    id: account.id,
    name: account.name || 'User',
    email: (account.email || '').toLowerCase(),
    password: account.password || '',
    plain_password: account.plain_password || '',
    role: account.role || 'supervisor',
    phone: account.phone || '',
    status: account.status || 'active',
    created_at: account.created_at || new Date().toISOString(),
    last_login: account.last_login || null,
  }
}

function getAccounts() {
  const accounts = safeStorageGet(ACCOUNTS_KEY, [])
  const normalized = (accounts || []).map(normalizeAccount).filter(Boolean)

  const adminExists = normalized.some((user) => user.role === 'admin')
  if (!adminExists) {
    const adminUser = normalizeAccount({
      id: makeId('admin'),
      name: 'Manager',
      email: 'admin@school.edu.om',
      password: hashPassword(DEFAULT_MANAGER_PASSWORD),
      plain_password: DEFAULT_MANAGER_PASSWORD,
      role: 'admin',
      phone: '+966500000000',
      status: 'active',
      created_at: new Date().toISOString(),
    })
    normalized.unshift(adminUser)
    safeStorageSet(ACCOUNTS_KEY, normalized)
  }

  const admin = normalized.find((user) => user.role === 'admin')
  if (admin && !admin.plain_password) {
    admin.plain_password = DEFAULT_MANAGER_PASSWORD
    admin.password = hashPassword(DEFAULT_MANAGER_PASSWORD)
  }

  return normalized
}

function saveAccounts(accounts) {
  safeStorageSet(ACCOUNTS_KEY, (accounts || []).map(normalizeAccount).filter(Boolean))
}

function getCurrentUserFromStorage() {
  const user = safeStorageGet(CURRENT_USER_KEY, null)
  if (!user) return null
  return normalizeAccount(user)
}

function getSchoolSettings() {
  const settings = safeStorageGet(SCHOOL_SETTINGS_KEY, {
    school_name: 'الوارف بن خالد 5-12',
    school_name_en: 'Alwarif Bin Khalid School',
    school_subtitle: 'نظام إدارة المدرسة',
    school_subtitle_en: 'School Management System',
    phone: '+966500000000',
    email: 'info@school.edu.om',
    website: 'https://school.edu.om',
    address: 'المدينة',
    manager_secret_code: DEFAULT_MANAGER_SECRET,
  })

  return {
    ...settings,
    manager_secret_code: settings.manager_secret_code || DEFAULT_MANAGER_SECRET,
  }
}

function saveSchoolSettings(nextValue) {
  safeStorageSet(SCHOOL_SETTINGS_KEY, nextValue)
}

function getRegistrationCodeState() {
  return safeStorageGet(REGISTRATION_CODE_KEY, null)
}

function saveRegistrationCodeState(nextValue) {
  safeStorageSet(REGISTRATION_CODE_KEY, nextValue)
}

function generateRegistrationCode() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const code = Array.from({ length: 3 }, () => letters[Math.floor(Math.random() * letters.length)]).join('')
  const expiresAt = Date.now() + 5 * 60 * 1000
  const state = { code, expiresAt }
  saveRegistrationCodeState(state)
  return state
}

function isRegistrationCodeExpired(codeState) {
  if (!codeState) return true
  return Date.now() > Number(codeState.expiresAt || 0)
}

export const base44Client = {
  auth: {
    async login(email, password) {
      if (supabase && hasSupabaseConfig()) {
        const { data, error } = await supabase.from('accounts').select('*').eq('email', String(email || '').trim().toLowerCase()).maybeSingle()
        if (error || !data) throw new Error('Invalid credentials')
        if (!passwordMatches(data, password)) throw new Error('Invalid credentials')
        const safeUser = { ...data, password: undefined, plain_password: undefined }
        safeStorageSet(CURRENT_USER_KEY, safeUser)
        return { user: safeUser }
      }

      const accounts = getAccounts()
      const user = accounts.find(account => account.email.toLowerCase() === String(email || '').trim().toLowerCase())

      if (!user || user.password !== hashPassword(password)) {
        throw new Error('Invalid credentials')
      }

      const safeUser = { ...user, password: undefined, plain_password: undefined }
      safeStorageSet(CURRENT_USER_KEY, safeUser)
      return { user: safeUser }
    },

    async loginWithProvider(provider) {
      if (provider !== 'google') {
        throw new Error('Provider not supported')
      }
      throw new Error('Google login is not enabled in this local build')
    },

    async register(data) {
      const email = String(data?.email || '').trim().toLowerCase()
      if (supabase && hasSupabaseConfig()) {
        const { data: existing, error: checkError } = await supabase.from('accounts').select('id').eq('email', email).maybeSingle()
        if (checkError) throw checkError
        if (existing) throw new Error('Account already exists')

        const registrationCode = String(data?.registration_code || '').trim().toUpperCase()
        const activeCode = getRegistrationCodeState()
        if (!activeCode || isRegistrationCodeExpired(activeCode) || activeCode.code !== registrationCode) {
          throw new Error('Registration code expired or invalid. Ask the manager for a new one.')
        }

        const accountPayload = {
          name: data.name,
          email,
          password: data.password,
          plain_password: data.password,
          role: data.role || 'supervisor',
          phone: data.phone || '',
          status: data.status || 'active',
        }

        const { data: saved, error } = await supabase.from('accounts').insert(accountPayload).select().single()
        if (error) throw error
        saveRegistrationCodeState(null)
        return { user: { ...saved, password: undefined, plain_password: undefined } }
      }

      const accounts = getAccounts()
      const registrationCode = String(data?.registration_code || '').trim().toUpperCase()

      if (!data?.name || !email || !data?.password) {
        throw new Error('Missing required data')
      }

      if (accounts.some(account => account.email === email)) {
        throw new Error('Account already exists')
      }

      const activeCode = getRegistrationCodeState()
      if (!activeCode || isRegistrationCodeExpired(activeCode) || activeCode.code !== registrationCode) {
        throw new Error('Registration code expired or invalid. Ask the manager for a new one.')
      }

      const account = normalizeAccount({
        id: makeId('user'),
        name: data.name,
        email,
        password: hashPassword(data.password),
        plain_password: data.password,
        role: data.role || 'supervisor',
        phone: data.phone || '',
        status: data.status || 'active',
        created_at: new Date().toISOString(),
      })

      accounts.push(account)
      saveAccounts(accounts)
      saveRegistrationCodeState(null)
      return { user: { ...account, password: undefined } }
    },

    async verifyOtp() {
      return true
    },

    async resendOtp() {
      return true
    },

    async logout() {
      safeStorageSet(CURRENT_USER_KEY, null)
      return true
    },

    async forgotPassword(email) {
      const accounts = getAccounts()
      const found = accounts.find(account => account.email.toLowerCase() === String(email || '').trim().toLowerCase())
      if (!found) return { sent: true }
      return { sent: true, email: found.email }
    },

    async resetPassword(token, newPassword) {
      if (!token || !newPassword) {
        throw new Error('Token and password are required')
      }
      return { success: true, token }
    },

    async resetPasswordByManagerCode({ email, managerCode, newPassword }) {
      const accounts = getAccounts()
      const admin = accounts.find(account => account.role === 'admin')

      if (!admin) {
        throw new Error('Manager account not found')
      }

      const settings = getSchoolSettings()
      if (String(managerCode || '').trim() !== (settings.manager_secret_code || DEFAULT_MANAGER_SECRET)) {
        throw new Error('Manager secret code is incorrect')
      }

      const target = accounts.find(account => account.email.toLowerCase() === String(email || '').trim().toLowerCase())
      if (!target) {
        throw new Error('Account not found')
      }

      if (!newPassword || String(newPassword).length < 8) {
        throw new Error('Password must be at least 8 characters')
      }

      target.password = hashPassword(newPassword)
      target.plain_password = newPassword
      saveAccounts(accounts)
      return { success: true, email: target.email }
    },

    async listAccounts() {
      if (supabase && hasSupabaseConfig()) {
        const { data, error } = await supabase.from('accounts').select('*')
        if (error) throw error
        return (data || []).map((account) => ({ ...account, password: undefined, plain_password: account.plain_password || '' }))
      }

      return getAccounts().map(account => ({ ...account, password: undefined, plain_password: account.plain_password || '' }))
    },

    async createAccount(data) {
      return this.register(data)
    },

    async updateAccount(id, data) {
      if (supabase && hasSupabaseConfig()) {
        const payload = { ...data }
        if (payload.password) {
          payload.plain_password = payload.password
        }
        const { data: updated, error } = await supabase.from('accounts').update(payload).eq('id', id).select().single()
        if (error) throw error
        return { ...updated, password: undefined, plain_password: updated.plain_password || '' }
      }

      const accounts = getAccounts()
      const index = accounts.findIndex(account => account.id === id)
      if (index === -1) throw new Error('Account not found')

      const next = { ...accounts[index], ...data }
      if (data.password) {
        next.password = hashPassword(data.password)
        next.plain_password = data.password
      }
      accounts[index] = normalizeAccount(next)
      saveAccounts(accounts)
      return { ...accounts[index], password: undefined, plain_password: accounts[index].plain_password || '' }
    },

    async deleteAccount(id) {
      if (supabase && hasSupabaseConfig()) {
        const { error } = await supabase.from('accounts').delete().eq('id', id)
        if (error) throw error
        return true
      }

      const accounts = getAccounts()
      const filtered = accounts.filter(account => account.id !== id)
      saveAccounts(filtered)
      return true
    },

    getCurrentUser() {
      return getCurrentUserFromStorage()
    },

    getSchoolSettings,
    saveSchoolSettings,
    getManagerSecretCode() {
      return getSchoolSettings().manager_secret_code || DEFAULT_MANAGER_SECRET
    },
    setManagerSecretCode(value) {
      const settings = getSchoolSettings()
      const next = { ...settings, manager_secret_code: value || DEFAULT_MANAGER_SECRET }
      saveSchoolSettings(next)
      return next
    },
    setManagerPassword(value) {
      if (supabase && hasSupabaseConfig()) {
        return supabase.from('accounts').update({ password: value, plain_password: value }).eq('role', 'admin').select().single().then(({ data, error }) => {
          if (error) throw error
          return { ...data, password: undefined, plain_password: value }
        })
      }

      const accounts = getAccounts()
      const admin = accounts.find((account) => account.role === 'admin')
      if (!admin) throw new Error('Manager account not found')
      admin.password = hashPassword(value)
      admin.plain_password = value
      saveAccounts(accounts)
      return { ...admin, password: undefined, plain_password: value }
    },
    getRegistrationCode() {
      const state = getRegistrationCodeState()
      if (!state || isRegistrationCodeExpired(state)) {
        return null
      }
      return state
    },
    generateRegistrationCode() {
      return generateRegistrationCode()
    },
    isRegistrationCodeValid(code) {
      const state = getRegistrationCodeState()
      return !!state && !isRegistrationCodeExpired(state) && String(code || '').trim().toUpperCase() === String(state.code || '').trim().toUpperCase()
    },
  },
  entities: {
    Student: createSupabaseEntity('students'),
    Section: createSupabaseEntity('sections'),
    Teacher: createSupabaseEntity('teachers'),
    Subject: createSupabaseEntity('subjects'),
    TimetableSlot: createSupabaseEntity('timetable_slots'),
    Violation: createSupabaseEntity('violations'),
    SubjectForm: createSupabaseEntity('subject_forms'),
    Supervisor: createSupabaseEntity('accounts'),
  },
}

function createEntityStub(name) {
  const store = []
  return {
    list: async (filters) => store.filter(item => {
      if (!filters) return true
      return Object.entries(filters).every(([k, v]) => item[k] === v)
    }),
    create: async (data) => {
      const item = { ...data, id: makeId(name), created_date: new Date().toISOString(), updated_date: new Date().toISOString() }
      store.push(item)
      return item
    },
    update: async (id, data) => {
      const idx = store.findIndex(i => i.id === id)
      if (idx === -1) throw new Error(`${name} not found: ${id}`)
      store[idx] = { ...store[idx], ...data, updated_date: new Date().toISOString() }
      return store[idx]
    },
    delete: async (id) => {
      const idx = store.findIndex(i => i.id === id)
      if (idx !== -1) store.splice(idx, 1)
    },
    bulkCreate: async (items) => {
      return Promise.all(items.map(item => createEntityStub(name).create(item)))
    },
    bulkUpdate: async (updates) => {
      return Promise.all(updates.map(({ id, ...data }) => createEntityStub(name).update(id, data)))
    },
  }
}

function createSupabaseEntity(tableName) {
  if (!supabase || !hasSupabaseConfig()) {
    return createEntityStub(tableName)
  }

  const mapTableName = tableName.toLowerCase()

  return {
    list: async (filters = {}) => {
      let query = supabase.from(mapTableName).select('*')
      if (filters && Object.keys(filters).length) {
        Object.entries(filters).forEach(([key, value]) => {
          query = query.eq(key, value)
        })
      }
      const { data, error } = await query
      if (error) throw error
      return data || []
    },
    create: async (data) => {
      const { data: result, error } = await supabase.from(mapTableName).insert(data).select().single()
      if (error) throw error
      return result
    },
    update: async (id, data) => {
      const { data: result, error } = await supabase.from(mapTableName).update(data).eq('id', id).select().single()
      if (error) throw error
      return result
    },
    delete: async (id) => {
      const { error } = await supabase.from(mapTableName).delete().eq('id', id)
      if (error) throw error
      return true
    },
    bulkCreate: async (items) => {
      const { data, error } = await supabase.from(mapTableName).insert(items).select()
      if (error) throw error
      return data || []
    },
    bulkUpdate: async (updates) => {
      const results = []
      for (const item of updates) {
        const { id, ...data } = item
        const { data: result, error } = await supabase.from(mapTableName).update(data).eq('id', id).select().single()
        if (error) throw error
        results.push(result)
      }
      return results
    },
  }
}

export default base44Client
