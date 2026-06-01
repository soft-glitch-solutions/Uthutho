import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Bus, Car, Train, Truck, CheckCircle, X, ChevronRight } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/context/ThemeContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.82;

interface SuggestRouteSheetProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const TRANSPORT_TYPES = [
  { key: 'minibus_taxi', label: 'Taxi', Icon: Car },
  { key: 'bus', label: 'Bus', Icon: Bus },
  { key: 'train', label: 'Train', Icon: Train },
  { key: 'other', label: 'Other', Icon: Truck },
];

export default function SuggestRouteSheet({ visible, onClose, onSuccess }: SuggestRouteSheetProps) {
  const { colors } = useTheme();
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [transportType, setTransportType] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (visible) {
      setSubmitted(false);
      setFrom('');
      setTo('');
      setTransportType('');
      setPrice('');
      setDescription('');
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: SHEET_HEIGHT, duration: 280, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (!from.trim() || !to.trim()) {
      Alert.alert('Missing info', 'Please enter both a start and end point.');
      return;
    }
    if (!transportType) {
      Alert.alert('Missing info', 'Please select a transport type.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');

      const { error } = await supabase.from('route_requests').insert({
        user_id: user.id,
        start_point: from.trim(),
        end_point: to.trim(),
        transport_type: transportType,
        description: description.trim() || null,
        cost: price ? parseFloat(price) : null,
        status: 'pending',
      });
      if (error) throw error;

      // Award points
      try {
        const { data: profile } = await supabase
          .from('profiles').select('points').eq('id', user.id).single();
        await supabase.from('profiles')
          .update({ points: (profile?.points ?? 0) + 15 })
          .eq('id', user.id);
      } catch {}

      setSubmitted(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2200);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        </Animated.View>

        {/* Sheet */}
        <Animated.View
          style={[
            styles.sheet,
            { backgroundColor: colors.card, transform: [{ translateY: slideAnim }], height: SHEET_HEIGHT }
          ]}
        >
          {/* Handle */}
          <View style={styles.handleRow}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>Suggest a Route</Text>
              <Text style={[styles.subtitle, { color: colors.text, opacity: 0.55 }]}>
                Tell us where you need to get to
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.background }]}>
              <X size={18} color={colors.text} />
            </TouchableOpacity>
          </View>

          {submitted ? (
            <View style={styles.successContainer}>
              <View style={[styles.successCircle, { backgroundColor: '#2bb8b320' }]}>
                <CheckCircle size={52} color="#2bb8b3" />
              </View>
              <Text style={[styles.successTitle, { color: colors.text }]}>Route Suggested!</Text>
              <Text style={[styles.successBody, { color: colors.text, opacity: 0.65 }]}>
                Your route suggestion has been submitted. We'll review it with the community.
              </Text>
              <Text style={[styles.successPoints, { color: '#2bb8b3' }]}>+15 TP earned 🎉</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.scrollArea}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Route visual: From → To */}
              <View style={[styles.routeCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <View style={styles.routeRow}>
                  <View style={[styles.routeDot, { backgroundColor: '#2bb8b3' }]} />
                  <TextInput
                    style={[styles.routeInput, { color: colors.text }]}
                    value={from}
                    onChangeText={setFrom}
                    placeholder="From — start point"
                    placeholderTextColor={colors.placeholder || '#888'}
                  />
                </View>
                <View style={styles.routeLine}>
                  <View style={[styles.routeLineDash, { backgroundColor: colors.border }]} />
                </View>
                <View style={styles.routeRow}>
                  <View style={[styles.routeDot, styles.routeDotEnd, { borderColor: '#2bb8b3' }]} />
                  <TextInput
                    style={[styles.routeInput, { color: colors.text }]}
                    value={to}
                    onChangeText={setTo}
                    placeholder="To — end point"
                    placeholderTextColor={colors.placeholder || '#888'}
                  />
                </View>
              </View>

              {/* Transport type */}
              <Text style={[styles.label, { color: colors.text }]}>Transport Type *</Text>
              <View style={styles.transportRow}>
                {TRANSPORT_TYPES.map(({ key, label, Icon }) => {
                  const active = transportType === key;
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.transportChip,
                        {
                          backgroundColor: active ? '#2bb8b3' : colors.background,
                          borderColor: active ? '#2bb8b3' : colors.border,
                        }
                      ]}
                      onPress={() => setTransportType(key)}
                      activeOpacity={0.8}
                    >
                      <Icon size={18} color={active ? '#fff' : colors.text} />
                      <Text style={[styles.transportLabel, { color: active ? '#fff' : colors.text, opacity: active ? 1 : 0.75 }]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Price — optional */}
              <Text style={[styles.label, { color: colors.text }]}>Fare / Price (optional)</Text>
              <View style={[styles.priceRow, { borderColor: colors.border, backgroundColor: colors.background }]}>
                <Text style={[styles.currencySymbol, { color: colors.text, opacity: 0.5 }]}>R</Text>
                <TextInput
                  style={[styles.priceInput, { color: colors.text }]}
                  value={price}
                  onChangeText={setPrice}
                  placeholder="0.00"
                  placeholderTextColor={colors.placeholder || '#888'}
                  keyboardType="decimal-pad"
                />
              </View>

              {/* Description */}
              <Text style={[styles.label, { color: colors.text }]}>Extra notes (optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
                value={description}
                onChangeText={setDescription}
                placeholder="Any extra details — peak hours, common stops along the way…"
                placeholderTextColor={colors.placeholder || '#888'}
                multiline
                numberOfLines={3}
              />

              {/* Submit */}
              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: '#2bb8b3', opacity: isSubmitting ? 0.7 : 1 }]}
                onPress={handleSubmit}
                disabled={isSubmitting}
                activeOpacity={0.85}
              >
                {isSubmitting
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <>
                      <Text style={styles.submitBtnText}>Submit Route</Text>
                      <ChevronRight size={18} color="#fff" />
                    </>
                }
              </TouchableOpacity>
              <Text style={[styles.rewardNote, { color: colors.text }]}>
                Earn +15 TP for every route you suggest
              </Text>
            </ScrollView>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 20,
  },
  handleRow: { alignItems: 'center', paddingTop: 10, paddingBottom: 4 },
  handle: { width: 40, height: 4, borderRadius: 2 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 4,
  },
  title: { fontSize: 22, fontWeight: '800' },
  subtitle: { fontSize: 13, marginTop: 2 },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 36 },

  label: { fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 16, opacity: 0.8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
  },
  textArea: { minHeight: 88, textAlignVertical: 'top', paddingTop: 14 },

  routeCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 4,
  },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  routeDot: { width: 12, height: 12, borderRadius: 6 },
  routeDotEnd: { backgroundColor: 'transparent', borderWidth: 2, borderRadius: 6, width: 12, height: 12 },
  routeLine: { paddingLeft: 5, paddingVertical: 6 },
  routeLineDash: { width: 2, height: 20, marginLeft: 4 },
  routeInput: { flex: 1, fontSize: 16, paddingVertical: 8 },

  transportRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  transportChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    flex: 1,
    minWidth: '40%',
    justifyContent: 'center',
  },
  transportLabel: { fontSize: 14, fontWeight: '600' },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    overflow: 'hidden',
  },
  currencySymbol: { fontSize: 16, fontWeight: '700', marginRight: 6 },
  priceInput: { flex: 1, fontSize: 15, paddingVertical: 14 },

  submitBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 24,
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  rewardNote: { textAlign: 'center', fontSize: 12, opacity: 0.45, marginTop: 10 },

  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  successCircle: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  successTitle: { fontSize: 26, fontWeight: '800', marginBottom: 10 },
  successBody: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 14 },
  successPoints: { fontSize: 20, fontWeight: '800' },
});
