
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xohzusvwwyrkqpnljtbh.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvaHp1c3Z3d3lya3FwbmxqdGJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NDQ4NzEsImV4cCI6MjA4NjEyMDg3MX0.N8-Cn-lo6DTQd-t_kwLGxae6iy98xccXqsQINXaj0jY';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing. Please check your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
