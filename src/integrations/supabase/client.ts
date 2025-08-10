
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = 'https://cfxecxtkwgbfeqeichij.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmeGVjeHRrd2diZmVxZWljaGlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk3MTMxNTEsImV4cCI6MjA1NTI4OTE1MX0.1t8Ok6Z7-etahezyQpa1xZBZ753grYxj9BTVvRFeKhY'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
})
