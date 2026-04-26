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

const BRAND_COLOR = '#1ea2b1';

interface RateTripModalProps {
  visible: boolean;
  onClose: () => void;
  journeyId: string | null;
  onRatingSubmitted?: (journeyId: string, rating: number) => void;
}

const RateTripModal: React.FC<RateTripModalProps> = ({ visible, onClose, journeyId, onRatingSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitRating = async () => {
    if (!journeyId || !rating) {
      Alert.alert('Selection Required', 'Please select a star rating.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error: updateError } = await supabase
        .from('completed_journeys')
        .update({ rating, notes: notes.trim() || null, updated_at: new Date().toISOString() })
        .eq('journey_id', journeyId);

      if (updateError) throw updateError;

      // Award bonus points
      const bonusPoints = rating;
      const { data: profile } = await supabase.from('profiles').select('points').eq('id', user.id).single();
      if (profile) {
        await supabase.from('profiles').update({ points: (profile.points || 0) + bonusPoints }).eq('id', user.id);
      }

      if (onRatingSubmitted) onRatingSubmitted(journeyId, rating);
      Alert.alert('Success', `Thank you! You earned +${bonusPoints} points.`, [{ text: 'OK', onPress: onClose }]);
      setRating(0); setNotes('');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to submit rating.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Rate Trip</Text>
            <TouchableOpacity onPress={onClose} disabled={isSubmitting}><X size={24} color="#FFF" /></TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.prompt}>HOW WAS YOUR JOURNEY?</Text>
            
            <View style={styles.starsBox}>
              {[1, 2, 3, 4, 5].map(s => (
                <TouchableOpacity key={s} onPress={() => setRating(s)} style={styles.starBtn} disabled={isSubmitting}>
                  <Star size={44} color={s <= rating ? '#FFD700' : '#222'} fill={s <= rating ? '#FFD700' : 'transparent'} />
                  <Text style={styles.starNum}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput 
              style={styles.input} 
              placeholder="Any comments about the ride?" 
              placeholderTextColor="#444" 
              value={notes} 
              onChangeText={setNotes} 
              multiline 
              numberOfLines={4} 
              editable={!isSubmitting}
            />

            <TouchableOpacity 
              style={[styles.submitBtn, { backgroundColor: rating > 0 && !isSubmitting ? BRAND_COLOR : '#111' }]} 
              onPress={submitRating} 
              disabled={rating === 0 || isSubmitting}
            >
              {isSubmitting ? <ActivityIndicator color="#000" /> : <Text style={[styles.submitText, { color: rating > 0 ? '#000' : '#333' }]}>SUBMIT REVIEW</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.skipBtn} onPress={onClose} disabled={isSubmitting}>
              <Text style={styles.skipText}>SKIP FOR NOW</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'flex-end' },
  content: { backgroundColor: '#111', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 32, maxHeight: '80%', borderWidth: 1, borderColor: '#222' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 24, fontWeight: '900', color: '#FFF', fontStyle: 'italic' },
  prompt: { fontSize: 10, fontWeight: '900', color: '#444', letterSpacing: 2, textAlign: 'center', marginBottom: 24 },
  starsBox: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 32 },
  starBtn: { alignItems: 'center', gap: 8 },
  starNum: { fontSize: 10, fontWeight: '900', color: '#333' },
  input: { backgroundColor: '#000', borderRadius: 20, padding: 20, color: '#FFF', fontWeight: '600', fontSize: 15, height: 120, textAlignVertical: 'top', borderWidth: 1, borderColor: '#222', marginBottom: 32 },
  submitBtn: { height: 64, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  submitText: { fontWeight: '900', fontSize: 14, letterSpacing: 1 },
  skipBtn: { alignItems: 'center', paddingVertical: 20 },
  skipText: { fontSize: 10, fontWeight: '900', color: '#444', letterSpacing: 1.5 },
});

export default RateTripModal;