import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const useWaiting = (stopId) => {
  const [isWaiting, setIsWaiting] = useState(false);
  const [waitingCount, setWaitingCount] = useState(0);

  useEffect(() => {
    const checkIfUserIsWaiting = async () => {
      const userId = (await supabase.auth.getSession()).data.session?.user.id;
      if (!userId) return;

      const { data } = await supabase
        .from('stop_waiting')
        .select('*')
        .eq('stop_id', stopId)
        .eq('user_id', userId)
        .single();

      setIsWaiting(!!data);
    };

    const fetchWaitingCount = async () => {
      const { count } = await supabase
        .from('stop_waiting')
        .select('id', { count: 'exact' })
        .eq('stop_id', stopId);

      setWaitingCount(count);
    };

    checkIfUserIsWaiting();
    fetchWaitingCount();
  }, [stopId]);

  return { isWaiting, waitingCount };
};

export default useWaiting;