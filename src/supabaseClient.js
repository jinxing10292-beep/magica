// Supabase Client - Initialize and export singleton
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';

const supabaseUrl = 'https://ermfvdnfhnosyjyvlxjq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVybWZ2ZG5maG5vc3lqeXZseGpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEwNzkxNzYsImV4cCI6MjEwNjY1NTE3Nn0.lu_87GX49fkp39zMIAPpMVc3AyUOn7UqSHaUBRXrNes';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
