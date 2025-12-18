// components/journey/ChatTab.tsx
import React from 'react';
import { JourneyChat } from '@/components/journey/JourneyChat';

interface ChatTabProps {
  messages: any[];
  newMessage: string;
  setNewMessage: (message: string) => void;
  onSendMessage: (message: string) => Promise<void>;
  currentUserId: string;
  onlineCount: number;
}

export const ChatTab: React.FC<ChatTabProps> = ({
  messages,
  newMessage,
  setNewMessage,
  onSendMessage,
  currentUserId,
  onlineCount
}) => {
  return (
    <JourneyChat
      messages={messages}
      newMessage={newMessage}
      setNewMessage={setNewMessage}
      onSendMessage={onSendMessage}
      currentUserId={currentUserId}
      onlineCount={onlineCount}
    />
  );
};