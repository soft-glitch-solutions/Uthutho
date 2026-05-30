import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  Animated,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Globe, Users, MapPin, Route, Share2, TrendingUp, Zap } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

// ── Types ─────────────────────────────────────────────────────────────────────

interface RegionStats {
  totalStopsTarget: number;
  totalRoutesTarget: number;
  currentStops: number;
  currentRoutes: number;
  cityCount: number;
}

interface CountryProgressCardProps {
  country: string | null;
  city: string | null;
  region: string | null;
}

// ── Animated progress bar ─────────────────────────────────────────────────────

const ProgressBar = ({
  value,
  target,
  color,
  label,
}: {
  value: number;
  target: number;
  color: string;
  label: string;
}) => {
  const progress = useRef(new Animated.Value(0)).current;
  const pct = Math.min(100, target > 0 ? Math.round((value / target) * 100) : 0);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: pct,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [pct]);

  const width = progress.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={pb.row}>
      <View style={pb.labelRow}>
        <Text style={pb.label}>{label}</Text>
        <Text style={[pb.pct, { color }]}>
          {value} / {target} &nbsp;·&nbsp; {pct}%
        </Text>
      </View>
      <View style={pb.track}>
        <Animated.View style={[pb.fill, { width, backgroundColor: color }]} />
      </View>
    </View>
  );
};

import { useRef } from 'react';

const pb = StyleSheet.create({
  row: { marginBottom: 16 },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: { color: '#aaa', fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
  pct: { fontSize: 12, fontWeight: '800' },
  track: {
    height: 6,
    backgroundColor: '#1e1e1e',
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 3 },
});

// ── Stat pill ─────────────────────────────────────────────────────────────────

const StatPill = ({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  color: string;
}) => (
  <View style={[pill.container, { borderColor: `${color}30` }]}>
    {icon}
    <Text style={[pill.value, { color }]}>{value}</Text>
    <Text style={pill.label}>{label}</Text>
  </View>
);

const pill = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.02)',
    gap: 4,
  },
  value: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  label: { fontSize: 10, fontWeight: '700', color: '#666', letterSpacing: 0.5 },
});

// ── Main component ────────────────────────────────────────────────────────────

const CountryProgressCard: React.FC<CountryProgressCardProps> = ({
  country,
  city,
  region,
}) => {
  const [stats, setStats] = useState<RegionStats | null>(null);
  const [contributorCount, setContributorCount] = useState(0);
  const [isListed, setIsListed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);

  const cardOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!country) return;
    fetchCountryStats();
  }, [country]);

  const fetchCountryStats = async () => {
    if (!country) return;
    setLoading(true);
    try {
      // Check region_progress for this country
      const { data: regions } = await supabase
        .from('region_progress')
        .select('*')
        .eq('country', country);

      if (!regions || regions.length === 0) {
        setIsListed(false);
        setStats(null);
      } else {
        setIsListed(true);
        // Aggregate across all cities in the country
        const totalStopsTarget = regions.reduce(
          (sum, r) => sum + (r.total_stops_target || 50),
          0
        );
        const totalRoutesTarget = regions.reduce(
          (sum, r) => sum + (r.total_routes_target || 10),
          0
        );
        const currentStops = regions.reduce(
          (sum, r) => sum + (r.current_stops || 0),
          0
        );
        const currentRoutes = regions.reduce(
          (sum, r) => sum + (r.current_routes || 0),
          0
        );
        setStats({
          totalStopsTarget,
          totalRoutesTarget,
          currentStops,
          currentRoutes,
          cityCount: regions.length,
        });
      }

      // Count contributors from user_contributions for this country
      const { count } = await supabase
        .from('user_contributions')
        .select('*', { count: 'exact', head: true })
        .eq('country', country);

      setContributorCount(count || 0);
    } catch (e) {
      console.warn('CountryProgressCard fetch error:', e);
      setIsListed(false);
    } finally {
      setLoading(false);
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      const countryText = country || 'your country';
      const stopsLeft = stats
        ? Math.max(0, stats.totalStopsTarget - stats.currentStops)
        : 'a few more';
      const message =
        `🚌 Help bring Uthutho to ${countryText}!\n\n` +
        `We need ${stopsLeft} more stop suggestions to go live.\n\n` +
        `Make your movement matter — suggest stops & routes near you on the Uthutho app.\n\n` +
        `#Uthutho #MoveSmarter #PublicTransport`;

      await Share.share({
        message,
        title: 'Make Your Movement Matter — Uthutho',
      });
    } catch (e) {
      // User dismissed
    } finally {
      setSharing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#1ea2b1" size="small" />
        <Text style={styles.loadingText}>Loading country profile…</Text>
      </View>
    );
  }

  const stopsOverallPct =
    stats && stats.totalStopsTarget > 0
      ? Math.min(100, Math.round((stats.currentStops / stats.totalStopsTarget) * 100))
      : 0;

  return (
    <Animated.View style={[styles.card, { opacity: cardOpacity }]}>
      {/* Header row */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Globe size={18} color="#1ea2b1" />
          <View>
            <Text style={styles.countryName}>{country || 'Your Country'}</Text>
            {city ? (
              <Text style={styles.cityLabel}>
                {city}{region ? `, ${region}` : ''}
              </Text>
            ) : null}
          </View>
        </View>

        {isListed ? (
          <View style={styles.listedBadge}>
            <Zap size={12} color="#f18f01" fill="#f18f01" />
            <Text style={styles.listedBadgeText}>On the List</Text>
          </View>
        ) : (
          <View style={styles.notListedBadge}>
            <Text style={styles.notListedBadgeText}>Not Listed Yet</Text>
          </View>
        )}
      </View>

      {/* Not listed message */}
      {!isListed && (
        <Text style={styles.notListedBody}>
          Your country isn't in our expansion list yet — but that doesn't mean you can't
          start! Your suggestions will automatically create a profile for your region.
        </Text>
      )}

      {/* Stats pills */}
      {stats ? (
        <View style={styles.pillRow}>
          <StatPill
            icon={<MapPin size={16} color="#1ea2b1" />}
            value={stats.currentStops}
            label="STOPS"
            color="#1ea2b1"
          />
          <StatPill
            icon={<Route size={16} color="#e151af" />}
            value={stats.currentRoutes}
            label="ROUTES"
            color="#e151af"
          />
          <StatPill
            icon={<Users size={16} color="#f18f01" />}
            value={contributorCount}
            label="MOVERS"
            color="#f18f01"
          />
        </View>
      ) : (
        <View style={styles.pillRow}>
          <StatPill
            icon={<Users size={16} color="#f18f01" />}
            value={contributorCount || 0}
            label="MOVERS"
            color="#f18f01"
          />
          <StatPill
            icon={<MapPin size={16} color="#1ea2b1" />}
            value={0}
            label="STOPS"
            color="#1ea2b1"
          />
          <StatPill
            icon={<Route size={16} color="#e151af" />}
            value={0}
            label="ROUTES"
            color="#e151af"
          />
        </View>
      )}

      {/* Progress bars */}
      {stats ? (
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <TrendingUp size={14} color="#666" />
            <Text style={styles.progressSectionTitle}>PROGRESS TO LAUNCH</Text>
          </View>
          <ProgressBar
            value={stats.currentStops}
            target={stats.totalStopsTarget}
            color="#1ea2b1"
            label="Stops Suggested"
          />
          <ProgressBar
            value={stats.currentRoutes}
            target={stats.totalRoutesTarget}
            color="#e151af"
            label="Routes Suggested"
          />
        </View>
      ) : (
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <TrendingUp size={14} color="#666" />
            <Text style={styles.progressSectionTitle}>BE THE FIRST TO START THE MOVEMENT</Text>
          </View>
          <ProgressBar
            value={0}
            target={50}
            color="#1ea2b1"
            label="Stops Suggested"
          />
          <ProgressBar
            value={0}
            target={10}
            color="#e151af"
            label="Routes Suggested"
          />
        </View>
      )}

      {/* Overall progress summary */}
      {stats && (
        <View style={styles.launchProgress}>
          <Text style={styles.launchProgressLabel}>
            Overall launch progress for {country}
          </Text>
          <Text style={[styles.launchProgressPct, { color: stopsOverallPct >= 80 ? '#00f5d4' : '#1ea2b1' }]}>
            {stopsOverallPct}%
          </Text>
        </View>
      )}

      {/* Divider */}
      <View style={styles.divider} />

      {/* Share CTA */}
      <View style={styles.shareSection}>
        <View style={styles.shareTextBlock}>
          <Text style={styles.shareCTA}>Make Your Movement Matter.</Text>
          <Text style={styles.shareBody}>
            Every person who uses public transport can help bring Uthutho to {country || 'your country'}.
            Share this with fellow commuters.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.shareBtn}
          onPress={handleShare}
          activeOpacity={0.85}
          disabled={sharing}
        >
          {sharing ? (
            <ActivityIndicator color="#000" size="small" />
          ) : (
            <>
              <Share2 size={18} color="#000" />
              <Text style={styles.shareBtnText}>Share</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  loadingText: {
    color: '#555',
    fontSize: 13,
  },
  card: {
    backgroundColor: '#0d0d0d',
    borderRadius: 20,
    padding: 20,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    flex: 1,
  },
  countryName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  cityLabel: {
    color: '#555',
    fontSize: 12,
    marginTop: 2,
  },
  listedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(241,143,1,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(241,143,1,0.3)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  listedBadgeText: {
    color: '#f18f01',
    fontSize: 11,
    fontWeight: '800',
  },
  notListedBadge: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  notListedBadgeText: {
    color: '#666',
    fontSize: 11,
    fontWeight: '700',
  },
  notListedBody: {
    color: '#555',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 16,
  },

  // Pills
  pillRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },

  // Progress
  progressSection: {
    marginBottom: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  progressSectionTitle: {
    color: '#444',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  launchProgress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  launchProgressLabel: {
    color: '#555',
    fontSize: 12,
  },
  launchProgressPct: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: '#1a1a1a',
    marginVertical: 16,
  },

  // Share
  shareSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  shareTextBlock: {
    flex: 1,
  },
  shareCTA: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  shareBody: {
    color: '#555',
    fontSize: 12,
    lineHeight: 18,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1ea2b1',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
    minWidth: 80,
    justifyContent: 'center',
  },
  shareBtnText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '900',
  },
});

export default CountryProgressCard;
