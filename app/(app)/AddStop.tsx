import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useTheme } from '@/context/ThemeContext';
import { MapPin, CheckCircle, ChevronDown, ChevronUp, X } from 'lucide-react-native';

export default function AddStop() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const isCommunityMode = params.mode === 'community';

  const [name, setName] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [cost, setCost] = useState('');
  const [description, setDescription] = useState('');
  const [routeId, setRouteId] = useState('');
  const [routes, setRoutes] = useState<{ id: string; name: string }[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRoutePicker, setShowRoutePicker] = useState(false);
  const [selectedRouteName, setSelectedRouteName] = useState('');
  const [isFetchingRoutes, setIsFetchingRoutes] = useState(false);

  useEffect(() => {
    if (!isCommunityMode) {
      fetchRoutes();
    }
  }, [isCommunityMode]);

  const fetchRoutes = async () => {
    setIsFetchingRoutes(true);
    try {
      const { data, error } = await supabase.from('routes').select('id, name').order('name');
      if (error) throw error;
      setRoutes(data || []);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to fetch routes: ' + error.message);
    } finally {
      setIsFetchingRoutes(false);
    }
  };

  const extractCoordinates = (url: string) => {
    try {
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
          return { latitude: match[1], longitude: match[2] };
        }
      }
      if (url.length > 10) {
        Alert.alert('Could not extract coordinates', 'Please use a Google Maps link that shows coordinates in the URL (e.g. from sharing a pin).');
      }
      return null;
    } catch {
      return null;
    }
  };

  const awardPoints = async (userId: string, points: number) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', userId)
        .single();
      const current = profile?.points ?? 0;
      await supabase
        .from('profiles')
        .update({ points: current + points })
        .eq('id', userId);
    } catch {
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (!name.trim()) {
      Alert.alert('Missing Info', 'Please enter a stop name.');
      return;
    }
    if (!latitude || !longitude) {
      Alert.alert('Missing Location', 'Please paste a Google Maps URL to auto-fill the coordinates.');
      return;
    }
    if (!isCommunityMode && !routeId) {
      Alert.alert('Missing Route', 'Please select a route for this stop.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;
      if (!userId) throw new Error('You must be logged in to submit a stop.');

      const submissionData: any = {
        user_id: userId,
        name: name.trim(),
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        cost: cost ? parseFloat(cost) : null,
        description: description.trim() || null,
        status: isCommunityMode ? 'community_suggestion' : 'pending',
        created_at: new Date().toISOString(),
      };

      if (!isCommunityMode && routeId) {
        submissionData.route_id = routeId;
      }

      const { error } = await supabase.from('stop_requests').insert(submissionData);
      if (error) throw error;

      try {
        await awardPoints(userId, 10);
      } catch {
      }

      setShowSuccessModal(true);
    } catch (error: any) {
      Alert.alert('Submission Error', error.message || 'Failed to submit stop. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setShowSuccessModal(false);
    router.back();
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {isCommunityMode && (
        <View style={[styles.communityBanner, { backgroundColor: '#2bb8b315', borderColor: '#2bb8b340' }]}>
          <MapPin size={18} color="#2bb8b3" />
          <Text style={[styles.communityBannerText, { color: '#2bb8b3' }]}>
            You're suggesting a stop to help launch Uthutho in your area. No existing route needed!
          </Text>
        </View>
      )}

      <Text style={[styles.label, { color: colors.text }]}>Stop Name *</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
        value={name}
        onChangeText={setName}
        placeholder="e.g. Main St & Market Ave"
        placeholderTextColor={colors.placeholder || '#888'}
      />

      <Text style={[styles.label, { color: colors.text }]}>Google Maps URL *</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
        value={googleMapsUrl}
        onChangeText={(text) => {
          setGoogleMapsUrl(text);
          extractCoordinates(text);
        }}
        placeholder="Paste a Google Maps share link"
        placeholderTextColor={colors.placeholder || '#888'}
        keyboardType="url"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Text style={[styles.hint, { color: colors.text, opacity: 0.5 }]}>
        Open Google Maps → long-press a location → tap the address → Share link
      </Text>

      {latitude && longitude ? (
        <View style={[styles.coordsRow, { backgroundColor: '#2bb8b315', borderColor: '#2bb8b330' }]}>
          <CheckCircle size={16} color="#2bb8b3" />
          <Text style={styles.coordsText}>
            {parseFloat(latitude).toFixed(5)}, {parseFloat(longitude).toFixed(5)}
          </Text>
        </View>
      ) : null}

      {!isCommunityMode && (
        <>
          <Text style={[styles.label, { color: colors.text }]}>Select Route *</Text>
          {isFetchingRoutes ? (
            <View style={[styles.routePickerButton, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <ActivityIndicator size="small" color={colors.primary || '#2bb8b3'} />
              <Text style={[styles.routePickerButtonText, { color: colors.text, opacity: 0.5 }]}>
                Loading routes…
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.routePickerButton,
                { borderColor: selectedRouteName ? '#2bb8b3' : colors.border, backgroundColor: colors.card }
              ]}
              onPress={() => setShowRoutePicker(true)}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.routePickerButtonText,
                { color: selectedRouteName ? colors.text : (colors.placeholder || '#888') }
              ]}>
                {selectedRouteName || 'Choose a route…'}
              </Text>
              <ChevronDown size={18} color={colors.text} style={{ opacity: 0.5 }} />
            </TouchableOpacity>
          )}
        </>
      )}

      <Text style={[styles.label, { color: colors.text }]}>Cost (Optional)</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
        value={cost}
        onChangeText={setCost}
        placeholder="0.00"
        placeholderTextColor={colors.placeholder || '#888'}
        keyboardType="decimal-pad"
      />

      <Text style={[styles.label, { color: colors.text }]}>Description (Optional)</Text>
      <TextInput
        style={[styles.input, styles.textArea, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
        value={description}
        onChangeText={setDescription}
        placeholder={isCommunityMode
          ? 'Describe this stop and why it would help commuters…'
          : 'Describe this stop…'}
        placeholderTextColor={colors.placeholder || '#888'}
        multiline
        numberOfLines={4}
      />

      <TouchableOpacity
        style={[styles.submitButton, { backgroundColor: colors.primary || '#2bb8b3', opacity: isSubmitting ? 0.7 : 1 }]}
        onPress={handleSubmit}
        disabled={isSubmitting}
        activeOpacity={0.85}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.submitButtonText}>
            {isCommunityMode ? 'Submit Community Stop' : 'Submit Stop Request'}
          </Text>
        )}
      </TouchableOpacity>

      {isCommunityMode && (
        <Text style={[styles.rewardHint, { color: colors.text, opacity: 0.5 }]}>
          You'll earn 10 TP for each stop you contribute 🎉
        </Text>
      )}

      {/* Route Picker Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={showRoutePicker}
        onRequestClose={() => setShowRoutePicker(false)}
      >
        <View style={styles.pickerOverlay}>
          <View style={[styles.pickerSheet, { backgroundColor: colors.card }]}>
            <View style={styles.pickerHeader}>
              <Text style={[styles.pickerTitle, { color: colors.text }]}>Select a Route</Text>
              <TouchableOpacity onPress={() => setShowRoutePicker(false)}>
                <X size={22} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerList} keyboardShouldPersistTaps="handled">
              {routes.length === 0 ? (
                <Text style={[styles.pickerEmpty, { color: colors.text, opacity: 0.5 }]}>
                  No routes available
                </Text>
              ) : (
                routes.map((route) => (
                  <TouchableOpacity
                    key={route.id}
                    style={[
                      styles.pickerItem,
                      { borderBottomColor: colors.border },
                      routeId === route.id && { backgroundColor: '#2bb8b315' }
                    ]}
                    onPress={() => {
                      setRouteId(route.id);
                      setSelectedRouteName(route.name);
                      setShowRoutePicker(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.pickerItemText,
                      { color: colors.text },
                      routeId === route.id && { color: '#2bb8b3', fontWeight: '700' }
                    ]}>
                      {route.name}
                    </Text>
                    {routeId === route.id && <CheckCircle size={16} color="#2bb8b3" />}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        animationType="fade"
        transparent
        visible={showSuccessModal}
        onRequestClose={closeModal}
      >
        <View style={styles.successOverlay}>
          <View style={[styles.successContent, { backgroundColor: colors.card }]}>
            <View style={styles.successIcon}>
              <CheckCircle size={56} color="#2bb8b3" />
            </View>
            <Text style={[styles.successTitle, { color: colors.text }]}>Thank You!</Text>
            <Text style={[styles.successBody, { color: colors.text, opacity: 0.8 }]}>
              {isCommunityMode
                ? 'Your stop suggestion has been added to the community movement. Every contribution helps bring Uthutho to your area!'
                : 'Your stop submission has been received. We\'ll review it and add it to the network soon.'}
            </Text>
            <Text style={[styles.rewardText, { color: '#2bb8b3' }]}>
              +10 TP earned for your contribution!
            </Text>
            <TouchableOpacity
              style={[styles.successButton, { backgroundColor: colors.primary || '#2bb8b3' }]}
              onPress={closeModal}
            >
              <Text style={styles.successButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },

  communityBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  communityBannerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 4,
  },
  hint: {
    fontSize: 11,
    marginTop: -8,
    marginBottom: 14,
    lineHeight: 15,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 13,
    marginBottom: 16,
    fontSize: 15,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 13,
  },

  coordsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: -8,
    marginBottom: 16,
  },
  coordsText: {
    fontSize: 12,
    color: '#2bb8b3',
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },

  routePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 10,
    padding: 13,
    marginBottom: 16,
  },
  routePickerButtonText: { fontSize: 15, flex: 1 },

  submitButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  rewardHint: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 12,
  },

  pickerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  pickerSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 32,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  pickerTitle: { fontSize: 18, fontWeight: '700' },
  pickerList: { maxHeight: 400 },
  pickerEmpty: { padding: 20, textAlign: 'center', fontSize: 14 },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pickerItemText: { fontSize: 15, flex: 1 },

  successOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 24,
  },
  successContent: {
    width: '100%',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
  },
  successIcon: { marginBottom: 16 },
  successTitle: { fontSize: 24, fontWeight: '800', marginBottom: 12 },
  successBody: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  rewardText: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 24,
    textAlign: 'center',
  },
  successButton: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
  },
  successButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
