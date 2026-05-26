import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ypuaavawvscpmxglkeiy.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_0mHCQXKxJnGV9Igk54S17A_V4UK90AL'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
