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
import {
  MapPin,
  Link,
  Navigation,
  CheckCircle,
  X,
  ChevronRight,
  Coins,
  Lock,
  ArrowRight,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/context/ThemeContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.82;
const SUGGEST_COST = 50;
const PINK = '#e91e8c';

interface Props {
  visible: boolean;
  onClose: () => void;
  userLocation?: { lat: number; lng: number } | null;
  onSuccess?: () => void;
}

type Step = 'unlock' | 'form' | 'success';
type InputMode = 'url' | 'location';

export default function SuggestStopToStopsModal({ visible, onClose, userLocation, onSuccess }: Props) {
  const { colors } = useTheme();
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const [step, setStep] = useState<Step>('unlock');
  const [userPoints, setUserPoints] = useState<number | null>(null);
  const [isLoadingPoints, setIsLoadingPoints] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Form state
  const [mode, setMode] = useState<InputMode>('location');
  const [name, setName] = useState('');
  const [mapsUrl, setMapsUrl] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Animate open / close ──────────────────────────────────────────────────
  useEffect(() => {
    if (visible) {
      setStep('unlock');
      setName('');
      setMapsUrl('');
      setLatitude('');
      setLongitude('');
      setMode('location');
      fetchPoints();
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

  const fetchPoints = async () => {
    setIsLoadingPoints(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data } = await supabase.from('profiles').select('points').eq('id', user.id).single();
      setUserPoints(data?.points ?? 0);
    } catch {
      setUserPoints(0);
    } finally {
      setIsLoadingPoints(false);
    }
  };

  // ── Coordinate helpers ────────────────────────────────────────────────────
  const extractCoordinates = (url: string) => {
    const patterns = [
      /@(-?\d+\.\d+),(-?\d+\.\d+)/,
      /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/,
      /ll=(-?\d+\.\d+),(-?\d+\.\d+)/,
      /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,
    ];
    for (const regex of patterns) {
      const match = url.match(regex);
      if (match) { setLatitude(match[1]); setLongitude(match[2]); return; }
    }
    if (url.length > 15) { setLatitude(''); setLongitude(''); }
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
        Alert.alert('Permission needed', 'Location permission is required.');
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

  // ── Unlock (deduct TP, move to form) ──────────────────────────────────────
  const handleUnlock = () => {
    if ((userPoints ?? 0) < SUGGEST_COST) return;
    setStep('form');
  };

  // ── Submit stop ────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Missing name', 'Please enter a stop name.');
      return;
    }
    if (!latitude || !longitude) {
      Alert.alert('Missing location', mode === 'url'
        ? 'Paste a Google Maps link to get the coordinates.'
        : 'Tap "Use My Location" to fill in coordinates.');
      return;
    }
    if (!userId) {
      Alert.alert('Not logged in', 'Please log in to suggest a stop.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Deduct TP first
      const currentPts = userPoints ?? 0;
      if (currentPts < SUGGEST_COST) throw new Error('Not enough TP');
      await supabase.from('profiles')
        .update({ points: currentPts - SUGGEST_COST })
        .eq('id', userId);

      // Insert into stops table with Suggested = true
      const { error } = await supabase.from('stops').insert({
        name: name.trim(),
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        Suggested: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      if (error) {
        // Refund TP on failure
        await supabase.from('profiles')
          .update({ points: currentPts })
          .eq('id', userId);
        throw error;
      }

      setStep('success');
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2400);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const coordsReady = !!(latitude && longitude);
  const canAfford = (userPoints ?? 0) >= SUGGEST_COST;

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
            { backgroundColor: colors.card, transform: [{ translateY: slideAnim }], height: SHEET_HEIGHT },
          ]}
        >
          {/* Handle */}
          <View style={styles.handleRow}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconCircle, { backgroundColor: `${PINK}18` }]}>
                <MapPin size={20} color={PINK} />
              </View>
              <View>
                <Text style={[styles.title, { color: colors.text }]}>Suggest a Stop</Text>
                <Text style={[styles.subtitle, { color: colors.text }]}>
                  {step === 'unlock' ? 'Unlock to place on the map' : step === 'form' ? 'Fill in the stop details' : 'Stop submitted!'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.background }]}>
              <X size={18} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* ── Step: unlock ─────────────────────────────────────────────── */}
          {step === 'unlock' && (
            <ScrollView
              contentContainerStyle={styles.unlockContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Hero */}
              <View style={[styles.unlockHero, { backgroundColor: `${PINK}0d`, borderColor: `${PINK}22` }]}>
                <View style={[styles.unlockIconBig, { backgroundColor: `${PINK}18` }]}>
                  <MapPin size={44} color={PINK} />
                </View>
                <Text style={[styles.unlockHeadline, { color: colors.text }]}>
                  Place a Stop on the Map
                </Text>
                <Text style={[styles.unlockDesc, { color: colors.text }]}>
                  Your suggested stop will appear immediately on the community map with a special marker. Once verified by our team, it becomes a permanent stop for all riders.
                </Text>
              </View>

              {/* What you get */}
              <View style={[styles.perksBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <PerkRow text="Instantly visible on the community map" />
                <PerkRow text="Pink marker shows it's community-suggested" />
                <PerkRow text="Verified stops earn you +25 bonus TP" />
              </View>

              {/* Cost + balance */}
              <View style={[styles.costRow, { borderColor: colors.border }]}>
                <View>
                  <Text style={[styles.costLabel, { color: colors.text }]}>Cost</Text>
                  <View style={styles.costBadge}>
                    <Coins size={16} color={PINK} />
                    <Text style={[styles.costAmount, { color: PINK }]}>{SUGGEST_COST} TP</Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.costLabel, { color: colors.text }]}>Your balance</Text>
                  {isLoadingPoints ? (
                    <ActivityIndicator size="small" color={PINK} />
                  ) : (
                    <Text style={[styles.balanceText, { color: canAfford ? '#2bb8b3' : '#ef4444' }]}>
                      {userPoints ?? 0} TP
                    </Text>
                  )}
                </View>
              </View>

              {!canAfford && !isLoadingPoints && (
                <View style={[styles.insufficientBox, { backgroundColor: '#ef444412', borderColor: '#ef444430' }]}>
                  <Text style={[styles.insufficientText, { color: '#ef4444' }]}>
                    You need {SUGGEST_COST - (userPoints ?? 0)} more TP.{'\n'}
                    Earn TP by waiting at stops, rating trips, and contributing routes.
                  </Text>
                </View>
              )}

              {/* Unlock button */}
              <TouchableOpacity
                style={[
                  styles.unlockBtn,
                  { backgroundColor: canAfford ? PINK : colors.border, opacity: isLoadingPoints ? 0.6 : 1 },
                ]}
                onPress={handleUnlock}
                disabled={!canAfford || isLoadingPoints}
                activeOpacity={0.85}
              >
                {canAfford
                  ? <><Lock size={16} color="#fff" /><Text style={styles.unlockBtnText}>Unlock for {SUGGEST_COST} TP</Text><ArrowRight size={16} color="#fff" /></>
                  : <><Lock size={16} color={colors.text} /><Text style={[styles.unlockBtnText, { color: colors.text, opacity: 0.5 }]}>Not Enough TP</Text></>
                }
              </TouchableOpacity>

              <Text style={[styles.noteText, { color: colors.text }]}>
                TP is non-refundable once the stop is submitted.
              </Text>
            </ScrollView>
          )}

          {/* ── Step: form ───────────────────────────────────────────────── */}
          {step === 'form' && (
            <ScrollView
              style={styles.scrollArea}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Cost deduction reminder */}
              <View style={[styles.deductionBanner, { backgroundColor: `${PINK}12`, borderColor: `${PINK}28` }]}>
                <Coins size={14} color={PINK} />
                <Text style={[styles.deductionText, { color: PINK }]}>
                  {SUGGEST_COST} TP will be deducted when you submit
                </Text>
              </View>

              {/* Stop name */}
              <Text style={[styles.label, { color: colors.text }]}>Stop Name *</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Main Rd & Station Ave"
                placeholderTextColor={colors.placeholder || '#888'}
              />

              {/* Location */}
              <Text style={[styles.label, { color: colors.text }]}>Location *</Text>
              <View style={[styles.modeToggle, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <TouchableOpacity
                  style={[styles.modeTab, mode === 'location' && { backgroundColor: PINK }]}
                  onPress={() => { setMode('location'); setMapsUrl(''); }}
                  activeOpacity={0.8}
                >
                  <Navigation size={14} color={mode === 'location' ? '#fff' : colors.text} />
                  <Text style={[styles.modeTabText, { color: mode === 'location' ? '#fff' : colors.text, opacity: mode === 'location' ? 1 : 0.6 }]}>
                    My Location
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modeTab, mode === 'url' && { backgroundColor: PINK }]}
                  onPress={() => { setMode('url'); setLatitude(''); setLongitude(''); }}
                  activeOpacity={0.8}
                >
                  <Link size={14} color={mode === 'url' ? '#fff' : colors.text} />
                  <Text style={[styles.modeTabText, { color: mode === 'url' ? '#fff' : colors.text, opacity: mode === 'url' ? 1 : 0.6 }]}>
                    Maps Link
                  </Text>
                </TouchableOpacity>
              </View>

              {mode === 'location' ? (
                <TouchableOpacity
                  style={[styles.locationBtn, { borderColor: coordsReady ? PINK : colors.border, backgroundColor: coordsReady ? `${PINK}10` : colors.background }]}
                  onPress={handleUseMyLocation}
                  disabled={isGettingLocation}
                  activeOpacity={0.8}
                >
                  {isGettingLocation ? (
                    <ActivityIndicator size="small" color={PINK} />
                  ) : coordsReady ? (
                    <CheckCircle size={18} color={PINK} />
                  ) : (
                    <Navigation size={18} color={PINK} />
                  )}
                  <Text style={[styles.locationBtnText, { color: coordsReady ? PINK : colors.text }]}>
                    {isGettingLocation
                      ? 'Getting location…'
                      : coordsReady
                        ? `${parseFloat(latitude).toFixed(5)}, ${parseFloat(longitude).toFixed(5)}`
                        : 'Tap to use your current location'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <>
                  <TextInput
                    style={[styles.input, { borderColor: coordsReady ? PINK : colors.border, color: colors.text, backgroundColor: colors.background, marginTop: 10 }]}
                    value={mapsUrl}
                    onChangeText={(t) => { setMapsUrl(t); extractCoordinates(t); }}
                    placeholder="Paste a Google Maps share link"
                    placeholderTextColor={colors.placeholder || '#888'}
                    keyboardType="url"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Text style={[styles.hint, { color: colors.text }]}>
                    Open Google Maps → long-press a spot → tap the address → Share
                  </Text>
                </>
              )}

              {coordsReady && (
                <View style={[styles.coordsPill, { backgroundColor: `${PINK}12`, borderColor: `${PINK}30` }]}>
                  <CheckCircle size={13} color={PINK} />
                  <Text style={[styles.coordsText, { color: PINK }]}>
                    {parseFloat(latitude).toFixed(5)}, {parseFloat(longitude).toFixed(5)}
                  </Text>
                </View>
              )}

              {/* Submit */}
              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: PINK, opacity: isSubmitting ? 0.7 : 1 }]}
                onPress={handleSubmit}
                disabled={isSubmitting}
                activeOpacity={0.85}
              >
                {isSubmitting
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <><Text style={styles.submitBtnText}>Submit Stop</Text><ChevronRight size={18} color="#fff" /></>
                }
              </TouchableOpacity>
              <Text style={[styles.rewardNote, { color: colors.text }]}>
                Costs {SUGGEST_COST} TP · Earn +25 TP if verified
              </Text>
            </ScrollView>
          )}

          {/* ── Step: success ────────────────────────────────────────────── */}
          {step === 'success' && (
            <View style={styles.successContainer}>
              <View style={[styles.successCircle, { backgroundColor: `${PINK}20` }]}>
                <CheckCircle size={52} color={PINK} />
              </View>
              <Text style={[styles.successTitle, { color: colors.text }]}>Stop Submitted!</Text>
              <Text style={[styles.successBody, { color: colors.text, opacity: 0.65 }]}>
                Your stop is now on the community map.{'\n'}Our team will verify it shortly.
              </Text>
              <View style={[styles.deductionBanner, { backgroundColor: `${PINK}12`, borderColor: `${PINK}28`, marginTop: 12 }]}>
                <Coins size={14} color={PINK} />
                <Text style={[styles.deductionText, { color: PINK }]}>
                  {SUGGEST_COST} TP deducted · +25 TP pending verification
                </Text>
              </View>
            </View>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const PerkRow = ({ text }: { text: string }) => (
  <View style={styles.perkRow}>
    <CheckCircle size={14} color="#2bb8b3" />
    <Text style={styles.perkText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 24,
  },
  handleRow: { alignItems: 'center', paddingTop: 10, paddingBottom: 4 },
  handle: { width: 40, height: 4, borderRadius: 2 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
    paddingTop: 4,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '800' },
  subtitle: { fontSize: 12, opacity: 0.55, marginTop: 1 },
  closeBtn: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },

  // Unlock step
  unlockContent: { paddingHorizontal: 20, paddingBottom: 32 },
  unlockHero: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  unlockIconBig: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  unlockHeadline: { fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  unlockDesc: { fontSize: 13, textAlign: 'center', opacity: 0.6, lineHeight: 19 },

  perksBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
    marginBottom: 16,
  },
  perkRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  perkText: { fontSize: 13, color: '#ccc', flex: 1, lineHeight: 17 },

  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 14,
    marginBottom: 14,
  },
  costLabel: { fontSize: 11, opacity: 0.5, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  costBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  costAmount: { fontSize: 22, fontWeight: '900' },
  balanceText: { fontSize: 20, fontWeight: '800' },

  insufficientBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 14,
  },
  insufficientText: { fontSize: 13, lineHeight: 19, textAlign: 'center' },

  unlockBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
  },
  unlockBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  noteText: { fontSize: 11, opacity: 0.35, textAlign: 'center' },

  // Form step
  scrollArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 32 },

  deductionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    marginBottom: 16,
  },
  deductionText: { fontSize: 12, fontWeight: '600', flex: 1 },

  label: { fontSize: 13, fontWeight: '600', marginBottom: 8, opacity: 0.8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 6, fontSize: 15 },
  hint: { fontSize: 12, opacity: 0.45, marginBottom: 4, lineHeight: 16 },

  modeToggle: { flexDirection: 'row', borderRadius: 12, borderWidth: 1, padding: 4, gap: 4, marginBottom: 10 },
  modeTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 9 },
  modeTabText: { fontSize: 13, fontWeight: '600' },

  locationBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 12, padding: 14, marginTop: 0, marginBottom: 8 },
  locationBtnText: { fontSize: 15, flex: 1 },

  coordsPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, marginBottom: 8 },
  coordsText: { fontSize: 12, fontWeight: '600' },

  submitBtn: { borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 20 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  rewardNote: { textAlign: 'center', fontSize: 12, opacity: 0.45, marginTop: 10 },

  // Success
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  successCircle: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  successTitle: { fontSize: 26, fontWeight: '800', marginBottom: 10 },
  successBody: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 6 },
});
