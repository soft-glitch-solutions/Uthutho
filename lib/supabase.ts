import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = "https://ygkhmcnpjjvmbrbyybik.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlna2htY25wamp2bWJyYnl5YmlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgwNzI3NTUsImV4cCI6MjA1MzY0ODc1NX0.PCjfCJDHt_AdO7gomtkqhNZrFRB5zHpYo6JcJ52uB60";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});