import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Animated, Dimensions, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChevronRight, ChevronLeft, X, Navigation, MapPin, Bus, Star, Users, Zap, CreditCard, MessageSquare, Heart, Share2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTutorial, TutorialRefs } from '@/context/TutorialContext';
import DemoWaitingDrawer from './DemoWaitingDrawer';

const { width: SW, height: SH } = Dimensions.get('window');
const IS_SMALL_SCREEN = SH < 700;
export const TUTORIAL_SEEN_KEY = 'hasSeenAppTutorial_v4';

export async function shouldShowTutorial(): Promise<boolean> {
  return (await AsyncStorage.getItem(TUTORIAL_SEEN_KEY)) !== 'true';
}
export async function resetTutorial(): Promise<void> {
  await AsyncStorage.removeItem(TUTORIAL_SEEN_KEY);
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface Rect { x: number; y: number; width: number; height: number; }

interface Step {
  id: string;
  refKey: keyof TutorialRefs | null;
  isDemo?: 'waiting' | 'tracker' | 'feeds' | null;
  tag: string;
  title: string;
  body: string;
  icon: React.ReactNode;
  accent: string;
  position: 'above' | 'below' | 'center';
  pad: number;
  tab?: string; // Tab to navigate to
}

const STEPS: Step[] = [
  { id: 'demo_waiting', refKey: null, isDemo: 'waiting', tag: 'THE CORE EXPERIENCE', title: 'Start Your First Journey', body: "Uthutho is built around community-driven transport. Here's exactly what it looks like when you join a waiting list at a stop. Tap below to try!", icon: <Bus size={30} color="#1ea2b1" />, accent: '#1ea2b1', position: 'center', pad: 0, tab: 'home' },
  { id: 'welcome', refKey: null, tag: 'WELCOME TO UTHUTHO', title: 'Your Smart Commute Companion', body: "Now that you've seen the core flow, let's explore your home dashboard. Tap NEXT for a guided tour of your tools.", icon: <Navigation size={30} color="#1ea2b1" />, accent: '#1ea2b1', position: 'center', pad: 0, tab: 'home' },
  { id: 'header', refKey: 'headerRef', tag: 'YOUR IDENTITY', title: 'Points & Profile', body: 'Your live Uthutho Points (TP) balance. Tap your avatar to view your profile, streak and achievements.', icon: <Star size={26} color="#fbbf24" />, accent: '#fbbf24', position: 'below', pad: 12, tab: 'home' },
  { id: 'nearby', refKey: 'nearbyRef', tag: 'STEP 1 — STOPS', title: 'Nearby Stops & Hubs', body: 'Your nearest transport stop and community hub. Tap it to see live waiting counts and available routes.', icon: <MapPin size={26} color="#1ea2b1" />, accent: '#1ea2b1', position: 'below', pad: 14, tab: 'home' },
  { id: 'services', refKey: 'servicesRef', tag: 'STEP 2 — SERVICES', title: 'Quick Access Panel', body: 'Jump to Leaderboards, Trips, School Transport, Driver dashboard and more — all from one row.', icon: <Zap size={26} color="#8B5CF6" />, accent: '#8B5CF6', position: 'below', pad: 10, tab: 'home' },
  { id: 'favorites', refKey: 'favoritesRef', tag: 'STEP 3 — COMMUNITY', title: 'Your Saved Places', body: 'Pin your favourite stops, routes and hubs here for quick access and live community activity.', icon: <Users size={26} color="#10B981" />, accent: '#10B981', position: 'above', pad: 10, tab: 'home' },
  { id: 'gamification', refKey: 'gamificationRef', tag: 'STEP 4 — REWARDS', title: 'Earn Points & Level Up', body: 'Every journey earns Uthutho Points. Build streaks for bonuses and climb the weekly leaderboard.', icon: <Star size={26} color="#fbbf24" />, accent: '#fbbf24', position: 'above', pad: 10, tab: 'home' },
  { id: 'tracker_tab', refKey: 'trackerTabRef', tag: 'BUDGETING', title: 'The Expense Tracker', body: "Manage your transport spending. We'll switch you to the Cards tab now so you can see where your digital cards live.", icon: <CreditCard size={30} color="#8B5CF6" />, accent: '#8B5CF6', position: 'above', pad: 15, tab: 'tracker' },
  { id: 'demo_tracker', refKey: 'trackerActionsRef', isDemo: 'tracker', tag: 'DIGITAL CARDS', title: 'Expense Logging', body: "Track your spending by creating cards for your transport modes. Log every ride to stay on top of your budget.", icon: <CreditCard size={30} color="#8B5CF6" />, accent: '#8B5CF6', position: 'above', pad: 10, tab: 'tracker' },
  { id: 'feeds_tab', refKey: 'feedsTabRef', tag: 'COMMUNITY', title: 'Community Feeds', body: "Stay connected! We're moving to the Feeds tab where you can see live updates from your community.", icon: <MessageSquare size={30} color="#1ea2b1" />, accent: '#1ea2b1', position: 'above', pad: 15, tab: 'feeds' },
  { id: 'demo_feeds', refKey: 'feedsContentRef', isDemo: 'feeds', tag: 'LIVE UPDATES', title: 'Commuter Social', body: "See real-time news from other commuters at your stops and hubs. React, share, and stay informed.", icon: <MessageSquare size={30} color="#1ea2b1" />, accent: '#1ea2b1', position: 'below', pad: 10, tab: 'feeds' },
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

// ─── Demo Components ──────────────────────────────────────────────────────────
const TrackerDemo = () => (
  <View style={stt.demoCard}>
    <View style={stt.demoCardHeader}>
      <View style={[stt.demoIconBox, { backgroundColor: '#8B5CF6' }]}>
        <CreditCard size={20} color="#FFF" />
      </View>
      <Text style={stt.demoCardTitle}>Minibus Taxi Card</Text>
    </View>
    <View style={stt.demoCardStats}>
      <View>
        <Text style={stt.demoStatLabel}>BALANCE</Text>
        <Text style={stt.demoStatValue}>R 240.00</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={stt.demoStatLabel}>RIDES LEFT</Text>
        <Text style={stt.demoStatValue}>12</Text>
      </View>
    </View>
    <View style={stt.demoCardFooter}>
      <Text style={stt.demoPillText}>R 20.00 / ride</Text>
      <View style={stt.demoActionBtn}><Text style={stt.demoActionBtnText}>LOG RIDE</Text></View>
    </View>
  </View>
);

const FeedsDemo = () => (
  <View style={stt.demoCard}>
    <View style={stt.demoCardHeader}>
      <View style={stt.demoAvatar}><Text style={stt.demoAvatarText}>JD</Text></View>
      <View>
        <Text style={stt.demoUser}>Jane Doe</Text>
        <Text style={stt.demoMeta}>Gardens Stop · 2m ago</Text>
      </View>
    </View>
    <Text style={stt.demoContent} numberOfLines={2}>"Century City Express is 5 mins late, but not too full!"</Text>
    <View style={stt.demoActions}>
      <View style={stt.demoAction}><Heart size={16} color="#ef4444" /><Text style={stt.demoActionText}>12</Text></View>
      <View style={stt.demoAction}><MessageSquare size={16} color="#888" /><Text style={stt.demoActionText}>4</Text></View>
      <View style={stt.demoAction}><Share2 size={16} color="#888" /></View>
    </View>
  </View>
);

// ─── Tooltip ──────────────────────────────────────────────────────────────────
const CARD_MAX_H = Math.min(SH * 0.52, 380);
const MARGIN = 10;

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
      <View style={[stt.card, { borderColor: step.accent + '55' }]}>
        {/* Dots */}
        <View style={stt.dots}>
          {Array.from({ length: total }).map((_, i) => (
            <View key={i} style={[stt.dot, i === idx && { width: 18, backgroundColor: step.accent }, i < idx && { backgroundColor: '#555' }]} />
          ))}
        </View>

        {/* Main content */}
        <View style={{ flexShrink: 1 }}>
          <View style={stt.iconRow}>
            <View style={[stt.iconBox, { backgroundColor: step.accent + '18' }]}>{step.icon}</View>
            <Text style={[stt.tag, { color: step.accent }]}>{step.tag}</Text>
          </View>
          <Text style={stt.title}>{step.title}</Text>
          <Text style={stt.body}>{step.body}</Text>

          {step.id === 'demo_waiting' && (
            <TouchableOpacity style={[stt.demoBtn, { backgroundColor: step.accent }]} onPress={onOpenDemo}>
              <Bus size={16} color="#000" />
              <Text style={stt.demoBtnText}>TRY JOURNEY DEMO</Text>
            </TouchableOpacity>
          )}

          {step.isDemo === 'tracker' && <TrackerDemo />}
          {step.isDemo === 'feeds' && <FeedsDemo />}
        </View>

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
            <Text style={stt.nextText}>{isLast ? "FINISH" : 'NEXT'}</Text>
            {!isLast && <ChevronRight size={15} color="#000" />}
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
interface AppTutorialProps { visible: boolean; onClose: () => void; onStepChange?: (stepId: string) => void; }

export default function AppTutorial({ visible, onClose, onStepChange }: AppTutorialProps) {
  const router = useRouter();
  const tutorialContext = useTutorial();
  const { refs, setShowTutorial } = tutorialContext;
  const [idx, setIdx] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [ready, setReady] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const fade = useRef(new Animated.Value(0)).current;
  const currentTab = useRef<string>('home'); // Track current tab to avoid unnecessary navigation

  const step = STEPS[idx];
  const isFirst = idx === 0;
  const isLast = idx === STEPS.length - 1;

  const measure = useCallback((retry = true) => {
    if (!step.refKey) { setRect(null); setReady(true); return; }
    const ref = refs[step.refKey];
    if (!ref?.current) { 
      if (retry) {
        setTimeout(() => measure(false), 250);
      } else {
        setRect(null); 
        setReady(true); 
      }
      return; 
    }
    ref.current.measureInWindow((x, y, w, h) => {
      if (w === 0 && retry) {
        setTimeout(() => measure(false), 250);
      } else {
        setRect(w > 0 ? { x, y, width: w, height: h } : null);
        setReady(true);
      }
    });
  }, [step.refKey, refs]);

  useEffect(() => {
    if (!visible) { fade.setValue(0); return; }

    setReady(false);

    const isScrollStep = ['nearby', 'services', 'favorites', 'gamification'].includes(step.id);
    const targetTab = step.tab || 'home';
    const needsTabChange = targetTab !== currentTab.current;

    // Only navigate if we're actually switching tabs
    if (needsTabChange) {
      currentTab.current = targetTab;
      router.push(`/(app)/(tabs)/${targetTab}`);
    }

    // Fire the scroll callback (home.tsx listens to this to scroll ScrollView)
    if (onStepChange) onStepChange(step.id);
    if (tutorialContext.onStepChange) tutorialContext.onStepChange(step.id);

    // Sequence: if tab changed, wait for navigation (600ms) then measure.
    // If scroll step on same tab, wait for scroll to fully settle (900ms) then measure.
    // Otherwise, short wait (350ms) is fine.
    let delay: number;
    if (needsTabChange) {
      delay = 700;
    } else if (isScrollStep) {
      delay = 900; // Give scroll animation plenty of time
    } else {
      delay = 350;
    }

    const t = setTimeout(measure, delay);
    return () => clearTimeout(t);
  }, [visible, idx, measure]);

  useEffect(() => {
    if (!ready) return;
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 260, useNativeDriver: true }).start();
  }, [ready]);

  const next = () => isLast ? finish() : (setReady(false), setIdx(i => i + 1));
  const prev = () => !isFirst && (setReady(false), setIdx(i => i - 1));
  
  const finish = async () => { 
    await AsyncStorage.setItem(TUTORIAL_SEEN_KEY, 'true');
    // Tell home screen to scroll back to top
    if (onStepChange) onStepChange('finish');
    if (tutorialContext.onStepChange) tutorialContext.onStepChange('finish');
    currentTab.current = 'home';
    router.push('/(app)/(tabs)/home');
    onClose(); 
    setIdx(0); 
  };

  if (!visible) return null;

  return (
    <>
      <Modal visible transparent statusBarTranslucent onRequestClose={finish}>
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          {ready && rect && <Spotlight rect={rect} pad={step.pad} color={step.accent} />}
          {ready && !rect && <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.84)' }]} pointerEvents="none" />}

          <TouchableOpacity style={stt.closeBtn} onPress={finish} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <X size={17} color="#888" />
          </TouchableOpacity>

          {ready && (
            <Tooltip
              step={step} rect={rect} isFirst={isFirst} isLast={isLast}
              idx={idx} total={STEPS.length} onNext={next} onPrev={prev}
              onSkip={finish} onOpenDemo={() => setShowDemo(true)} fade={fade}
            />
          )}
        </View>
      </Modal>

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
    backgroundColor: '#111', 
    borderRadius: IS_SMALL_SCREEN ? 20 : 26, 
    padding: IS_SMALL_SCREEN ? 14 : 18, 
    borderWidth: 1,
    width: '100%', 
    maxWidth: 430,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.7, shadowRadius: 28, elevation: 24,
  },
  dots: { flexDirection: 'row', gap: 5, marginBottom: IS_SMALL_SCREEN ? 8 : 14 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#1e1e1e' },
  iconRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: IS_SMALL_SCREEN ? 6 : 10 },
  iconBox: { width: IS_SMALL_SCREEN ? 36 : 48, height: IS_SMALL_SCREEN ? 36 : 48, borderRadius: IS_SMALL_SCREEN ? 12 : 16, alignItems: 'center', justifyContent: 'center' },
  tag: { fontSize: 9, fontWeight: '900', letterSpacing: 2, flex: 1, textTransform: 'uppercase' },
  title: { 
    fontSize: IS_SMALL_SCREEN ? 16 : 20, 
    fontWeight: 'bold', 
    color: '#FFF', 
    fontStyle: 'italic', 
    letterSpacing: -0.3, 
    marginBottom: IS_SMALL_SCREEN ? 2 : 8, 
    lineHeight: IS_SMALL_SCREEN ? 20 : 26 
  },
  body: { 
    fontSize: IS_SMALL_SCREEN ? 11 : 13, 
    color: '#888', 
    lineHeight: IS_SMALL_SCREEN ? 16 : 20, 
    marginBottom: IS_SMALL_SCREEN ? 6 : 12 
  },
  demoBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: IS_SMALL_SCREEN ? 40 : 48, borderRadius: IS_SMALL_SCREEN ? 12 : 16, marginBottom: 4 },
  demoBtnText: { color: '#000', fontWeight: '900', fontSize: 13, letterSpacing: 0.5 },
  btns: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    marginTop: IS_SMALL_SCREEN ? 8 : 16, 
    borderTopWidth: 1, 
    borderTopColor: '#1a1a1a', 
    paddingTop: IS_SMALL_SCREEN ? 10 : 16 
  },
  skipBtn: { paddingVertical: 6, paddingHorizontal: 4 },
  skipText: { color: '#444', fontSize: 13, fontWeight: '600' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6 },
  backText: { color: '#555', fontSize: 13, fontWeight: '600' },
  nextBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: IS_SMALL_SCREEN ? 8 : 12, borderRadius: IS_SMALL_SCREEN ? 12 : 16, gap: 5 },
  nextText: { color: '#000', fontWeight: '900', fontSize: 13, letterSpacing: 0.5 },
  closeBtn: {
    position: 'absolute', top: Platform.OS === 'ios' ? SW >= 390 ? 54 : 44 : 34, right: 18, zIndex: 200,
    backgroundColor: '#111', borderRadius: 18, width: 36, height: 36,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#333',
  },

  // Demo Specific Styles
  demoCard: { backgroundColor: '#000', borderRadius: 16, padding: IS_SMALL_SCREEN ? 8 : 16, borderWidth: 1, borderColor: '#1a1a1a', marginTop: IS_SMALL_SCREEN ? 4 : 8 },
  demoCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: IS_SMALL_SCREEN ? 6 : 16 },
  demoIconBox: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  demoCardTitle: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  demoCardStats: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: IS_SMALL_SCREEN ? 6 : 16 },
  demoStatLabel: { color: '#444', fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  demoStatValue: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  demoCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: IS_SMALL_SCREEN ? 2 : 0 },
  demoPill: { backgroundColor: '#111', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  demoPillText: { color: '#8B5CF6', fontSize: 10, fontWeight: 'bold' },
  demoActionBtn: { backgroundColor: '#8B5CF6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  demoActionBtnText: { color: '#000', fontSize: 11, fontWeight: '900' },

  demoAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#1ea2b1', alignItems: 'center', justifyContent: 'center' },
  demoAvatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  demoUser: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  demoMeta: { color: '#444', fontSize: 10 },
  demoContent: { color: '#CCC', fontSize: 12, lineHeight: 16, marginBottom: IS_SMALL_SCREEN ? 6 : 12 },
  demoActions: { flexDirection: 'row', gap: 20, borderTopWidth: 1, borderTopColor: '#111', paddingTop: IS_SMALL_SCREEN ? 4 : 10 },
  demoAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  demoActionText: { color: '#666', fontSize: 10, fontWeight: '600' },
});
