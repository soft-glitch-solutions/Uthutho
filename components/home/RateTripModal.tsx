import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Star, X, Calendar, Award, Leaf, Clock } from 'lucide-react-native';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';

interface CompletedJourney {
  id: string;
  journey_id: string;
  route_name: string;
  transport_type: string;
  started_at: string;
  completed_at: string;
  duration_seconds: number;
  points_earned: number;
  co2_saved_kg?: number;
  passenger_count: number;
  was_driving: boolean;
  rating?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface RateTripModalProps {
  visible: boolean;
  onClose: () => void;
  journeyId: string | null;
  onRatingSubmitted?: (journeyId: string, rating: number) => void;
}

// Helper function to safely render text
const SafeText = ({ children, style }: { children: any; style?: any }) => {
  if (typeof children === 'string' || typeof children === 'number') {
    return <Text style={style}>{children}</Text>;
  }
  return children;
};

const RateTripModal: React.FC<RateTripModalProps> = ({
  visible,
  onClose,
  journeyId,
  onRatingSubmitted,
}) => {
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [journeyToRate, setJourneyToRate] = useState<CompletedJourney | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add logging to debug
// In RateTripModal, update the useEffect:
useEffect(() => {
  console.log('🎯 RateTripModal received props:', {
    visible,
    journeyId,
    hasJourneyId: !!journeyId
  });
  
  if (visible) {
    console.log('✅ Modal IS visible!');
  } else {
    console.log('❌ Modal is NOT visible');
  }
}, [visible, journeyId]);

  

  // Fetch journey details when modal opens with a journeyId


  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const submitRating = async () => {
    console.log('📤 Submitting rating for journey:', journeyId, 'Rating:', rating);
    
    if (!journeyId || !rating) {
      Alert.alert('Select a Rating', 'Please select a star rating for your trip');
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('📤 Submitting rating for journey:', journeyId, 'Rating:', rating);
      
      // First, try to update in completed_journeys
      let updateError = null;
      
      // Check if journey exists in completed_journeys
      const { data: existingJourney } = await supabase
        .from('completed_journeys')
        .select('id')
        .eq('journey_id', journeyId)
        .maybeSingle();

      if (existingJourney) {
        // Update existing record
        const { error } = await supabase
          .from('completed_journeys')
          .update({ 
            rating,
            notes: notes.trim() || null,
            updated_at: new Date().toISOString()
          })
          .eq('journey_id', journeyId);

        updateError = error;
      } else {
        // Create new record if journey exists in journeys table
        const { data: journey } = await supabase
          .from('journeys')
          .select(`
            *,
            routes (
              name,
              transport_type,
              start_point,
              end_point
            )
          `)
          .eq('id', journeyId)
          .maybeSingle();

        if (journey) {
          // Get current user
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { error } = await supabase
              .from('completed_journeys')
              .insert({
                user_id: user.id,
                journey_id: journeyId,
                route_name: journey.routes?.name || 'Recent Trip',
                transport_type: journey.routes?.transport_type || 'Unknown',
                start_point: journey.routes?.start_point,
                end_point: journey.routes?.end_point,
                started_at: journey.created_at,
                completed_at: journey.completed_at || new Date().toISOString(),
                duration_seconds: 0,
                points_earned: 0,
                passenger_count: 1,
                was_driving: false,
                rating,
                notes: notes.trim() || null,
              });

            updateError = error;
          }
        }
      }

      if (updateError) {
        console.error('❌ Error saving rating:', updateError);
        throw updateError;
      }

      // Award bonus points for rating
      const bonusPoints = Math.min(rating, 5); // 1-5 points based on rating
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user && bonusPoints > 0) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('points')
          .eq('id', user.id)
          .single();

        if (profile) {
          await supabase
            .from('profiles')
            .update({ 
              points: (profile.points || 0) + bonusPoints 
            })
            .eq('id', user.id);
        }
      }

      // Call the callback if provided
      if (onRatingSubmitted) {
        onRatingSubmitted(journeyId, rating);
      }

      Alert.alert(
        'Thanks for Your Feedback!',
        `You rated your trip ${rating} stars! ${bonusPoints > 0 ? `+${bonusPoints} points!` : ''}`,
        [{ text: 'OK', onPress: onClose }]
      );
      
      // Reset form
      setRating(0);
      setNotes('');
      setJourneyToRate(null);
      
    } catch (error) {
      console.error('❌ Error submitting rating:', error);
      Alert.alert('Error', 'Failed to submit your rating. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return; // Don't close while submitting
    
    if (rating > 0) {
      Alert.alert(
        'Save Your Rating?',
        'You have unsaved changes. Do you want to save before closing?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: onClose },
          { text: 'Save', onPress: submitRating },
        ]
      );
    } else {
      onClose();
    }
  };

  if (!visible) {
    console.log('❌ RateTripModal not visible, returning null');
    return null;
  }

  console.log('✅ RateTripModal rendering with journeyToRate:', journeyToRate);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView 
            style={styles.modalScrollView}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rate Your Trip</Text>
              <TouchableOpacity 
                onPress={handleClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                disabled={isSubmitting}
              >
                <X size={24} color="#666666" />
              </TouchableOpacity>
            </View>
            
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1ea2b1" />
                <Text style={styles.loadingText}>Loading trip details...</Text>
              </View>
            ) : journeyToRate ? (
              <>
                <SafeText style={styles.routeNameModal}>
                  {journeyToRate.route_name}
                </SafeText>
                <View style={styles.dateContainer}>
                  <Calendar size={16} color="#666666" />
                  <SafeText style={styles.dateModal}>
                    {format(new Date(journeyToRate.completed_at), 'PPP')}
                  </SafeText>
                </View>
                
                <View style={styles.tripStatsModal}>
                  <View style={styles.statBadgeModal}>
                    <Clock size={16} color="#1ea2b1" />
                    <SafeText style={styles.statBadgeTextModal}>
                      {formatDuration(journeyToRate.duration_seconds)}
                    </SafeText>
                  </View>
                  
                  {journeyToRate.points_earned > 0 && (
                    <View style={styles.statBadgeModal}>
                      <Award size={16} color="#f59e0b" />
                      <SafeText style={styles.statBadgeTextModal}>
                        +{journeyToRate.points_earned} pts
                      </SafeText>
                    </View>
                  )}
                  
                  {journeyToRate.co2_saved_kg && journeyToRate.co2_saved_kg > 0 && (
                    <View style={styles.statBadgeModal}>
                      <Leaf size={16} color="#10b981" />
                      <SafeText style={styles.statBadgeTextModal}>
                        {journeyToRate.co2_saved_kg.toFixed(1)}kg CO₂
                      </SafeText>
                    </View>
                  )}
                </View>
              </>
            ) : (
              <View style={styles.genericJourney}>
                <SafeText style={styles.genericTitle}>
                  Your Recent Trip
                </SafeText>
                <SafeText style={styles.genericSubtitle}>
                  Share your experience to help improve the community
                </SafeText>
              </View>
            )}
            
            <SafeText style={styles.ratingQuestion}>
              How was your trip?
            </SafeText>
            
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  style={styles.starButton}
                  disabled={isSubmitting}
                >
                  <Star
                    size={44}
                    color={star <= rating ? '#fbbf24' : '#666666'}
                    fill={star <= rating ? '#fbbf24' : 'transparent'}
                  />
                  <Text style={styles.starNumber}>{star}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.ratingLabels}>
              <SafeText style={styles.ratingLabel}>
                Poor
              </SafeText>
              <SafeText style={styles.ratingLabel}>
                Excellent
              </SafeText>
            </View>
            
            <TextInput
              style={styles.notesInput}
              placeholder="Add notes about your trip (optional)"
              placeholderTextColor="#666666"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              maxLength={500}
              editable={!isSubmitting}
            />
            
            <TouchableOpacity
              style={[
                styles.submitButton, 
                { 
                  backgroundColor: rating > 0 && !isSubmitting ? '#1ea2b1' : '#666666',
                  opacity: isSubmitting ? 0.7 : 1
                }
              ]}
              onPress={submitRating}
              disabled={rating === 0 || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <SafeText style={styles.submitButtonText}>
                  {rating === 0 ? 'Select a rating' : 'Submit Rating'}
                </SafeText>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.skipButton, { opacity: isSubmitting ? 0.5 : 1 }]}
              onPress={handleClose}
              disabled={isSubmitting}
            >
              <SafeText style={styles.skipButtonText}>
                Skip for now
              </SafeText>
            </TouchableOpacity>
            
            <SafeText style={styles.ratingNote}>
              Your feedback helps improve the community experience
            </SafeText>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalScrollView: {
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  routeNameModal: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
    lineHeight: 26,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dateModal: {
    color: '#666666',
    fontSize: 14,
    marginLeft: 8,
  },
  tripStatsModal: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  statBadgeModal: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222222',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  statBadgeTextModal: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  genericJourney: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#222222',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  genericTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  genericSubtitle: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  ratingQuestion: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 20,
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  starButton: {
    alignItems: 'center',
  },
  starNumber: {
    color: '#666666',
    fontSize: 12,
    marginTop: 4,
  },
  ratingLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  ratingLabel: {
    color: '#666666',
    fontSize: 12,
    fontWeight: '500',
  },
  notesInput: {
    backgroundColor: '#222222',
    borderRadius: 12,
    padding: 16,
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 20,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#333333',
  },
  submitButton: {
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 12,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#666666',
    fontSize: 14,
  },
  ratingNote: {
    color: '#666666',
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: '#666666',
    fontSize: 14,
    marginTop: 12,
  },
});

export default RateTripModal;