import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cdtnvqlxsbwcdiapbdkh.supabase.co';
const SUPABASE_KEY = 'sb_publishable_t_ZX1tPKl9q93fdiVU-LeA_rrnK4Sv5';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
