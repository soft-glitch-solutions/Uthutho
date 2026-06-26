import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  Search,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Bus,
  Train,
  Car,
  Zap,
  Plus,
  MapPin,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/context/ThemeContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.9;
const ORANGE = '#f97316';

const TRANSPORT_TYPES = ['Taxi', 'Bus', 'Train', 'Other'];

const TRANSPORT_ICON: Record<string, React.ComponentType<any>> = {
  Taxi: Car,
  Bus: Bus,
  Train: Train,
  Other: Zap,
};

interface RouteResult {
  id: string;
  name: string;
  transport_type: string;
  cost: number;
  start_point: string;
  end_point: string;
}

interface MergedStop {
  stopId: string;
  name: string;
  isNew: boolean;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  stopId: string;
  stopName: string;
  onSuccess?: () => void;
}

type Step = 'search' | 'order' | 'create' | 'success';

export default function SuggestRouteForStopModal({ visible, onClose, stopId, stopName, onSuccess }: Props) {
  const { colors } = useTheme();
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  // ── Step ─────────────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>('search');

  // ── Search step ───────────────────────────────────────────────────────────
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<RouteResult[]>([]);

  // ── Order step ────────────────────────────────────────────────────────────
  const [selectedRoute, setSelectedRoute] = useState<RouteResult | null>(null);
  const [mergedList, setMergedList] = useState<MergedStop[]>([]);
  const [isLoadingStops, setIsLoadingStops] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Create step ───────────────────────────────────────────────────────────
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('Taxi');
  const [newStart, setNewStart] = useState('');
  const [newEnd, setNewEnd] = useState('');
  const [newCost, setNewCost] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // ── Animation ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (visible) {
      setStep('search');
      setQuery('');
      setResults([]);
      setSelectedRoute(null);
      setMergedList([]);
      setNewName(''); setNewType('Taxi'); setNewStart(''); setNewEnd(''); setNewCost('');
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

  // ── Search ────────────────────────────────────────────────────────────────
  const searchRoutes = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setIsSearching(true);
    try {
      const { data } = await supabase
        .from('routes')
        .select('id, name, transport_type, cost, start_point, end_point')
        .or(`name.ilike.%${q}%,start_point.ilike.%${q}%,end_point.ilike.%${q}%`)
        .limit(20);
      setResults(data || []);
    } catch {}
    setIsSearching(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchRoutes(query), 350);
    return () => clearTimeout(t);
  }, [query, searchRoutes]);

  // ── Select an existing route → load its stop chain ────────────────────────
  const handleSelectRoute = async (route: RouteResult) => {
    setSelectedRoute(route);
    setStep('order');
    setIsLoadingStops(true);
    try {
      const { data } = await supabase
        .from('route_stops')
        .select('stop_id, order_number, stops(name)')
        .eq('route_id', route.id)
        .order('order_number', { ascending: true });

      const existing: MergedStop[] = (data || []).map((s: any) => ({
        stopId: s.stop_id,
        name: s.stops?.name ?? 'Unknown stop',
        isNew: false,
      }));

      // Insert the new stop at the end by default
      setMergedList([...existing, { stopId, name: stopName, isNew: true }]);
    } catch {}
    setIsLoadingStops(false);
  };

  // ── Move new stop up / down in the chain ──────────────────────────────────
  const newStopIndex = mergedList.findIndex(s => s.isNew);

  const moveUp = () => {
    if (newStopIndex <= 0) return;
    const list = [...mergedList];
    [list[newStopIndex], list[newStopIndex - 1]] = [list[newStopIndex - 1], list[newStopIndex]];
    setMergedList(list);
  };

  const moveDown = () => {
    if (newStopIndex >= mergedList.length - 1) return;
    const list = [...mergedList];
    [list[newStopIndex], list[newStopIndex + 1]] = [list[newStopIndex + 1], list[newStopIndex]];
    setMergedList(list);
  };

  // ── Submit: insert new stop + renumber all existing stops ─────────────────
  const handleSubmit = async () => {
    if (!selectedRoute || newStopIndex < 0) return;
    setIsSubmitting(true);
    try {
      const finalOrder = newStopIndex + 1; // 1-indexed

      // Insert the new route_stop
      const { error } = await supabase.from('route_stops').insert({
        route_id: selectedRoute.id,
        stop_id: stopId,
        order_number: finalOrder,
      });
      if (error) {
        if (error.code === '23505') {
          Alert.alert('Already linked', `${stopName} is already part of this route.`);
          setIsSubmitting(false);
          return;
        }
        throw error;
      }

      // Renumber all the other stops to match the new visual order
      const existingUpdates = mergedList
        .map((s, i) => ({ ...s, newOrder: i + 1 }))
        .filter(s => !s.isNew);

      await Promise.all(
        existingUpdates.map(s =>
          supabase.from('route_stops')
            .update({ order_number: s.newOrder })
            .eq('route_id', selectedRoute.id)
            .eq('stop_id', s.stopId)
        )
      );

      // Mark route as community-suggested
      await supabase.from('routes').update({ Suggested: true }).eq('id', selectedRoute.id);

      // Award TP
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase.from('profiles').select('points').eq('id', user.id).single();
          await supabase.from('profiles').update({ points: (profile?.points ?? 0) + 5 }).eq('id', user.id);
        }
      } catch {}

      setStep('success');
      setTimeout(() => { onSuccess?.(); onClose(); }, 2800);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not link stop to route. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Create a brand-new route then flow to order step ─────────────────────
  const handleCreateRoute = async () => {
    if (!newName.trim() || !newStart.trim() || !newEnd.trim()) {
      Alert.alert('Missing fields', 'Please fill in route name, start point, and end point.');
      return;
    }
    setIsCreating(true);
    try {
      const { data, error } = await supabase
        .from('routes')
        .insert({
          name: newName.trim(),
          transport_type: newType,
          start_point: newStart.trim(),
          end_point: newEnd.trim(),
          cost: parseFloat(newCost) || 0,
          Suggested: true,
        })
        .select()
        .single();
      if (error) throw error;
      // Jump straight to order step (no existing stops yet)
      await handleSelectRoute(data as RouteResult);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not create route.');
    } finally {
      setIsCreating(false);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const renderTransportBadge = (type: string) => {
    const Icon = TRANSPORT_ICON[type] || Zap;
    return (
      <View style={[styles.badge, { backgroundColor: `${ORANGE}18`, borderColor: `${ORANGE}40` }]}>
        <Icon size={11} color={ORANGE} />
        <Text style={[styles.badgeText, { color: ORANGE }]}>{type}</Text>
      </View>
    );
  };

  // ── Step: Search ──────────────────────────────────────────────────────────
  const renderSearchStep = () => (
    <ScrollView
      style={styles.scrollArea}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Banner */}
      <View style={[styles.stopBanner, { backgroundColor: `${ORANGE}10`, borderColor: `${ORANGE}28` }]}>
        <RouteIcon size={13} color={ORANGE} />
        <Text style={[styles.stopBannerText, { color: ORANGE }]}>
          Linking a route to <Text style={{ fontWeight: '800' }}>{stopName}</Text>
        </Text>
      </View>

      {/* ── Section 1: Search existing ── */}
      <Text style={[styles.sectionLabel, { color: colors.text }]}>Search existing routes</Text>

      <View style={[styles.searchBox, { backgroundColor: colors.background, borderColor: query ? ORANGE : colors.border }]}>
        <Search size={16} color={query ? ORANGE : colors.text} style={{ opacity: query ? 1 : 0.45 }} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          value={query}
          onChangeText={setQuery}
          placeholder="Route name, start or end location…"
          placeholderTextColor={colors.text + '55'}
          autoFocus
          returnKeyType="search"
        />
        {isSearching
          ? <ActivityIndicator size="small" color={ORANGE} />
          : query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <X size={15} color={colors.text} style={{ opacity: 0.45 }} />
            </TouchableOpacity>
          )
        }
      </View>

      {query.trim().length === 0 && (
        <Text style={[styles.hint, { color: colors.text }]}>
          Type to search — select a route to place this stop on it.
        </Text>
      )}

      {query.trim().length > 0 && !isSearching && results.length === 0 && (
        <Text style={[styles.noResults, { color: colors.text }]}>No routes found for "{query}"</Text>
      )}

      {results.map((route) => (
        <TouchableOpacity
          key={route.id}
          style={[styles.routeRow, { backgroundColor: colors.background, borderColor: colors.border }]}
          onPress={() => handleSelectRoute(route)}
          activeOpacity={0.78}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.routeRowName, { color: colors.text }]} numberOfLines={1}>{route.name}</Text>
            <Text style={[styles.routeRowPath, { color: colors.text + '75' }]} numberOfLines={1}>
              {route.start_point} → {route.end_point}
            </Text>
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
              {renderTransportBadge(route.transport_type)}
              {route.cost > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.badgeText, { color: colors.text }]}>R {route.cost}</Text>
                </View>
              )}
            </View>
          </View>
          <ChevronRight size={18} color={ORANGE} />
        </TouchableOpacity>
      ))}

      {/* ── Section 2: Create new route ── */}
      <View style={[styles.dividerRow, { marginTop: results.length > 0 ? 20 : 8 }]}>
        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        <Text style={[styles.dividerText, { color: colors.text }]}>Can't find your route?</Text>
        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
      </View>

      <TouchableOpacity
        style={[styles.createRouteBtn, { backgroundColor: colors.background, borderColor: ORANGE }]}
        onPress={() => setStep('create')}
        activeOpacity={0.8}
      >
        <View style={[styles.createRouteBtnIcon, { backgroundColor: `${ORANGE}18` }]}>
          <Plus size={16} color={ORANGE} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.createRouteBtnTitle, { color: colors.text }]}>Create a new route</Text>
          <Text style={[styles.createRouteBtnSub, { color: colors.text }]}>
            Add it to the system and place this stop on it
          </Text>
        </View>
        <ChevronRight size={16} color={ORANGE} />
      </TouchableOpacity>
    </ScrollView>
  );

  // ── Step: Order (drag-less reorder via up/down arrows) ────────────────────
  const renderOrderStep = () => {
    if (!selectedRoute) return null;
    return (
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Selected route card */}
        <View style={[styles.selectedRouteCard, { backgroundColor: `${ORANGE}10`, borderColor: `${ORANGE}35` }]}>
          <RouteIcon size={15} color={ORANGE} style={{ flexShrink: 0 }} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.routeRowName, { color: colors.text }]} numberOfLines={1}>{selectedRoute.name}</Text>
            <Text style={[styles.routeRowPath, { color: colors.text + '75' }]} numberOfLines={1}>
              {selectedRoute.start_point} → {selectedRoute.end_point}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => { setStep('search'); setSelectedRoute(null); setMergedList([]); }}
            style={[styles.changeBtn, { backgroundColor: colors.background }]}
          >
            <Text style={{ color: ORANGE, fontSize: 12, fontWeight: '700' }}>Change</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.text }]}>Stop order on this route</Text>
        <Text style={[styles.hint, { color: colors.text, textAlign: 'left', marginTop: 0, marginBottom: 12 }]}>
          Use the arrows to move <Text style={{ fontWeight: '700', opacity: 1 }}>{stopName}</Text> to the right position in the sequence.
        </Text>

        {isLoadingStops ? (
          <ActivityIndicator color={ORANGE} style={{ marginVertical: 24 }} />
        ) : mergedList.length === 1 ? (
          // Only the new stop (route had no stops)
          <View style={[styles.stopChain, { borderColor: `${ORANGE}50` }]}>
            <View style={styles.chainRow}>
              <View style={[styles.chainDot, { backgroundColor: ORANGE }]} />
              <View style={[styles.chainNewPill, { backgroundColor: `${ORANGE}15`, borderColor: `${ORANGE}50` }]}>
                <MapPin size={11} color={ORANGE} />
                <Text style={[styles.chainNewText, { color: ORANGE }]}>
                  #1 · {stopName} <Text style={{ fontWeight: '500', opacity: 0.7 }}>(your stop)</Text>
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={[styles.stopChain, { borderColor: colors.border }]}>
            {mergedList.map((s, i) => (
              <View key={s.isNew ? 'new' : s.stopId}>
                <View style={styles.chainRow}>
                  <View style={[
                    styles.chainDot,
                    { backgroundColor: s.isNew ? ORANGE : colors.text, opacity: s.isNew ? 1 : 0.3 },
                  ]} />

                  {s.isNew ? (
                    /* ── New stop row with up/down controls ── */
                    <View style={styles.chainNewRow}>
                      <View style={[styles.chainNewPill, { backgroundColor: `${ORANGE}15`, borderColor: `${ORANGE}50`, flex: 1 }]}>
                        <MapPin size={11} color={ORANGE} />
                        <Text style={[styles.chainNewText, { color: ORANGE }]} numberOfLines={1}>
                          #{i + 1} · {stopName}
                        </Text>
                        <Text style={[styles.chainNewTag, { color: ORANGE }]}>your stop</Text>
                      </View>
                      <View style={styles.arrowCol}>
                        <TouchableOpacity
                          style={[styles.arrowBtn, { backgroundColor: i > 0 ? `${ORANGE}20` : colors.background, borderColor: i > 0 ? ORANGE : colors.border }]}
                          onPress={moveUp}
                          disabled={i === 0}
                          activeOpacity={0.7}
                        >
                          <ChevronUp size={14} color={i > 0 ? ORANGE : colors.text} style={{ opacity: i > 0 ? 1 : 0.25 }} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.arrowBtn, { backgroundColor: i < mergedList.length - 1 ? `${ORANGE}20` : colors.background, borderColor: i < mergedList.length - 1 ? ORANGE : colors.border }]}
                          onPress={moveDown}
                          disabled={i === mergedList.length - 1}
                          activeOpacity={0.7}
                        >
                          <ChevronDown size={14} color={i < mergedList.length - 1 ? ORANGE : colors.text} style={{ opacity: i < mergedList.length - 1 ? 1 : 0.25 }} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    /* ── Existing stop row ── */
                    <Text style={[styles.chainExistingText, { color: colors.text }]} numberOfLines={1}>
                      <Text style={{ opacity: 0.45 }}>#{i + 1}</Text>{'  '}{s.name}
                    </Text>
                  )}
                </View>

                {i < mergedList.length - 1 && (
                  <View style={[styles.chainConnector, { borderColor: s.isNew ? `${ORANGE}60` : colors.border }]} />
                )}
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: ORANGE, opacity: isSubmitting ? 0.7 : 1 }]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.85}
        >
          {isSubmitting
            ? <ActivityIndicator color="#fff" size="small" />
            : <><Text style={styles.submitBtnText}>Confirm Position</Text><ChevronRight size={18} color="#fff" /></>
          }
        </TouchableOpacity>
        <Text style={[styles.rewardNote, { color: colors.text }]}>+5 TP earned for linking a stop to a route</Text>
      </ScrollView>
    );
  };

  // ── Step: Create route ────────────────────────────────────────────────────
  const renderCreateStep = () => (
    <ScrollView
      style={styles.scrollArea}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.stopBanner, { backgroundColor: `${ORANGE}10`, borderColor: `${ORANGE}28` }]}>
        <Plus size={13} color={ORANGE} />
        <Text style={[styles.stopBannerText, { color: ORANGE }]}>
          New route · will be marked <Text style={{ fontWeight: '800' }}>Community Suggested</Text>
        </Text>
      </View>

      <Text style={[styles.sectionLabel, { color: colors.text }]}>Route name</Text>
      <View style={[styles.inputBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <TextInput
          style={[styles.inputField, { color: colors.text }]}
          value={newName}
          onChangeText={setNewName}
          placeholder="e.g. Cape Town CBD → Sea Point"
          placeholderTextColor={colors.text + '50'}
          autoFocus
        />
      </View>

      <Text style={[styles.sectionLabel, { color: colors.text }]}>Transport type</Text>
      <View style={styles.typeRow}>
        {TRANSPORT_TYPES.map(t => {
          const Icon = TRANSPORT_ICON[t] || Zap;
          const active = newType === t;
          return (
            <TouchableOpacity
              key={t}
              style={[styles.typeChip, {
                backgroundColor: active ? `${ORANGE}18` : colors.background,
                borderColor: active ? ORANGE : colors.border,
              }]}
              onPress={() => setNewType(t)}
              activeOpacity={0.8}
            >
              <Icon size={13} color={active ? ORANGE : colors.text} style={{ opacity: active ? 1 : 0.5 }} />
              <Text style={[styles.typeChipText, { color: active ? ORANGE : colors.text, opacity: active ? 1 : 0.6 }]}>{t}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[styles.sectionLabel, { color: colors.text }]}>Start point</Text>
      <View style={[styles.inputBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <TextInput
          style={[styles.inputField, { color: colors.text }]}
          value={newStart}
          onChangeText={setNewStart}
          placeholder="e.g. Cape Town Station"
          placeholderTextColor={colors.text + '50'}
        />
      </View>

      <Text style={[styles.sectionLabel, { color: colors.text }]}>End point</Text>
      <View style={[styles.inputBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <TextInput
          style={[styles.inputField, { color: colors.text }]}
          value={newEnd}
          onChangeText={setNewEnd}
          placeholder="e.g. Sea Point Pavilion"
          placeholderTextColor={colors.text + '50'}
        />
      </View>

      <Text style={[styles.sectionLabel, { color: colors.text }]}>Fare (R) <Text style={{ fontWeight: '400', textTransform: 'none', letterSpacing: 0 }}>— optional</Text></Text>
      <View style={[styles.inputBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <TextInput
          style={[styles.inputField, { color: colors.text }]}
          value={newCost}
          onChangeText={setNewCost}
          placeholder="e.g. 15"
          placeholderTextColor={colors.text + '50'}
          keyboardType="decimal-pad"
        />
      </View>

      <TouchableOpacity
        style={[styles.submitBtn, { backgroundColor: ORANGE, opacity: isCreating ? 0.7 : 1, marginTop: 24 }]}
        onPress={handleCreateRoute}
        disabled={isCreating}
        activeOpacity={0.85}
      >
        {isCreating
          ? <ActivityIndicator color="#fff" size="small" />
          : <><Text style={styles.submitBtnText}>Create Route &amp; Continue</Text><ChevronRight size={18} color="#fff" /></>
        }
      </TouchableOpacity>
    </ScrollView>
  );

  // ── Step indicators ───────────────────────────────────────────────────────
  const stepDots: Step[] = ['search', 'order', 'success'];

  const getTitle = () => {
    if (step === 'search') return 'Add Route to Stop';
    if (step === 'create') return 'Create New Route';
    if (step === 'order') return 'Set Stop Position';
    return 'Stop Linked!';
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        </Animated.View>

        <Animated.View style={[styles.sheet, { backgroundColor: colors.card, transform: [{ translateY: slideAnim }], height: SHEET_HEIGHT }]}>
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
                <Text style={[styles.title, { color: colors.text }]}>{getTitle()}</Text>
                <Text style={[styles.subtitle, { color: colors.text }]} numberOfLines={1}>{stopName}</Text>
              </View>
            </View>
            {step !== 'success' && (
              <TouchableOpacity
                onPress={() => {
                  if (step === 'order') { setStep('search'); setSelectedRoute(null); setMergedList([]); }
                  else if (step === 'create') setStep('search');
                  else onClose();
                }}
                style={[styles.closeBtn, { backgroundColor: colors.background }]}
              >
                <X size={18} color={colors.text} />
              </TouchableOpacity>
            )}
          </View>

          {/* Step dots (not shown on 'create') */}
          {step !== 'create' && step !== 'success' && (
            <View style={styles.stepIndicator}>
              {stepDots.map((s, i) => (
                <React.Fragment key={s}>
                  <View style={[styles.stepDot, {
                    backgroundColor: step === s || (step === 'order' && i <= 1) || (step === 'success' && i <= 2)
                      ? ORANGE : colors.border,
                    width: step === s ? 20 : 8,
                  }]} />
                  {i < stepDots.length - 1 && (
                    <View style={[styles.stepLine, {
                      backgroundColor: (step === 'order' && i === 0) || (step === 'success') ? ORANGE : colors.border,
                    }]} />
                  )}
                </React.Fragment>
              ))}
            </View>
          )}

          {step === 'search' && renderSearchStep()}
          {step === 'order' && renderOrderStep()}
          {step === 'create' && renderCreateStep()}
          {step === 'success' && (
            <View style={styles.successContainer}>
              <View style={[styles.successCircle, { backgroundColor: `${ORANGE}20` }]}>
                <CheckCircle size={52} color={ORANGE} />
              </View>
              <Text style={[styles.successTitle, { color: colors.text }]}>Stop Linked!</Text>
              <Text style={[styles.successBody, { color: colors.text, opacity: 0.65 }]}>
                {stopName} has been added to{'\n'}
                <Text style={{ fontWeight: '800', opacity: 1 }}>{selectedRoute?.name}</Text>.
              </Text>
              <View style={[styles.communityBadge, { backgroundColor: `${ORANGE}15`, borderColor: `${ORANGE}45` }]}>
                <RouteIcon size={13} color={ORANGE} />
                <Text style={[styles.communityBadgeText, { color: ORANGE }]}>Community Suggested</Text>
              </View>
              <Text style={[styles.communityNote, { color: colors.text }]}>
                This route now shows the orange community badge wherever it appears.
              </Text>
              <Text style={[styles.successPoints, { color: ORANGE }]}>+5 TP earned 🎉</Text>
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
    paddingBottom: 10,
    paddingTop: 4,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '800' },
  subtitle: { fontSize: 12, opacity: 0.55, marginTop: 1 },
  closeBtn: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },

  stepIndicator: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 14 },
  stepDot: { height: 8, borderRadius: 4 },
  stepLine: { flex: 1, height: 2, marginHorizontal: 6 },

  scrollArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 44 },

  stopBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    marginBottom: 18,
  },
  stopBannerText: { fontSize: 12, flex: 1, lineHeight: 16 },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    opacity: 0.55,
    marginBottom: 8,
  },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  searchInput: { flex: 1, fontSize: 15 },

  hint: { fontSize: 13, opacity: 0.5, textAlign: 'center', marginVertical: 14, lineHeight: 19 },
  noResults: { fontSize: 14, opacity: 0.55, textAlign: 'center', marginVertical: 16 },

  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  routeRowName: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  routeRowPath: { fontSize: 12 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { fontSize: 11, fontWeight: '600' },

  // "Can't find" divider
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 12, opacity: 0.45, fontWeight: '600' },

  createRouteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
    marginBottom: 6,
  },
  createRouteBtnIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  createRouteBtnTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  createRouteBtnSub: { fontSize: 12, opacity: 0.5 },

  // Order step
  selectedRouteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  changeBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },

  stopChain: { borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 8 },
  chainRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  chainDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  chainConnector: { borderLeftWidth: 2, borderStyle: 'dashed', height: 14, marginLeft: 3, marginVertical: 1 },

  chainExistingText: { fontSize: 13, flex: 1 },

  chainNewRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  chainNewPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chainNewText: { fontSize: 13, fontWeight: '700', flex: 1 },
  chainNewTag: { fontSize: 10, fontWeight: '600', opacity: 0.65 },

  arrowCol: { gap: 4 },
  arrowBtn: { width: 28, height: 28, borderRadius: 8, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },

  submitBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 20,
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  rewardNote: { textAlign: 'center', fontSize: 12, opacity: 0.45, marginTop: 10 },

  // Create step
  inputBox: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  inputField: { fontSize: 15 },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  typeChipText: { fontSize: 13, fontWeight: '600' },

  // Success
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  successCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  successTitle: { fontSize: 26, fontWeight: '800', marginBottom: 8 },
  successBody: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 14 },
  communityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginBottom: 10,
  },
  communityBadgeText: { fontSize: 13, fontWeight: '800' },
  communityNote: { fontSize: 12, opacity: 0.5, textAlign: 'center', lineHeight: 17, paddingHorizontal: 12, marginBottom: 16 },
  successPoints: { fontSize: 20, fontWeight: '800' },
});
