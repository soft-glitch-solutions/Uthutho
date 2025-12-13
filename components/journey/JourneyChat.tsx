import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  StyleSheet, 
  Image, 
  KeyboardAvoidingView, 
  Platform, 
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import { Send, Smile, CheckCheck, Circle, Check } from 'lucide-react-native';

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
  onSendMessage: (message: string) => Promise<void>;
  currentUserId: string;
  onlineCount?: number;
}

export const JourneyChat = ({
  messages,
  newMessage,
  setNewMessage,
  onSendMessage,
  currentUserId,
  onlineCount = 1
}: JourneyChatProps) => {
  const flatListRef = useRef<FlatList>(null);
  const [sending, setSending] = useState(false);
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [messageStatus, setMessageStatus] = useState<Record<string, 'sending' | 'sent'>>({});

  // Combine server messages with local messages
  const allMessages = [...messages, ...localMessages].sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (allMessages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [allMessages]);

  // Remove local messages when they appear in server messages
  useEffect(() => {
    if (messages.length > 0 && localMessages.length > 0) {
      messages.forEach(serverMsg => {
        // Find matching local message by content and user
        const matchingLocalIndex = localMessages.findIndex(localMsg => 
          localMsg.message === serverMsg.message &&
          localMsg.user_id === serverMsg.user_id &&
          Math.abs(new Date(localMsg.created_at).getTime() - new Date(serverMsg.created_at).getTime()) < 5000
        );

        if (matchingLocalIndex !== -1) {
          setLocalMessages(prev => prev.filter((_, idx) => idx !== matchingLocalIndex));
          setMessageStatus(prev => {
            const updated = { ...prev };
            delete updated[localMessages[matchingLocalIndex].id];
            return updated;
          });
        }
      });
    }
  }, [messages, localMessages]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;

    const messageText = newMessage.trim();
    const tempId = `temp-${Date.now()}`;
    const tempMessage: ChatMessage = {
      id: tempId,
      message: messageText,
      created_at: new Date().toISOString(),
      is_anonymous: true,
      user_id: currentUserId,
      profiles: {
        first_name: 'You',
        last_name: '',
        selected_title: 'You'
      }
    };

    // Add to local messages immediately
    setLocalMessages(prev => [...prev, tempMessage]);
    setMessageStatus(prev => ({ ...prev, [tempId]: 'sending' }));
    setSending(true);
    setNewMessage('');

    try {
      // Send to server
      await onSendMessage(messageText);
      
      // Mark as sent
      setMessageStatus(prev => ({ ...prev, [tempId]: 'sent' }));
      
      // Keep local message for a while (it will be removed when server message arrives)
      // Auto-remove after 10 seconds if not replaced
      setTimeout(() => {
        setLocalMessages(prev => prev.filter(msg => msg.id !== tempId));
        setMessageStatus(prev => {
          const updated = { ...prev };
          delete updated[tempId];
          return updated;
        });
      }, 10000);
      
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove failed message after delay
      setTimeout(() => {
        setLocalMessages(prev => prev.filter(msg => msg.id !== tempId));
        setMessageStatus(prev => {
          const updated = { ...prev };
          delete updated[tempId];
          return updated;
        });
        // Restore to input
        setNewMessage(messageText);
      }, 500);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
    const isOwnMessage = item.user_id === currentUserId;
    const isLocal = item.id.startsWith('temp-');
    const status = messageStatus[item.id];
    const showSenderInfo = !isOwnMessage && !item.is_anonymous && item.profiles;
    const previousMessage = index > 0 ? allMessages[index - 1] : null;
    const isConsecutive = isConsecutiveMessage(item, previousMessage, currentUserId);
    const showAvatar = !isOwnMessage && !isConsecutive;

    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer
      ]}>
        {showAvatar && (
          <View style={styles.avatarContainer}>
            {item.profiles?.avatar_url ? (
              <Image 
                source={{ uri: item.profiles.avatar_url }} 
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {item.profiles?.first_name?.[0] || 'U'}
                </Text>
              </View>
            )}
          </View>
        )}
        
        {!showAvatar && !isOwnMessage && <View style={styles.avatarSpacer} />}
        
        <View style={styles.messageContent}>
          {showSenderInfo && (
            <Text style={styles.senderName}>
              {item.profiles?.selected_title || `${item.profiles?.first_name} ${item.profiles?.last_name}`}
            </Text>
          )}
          
          <View style={[
            styles.messageBubble,
            isOwnMessage ? styles.ownBubble : styles.otherBubble,
            isLocal && styles.localBubble
          ]}>
            <Text style={[
              styles.messageText,
              isOwnMessage ? styles.ownText : styles.otherText
            ]}>
              {item.message}
            </Text>
          </View>
          
          <View style={[
            styles.messageMeta,
            isOwnMessage && styles.ownMeta
          ]}>
            <Text style={styles.messageTime}>
              {new Date(item.created_at).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
            
            {isOwnMessage && (
              <View style={styles.statusContainer}>
                {isLocal ? (
                  <>
                    {status === 'sending' && (
                      <>
                        <ActivityIndicator size={10} color="#666" />
                        <Text style={styles.statusText}>Sending</Text>
                      </>
                    )}
                    {status === 'sent' && (
                      <>
                        <Check size={12} color="#1ea2b1" />
                        <Text style={styles.statusText}>Sent</Text>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <CheckCheck size={12} color="#1ea2b1" />
                    <Text style={styles.statusText}>Delivered</Text>
                  </>
                )}
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.onlineIndicator}>
            <Circle size={8} color="#22c55e" fill="#22c55e" />
            <Text style={styles.onlineText}>{onlineCount} online</Text>
          </View>
        </View>

        {/* Messages */}
        {allMessages.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptySubtitle}>
              Be the first to start the conversation
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={allMessages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContainer}
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            inverted={false}
            onContentSizeChange={() => {
              setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
              }, 50);
            }}
          />
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor="#666"
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              maxLength={500}
              textAlignVertical="center"
              enablesReturnKeyAutomatically
              returnKeyType="send"
              onSubmitEditing={handleSend}
            />
            
            <TouchableOpacity 
              style={[styles.sendButton, (!newMessage.trim() || sending) && styles.sendDisabled]}
              onPress={handleSend}
              disabled={!newMessage.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#666" />
              ) : (
                <Send size={20} color={newMessage.trim() ? "#1ea2b1" : "#666"} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// Helper function
const isConsecutiveMessage = (
  current: ChatMessage, 
  previous: ChatMessage | null, 
  currentUserId: string
): boolean => {
  if (!previous) return false;
  if (current.user_id !== previous.user_id) return false;
  
  const currentTime = new Date(current.created_at);
  const previousTime = new Date(previous.created_at);
  const timeDiff = currentTime.getTime() - previousTime.getTime();
  
  return timeDiff < 120000; // 2 minutes
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  onlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  onlineText: {
    color: '#22c55e',
    fontSize: 13,
    fontWeight: '600',
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    paddingBottom: 20,
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 4,
    alignItems: 'flex-end',
  },
  ownMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    width: 32,
    height: 32,
    marginRight: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1ea2b1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  avatarSpacer: {
    width: 40,
  },
  messageContent: {
    maxWidth: '75%',
  },
  senderName: {
    color: '#1ea2b1',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
    marginLeft: 8,
  },
  messageBubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 4,
  },
  ownBubble: {
    backgroundColor: '#1ea2b1',
    borderBottomRightRadius: 6,
  },
  otherBubble: {
    backgroundColor: '#2a2a2a',
    borderBottomLeftRadius: 6,
  },
  localBubble: {
    opacity: 0.9,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  ownText: {
    color: '#fff',
  },
  otherText: {
    color: '#fff',
  },
  messageMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  ownMeta: {
    justifyContent: 'flex-end',
    marginRight: 8,
  },
  messageTime: {
    fontSize: 11,
    color: '#666',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 6,
  },
  statusText: {
    fontSize: 11,
    color: '#666',
  },
  inputContainer: {
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    borderRadius: 24,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    maxHeight: 100,
    minHeight: 40,
    paddingVertical: 10,
  },
  sendButton: {
    padding: 8,
  },
  sendDisabled: {
    opacity: 0.5,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyTitle: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#444',
    fontSize: 14,
  },
});