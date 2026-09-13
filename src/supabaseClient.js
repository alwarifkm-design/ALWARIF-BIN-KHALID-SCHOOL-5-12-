import { createClient } from '@supabase/supabase-js'

// استبدل الـ Project ID بمعرّفك الخاطئ
const supabaseUrl = 'https://rynnczvyzziudknjihqa.supabase.co'

// ضع المفتاح الطويل الذي نسخته بجانب كلمة anon public key
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5bm5jenZ5enppdWRrbmppaHFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyMDE1ODIsImV4cCI6MjEwNDc3NzU4Mn0.531P_K7F1ZvTO7xbRTUM5YLpDRB_ZSDI0D2khSU4ktc'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)