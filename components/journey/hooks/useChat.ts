// components/journey/hooks/useChat.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ChatMessage } from '@/types/journey';

export function useChat(
  activeJourneyId?: string,
  currentUserId?: string,
  activeTab?: 'info' | 'chat'
) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (activeTab === 'chat') {
      setUnreadMessages(0);
    }
  }, [activeTab]);

  const loadChatMessages = async () => {
    if (!activeJourneyId) return;

    try {
      const { data: messages, error } = await supabase
        .from('journey_messages')
        .select(`
          *,
          profiles (
            first_name,
            last_name,
            selected_title,
            avatar_url
          )
        `)
        .eq('journey_id', activeJourneyId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setChatMessages(messages || []);
    } catch (error) {
      console.error('Error loading chat messages:', error);
    }
  };

  const subscribeToChat = () => {
    if (!activeJourneyId) return;

    try {
      const subscription = supabase
        .channel('journey-chat-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'journey_messages',
            filter: `journey_id=eq.${activeJourneyId}`
          },
          async (payload) => {
            console.log('Chat update:', payload.eventType, payload.new);
            
            if (payload.eventType === 'INSERT') {
              const { data: profile } = await supabase
                .from('profiles')
                .select('first_name, last_name, avatar_url, selected_title')
                .eq('id', payload.new.user_id)
                .single();
                
              const newMessage = {
                ...payload.new as ChatMessage,
                profiles: profile
              };
              
              setChatMessages(prev => [...prev, newMessage]);
              
              if (activeTab !== 'chat') {
                setUnreadMessages(prev => prev + 1);
              }
            }
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error('Error subscribing to chat:', error);
    }
  };

  const sendChatMessage = async (messageText: string) => {
    if (!activeJourneyId || !currentUserId || !messageText.trim()) {
      throw new Error('Missing required data');
    }

    try {
      const { error } = await supabase
        .from('journey_messages')
        .insert({
          journey_id: activeJourneyId,
          user_id: currentUserId,
          message: messageText.trim(),
          is_anonymous: true
        });

      if (error) throw error;

      return;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  return {
    chatMessages,
    setChatMessages,
    newMessage,
    setNewMessage,
    unreadMessages,
    setUnreadMessages,
    loadChatMessages,
    subscribeToChat,
    sendChatMessage
  };
}