import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { X, Download, Smartphone } from 'lucide-react-native';

const DISMISSED_KEY = 'install_banner_dismissed_v1';
const SCREEN_WIDTH = Dimensions.get('window').width;
const isMobile = SCREEN_WIDTH < 768;

// ── Detection helpers (web-only) ────────────────────────────────────────────
const getWebContext = () => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;

  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/.test(ua);
  const isAndroid = /Android/.test(ua);
  const isChrome = /Chrome/.test(ua) && !/Edg|OPR/.test(ua);
  const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);
  const isMobileSafari = isIOS && isSafari;

  const isStandalone =
    (window.navigator as any).standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches;

  return { isIOS, isAndroid, isChrome, isSafari, isMobileSafari, isStandalone };
};

// ── Platform config ─────────────────────────────────────────────────────────
type BannerVariant = 'ios' | 'android' | 'desktop' | null;

const getBannerVariant = (): BannerVariant => {
  const ctx = getWebContext();
  if (!ctx || ctx.isStandalone) return null;
  if (ctx.isIOS) return 'ios';
  if (ctx.isAndroid && ctx.isChrome) return 'android';
  if (!ctx.isIOS && !ctx.isAndroid && ctx.isChrome) return 'desktop';
  return null;
};

const VARIANT_CONFIG: Record<NonNullable<BannerVariant>, { title: string; body: string; cta: string | null }> = {
  ios: {
    title: 'Add Uthutho to your Home Screen',
    body: "Tap  Share  →  Add to Home Screen  for the best experience",
    cta: null,
  },
  android: {
    title: 'Install the Uthutho app',
    body: 'Get the full experience — faster, offline-ready, no browser bar',
    cta: 'Install',
  },
  desktop: {
    title: 'Install Uthutho',
    body: 'Install as a desktop app for instant access and a native feel',
    cta: 'Install',
  },
};

// ── Component ────────────────────────────────────────────────────────────────
export default function WebInstallBanner() {
  const [variant, setVariant] = useState<BannerVariant>(null);
  const [visible, setVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-80)).current;
  const deferredPromptRef = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const init = async () => {
      const dismissed = await AsyncStorage.getItem(DISMISSED_KEY);
      if (dismissed) return;

      const v = getBannerVariant();
      if (!v) return;

      setVariant(v);

      // For Chrome (Android & Desktop): capture the install prompt
      if (v === 'android' || v === 'desktop') {
        const handler = (e: Event) => {
          e.preventDefault();
          deferredPromptRef.current = e;
          show();
        };
        window.addEventListener('beforeinstallprompt', handler as any);
        return () => window.removeEventListener('beforeinstallprompt', handler as any);
      } else {
        // iOS — just show the banner right away
        show();
      }
    };

    init();
  }, []);

  const show = () => {
    setVisible(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 80,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const dismiss = async () => {
    Animated.timing(slideAnim, {
      toValue: -80,
      duration: 220,
      useNativeDriver: true,
    }).start(() => setVisible(false));
    await AsyncStorage.setItem(DISMISSED_KEY, '1');
  };

  const handleInstall = async () => {
    if (deferredPromptRef.current) {
      deferredPromptRef.current.prompt();
      const { outcome } = await deferredPromptRef.current.userChoice;
      deferredPromptRef.current = null;
      if (outcome === 'accepted') dismiss();
    }
  };

  if (!visible || !variant) return null;

  const config = VARIANT_CONFIG[variant];
  const isIOS = variant === 'ios';

  return (
    <Animated.View
      style={[
        styles.banner,
        { transform: [{ translateY: slideAnim }] },
        isMobile ? styles.bannerMobile : styles.bannerDesktop,
      ]}
    >
      {/* App icon + text */}
      <View style={styles.left}>
        <Image
          source={require('../assets/logo.png')}
          style={styles.icon}
          resizeMode="contain"
        />
        <View style={styles.textBlock}>
          <Text style={styles.title} numberOfLines={1}>{config.title}</Text>
          <Text style={styles.body} numberOfLines={2}>{config.body}</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.right}>
        {config.cta && (
          <TouchableOpacity
            style={styles.installBtn}
            onPress={handleInstall}
            activeOpacity={0.85}
          >
            {isMobile
              ? <Smartphone size={14} color="#fff" />
              : <Download size={14} color="#fff" />}
            <Text style={styles.installBtnText}>{config.cta}</Text>
          </TouchableOpacity>
        )}

        {isIOS && (
          <View style={styles.iosHint}>
            <Text style={styles.iosHintText}>
              Tap <Text style={styles.iosBold}>Share</Text> then{'\n'}
              <Text style={styles.iosBold}>Add to Home Screen</Text>
            </Text>
          </View>
        )}

        <TouchableOpacity style={styles.closeBtn} onPress={dismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <X size={16} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'fixed' as any,
    top: 0,
    left: 0,
    right: 0,
    zIndex: 99999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0d1f2d',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(43,184,179,0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
    gap: 12,
  },
  bannerMobile: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bannerDesktop: {
    paddingHorizontal: 32,
    paddingVertical: 10,
  },

  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 0,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#1a2f40',
    flexShrink: 0,
  },
  textBlock: { flex: 1, minWidth: 0 },
  title: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 16,
  },
  body: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },

  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
  },

  installBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2bb8b3',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  installBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },

  iosHint: {
    alignItems: 'flex-end',
  },
  iosHintText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    textAlign: 'right',
    lineHeight: 14,
  },
  iosBold: {
    color: '#2bb8b3',
    fontWeight: '700',
  },

  closeBtn: {
    padding: 4,
    opacity: 0.8,
  },
});
