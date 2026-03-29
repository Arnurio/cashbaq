import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xurjanbmrnvtqyxbkbms.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pIPtW5Df0zaUSnwMpPexsA_ozmjvhrb';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
