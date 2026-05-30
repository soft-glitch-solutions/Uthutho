import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { X, MapPin, Route, ChevronDown } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

// ─── Shared helpers ──────────────────────────────────────────────────────────

const TRANSPORT_TYPES = ['bus', 'train', 'taxi', 'tram', 'subway', 'other'] as const;
type TransportType = typeof TRANSPORT_TYPES[number];

// Reverse-geocode using Nominatim (free, no key needed)
async function reverseGeocode(lat: number, lng: number) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    return {
      city:
        data.address?.city ||
        data.address?.town ||
        data.address?.village ||
        data.address?.county ||
        null,
      country: data.address?.country || 'Unknown',
      region:
        data.address?.state ||
        data.address?.province ||
        data.address?.region ||
        null,
    };
  } catch {
    return { city: null, country: 'Unknown', region: null };
  }
}

// ─── Suggest Stop Modal ───────────────────────────────────────────────────────

interface SuggestStopModalProps {
  visible: boolean;
  onClose: () => void;
  userLat: number | null;
  userLng: number | null;
}

export const SuggestStopModal: React.FC<SuggestStopModalProps> = ({
  visible,
  onClose,
  userLat,
  userLng,
}) => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!userLat || !userLng) {
      Alert.alert('Location Unavailable', 'We need your location to suggest a stop.');
      return;
    }

    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Sign In Required', 'Please sign in to suggest a stop.');
        return;
      }

      const geo = await reverseGeocode(userLat, userLng);

      const { error } = await supabase.from('user_stop_suggestions').insert({
        user_id: user.id,
        latitude: userLat,
        longitude: userLng,
        city: geo.city,
        country: geo.country,
        region: geo.region,
      });

      if (error) {
        if (error.code === '23505') {
          Alert.alert(
            'Already Submitted',
            'You have already suggested a stop at this location. Thank you!'
          );
        } else {
          throw error;
        }
      } else {
        Alert.alert(
          '🎉 Stop Suggested!',
          'Your stop suggestion has been submitted. Once enough people vote for it, it will go live!',
          [{ text: 'Awesome!', onPress: onClose }]
        );
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View style={styles.sheetTitleRow}>
              <MapPin size={20} color="#1ea2b1" />
              <Text style={styles.sheetTitle}>Suggest a Stop</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#888" />
            </TouchableOpacity>
          </View>

          <Text style={styles.sheetBody}>
            We'll use your current GPS coordinates to place a stop suggestion on the map.
            Once it receives enough community votes, it'll go live!
          </Text>

          {userLat && userLng ? (
            <View style={styles.coordsBox}>
              <MapPin size={14} color="#1ea2b1" />
              <Text style={styles.coordsText}>
                {userLat.toFixed(5)}, {userLng.toFixed(5)}
              </Text>
            </View>
          ) : (
            <Text style={styles.noLocation}>📍 Waiting for your location…</Text>
          )}

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading || !userLat || !userLng}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.submitBtnText}>Submit Stop at My Location</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ─── Suggest Route Modal ──────────────────────────────────────────────────────

interface SuggestRouteModalProps {
  visible: boolean;
  onClose: () => void;
  userLat: number | null;
  userLng: number | null;
}

export const SuggestRouteModal: React.FC<SuggestRouteModalProps> = ({
  visible,
  onClose,
  userLat,
  userLng,
}) => {
  const [routeName, setRouteName] = useState('');
  const [transportType, setTransportType] = useState<TransportType>('bus');
  const [cost, setCost] = useState('');
  const [instructions, setInstructions] = useState('');
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setRouteName('');
    setTransportType('bus');
    setCost('');
    setInstructions('');
  };

  const handleSubmit = async () => {
    if (!routeName.trim()) {
      Alert.alert('Missing Info', 'Please enter a destination or route name.');
      return;
    }

    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Sign In Required', 'Please sign in to suggest a route.');
        return;
      }

      const geo = userLat && userLng ? await reverseGeocode(userLat, userLng) : { city: null, country: 'Unknown', region: null };

      const costNum = parseFloat(cost) || 0;

      const { error } = await supabase.from('route_suggestions').insert({
        user_id: user.id,
        name: routeName.trim(),
        transport_type: transportType,
        cost: costNum,
        city: geo.city,
        country: geo.country,
        region: geo.region,
        instructions: instructions.trim() || null,
      });

      if (error) throw error;

      Alert.alert(
        '🎉 Route Suggested!',
        'Your route suggestion has been submitted. The community will vote on it!',
        [
          {
            text: 'Done!',
            onPress: () => {
              reset();
              onClose();
            },
          },
        ]
      );
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Header */}
            <View style={styles.sheetHeader}>
              <View style={styles.sheetTitleRow}>
                <Route size={20} color="#1ea2b1" />
                <Text style={styles.sheetTitle}>Suggest a Route</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={20} color="#888" />
              </TouchableOpacity>
            </View>

            <Text style={styles.sheetBody}>
              Tell us about a route you wish existed in your area. Your suggestion helps us
              prioritise where to expand next.
            </Text>

            {/* Destination / Route Name */}
            <Text style={styles.label}>Destination / Route Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Downtown to Airport"
              placeholderTextColor="#555"
              value={routeName}
              onChangeText={setRouteName}
            />

            {/* Transport Type */}
            <Text style={styles.label}>Transport Type</Text>
            <TouchableOpacity
              style={styles.pickerBtn}
              onPress={() => setShowTypePicker(!showTypePicker)}
            >
              <Text style={styles.pickerBtnText}>{transportType.toUpperCase()}</Text>
              <ChevronDown size={16} color="#888" />
            </TouchableOpacity>
            {showTypePicker && (
              <View style={styles.typeOptions}>
                {TRANSPORT_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeOption, transportType === t && styles.typeOptionActive]}
                    onPress={() => {
                      setTransportType(t);
                      setShowTypePicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.typeOptionText,
                        transportType === t && styles.typeOptionTextActive,
                      ]}
                    >
                      {t.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Cost */}
            <Text style={styles.label}>Estimated Cost (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 15.00"
              placeholderTextColor="#555"
              keyboardType="decimal-pad"
              value={cost}
              onChangeText={setCost}
            />

            {/* Instructions */}
            <Text style={styles.label}>How does it work? (optional)</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="Describe the route, stops, or anything helpful…"
              placeholderTextColor="#555"
              multiline
              numberOfLines={4}
              value={instructions}
              onChangeText={setInstructions}
            />

            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.submitBtnText}>Submit Route Suggestion</Text>
              )}
            </TouchableOpacity>

            <View style={{ height: 32 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#0d0d0d',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
    borderTopWidth: 1,
    borderColor: '#1a1a1a',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  closeBtn: {
    padding: 4,
  },
  sheetBody: {
    color: '#888',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  coordsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(30,162,177,0.08)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(30,162,177,0.2)',
  },
  coordsText: {
    color: '#1ea2b1',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  noLocation: {
    color: '#666',
    fontSize: 13,
    marginBottom: 20,
  },
  label: {
    color: '#aaa',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 15,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  inputMultiline: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  pickerBtn: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  pickerBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  typeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  typeOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  typeOptionActive: {
    backgroundColor: 'rgba(30,162,177,0.15)',
    borderColor: '#1ea2b1',
  },
  typeOptionText: {
    color: '#666',
    fontSize: 13,
    fontWeight: '700',
  },
  typeOptionTextActive: {
    color: '#1ea2b1',
  },
  submitBtn: {
    backgroundColor: '#1ea2b1',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
});
