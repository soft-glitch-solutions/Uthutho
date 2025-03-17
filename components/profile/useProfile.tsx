import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export const useProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

    
  const fetchProfile = async () => {
    console.log('Fetching user session...');
    
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('Unable to fetch user session', sessionError);
      throw new Error('Unable to fetch user session');
    }
  
    console.log('User session fetched:', session);
  
    // Fetch profile data from Supabase
    console.log('Fetching profile data...');
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id, first_name, last_name, avatar_url
      `)
      .eq('id', session.user.id)
      .single();
  
    if (error) {
      console.error('Error fetching profile data', error);
      throw new Error('Error fetching profile data');
    }
  
    console.log('Profile data fetched:', data);
  
    return data;
  };

  useEffect(() => {
    let isMounted = true; // To prevent setting state if the component is unmounted

    const loadProfile = async () => {
      setLoading(true);
      try {
        const profileData = await fetchProfile();
        if (isMounted) {
          setProfile(profileData);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false; // Cleanup function to prevent state updates if unmounted
    };
  }, []);

  const updateProfile = async (updatedProfile) => {
    setLoading(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Unable to fetch user session');
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updatedProfile)
        .eq('id', session.user.id);

      if (updateError) {
        throw new Error('Error updating profile');
      }

      // Update local profile state
      setProfile((prev) => ({
        ...prev,
        ...updatedProfile,
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { profile, loading, error, updateProfile };
};
