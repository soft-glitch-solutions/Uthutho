import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Animated, Dimensions } from 'react-native';
import { ChevronRight, Users, Clock, Leaf, ArrowLeft, CheckCircle, X } from 'lucide-react-native';

const { width: W, height: H } = Dimensions.get('window');

const DEMO_ROUTES = [
  { id: '1', name: 'Cape Town CBD → Bellville', transport_type: 'Minibus', cost: 14, start_point: 'Cape Town CBD', end_point: 'Bellville', waiting: 4, co2: '2.4', time: '34m' },
  { id: '2', name: 'Gardens → Rondebosch → Claremont', transport_type: 'Train', cost: 9, start_point: 'Gardens', end_point: 'Claremont', waiting: 2, co2: '1.8', time: '22m' },
  { id: '3', name: 'Century City Express', transport_type: 'Bus', cost: 12, start_point: 'Cape Town CBD', end_point: 'Century City', waiting: 0, co2: '3.1', time: '28m' },
];

const TYPE_COLOR: Record<string, string> = { Minibus: '#1ea2b1', Train: '#8B5CF6', Bus: '#10b981' };

interface Props { visible: boolean; onClose: () => void; onConfirm: () => void; }

export default function DemoWaitingDrawer({ visible, onClose, onConfirm }: Props) {
  const [step, setStep] = useState<'select' | 'confirm' | 'done'>('select');
  const [selected, setSelected] = useState(DEMO_ROUTES[0]);
  const slideAnim = useRef(new Animated.Value(H)).current;

  useEffect(() => {
    if (visible) {
      setStep('select');
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 60, friction: 10 }).start();
    } else {
      Animated.timing(slideAnim, { toValue: H, duration: 280, useNativeDriver: true }).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.overlay}>
        <Animated.View style={[s.sheet, { transform: [{ translateY: slideAnim }] }]}>
          {/* Demo badge */}
          <View style={s.demoBadge}><Text style={s.demoBadgeText}>✦ TUTORIAL DEMO — No real journey started</Text></View>
          <View style={s.handle} />

          {/* Header */}
          <View style={s.header}>
            <Text style={s.readyTag}>READY TO MOVE</Text>
            <Text style={s.title}>{step === 'select' ? 'SELECT YOUR ROUTE' : step === 'confirm' ? 'CONFIRM WAITING' : 'JOURNEY STARTING!'}</Text>
            <Text style={s.sub}>Greenmarket Square Stop · 4 people nearby</Text>
          </View>

          {step === 'select' && (
            <>
              <ScrollView contentContainerStyle={s.routeList} showsVerticalScrollIndicator={false}>
                {DEMO_ROUTES.map(r => (
                  <TouchableOpacity key={r.id} style={[s.routeCard, selected.id === r.id && s.routeCardActive]} onPress={() => setSelected(r)}>
                    <View style={s.routeTop}>
                      <View style={[s.typePill, { backgroundColor: (TYPE_COLOR[r.transport_type] || '#1ea2b1') + '20', borderColor: TYPE_COLOR[r.transport_type] || '#1ea2b1' }]}>
                        <Text style={[s.typeText, { color: TYPE_COLOR[r.transport_type] || '#1ea2b1' }]}>{r.transport_type}</Text>
                      </View>
                      <Text style={s.cost}>R {r.cost}</Text>
                      {selected.id === r.id && <CheckCircle size={18} color="#1ea2b1" />}
                    </View>
                    <Text style={s.routeName}>{r.name}</Text>
                    <View style={s.badges}>
                      <View style={[s.badge, r.waiting > 0 && s.badgeActive]}>
                        <Users size={11} color={r.waiting > 0 ? '#FFF' : '#666'} />
                        <Text style={[s.badgeText, r.waiting > 0 && { color: '#FFF' }]}>{r.waiting} waiting</Text>
                      </View>
                      <View style={s.badge}><Leaf size={11} color="#10b981" /><Text style={[s.badgeText, { color: '#10b981' }]}>Saves {r.co2}kg CO₂</Text></View>
                      <View style={s.badge}><Clock size={11} color="#1ea2b1" /><Text style={[s.badgeText, { color: '#1ea2b1' }]}>{r.time}</Text></View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View style={s.footer}>
                <TouchableOpacity style={s.nextBtn} onPress={() => setStep('confirm')}>
                  <Text style={s.nextBtnText}>CONTINUE WITH {selected.transport_type.toUpperCase()}</Text>
                  <ChevronRight size={18} color="#000" />
                </TouchableOpacity>
              </View>
            </>
          )}

          {step === 'confirm' && (
            <ScrollView contentContainerStyle={s.confirmContent}>
              <TouchableOpacity style={s.back} onPress={() => setStep('select')}>
                <ArrowLeft size={16} color="#1ea2b1" />
                <Text style={s.backText}>BACK TO ROUTES</Text>
              </TouchableOpacity>
              <View style={s.confirmCard}>
                <Text style={s.confirmLabel}>YOU'RE ABOUT TO JOIN THE WAITING LIST FOR</Text>
                <View style={[s.typePill, { backgroundColor: (TYPE_COLOR[selected.transport_type] || '#1ea2b1') + '15', borderColor: TYPE_COLOR[selected.transport_type] || '#1ea2b1', alignSelf: 'flex-start', marginBottom: 12 }]}>
                  <Text style={[s.typeText, { color: TYPE_COLOR[selected.transport_type] || '#1ea2b1' }]}>{selected.transport_type}</Text>
                </View>
                <Text style={s.confirmRouteName}>{selected.name}</Text>
                <Text style={s.confirmRoute}>{selected.start_point} → {selected.end_point}</Text>
                <Text style={s.confirmCost}>R {selected.cost} per trip</Text>
                <View style={s.waitInfo}>
                  <Users size={16} color="#1ea2b1" />
                  <Text style={s.waitText}>{selected.waiting} people already waiting at this stop</Text>
                </View>
              </View>
              <TouchableOpacity style={s.confirmBtn} onPress={() => { setStep('done'); setTimeout(() => { onConfirm(); setStep('select'); }, 1800); }}>
                <Text style={s.confirmBtnText}>✓  CONFIRM WAITING</Text>
              </TouchableOpacity>
              <Text style={s.demoNote}>In the real app, this starts your journey and earns you points!</Text>
            </ScrollView>
          )}

          {step === 'done' && (
            <View style={s.doneContainer}>
              <Text style={s.doneEmoji}>🎉</Text>
              <Text style={s.doneTitle}>Journey Started!</Text>
              <Text style={s.doneSub}>You earned +2 Uthutho Points</Text>
            </View>
          )}

          <TouchableOpacity style={s.closeBtn} onPress={onClose}><X size={18} color="#888" /></TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#000', borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: H * 0.88, borderTopWidth: 1, borderColor: '#222' },
  demoBadge: { backgroundColor: 'rgba(251,191,36,0.12)', borderBottomWidth: 1, borderColor: 'rgba(251,191,36,0.2)', paddingVertical: 8, alignItems: 'center' },
  demoBadgeText: { fontSize: 10, fontWeight: '800', color: '#fbbf24', letterSpacing: 1 },
  handle: { width: 40, height: 4, backgroundColor: '#333', borderRadius: 2, alignSelf: 'center', marginTop: 12 },
  header: { padding: 20, paddingBottom: 12 },
  readyTag: { fontSize: 10, fontWeight: '900', color: '#1ea2b1', letterSpacing: 2, marginBottom: 4 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFF', fontStyle: 'italic', letterSpacing: -0.5, marginBottom: 4 },
  sub: { fontSize: 13, color: '#555' },
  routeList: { paddingHorizontal: 20, paddingBottom: 8, gap: 10 },
  routeCard: { backgroundColor: '#111', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#222' },
  routeCardActive: { borderColor: '#1ea2b1' },
  routeTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  typePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  typeText: { fontSize: 11, fontWeight: '800' },
  cost: { flex: 1, fontSize: 16, fontWeight: '800', color: '#FFF' },
  routeName: { fontSize: 14, fontWeight: '600', color: '#FFF', marginBottom: 10 },
  badges: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#1a1a1a', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeActive: { backgroundColor: '#1ea2b1' },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#666' },
  footer: { padding: 16, paddingBottom: 32 },
  nextBtn: { backgroundColor: '#1ea2b1', height: 56, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  nextBtnText: { color: '#000', fontWeight: '900', fontSize: 14, letterSpacing: 0.5 },
  confirmContent: { padding: 20, paddingBottom: 40 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  backText: { fontSize: 11, fontWeight: '800', color: '#1ea2b1', letterSpacing: 1 },
  confirmCard: { backgroundColor: '#111', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#222', marginBottom: 20 },
  confirmLabel: { fontSize: 9, fontWeight: '900', color: '#444', letterSpacing: 1.5, marginBottom: 12 },
  confirmRouteName: { fontSize: 18, fontWeight: 'bold', color: '#FFF', marginBottom: 4 },
  confirmRoute: { fontSize: 13, color: '#666', marginBottom: 8 },
  confirmCost: { fontSize: 22, fontWeight: '900', color: '#1ea2b1', marginBottom: 16 },
  waitInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(30,162,177,0.08)', padding: 12, borderRadius: 12 },
  waitText: { color: '#1ea2b1', fontSize: 13, fontWeight: '600', flex: 1 },
  confirmBtn: { backgroundColor: '#1ea2b1', height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  confirmBtnText: { color: '#000', fontWeight: '900', fontSize: 16 },
  demoNote: { textAlign: 'center', fontSize: 12, color: '#555', fontStyle: 'italic' },
  doneContainer: { alignItems: 'center', paddingVertical: 60 },
  doneEmoji: { fontSize: 64, marginBottom: 16 },
  doneTitle: { fontSize: 28, fontWeight: 'bold', color: '#FFF', fontStyle: 'italic', marginBottom: 8 },
  doneSub: { fontSize: 14, color: '#10b981', fontWeight: '700' },
  closeBtn: { position: 'absolute', top: 48, right: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#222' },
});
