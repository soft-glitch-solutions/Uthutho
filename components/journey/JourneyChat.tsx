import React, { useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { Send, Smile, Check, CheckCheck } from 'lucide-react-native';

interface ChatMessage {
  id: string;
  message: string;
  created_at: string;
  is_anonymous: boolean;
  user_id: string;
  profiles?: {
    first_name: string;
    last_name: string;
    selected_title: string;
    avatar_url?: string;
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
  const flatListRef = useRef<FlatList>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Optimized message display - add temporary local message for instant feedback
  const handleSendOptimized = () => {
    if (newMessage.trim()) {
      // Create optimistic update
      const tempMessage = {
        id: `temp-${Date.now()}`,
        message: newMessage.trim(),
        created_at: new Date().toISOString(),
        is_anonymous: true,
        user_id: currentUserId,
        profiles: {} // Temporary empty profile
      };
      
      // Call the send function
      onSendMessage();
    }
  };

  const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
    const isOwnMessage = item.user_id === currentUserId;
    const isTempMessage = item.id.startsWith('temp-');
    const showSenderInfo = !isOwnMessage && !item.is_anonymous && item.profiles;
    const previousMessage = index > 0 ? messages[index - 1] : null;
    const showTimeSeparator = shouldShowTimeSeparator(item, previousMessage);
    const isConsecutive = isConsecutiveMessage(item, previousMessage, currentUserId);

    return (
      <View>
        {showTimeSeparator && (
          <View style={styles.timeSeparator}>
            <Text style={styles.timeSeparatorText}>
              {formatTimeSeparator(item.created_at)}
            </Text>
          </View>
        )}
        
        <View style={[
          styles.messageRow,
          isOwnMessage ? styles.ownMessageRow : styles.otherMessageRow
        ]}>
          {!isOwnMessage && (
            <View style={styles.avatarContainer}>
              {showSenderInfo && !isConsecutive ? (
                item.profiles?.avatar_url ? (
                  <Image 
                    source={{ uri: item.profiles.avatar_url }} 
                    style={styles.avatar}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>
                      {item.profiles?.first_name?.[0]}{item.profiles?.last_name?.[0]}
                    </Text>
                  </View>
                )
              ) : (
                <View style={styles.avatarSpacer} />
              )}
            </View>
          )}
          
          <View style={styles.messageContent}>
            {showSenderInfo && !isConsecutive && (
              <Text style={styles.senderName}>
                {item.profiles?.selected_title || `${item.profiles?.first_name} ${item.profiles?.last_name}`}
              </Text>
            )}
            
            <View style={[
              styles.messageBubble,
              isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble,
              isConsecutive && styles.consecutiveMessage,
              isTempMessage && styles.tempMessage
            ]}>
              <Text style={[
                styles.messageText,
                isOwnMessage ? styles.ownMessageText : styles.otherMessageText
              ]}>
                {item.message}
              </Text>
            </View>
            
            <View style={[
              styles.messageMeta,
              isOwnMessage ? styles.ownMessageMeta : styles.otherMessageMeta
            ]}>
              <Text style={styles.messageTime}>
                {new Date(item.created_at).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </Text>
              {isOwnMessage && (
                <View style={styles.readReceipt}>
                  {isTempMessage ? (
                    <Check size={12} color="#666666" />
                  ) : (
                    <CheckCheck size={12} color="#1ea2b1" />
                  )}
                </View>
              )}
            </View>
          </View>
          
          {isOwnMessage && <View style={styles.avatarSpacer} />}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.chatContainer}>
        {messages.length === 0 ? (
          <View style={styles.emptyChat}>
            <Text style={styles.emptyChatTitle}>No messages yet</Text>
            <Text style={styles.emptyChatSubtitle}>
              Start the conversation with your fellow passengers
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContainer}
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => {
              if (messages.length > 0) {
                flatListRef.current?.scrollToEnd({ animated: true });
              }
            }}
          />
        )}
      </View>
      
      {/* Fixed WhatsApp-style input container */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TouchableOpacity 
            style={styles.emojiButton}
            onPress={() => {
              setNewMessage(prev => prev + '😊');
            }}
          >
            <Smile size={24} color="#666666" />
          </TouchableOpacity>
          
          <TextInput
            style={styles.chatInput}
            placeholder="Message"
            placeholderTextColor="#999999"
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={500}
            textAlignVertical="center"
            enablesReturnKeyAutomatically
            returnKeyType="send"
            onSubmitEditing={handleSendOptimized}
          />
          
          <TouchableOpacity 
            style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
            onPress={handleSendOptimized}
            disabled={!newMessage.trim()}
          >
            <Send size={20} color={newMessage.trim() ? "#1ea2b1" : "#666666"} />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

// Helper functions
const shouldShowTimeSeparator = (current: ChatMessage, previous: ChatMessage | null): boolean => {
  if (!previous) return true;
  
  const currentTime = new Date(current.created_at);
  const previousTime = new Date(previous.created_at);
  const timeDiff = currentTime.getTime() - previousTime.getTime();
  const minutesDiff = timeDiff / (1000 * 60);
  
  return minutesDiff > 5;
};

const isConsecutiveMessage = (
  current: ChatMessage, 
  previous: ChatMessage | null, 
  currentUserId: string
): boolean => {
  if (!previous) return false;
  
  const currentTime = new Date(current.created_at);
  const previousTime = new Date(previous.created_at);
  const timeDiff = currentTime.getTime() - previousTime.getTime();
  const minutesDiff = timeDiff / (1000 * 60);
  
  return previous.user_id === current.user_id && minutesDiff < 2;
};

const formatTimeSeparator = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  if (messageDate.getTime() === today.getTime()) {
    return 'Today';
  } else if (messageDate.getTime() === today.getTime() - 86400000) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingBottom: 80, // Space for fixed input
  },
  timeSeparator: {
    alignItems: 'center',
    marginVertical: 16,
  },
  timeSeparatorText: {
    color: '#666666',
    fontSize: 12,
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: 2,
    alignItems: 'flex-end',
  },
  ownMessageRow: {
    justifyContent: 'flex-end',
  },
  otherMessageRow: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    width: 32,
    marginRight: 4,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  avatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1ea2b1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  avatarSpacer: {
    width: 32,
  },
  messageContent: {
    maxWidth: '70%',
  },
  senderName: {
    color: '#1ea2b1',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 8,
    marginBottom: 2,
  },
  messageBubble: {
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 2,
  },
  ownMessageBubble: {
    backgroundColor: '#1ea2b1',
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: '#1a1a1a',
    borderBottomLeftRadius: 4,
  },
  consecutiveMessage: {
    marginTop: 1,
  },
  tempMessage: {
    opacity: 0.7,
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
  messageMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  ownMessageMeta: {
    justifyContent: 'flex-end',
  },
  otherMessageMeta: {
    justifyContent: 'flex-start',
  },
  messageTime: {
    fontSize: 11,
    color: '#666666',
    marginRight: 4,
  },
  readReceipt: {
    marginLeft: 2,
  },
  inputContainer: {
    backgroundColor: '#1a1a1a',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#333333',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#0a0a0a',
    borderRadius: 20,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  emojiButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    maxHeight: 100,
    minHeight: 40,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  sendButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  emptyChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginBottom: 80,
  },
  emptyChatTitle: {
    color: '#666666',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyChatSubtitle: {
    color: '#444444',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});