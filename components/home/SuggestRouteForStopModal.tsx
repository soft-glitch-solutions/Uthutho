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
import {
  Route as RouteIcon,
  CheckCircle,
  X,
  ChevronRight,
  Bus,
  Train,
  Car,
  Zap,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/context/ThemeContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.88;
const ORANGE = '#f97316';

const TRANSPORT_TYPES = [
  { id: 'Taxi',  label: 'Taxi',  Icon: Car },
  { id: 'Bus',   label: 'Bus',   Icon: Bus },
  { id: 'Train', label: 'Train', Icon: Train },
  { id: 'Other', label: 'Other', Icon: Zap },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  stopId: string;
  stopName: string;
  onSuccess?: () => void;
}

type Step = 'form' | 'success';

export default function SuggestRouteForStopModal({ visible, onClose, stopId, stopName, onSuccess }: Props) {
  const { colors } = useTheme();
  const slideAnim   = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const [step, setStep] = useState<Step>('form');
  const [name, setName]             = useState('');
  const [from, setFrom]             = useState('');
  const [to, setTo]                 = useState('');
  const [transportType, setTransportType] = useState('Taxi');
  const [cost, setCost]             = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setStep('form');
      setName(''); setFrom(''); setTo(''); setCost('');
      setTransportType('Taxi');
      Animated.parallel([
        Animated.spring(slideAnim,    { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim,    { toValue: SHEET_HEIGHT, duration: 280, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (!name.trim())  return Alert.alert('Missing name', 'Please enter a route name.');
    if (!from.trim())  return Alert.alert('Missing start', 'Please enter the start point.');
    if (!to.trim())    return Alert.alert('Missing end', 'Please enter the end point.');

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');

      // 1. Insert the route with Suggested = true
      const { data: newRoute, error: routeErr } = await supabase
        .from('routes')
        .insert({
          name: name.trim(),
          transport_type: transportType,
          cost: cost ? parseFloat(cost) : 0,
          start_point: from.trim(),
          end_point: to.trim(),
          Suggested: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single();
      if (routeErr) throw routeErr;

      // 2. Link it to the stop via route_stops
      const { error: linkErr } = await supabase
        .from('route_stops')
        .insert({
          route_id: newRoute.id,
          stop_id: stopId,
          order_number: 1,
        });
      if (linkErr) throw linkErr;

      // 3. Award TP
      try {
        const { data: profile } = await supabase.from('profiles').select('points').eq('id', user.id).single();
        await supabase.from('profiles').update({ points: (profile?.points ?? 0) + 15 }).eq('id', user.id);
      } catch {}

      setStep('success');
      setTimeout(() => { onSuccess?.(); onClose(); }, 2200);
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
        <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            { backgroundColor: colors.card, transform: [{ translateY: slideAnim }], height: SHEET_HEIGHT },
          ]}
        >
          <View style={styles.handleRow}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconCircle, { backgroundColor: `${ORANGE}18` }]}>
                <RouteIcon size={20} color={ORANGE} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: colors.text }]}>Suggest a Route</Text>
                <Text style={[styles.subtitle, { color: colors.text }]} numberOfLines={1}>
                  Linking to {stopName}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.background }]}>
              <X size={18} color={colors.text} />
            </TouchableOpacity>
          </View>

          {step === 'form' ? (
            <ScrollView
              style={styles.scrollArea}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Stop link banner */}
              <View style={[styles.stopBanner, { backgroundColor: `${ORANGE}10`, borderColor: `${ORANGE}28` }]}>
                <RouteIcon size={13} color={ORANGE} />
                <Text style={[styles.stopBannerText, { color: ORANGE }]}>
                  This route will be linked to <Text style={{ fontWeight: '800' }}>{stopName}</Text>
                </Text>
              </View>

              {/* Route name */}
              <Text style={[styles.label, { color: colors.text }]}>Route Name *</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Cape Town CBD → Claremont"
                placeholderTextColor={colors.placeholder || '#888'}
              />

              {/* Transport type */}
              <Text style={[styles.label, { color: colors.text }]}>Transport Type *</Text>
              <View style={styles.typeGrid}>
                {TRANSPORT_TYPES.map(({ id, label, Icon }) => {
                  const active = transportType === id;
                  return (
                    <TouchableOpacity
                      key={id}
                      style={[
                        styles.typeChip,
                        { borderColor: active ? ORANGE : colors.border, backgroundColor: active ? `${ORANGE}15` : colors.background },
                      ]}
                      onPress={() => setTransportType(id)}
                      activeOpacity={0.8}
                    >
                      <Icon size={16} color={active ? ORANGE : colors.text} />
                      <Text style={[styles.typeChipText, { color: active ? ORANGE : colors.text }]}>{label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* From → To visual */}
              <Text style={[styles.label, { color: colors.text }]}>Route Path *</Text>
              <View style={[styles.routePath, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <View style={styles.routePathRow}>
                  <View style={[styles.dot, { backgroundColor: ORANGE }]} />
                  <TextInput
                    style={[styles.pathInput, { color: colors.text }]}
                    value={from}
                    onChangeText={setFrom}
                    placeholder="Start point"
                    placeholderTextColor={colors.placeholder || '#888'}
                  />
                </View>
                <View style={[styles.routePathLine, { borderColor: `${ORANGE}40` }]} />
                <View style={styles.routePathRow}>
                  <View style={[styles.dot, { backgroundColor: '#2bb8b3' }]} />
                  <TextInput
                    style={[styles.pathInput, { color: colors.text }]}
                    value={to}
                    onChangeText={setTo}
                    placeholder="End point"
                    placeholderTextColor={colors.placeholder || '#888'}
                  />
                </View>
              </View>

              {/* Cost (optional) */}
              <Text style={[styles.label, { color: colors.text }]}>Fare (optional)</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
                value={cost}
                onChangeText={setCost}
                placeholder="e.g. 15.00"
                placeholderTextColor={colors.placeholder || '#888'}
                keyboardType="decimal-pad"
              />

              {/* Submit */}
              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: ORANGE, opacity: isSubmitting ? 0.7 : 1 }]}
                onPress={handleSubmit}
                disabled={isSubmitting}
                activeOpacity={0.85}
              >
                {isSubmitting
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <><Text style={styles.submitBtnText}>Submit Route</Text><ChevronRight size={18} color="#fff" /></>
                }
              </TouchableOpacity>
              <Text style={[styles.rewardNote, { color: colors.text }]}>
                Earn +15 TP for every route you suggest
              </Text>
            </ScrollView>
          ) : (
            <View style={styles.successContainer}>
              <View style={[styles.successCircle, { backgroundColor: `${ORANGE}20` }]}>
                <CheckCircle size={52} color={ORANGE} />
              </View>
              <Text style={[styles.successTitle, { color: colors.text }]}>Route Submitted!</Text>
              <Text style={[styles.successBody, { color: colors.text, opacity: 0.65 }]}>
                Your route is now linked to {stopName}.{'\n'}Commuters can start using it right away.
              </Text>
              <Text style={[styles.successPoints, { color: ORANGE }]}>+15 TP earned 🎉</Text>
            </View>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.22, shadowRadius: 20, elevation: 24,
  },
  handleRow: { alignItems: 'center', paddingTop: 10, paddingBottom: 4 },
  handle: { width: 40, height: 4, borderRadius: 2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 14, paddingTop: 4 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '800' },
  subtitle: { fontSize: 12, opacity: 0.55, marginTop: 1 },
  closeBtn: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },

  scrollArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 36 },

  stopBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, borderWidth: 1, padding: 10, marginBottom: 18 },
  stopBannerText: { fontSize: 12, flex: 1, lineHeight: 16 },

  label: { fontSize: 13, fontWeight: '600', marginBottom: 8, opacity: 0.8, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 6 },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 6, fontSize: 15 },

  typeGrid: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 6 },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  typeChipText: { fontSize: 13, fontWeight: '600' },

  routePath: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 4, marginBottom: 6 },
  routePathRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  pathInput: { flex: 1, fontSize: 15, paddingVertical: 6 },
  routePathLine: { borderLeftWidth: 2, borderStyle: 'dashed', height: 18, marginLeft: 4 },

  submitBtn: { borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 22 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  rewardNote: { textAlign: 'center', fontSize: 12, opacity: 0.45, marginTop: 10 },

  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  successCircle: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  successTitle: { fontSize: 26, fontWeight: '800', marginBottom: 10 },
  successBody: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 14 },
  successPoints: { fontSize: 20, fontWeight: '800' },
});
