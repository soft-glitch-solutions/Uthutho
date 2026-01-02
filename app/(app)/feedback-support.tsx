import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hook/useAuth';

export default function FeedbackSupportScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedbackType, setFeedbackType] = useState<'bug' | 'suggestion' | 'general'>('general');
  const [message, setMessage] = useState('');
  const [contactEmail, setContactEmail] = useState(user?.email || '');

  const feedbackTypes = [
    { id: 'bug', label: 'Report a Bug' },
    { id: 'suggestion', label: 'Suggestion' },
    { id: 'general', label: 'General' },
  ];

  const ratings = [1, 2, 3, 4, 5];

  const submitFeedback = async () => {
    if (!message.trim()) {
      Alert.alert('Error', 'Please enter your feedback message');
      return;
    }

    if (!contactEmail.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      // Create feedback record in database
      const { error } = await supabase.from('feedback').insert({
        user_id: user?.id,
        type: feedbackType,
        message: message.trim(),
        rating: rating || null,
        contact_email: contactEmail.trim(),
        status: 'new',
        created_at: new Date().toISOString(),
      });

      if (error) throw error;

      setSubmitted(true);
      setTimeout(() => {
        router.back();
      }, 3000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      Alert.alert('Error', 'Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setRating(0);
    setFeedbackType('general');
    setMessage('');
    setContactEmail(user?.email || '');
    setSubmitted(false);
  };

  if (submitted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.successContainer}>
          <View style={[styles.successIcon, { backgroundColor: '#10B98120' }]}>
            <Text style={styles.successIconText}>✓</Text>
          </View>
          <Text style={[styles.successTitle, { color: colors.text }]}>
            Thank You!
          </Text>
          <Text style={[styles.successMessage, { color: colors.text }]}>
            Your feedback has been submitted successfully.
          </Text>
          <Text style={[styles.successSubtext, { color: '#666666' }]}>
            We appreciate your input and will review it shortly.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Return to Settings</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={[styles.backButtonText, { color: colors.text }]}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Feedback & Support</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={[styles.headerLine, { backgroundColor: '#1EA2B1' }]} />

        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={[styles.welcomeTitle, { color: colors.text }]}>
            Share Your Thoughts
          </Text>
          <Text style={[styles.welcomeText, { color: colors.text }]}>
            Help us improve Uthutho by sharing your feedback or reporting issues.
          </Text>
        </View>

        {/* Rating Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            How would you rate your experience?
          </Text>
          <View style={styles.ratingContainer}>
            {ratings.map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                style={styles.starButton}
              >
                <Text
                  style={[
                    styles.starText,
                    { color: star <= rating ? '#FBBF24' : '#cccccc' }
                  ]}
                >
                  ★
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.ratingLabel, { color: colors.text }]}>
            {rating === 0 ? 'Select a rating' : `You rated us ${rating} out of 5`}
          </Text>
        </View>

        {/* Feedback Type */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            What type of feedback?
          </Text>
          <View style={styles.typeContainer}>
            {feedbackTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.typeButton,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  feedbackType === type.id && styles.typeButtonSelected,
                ]}
                onPress={() => setFeedbackType(type.id as any)}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    { color: colors.text },
                    feedbackType === type.id && styles.typeButtonTextSelected,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Message Input */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Your Feedback
          </Text>
          <TextInput
            style={[
              styles.messageInput,
              {
                backgroundColor: colors.card,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            placeholder="Describe your feedback in detail..."
            placeholderTextColor="#666666"
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={[styles.charCount, { color: '#666666' }]}>
            {message.length}/500 characters
          </Text>
        </View>

        {/* Contact Email */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Contact Information
          </Text>
          <Text style={[styles.contactLabel, { color: colors.text }]}>
            We'll use this to follow up if needed
          </Text>
          <TextInput
            style={[
              styles.emailInput,
              {
                backgroundColor: colors.card,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            placeholder="your@email.com"
            placeholderTextColor="#666666"
            value={contactEmail}
            onChangeText={setContactEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Tips */}
        <View style={[styles.tipsCard, { backgroundColor: '#FFFBEB', borderColor: '#FBBF24' }]}>
          <Text style={styles.tipsIcon}>💡</Text>
          <View style={styles.tipsContent}>
            <Text style={styles.tipsTitle}>Tips for Effective Feedback:</Text>
            <Text style={styles.tipsText}>
              • Be specific and descriptive
            </Text>
            <Text style={styles.tipsText}>
              • Include steps to reproduce issues
            </Text>
            <Text style={styles.tipsText}>
              • Share what you expected vs what happened
            </Text>
            <Text style={styles.tipsText}>
              • Suggest improvements if possible
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.button, styles.resetButton, { backgroundColor: colors.card }]}
            onPress={handleReset}
            disabled={loading}
          >
            <Text style={[styles.resetButtonText, { color: colors.text }]}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.submitButton, { backgroundColor: '#1EA2B1' }]}
            onPress={submitFeedback}
            disabled={loading || !message.trim()}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Feedback</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Database Note */}
        <View style={[styles.noteCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.noteText, { color: '#666666' }]}>
            Note: Your feedback will be stored in our database for review. 
            We typically respond within 1-2 business days.
          </Text>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    padding: 4,
    paddingHorizontal: 8,
  },
  backButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  headerSpacer: {
    width: 32,
  },
  headerLine: {
    height: 4,
    width: 60,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 24,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  welcomeIcon: {
    fontSize: 40,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 22,
    maxWidth: '80%',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 8,
  },
  starButton: {
    padding: 4,
  },
  starText: {
    fontSize: 32,
  },
  ratingLabel: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.8,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  typeButton: {
    flex: 1,
    minWidth: 100,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  typeButtonSelected: {
    borderColor: '#1EA2B1',
    backgroundColor: '#1EA2B110',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  typeButtonTextSelected: {
    color: '#1EA2B1',
    fontWeight: '600',
  },
  messageInput: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    fontSize: 15,
    lineHeight: 20,
    minHeight: 120,
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  contactLabel: {
    fontSize: 14,
    marginBottom: 8,
    opacity: 0.8,
  },
  emailInput: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    fontSize: 15,
  },
  tipsCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 24,
    gap: 12,
  },
  tipsIcon: {
    fontSize: 24,
    marginTop: 2,
  },
  tipsContent: {
    flex: 1,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 13,
    color: '#92400E',
    marginBottom: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  resetButton: {
    borderWidth: 1,
    borderColor: '#333333',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flexDirection: 'row',
    gap: 8,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  noteCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333333',
    marginBottom: 20,
  },
  noteText: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 40,
  },
  // Success Screen
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successIconText: {
    fontSize: 48,
    color: '#10B981',
    fontWeight: 'bold',
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 8,
    opacity: 0.9,
  },
  successSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
  },
});