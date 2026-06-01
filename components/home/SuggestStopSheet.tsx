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
import * as Location from 'expo-location';
import { MapPin, Link, Navigation, CheckCircle, X, ChevronRight } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/context/ThemeContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.82;

interface SuggestStopSheetProps {
  visible: boolean;
  onClose: () => void;
  userLocation?: { lat: number; lng: number } | null;
  onSuccess?: () => void;
}

type InputMode = 'url' | 'location';

export default function SuggestStopSheet({ visible, onClose, userLocation, onSuccess }: SuggestStopSheetProps) {
  const { colors } = useTheme();
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const [mode, setMode] = useState<InputMode>('url');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [mapsUrl, setMapsUrl] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (visible) {
      setSubmitted(false);
      setName('');
      setDescription('');
      setMapsUrl('');
      setLatitude('');
      setLongitude('');
      setMode('url');
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

  const extractCoordinates = (url: string) => {
    const patterns = [
      /@(-?\d+\.\d+),(-?\d+\.\d+)/,
      /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/,
      /ll=(-?\d+\.\d+),(-?\d+\.\d+)/,
      /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,
    ];
    for (const regex of patterns) {
      const match = url.match(regex);
      if (match) {
        setLatitude(match[1]);
        setLongitude(match[2]);
        return;
      }
    }
    if (url.length > 15) {
      setLatitude('');
      setLongitude('');
    }
  };

  const handleUseMyLocation = async () => {
    if (userLocation) {
      setLatitude(userLocation.lat.toFixed(6));
      setLongitude(userLocation.lng.toFixed(6));
      return;
    }
    setIsGettingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Location permission is required to use this feature.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLatitude(loc.coords.latitude.toFixed(6));
      setLongitude(loc.coords.longitude.toFixed(6));
    } catch {
      Alert.alert('Error', 'Could not get your location. Try again.');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Missing name', 'Please enter a stop name.');
      return;
    }
    if (!latitude || !longitude) {
      Alert.alert('Missing location', mode === 'url'
        ? 'Please paste a Google Maps link to get the coordinates.'
        : 'Tap "Use My Location" to fill in your coordinates.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');

      const { error } = await supabase.from('stop_requests').insert({
        user_id: user.id,
        name: name.trim(),
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        description: description.trim() || null,
        status: 'community_suggestion',
        created_at: new Date().toISOString(),
      });
      if (error) throw error;

      // Award points
      try {
        const { data: profile } = await supabase
          .from('profiles').select('points').eq('id', user.id).single();
        await supabase.from('profiles')
          .update({ points: (profile?.points ?? 0) + 10 })
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

  const coordsReady = !!(latitude && longitude);

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
          {/* Handle bar */}
          <View style={styles.handleRow}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>Suggest a Stop</Text>
              <Text style={[styles.subtitle, { color: colors.text, opacity: 0.55 }]}>
                Help build Uthutho in your area
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
              <Text style={[styles.successTitle, { color: colors.text }]}>Stop Submitted!</Text>
              <Text style={[styles.successBody, { color: colors.text, opacity: 0.65 }]}>
                Thanks for helping build the community.
              </Text>
              <Text style={[styles.successPoints, { color: '#2bb8b3' }]}>+10 TP earned 🎉</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.scrollArea}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Stop name */}
              <Text style={[styles.label, { color: colors.text }]}>Stop Name *</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Main St & Market Ave"
                placeholderTextColor={colors.placeholder || '#888'}
              />

              {/* Mode toggle */}
              <Text style={[styles.label, { color: colors.text }]}>Location *</Text>
              <View style={[styles.modeToggle, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <TouchableOpacity
                  style={[styles.modeTab, mode === 'url' && { backgroundColor: '#2bb8b3' }]}
                  onPress={() => { setMode('url'); setLatitude(''); setLongitude(''); }}
                  activeOpacity={0.8}
                >
                  <Link size={14} color={mode === 'url' ? '#fff' : (colors.text)} />
                  <Text style={[styles.modeTabText, { color: mode === 'url' ? '#fff' : colors.text, opacity: mode === 'url' ? 1 : 0.6 }]}>
                    Google Maps URL
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modeTab, mode === 'location' && { backgroundColor: '#2bb8b3' }]}
                  onPress={() => { setMode('location'); setMapsUrl(''); }}
                  activeOpacity={0.8}
                >
                  <Navigation size={14} color={mode === 'location' ? '#fff' : colors.text} />
                  <Text style={[styles.modeTabText, { color: mode === 'location' ? '#fff' : colors.text, opacity: mode === 'location' ? 1 : 0.6 }]}>
                    Use My Location
                  </Text>
                </TouchableOpacity>
              </View>

              {mode === 'url' ? (
                <>
                  <TextInput
                    style={[styles.input, { borderColor: coordsReady ? '#2bb8b3' : colors.border, color: colors.text, backgroundColor: colors.background, marginTop: 10 }]}
                    value={mapsUrl}
                    onChangeText={(t) => { setMapsUrl(t); extractCoordinates(t); }}
                    placeholder="Paste a Google Maps share link"
                    placeholderTextColor={colors.placeholder || '#888'}
                    keyboardType="url"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Text style={[styles.hint, { color: colors.text }]}>
                    Open Google Maps → long-press a spot → tap the address → Share link
                  </Text>
                </>
              ) : (
                <TouchableOpacity
                  style={[styles.locationBtn, { borderColor: coordsReady ? '#2bb8b3' : colors.border, backgroundColor: coordsReady ? '#2bb8b310' : colors.background }]}
                  onPress={handleUseMyLocation}
                  disabled={isGettingLocation}
                  activeOpacity={0.8}
                >
                  {isGettingLocation ? (
                    <ActivityIndicator size="small" color="#2bb8b3" />
                  ) : coordsReady ? (
                    <CheckCircle size={18} color="#2bb8b3" />
                  ) : (
                    <Navigation size={18} color="#2bb8b3" />
                  )}
                  <Text style={[styles.locationBtnText, { color: coordsReady ? '#2bb8b3' : colors.text }]}>
                    {isGettingLocation
                      ? 'Getting location…'
                      : coordsReady
                        ? `${parseFloat(latitude).toFixed(5)}, ${parseFloat(longitude).toFixed(5)}`
                        : 'Tap to use your current location'}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Coords pill when url mode fills in */}
              {mode === 'url' && coordsReady && (
                <View style={[styles.coordsPill, { backgroundColor: '#2bb8b312', borderColor: '#2bb8b330' }]}>
                  <CheckCircle size={13} color="#2bb8b3" />
                  <Text style={styles.coordsText}>
                    {parseFloat(latitude).toFixed(5)}, {parseFloat(longitude).toFixed(5)}
                  </Text>
                </View>
              )}

              {/* Description */}
              <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>Description (optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe this stop — what's nearby, who uses it…"
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
                      <Text style={styles.submitBtnText}>Submit Stop</Text>
                      <ChevronRight size={18} color="#fff" />
                    </>
                }
              </TouchableOpacity>
              <Text style={[styles.rewardNote, { color: colors.text }]}>
                Earn +10 TP for every stop you suggest
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
  scrollContent: { paddingHorizontal: 20, paddingBottom: 32 },

  label: { fontSize: 13, fontWeight: '600', marginBottom: 8, opacity: 0.8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 6,
    fontSize: 15,
  },
  textArea: { minHeight: 88, textAlignVertical: 'top', paddingTop: 14 },
  hint: { fontSize: 12, opacity: 0.45, marginBottom: 4, lineHeight: 16 },

  modeToggle: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 9,
  },
  modeTabText: { fontSize: 13, fontWeight: '600' },

  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
  },
  locationBtnText: { fontSize: 15, flex: 1 },

  coordsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 4,
    marginTop: 2,
  },
  coordsText: { fontSize: 12, color: '#2bb8b3', fontWeight: '600' },

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
