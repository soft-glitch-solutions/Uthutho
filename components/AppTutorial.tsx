import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Animated, Dimensions, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChevronRight, ChevronLeft, X, Navigation, MapPin, Bus, Star, Users, Zap } from 'lucide-react-native';
import DemoWaitingDrawer from './DemoWaitingDrawer';

const { width: SW, height: SH } = Dimensions.get('window');
export const TUTORIAL_SEEN_KEY = 'hasSeenAppTutorial_v2';

export async function shouldShowTutorial(): Promise<boolean> {
  return (await AsyncStorage.getItem(TUTORIAL_SEEN_KEY)) !== 'true';
}
export async function resetTutorial(): Promise<void> {
  await AsyncStorage.removeItem(TUTORIAL_SEEN_KEY);
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface Rect { x: number; y: number; width: number; height: number; }

export interface TutorialRefs {
  headerRef?: React.RefObject<View>;
  nearbyRef?: React.RefObject<View>;
  servicesRef?: React.RefObject<View>;
  favoritesRef?: React.RefObject<View>;
  gamificationRef?: React.RefObject<View>;
}

interface Step {
  id: string;
  refKey: keyof TutorialRefs | null;
  /** 'demo' steps pause the tutorial and show the DemoWaitingDrawer */
  isDemo?: boolean;
  tag: string;
  title: string;
  body: string;
  icon: React.ReactNode;
  accent: string;
  position: 'above' | 'below' | 'center';
  pad: number;
}

const STEPS: Step[] = [
  { id: 'welcome', refKey: null, tag: 'WELCOME TO UTHUTHO', title: 'Your Smart Commute Companion', body: "Let's quickly show you how Uthutho works. Tap NEXT for a guided tour, or SKIP to explore on your own.", icon: <Navigation size={30} color="#1ea2b1" />, accent: '#1ea2b1', position: 'center', pad: 0 },
  { id: 'header', refKey: 'headerRef', tag: 'YOUR IDENTITY', title: 'Points & Profile', body: 'Your live Uthutho Points (TP) balance. Tap your avatar to view your profile, streak and achievements.', icon: <Star size={26} color="#fbbf24" />, accent: '#fbbf24', position: 'below', pad: 12 },
  { id: 'nearby', refKey: 'nearbyRef', tag: 'STEP 1 — STOPS', title: 'Nearby Stops & Hubs', body: 'Your nearest transport stop and community hub. Tap it to see live waiting counts and available routes.', icon: <MapPin size={26} color="#1ea2b1" />, accent: '#1ea2b1', position: 'below', pad: 14 },
  { id: 'services', refKey: 'servicesRef', tag: 'STEP 2 — SERVICES', title: 'Quick Access Panel', body: 'Jump to Leaderboards, Trips, School Transport, Driver dashboard and more — all from one row.', icon: <Zap size={26} color="#8B5CF6" />, accent: '#8B5CF6', position: 'below', pad: 10 },
  { id: 'favorites', refKey: 'favoritesRef', tag: 'STEP 3 — COMMUNITY', title: 'Your Saved Places', body: 'Pin your favourite stops, routes and hubs here for quick access and live community activity.', icon: <Users size={26} color="#10B981" />, accent: '#10B981', position: 'above', pad: 10 },
  { id: 'gamification', refKey: 'gamificationRef', tag: 'STEP 4 — REWARDS', title: 'Earn Points & Level Up', body: 'Every journey earns Uthutho Points. Build streaks for bonuses and climb the weekly leaderboard.', icon: <Star size={26} color="#fbbf24" />, accent: '#fbbf24', position: 'above', pad: 10 },
  { id: 'demo', refKey: null, isDemo: true, tag: 'TRY IT NOW — DEMO', title: 'Start Your First Journey', body: "Here's exactly what it looks like when you join a waiting list at a stop. Tap the button below to try the demo!", icon: <Bus size={30} color="#1ea2b1" />, accent: '#1ea2b1', position: 'center', pad: 0 },
];

// ─── Spotlight ────────────────────────────────────────────────────────────────
const Spotlight = ({ rect, pad, color }: { rect: Rect; pad: number; color: string }) => {
  const x = Math.max(0, rect.x - pad);
  const y = Math.max(0, rect.y - pad);
  const w = rect.width + pad * 2;
  const h = rect.height + pad * 2;
  const dim = 'rgba(0,0,0,0.84)';
  return (
    <>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: y, backgroundColor: dim }} pointerEvents="none" />
      <View style={{ position: 'absolute', top: y, left: 0, width: x, height: h, backgroundColor: dim }} pointerEvents="none" />
      <View style={{ position: 'absolute', top: y, left: x + w, right: 0, height: h, backgroundColor: dim }} pointerEvents="none" />
      <View style={{ position: 'absolute', top: y + h, left: 0, right: 0, bottom: 0, backgroundColor: dim }} pointerEvents="none" />
      <View style={{ position: 'absolute', top: y, left: x, width: w, height: h, borderRadius: 20, borderWidth: 2, borderColor: color }} pointerEvents="none" />
    </>
  );
};

// ─── Tooltip ──────────────────────────────────────────────────────────────────
const CARD_MAX_H = Math.min(SH * 0.42, 320);
const MARGIN = 14;

function calcTop(rect: Rect, pad: number, pos: Step['position']): number {
  const spotBot = rect.y + rect.height + pad * 2 + MARGIN;
  const spotTop = rect.y - pad - MARGIN - CARD_MAX_H;
  if (pos === 'below' && spotBot + CARD_MAX_H < SH - 20) return spotBot;
  if (pos === 'above' && spotTop > 80) return spotTop;
  if (spotBot + CARD_MAX_H < SH - 20) return spotBot;
  return Math.max(80, spotTop);
}

interface TooltipProps {
  step: Step; rect: Rect | null; isFirst: boolean; isLast: boolean;
  idx: number; total: number; onNext: () => void; onPrev: () => void;
  onSkip: () => void; onOpenDemo: () => void; fade: Animated.Value;
}

const Tooltip = ({ step, rect, isFirst, isLast, idx, total, onNext, onPrev, onSkip, onOpenDemo, fade }: TooltipProps) => {
  const centered = step.position === 'center' || !rect;
  const top = (!centered && rect) ? calcTop(rect, step.pad, step.position) : undefined;

  const wrapStyle: any = centered
    ? [stt.centered]
    : [stt.positioned, { top: Math.max(80, Math.min(top ?? 100, SH - CARD_MAX_H - 20)) }];

  return (
    <Animated.View style={[wrapStyle, { opacity: fade }]} pointerEvents="box-none">
      <View style={[stt.card, { borderColor: step.accent + '55', maxHeight: CARD_MAX_H }]}>
        {/* Dots */}
        <View style={stt.dots}>
          {Array.from({ length: total }).map((_, i) => (
            <View key={i} style={[stt.dot, i === idx && { width: 18, backgroundColor: step.accent }, i < idx && { backgroundColor: '#555' }]} />
          ))}
        </View>

        {/* Scrollable content */}
        <ScrollView showsVerticalScrollIndicator={false} style={{ flexShrink: 1 }} contentContainerStyle={{ paddingBottom: 4 }}>
          <View style={stt.iconRow}>
            <View style={[stt.iconBox, { backgroundColor: step.accent + '18' }]}>{step.icon}</View>
            <Text style={[stt.tag, { color: step.accent }]}>{step.tag}</Text>
          </View>
          <Text style={stt.title}>{step.title}</Text>
          <Text style={stt.body}>{step.body}</Text>

          {step.isDemo && (
            <TouchableOpacity style={[stt.demoBtn, { backgroundColor: step.accent }]} onPress={onOpenDemo}>
              <Bus size={16} color="#000" />
              <Text style={stt.demoBtnText}>OPEN JOURNEY DEMO</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Always-visible buttons pinned at bottom */}
        <View style={stt.btns}>
          {isFirst ? (
            <TouchableOpacity onPress={onSkip} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} style={stt.skipBtn}>
              <Text style={stt.skipText}>Skip tour</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={onPrev} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} style={stt.backBtn}>
              <ChevronLeft size={16} color="#666" />
              <Text style={stt.backText}>Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={onNext}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={[stt.nextBtn, { backgroundColor: step.accent }]}
          >
            <Text style={stt.nextText}>{isLast ? "LET'S GO!" : 'NEXT'}</Text>
            {!isLast && <ChevronRight size={15} color="#000" />}
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
interface AppTutorialProps { visible: boolean; onClose: () => void; refs?: TutorialRefs; }

export default function AppTutorial({ visible, onClose, refs = {} }: AppTutorialProps) {
  const [idx, setIdx] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [ready, setReady] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const fade = useRef(new Animated.Value(0)).current;

  const step = STEPS[idx];
  const isFirst = idx === 0;
  const isLast = idx === STEPS.length - 1;

  const measure = useCallback(() => {
    if (!step.refKey) { setRect(null); setReady(true); return; }
    const ref = refs[step.refKey];
    if (!ref?.current) { setRect(null); setReady(true); return; }
    ref.current.measureInWindow((x, y, w, h) => {
      setRect(w > 0 ? { x, y, width: w, height: h } : null);
      setReady(true);
    });
  }, [step.refKey, refs]);

  useEffect(() => {
    if (!visible) { fade.setValue(0); return; }
    setReady(false);
    const t = setTimeout(measure, 150);
    return () => clearTimeout(t);
  }, [visible, idx, measure]);

  useEffect(() => {
    if (!ready) return;
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 260, useNativeDriver: true }).start();
  }, [ready]);

  const next = () => isLast ? finish() : (setReady(false), setIdx(i => i + 1));
  const prev = () => !isFirst && (setReady(false), setIdx(i => i - 1));
  const finish = async () => { await AsyncStorage.setItem(TUTORIAL_SEEN_KEY, 'true'); onClose(); setIdx(0); };

  if (!visible) return null;

  return (
    <>
      <Modal visible transparent statusBarTranslucent onRequestClose={finish}>
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          {/* Spotlight or plain dim */}
          {ready && rect && <Spotlight rect={rect} pad={step.pad} color={step.accent} />}
          {ready && !rect && <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.84)' }]} pointerEvents="none" />}

          {/* Close */}
          <TouchableOpacity style={stt.closeBtn} onPress={finish} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <X size={17} color="#888" />
          </TouchableOpacity>

          {/* Tooltip */}
          {ready && (
            <Tooltip
              step={step} rect={rect} isFirst={isFirst} isLast={isLast}
              idx={idx} total={STEPS.length} onNext={next} onPrev={prev}
              onSkip={finish} onOpenDemo={() => setShowDemo(true)} fade={fade}
            />
          )}
        </View>
      </Modal>

      {/* Demo drawer rendered outside the tutorial modal so it sits on top */}
      <DemoWaitingDrawer
        visible={showDemo}
        onClose={() => setShowDemo(false)}
        onConfirm={() => { setShowDemo(false); next(); }}
      />
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const stt = StyleSheet.create({
  centered: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 },
  positioned: { position: 'absolute', left: 14, right: 14 },
  card: {
    backgroundColor: '#111', borderRadius: 26, padding: 18, borderWidth: 1,
    width: '100%', maxWidth: 430,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.7, shadowRadius: 28, elevation: 24,
  },
  dots: { flexDirection: 'row', gap: 5, marginBottom: 14 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#1e1e1e' },
  iconRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  iconBox: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  tag: { fontSize: 9, fontWeight: '900', letterSpacing: 2, flex: 1, textTransform: 'uppercase' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#FFF', fontStyle: 'italic', letterSpacing: -0.3, marginBottom: 8, lineHeight: 26 },
  body: { fontSize: 13, color: '#888', lineHeight: 20, marginBottom: 12 },
  demoBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, borderRadius: 16, marginBottom: 4 },
  demoBtnText: { color: '#000', fontWeight: '900', fontSize: 13, letterSpacing: 0.5 },
  btns: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, borderTopWidth: 1, borderTopColor: '#1a1a1a', paddingTop: 14 },
  skipBtn: { paddingVertical: 8, paddingHorizontal: 4 },
  skipText: { color: '#444', fontSize: 13, fontWeight: '600' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 8 },
  backText: { color: '#555', fontSize: 13, fontWeight: '600' },
  nextBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 16, gap: 5 },
  nextText: { color: '#000', fontWeight: '900', fontSize: 13, letterSpacing: 0.5 },
  closeBtn: {
    position: 'absolute', top: Platform.OS === 'ios' ? 54 : 34, right: 18, zIndex: 200,
    backgroundColor: '#111', borderRadius: 18, width: 36, height: 36,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#333',
  },
});
