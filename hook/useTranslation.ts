import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getTranslation } from '@/utils/translations';

export function useTranslation() {
  const [language, setLanguage] = useState('English');

  useEffect(() => {
    loadUserLanguage();
  }, []);

  const loadUserLanguage = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('preferred_language')
          .eq('id', user.id)
          .single();
        
        if (profile?.preferred_language) {
          setLanguage(profile.preferred_language);
        }
      }
    } catch (error) {
      console.error('Error loading user language:', error);
    }
  };

  const t = (key: string): string => {
    return getTranslation(language, key);
  };

  return { t, language };
}