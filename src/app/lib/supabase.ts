import { createClient } from '@supabase/supabase-js';

// Используем ключи из .env (Vite использует префикс VITE_ для клиентских переменных)
// Но так как пользователь добавил PROJECT_URL и PROJECT_KEY, адаптируем под них
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.PROJECT_URL || 'https://toanvhjmijldvxkyhxss.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.PROJECT_KEY || 'sb_publishable_Mf7ySX4HhYawLYqG1cJQ3g_NxL7gF25';

export const supabase = createClient(supabaseUrl, supabaseKey);
