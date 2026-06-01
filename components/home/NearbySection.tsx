import React, { useState, useEffect } from 'react';
import { View, Text, Dimensions, StyleSheet, TouchableOpacity, ActivityIndicator, Share } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import InteractiveNearbyMap from './InteractiveNearbyMap';
import NearbyCards from './NearbyCards';
import NearestLocationsSkeleton from './skeletons/NearestLocationsSkeleton';
import { Users, MapPin, Target, TrendingUp, Flag, CheckCircle, Share2, Plus, Route } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import SuggestStopSheet from './SuggestStopSheet';
import SuggestRouteSheet from './SuggestRouteSheet';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isDesktop = SCREEN_WIDTH >= 1024;

interface NearbySectionProps {
  locationError: string | null;
  isNearestLoading: boolean;
  userLocation: { lat: number; lng: number } | null;
  nearestLocations: {
    nearestStop: any;
    nearestHub: any;
    nearestStops?: any[];
  } | null;
  colors?: any;
  handleNearestStopPress: (stopId: string) => void;
  handleNearestHubPress: (hubId: string) => void;
  calculateWalkingTime: (lat1: number, lng1: number, lat2: number, lng2: number) => number;
  hasActiveJourney: boolean;
  onMarkAsWaiting: (locationId: string, locationType: string, locationName: string) => void;
  compact?: boolean;
  isUnsupportedRegion?: boolean;
}

interface LocationInfo {
  city: string;
  country: string;
}

interface CommunityProgress {
  requiredStops: number;
  currentStops: number;
  requiredUsers: number;
  currentUsers: number;
  percentageComplete: number;
  contributors: number;
}

const NearbySection: React.FC<NearbySectionProps> = (props) => {
  const { colors } = useTheme();

  const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [communityProgress, setCommunityProgress] = useState<CommunityProgress>({
    requiredStops: 50,
    currentStops: 0,
    requiredUsers: 200,
    currentUsers: 0,
    percentageComplete: 0,
    contributors: 0,
  });
  const [isProgressLoading, setIsProgressLoading] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [showStopSheet, setShowStopSheet] = useState(false);
  const [showRouteSheet, setShowRouteSheet] = useState(false);

  const {
    locationError,
    isNearestLoading,
    userLocation,
    compact = false,
    isUnsupportedRegion = false,
  } = props;

  // ─── Geocode + progress for unsupported regions ───────────────────────────
  useEffect(() => {
    if (!userLocation || !isUnsupportedRegion) return;

    const geocodeAndFetch = async () => {
      setIsGeocoding(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLocation.lat}&lon=${userLocation.lng}&addressdetails=1&accept-language=en`,
          { headers: { 'User-Agent': 'UthuthoApp/1.0' } }
        );
        const data = await res.json();
        const city =
          data.address?.city ||
          data.address?.town ||
          data.address?.village ||
          data.address?.county ||
          'Your Area';
        const country = data.address?.country || 'Your Country';
        setLocationInfo({ city, country });
        await fetchCommunityProgress(city, country);
      } catch {
        setLocationInfo({ city: 'Your Area', country: 'Your Country' });
        await fetchCommunityProgress('Your Area', 'Your Country');
      } finally {
        setIsGeocoding(false);
      }
    };

    geocodeAndFetch();
  }, [userLocation, isUnsupportedRegion]);

  const fetchCommunityProgress = async (city: string, country: string) => {
    setIsProgressLoading(true);
    try {
      let requiredStops = 50;
      let requiredUsers = 200;

      const { data: regionData } = await supabase
        .from('region_requirements')
        .select('required_stops, required_users')
        .eq('city', city)
        .eq('country', country)
        .maybeSingle();

      if (regionData) {
        requiredStops = regionData.required_stops;
        requiredUsers = regionData.required_users;
      }

      if (userLocation) {
        const { lat, lng } = userLocation;
        const delta = 0.45;

        const { count: stopsCount } = await supabase
          .from('stop_requests')
          .select('*', { count: 'exact', head: true })
          .gte('latitude', lat - delta)
          .lte('latitude', lat + delta)
          .gte('longitude', lng - delta)
          .lte('longitude', lng + delta);

        const { data: contributorRows } = await supabase
          .from('stop_requests')
          .select('user_id')
          .gte('latitude', lat - delta)
          .lte('latitude', lat + delta)
          .gte('longitude', lng - delta)
          .lte('longitude', lng + delta);

        const uniqueUsers = new Set((contributorRows || []).map(r => r.user_id));
        const uniqueCount = uniqueUsers.size;
        const currentStops = stopsCount || 0;

        const stopsBarPct = Math.min((currentStops / requiredStops) * 100, 100);
        const usersPct = Math.min((uniqueCount / requiredUsers) * 100, 100);
        const overall = Math.round((stopsBarPct + usersPct) / 2);

        setCommunityProgress({
          requiredStops,
          currentStops,
          requiredUsers,
          currentUsers: uniqueCount,
          percentageComplete: overall,
          contributors: uniqueCount,
        });
      }
    } catch {
      setCommunityProgress({
        requiredStops: 50, currentStops: 0, requiredUsers: 200,
        currentUsers: 0, percentageComplete: 0, contributors: 0,
      });
    } finally {
      setIsProgressLoading(false);
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const city = locationInfo?.city || 'Your City';
      const country = locationInfo?.country || 'Your Country';
      const stopsLeft = Math.max(0, communityProgress.requiredStops - communityProgress.currentStops);
      await Share.share({
        title: `Help bring Uthutho to ${city}!`,
        message:
          `🚌 Help bring Uthutho to ${city}, ${country}!\n\n` +
          `We need ${stopsLeft} more stop suggestions to go live.\n\n` +
          `Join our community and suggest stops near you!\n\n` +
          `#Uthutho #MoveSmarter`,
      });
    } catch {
      // ignore cancel
    } finally {
      setIsSharing(false);
    }
  };

  const handleStopSuccess = () => {
    // Refresh progress counts
    if (locationInfo) {
      fetchCommunityProgress(locationInfo.city, locationInfo.country);
    }
  };

  // ─── Unsupported region view ───────────────────────────────────────────────
  if (isUnsupportedRegion) {
    const m1Target = Math.ceil(communityProgress.requiredStops * 0.5);
    const m2Target = Math.ceil(communityProgress.requiredUsers * 0.4);
    const m1Done = communityProgress.currentStops >= m1Target;
    const m2Done = communityProgress.currentUsers >= m2Target;
    const launchDone =
      communityProgress.currentStops >= communityProgress.requiredStops &&
      communityProgress.currentUsers >= communityProgress.requiredUsers;

    const stopsBar = Math.min((communityProgress.currentStops / communityProgress.requiredStops) * 100, 100);
    const usersBar = Math.min((communityProgress.currentUsers / communityProgress.requiredUsers) * 100, 100);
    const stopsLeft = Math.max(0, communityProgress.requiredStops - communityProgress.currentStops);
    const usersLeft = Math.max(0, communityProgress.requiredUsers - communityProgress.currentUsers);

    return (
      <>
        <View style={[styles.section, compact && styles.sectionCompact]}>
          {!compact && (
            <View style={styles.headerRow}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Community Progress</Text>
            </View>
          )}

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {(isGeocoding || isProgressLoading) ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color="#2bb8b3" />
                <Text style={[styles.loadingText, { color: colors.text }]}>Detecting your area…</Text>
              </View>
            ) : (
              <>
                {/* Header */}
                <View style={styles.progressHeader}>
                  <View style={[styles.iconCircle, { backgroundColor: '#2bb8b318' }]}>
                    <Flag size={22} color="#2bb8b3" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>
                      Bring Uthutho to {locationInfo?.city || 'Your City'}
                    </Text>
                    <Text style={[styles.cardSubtitle, { color: colors.text }]}>
                      {communityProgress.contributors === 0
                        ? 'Be the first to start the movement'
                        : `${communityProgress.contributors} ${communityProgress.contributors === 1 ? 'person' : 'people'} contributing`}
                    </Text>
                  </View>
                </View>

                {/* Overall bar */}
                <View style={styles.overallRow}>
                  <View style={[styles.bar, { backgroundColor: colors.border }]}>
                    <View style={[styles.barFill, { backgroundColor: '#2bb8b3', width: `${communityProgress.percentageComplete}%` as any }]} />
                  </View>
                  <Text style={[styles.pctLabel, { color: '#2bb8b3' }]}>
                    {communityProgress.percentageComplete}%
                  </Text>
                </View>

                {/* Stops */}
                <View style={styles.metricBlock}>
                  <View style={styles.metricHeader}>
                    <View style={styles.metricLeft}>
                      <MapPin size={16} color="#2bb8b3" />
                      <Text style={[styles.metricTitle, { color: colors.text }]}>
                        Stops in {locationInfo?.city?.split(' ')[0] || 'Your City'}
                      </Text>
                    </View>
                    <Text style={[styles.metricCount, { color: '#2bb8b3' }]}>
                      {communityProgress.currentStops}/{communityProgress.requiredStops}
                    </Text>
                  </View>
                  <View style={[styles.bar, { backgroundColor: colors.border }]}>
                    <View style={[styles.barFill, { backgroundColor: '#2bb8b3', width: `${stopsBar}%` as any }]} />
                  </View>
                  <Text style={[styles.metricNote, { color: colors.text }]}>
                    {stopsLeft > 0 ? `${stopsLeft} more stops needed` : '✓ Goal reached!'}
                  </Text>
                </View>

                {/* Members */}
                <View style={styles.metricBlock}>
                  <View style={styles.metricHeader}>
                    <View style={styles.metricLeft}>
                      <Users size={16} color="#2bb8b3" />
                      <Text style={[styles.metricTitle, { color: colors.text }]}>Community Members</Text>
                    </View>
                    <Text style={[styles.metricCount, { color: '#2bb8b3' }]}>
                      {communityProgress.currentUsers}/{communityProgress.requiredUsers}
                    </Text>
                  </View>
                  <View style={[styles.bar, { backgroundColor: colors.border }]}>
                    <View style={[styles.barFill, { backgroundColor: '#2bb8b3', width: `${usersBar}%` as any }]} />
                  </View>
                  <Text style={[styles.metricNote, { color: colors.text }]}>
                    {usersLeft > 0 ? `${usersLeft} more contributors needed` : '✓ Goal reached!'}
                  </Text>
                </View>

                {/* CTA row */}
                <View style={styles.ctaRow}>
                  <TouchableOpacity
                    style={[styles.ctaBtn, { backgroundColor: '#2bb8b3' }]}
                    onPress={() => setShowStopSheet(true)}
                    activeOpacity={0.85}
                  >
                    <Plus size={15} color="#fff" />
                    <Text style={styles.ctaBtnText}>Suggest a Stop</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.ctaBtn, { backgroundColor: '#1a9fa8' }]}
                    onPress={() => setShowRouteSheet(true)}
                    activeOpacity={0.85}
                  >
                    <Route size={15} color="#fff" />
                    <Text style={styles.ctaBtnText}>Suggest a Route</Text>
                  </TouchableOpacity>
                </View>

                {/* Share row */}
                <TouchableOpacity
                  style={[styles.shareRow, { borderColor: colors.border }]}
                  onPress={handleShare}
                  disabled={isSharing}
                  activeOpacity={0.8}
                >
                  <Share2 size={15} color={colors.text} style={{ opacity: 0.55 } as any} />
                  <Text style={[styles.shareText, { color: colors.text }]}>
                    {isSharing ? 'Sharing…' : 'Invite friends to help build the community'}
                  </Text>
                </TouchableOpacity>

                {/* Milestones */}
                <View style={[styles.milestonesBox, { borderTopColor: colors.border }]}>
                  <Text style={[styles.milestonesLabel, { color: colors.text }]}>Milestones</Text>
                  <View style={styles.milestonesList}>
                    <MilestoneBadge
                      done={m1Done}
                      color="#f18f01"
                      Icon={Target}
                      label={`${m1Target} Stops`}
                      colors={colors}
                    />
                    <MilestoneBadge
                      done={m2Done}
                      color="#bdd358"
                      Icon={Users}
                      label={`${m2Target} Members`}
                      colors={colors}
                    />
                    <MilestoneBadge
                      done={launchDone}
                      color="#e151af"
                      Icon={TrendingUp}
                      label="Launch Ready"
                      colors={colors}
                    />
                  </View>
                </View>

                {/* Impact note */}
                <View style={[styles.impactNote, { backgroundColor: '#2bb8b30a', borderColor: '#2bb8b320' }]}>
                  <TrendingUp size={14} color="#2bb8b3" />
                  <Text style={[styles.impactText, { color: colors.text }]}>
                    Once goals are met, Uthutho will go live in {locationInfo?.city || 'your area'}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Bottom sheets */}
        <SuggestStopSheet
          visible={showStopSheet}
          onClose={() => setShowStopSheet(false)}
          userLocation={userLocation}
          onSuccess={handleStopSuccess}
        />
        <SuggestRouteSheet
          visible={showRouteSheet}
          onClose={() => setShowRouteSheet(false)}
          onSuccess={() => {}}
        />
      </>
    );
  }

  // ─── Supported region: normal nearby view ─────────────────────────────────
  return (
    <View style={[styles.section, compact && styles.sectionCompact]}>
      {!compact && (
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Nearby Stops</Text>
      )}

      {locationError ? (
        <View style={[styles.errorCard, { backgroundColor: colors.card }]}>
          <Text style={{ color: '#ef4444', fontSize: 14 }}>{locationError}</Text>
        </View>
      ) : isNearestLoading || !userLocation ? (
        <NearestLocationsSkeleton colors={colors} compact={compact} />
      ) : isDesktop ? (
        <InteractiveNearbyMap
          userLocation={userLocation}
          nearestLocations={props.nearestLocations}
          calculateWalkingTime={props.calculateWalkingTime}
          handleNearestStopPress={props.handleNearestStopPress}
          handleNearestHubPress={props.handleNearestHubPress}
          compact={compact}
        />
      ) : (
        <NearbyCards {...props} />
      )}
    </View>
  );
};

// ─── Milestone badge sub-component ────────────────────────────────────────────
const MilestoneBadge = ({
  done, color, Icon, label, colors,
}: { done: boolean; color: string; Icon: any; label: string; colors: any }) => (
  <View style={[
    styles.badge,
    {
      backgroundColor: done ? `${color}22` : `${color}0e`,
      borderColor: done ? color : `${color}35`,
    }
  ]}>
    {done
      ? <CheckCircle size={13} color={color} />
      : <Icon size={13} color={color} />}
    <Text style={[styles.badgeText, { color: done ? color : colors.text }]}>
      {label}{done ? ' ✓' : ''}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  section: { marginBottom: 24 },
  sectionCompact: { marginBottom: 0 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  sectionTitle: { fontSize: 30, fontWeight: '900', letterSpacing: -0.8 },
  errorCard: { borderRadius: 12, padding: 16 },

  card: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  loadingBox: { paddingVertical: 40, alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, opacity: 0.6 },

  progressHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 },
  iconCircle: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 17, fontWeight: '800', marginBottom: 3 },
  cardSubtitle: { fontSize: 13, opacity: 0.6 },

  overallRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  bar: { flex: 1, height: 7, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  pctLabel: { fontSize: 13, fontWeight: '700', minWidth: 38, textAlign: 'right' },

  metricBlock: { marginBottom: 18 },
  metricHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  metricLeft: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  metricTitle: { fontSize: 14, fontWeight: '600' },
  metricCount: { fontSize: 14, fontWeight: '700' },
  metricNote: { fontSize: 12, opacity: 0.55, marginTop: 5 },

  ctaRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  ctaBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 13,
    borderRadius: 12,
  },
  ctaBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  shareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 11,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 16,
  },
  shareText: { fontSize: 13, opacity: 0.7, flex: 1 },

  milestonesBox: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 14, marginBottom: 14 },
  milestonesLabel: { fontSize: 11, fontWeight: '600', opacity: 0.5, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  milestonesList: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 5,
    borderWidth: 1,
  },
  badgeText: { fontSize: 12, fontWeight: '600' },

  impactNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 11,
    borderRadius: 10,
    borderWidth: 1,
  },
  impactText: { flex: 1, fontSize: 12, opacity: 0.75, lineHeight: 16 },
});

export default NearbySection;
