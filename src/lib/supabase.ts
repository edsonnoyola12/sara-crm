import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hwyrxlnycrlgohrecbpx.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3eXJ4bG55Y3JsZ29ocmVjYnB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MDI5MzksImV4cCI6MjA3ODI3ODkzOX0.LqykcvHbFu5DPd0sByeLgznrOeA4V40lGgzrggG8wVU'

export const supabase = createClient(supabaseUrl, supabaseKey)
