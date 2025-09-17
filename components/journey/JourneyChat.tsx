import React from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { Send, Smile } from 'lucide-react-native';

interface ChatMessage {
  id: string;
  message: string;
  created_at: string;
  is_anonymous: boolean;
  user_id: string;
  profiles?: {
    first_name: string;
    last_name: string;
  };
}

interface JourneyChatProps {
  messages: ChatMessage[];
  newMessage: string;
  setNewMessage: (message: string) => void;
  onSendMessage: () => void;
  currentUserId: string;
}

export const JourneyChat = ({
  messages,
  newMessage,
  setNewMessage,
  onSendMessage,
  currentUserId
}: JourneyChatProps) => {
  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isOwnMessage = item.user_id === currentUserId;
    
    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage && styles.ownMessageContainer
      ]}>
        {!isOwnMessage && !item.is_anonymous && item.profiles && (
          <Text style={styles.senderName}>
            {item.profiles.first_name} {item.profiles.last_name}
          </Text>
        )}
        
        <View style={[
          styles.messageBubble,
          isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble
        ]}>
          <Text style={[
            styles.messageText,
            isOwnMessage ? styles.ownMessageText : styles.otherMessageText
          ]}>
            {item.message}
          </Text>
        </View>
        
        <Text style={[
          styles.messageTime,
          isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime
        ]}>
          {new Date(item.created_at).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.chatContainer}>
      {messages.length === 0 ? (
        <View style={styles.emptyChat}>
          <Text style={styles.emptyChatText}>
            No messages yet. Start the conversation!
          </Text>
          <Text style={styles.emptyChatSubtext}>
            This chat is only visible to passengers on this journey
          </Text>
        </View>
      ) : (
        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          inverted
          contentContainerStyle={styles.messagesContainer}
        />
      )}
      
      <View style={styles.inputContainer}>
        <TouchableOpacity 
          style={styles.emojiButton}
          onPress={() => {
            // You can implement an emoji picker here
            // For now, let's just add a common emoji to the message
            setNewMessage(prev => prev + '😊');
          }}
        >
          <Smile size={24} color="#666666" />
        </TouchableOpacity>
        
        <TextInput
          style={styles.chatInput}
          placeholder="Type a message..."
          placeholderTextColor="#666666"
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
          maxLength={500}
        />
        
        <TouchableOpacity 
          style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
          onPress={onSendMessage}
          disabled={!newMessage.trim()}
        >
          <Send size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  chatContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333333',
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  ownMessageContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  senderName: {
    color: '#1ea2b1',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
    marginLeft: 12,
  },
  messageBubble: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 4,
  },
  ownMessageBubble: {
    backgroundColor: '#1ea2b1',
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: '#1a1a1a',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#ffffff',
  },
  otherMessageText: {
    color: '#ffffff',
  },
  messageTime: {
    fontSize: 11,
    opacity: 0.7,
    marginHorizontal: 4,
  },
  ownMessageTime: {
    color: '#cccccc',
    textAlign: 'right',
  },
  otherMessageTime: {
    color: '#999999',
    textAlign: 'left',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  emojiButton: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#ffffff',
    fontSize: 16,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#333333',
  },
  sendButton: {
    backgroundColor: '#1ea2b1',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  sendButtonDisabled: {
    backgroundColor: '#333333',
  },
  emptyChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyChatText: {
    color: '#666666',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyChatSubtext: {
    color: '#444444',
    fontSize: 14,
    textAlign: 'center',
  },
});