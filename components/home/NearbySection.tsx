import React, { useState, useEffect } from 'react';
import { View, Text, Dimensions, StyleSheet, TouchableOpacity, ActivityIndicator, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import InteractiveNearbyMap from './InteractiveNearbyMap';
import NearbyCards from './NearbyCards';
import NearestLocationsSkeleton from './skeletons/NearestLocationsSkeleton';
import { Users, MapPin, Target, TrendingUp, Flag, CheckCircle, Share2, Plus } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isDesktop = SCREEN_WIDTH >= 1024;

interface NearbySectionProps {
  locationError: string | null;
  isNearestLoading: boolean;
  userLocation: {
    lat: number;
    lng: number;
  } | null;
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
  displayName: string;
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
  const router = useRouter();
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

  const {
    locationError,
    isNearestLoading,
    userLocation,
    compact = false,
    isUnsupportedRegion = false
  } = props;

  const showHeader = !compact;

  useEffect(() => {
    const getLocationName = async () => {
      if (!userLocation || !isUnsupportedRegion) return;

      setIsGeocoding(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLocation.lat}&lon=${userLocation.lng}&addressdetails=1&accept-language=en`,
          { headers: { 'User-Agent': 'UthuthoApp/1.0' } }
        );
        const data = await response.json();
        const city =
          data.address?.city ||
          data.address?.town ||
          data.address?.village ||
          data.address?.county ||
          'Your Area';
        const country = data.address?.country || 'Your Country';

        setLocationInfo({ city, country, displayName: `${city}, ${country}` });
        await fetchCommunityProgress(city, country);
      } catch {
        setLocationInfo({ city: 'Your Area', country: 'Your Country', displayName: 'Your Area' });
        await fetchCommunityProgress('Your Area', 'Your Country');
      } finally {
        setIsGeocoding(false);
      }
    };

    getLocationName();
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
        const uniqueUserCount = uniqueUsers.size;
        const currentStops = stopsCount || 0;

        const stopsPercentage = Math.min((currentStops / requiredStops) * 100, 100);
        const usersPercentage = Math.min((uniqueUserCount / requiredUsers) * 100, 100);
        const percentageComplete = Math.round((stopsPercentage + usersPercentage) / 2);

        setCommunityProgress({
          requiredStops,
          currentStops,
          requiredUsers,
          currentUsers: uniqueUserCount,
          percentageComplete,
          contributors: uniqueUserCount,
        });
      }
    } catch {
      setCommunityProgress({
        requiredStops: 50,
        currentStops: 0,
        requiredUsers: 200,
        currentUsers: 0,
        percentageComplete: 0,
        contributors: 0,
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
          `Join our community and suggest stops near you — every contribution counts!\n\n` +
          `#Uthutho #MoveSmarter #PublicTransport`,
      });
    } catch {
    } finally {
      setIsSharing(false);
    }
  };

  if (isUnsupportedRegion) {
    const milestone1Target = Math.ceil(communityProgress.requiredStops * 0.5);
    const milestone2Target = Math.ceil(communityProgress.requiredUsers * 0.4);
    const milestone1Done = communityProgress.currentStops >= milestone1Target;
    const milestone2Done = communityProgress.currentUsers >= milestone2Target;
    const launchDone =
      communityProgress.currentStops >= communityProgress.requiredStops &&
      communityProgress.currentUsers >= communityProgress.requiredUsers;

    const stopsBarWidth = Math.min(
      (communityProgress.currentStops / communityProgress.requiredStops) * 100,
      100
    );
    const usersBarWidth = Math.min(
      (communityProgress.currentUsers / communityProgress.requiredUsers) * 100,
      100
    );
    const stopsLeft = Math.max(0, communityProgress.requiredStops - communityProgress.currentStops);
    const usersLeft = Math.max(0, communityProgress.requiredUsers - communityProgress.currentUsers);

    return (
      <View style={[styles.section, isDesktop && styles.sectionDesktop, compact && styles.sectionCompact]}>
        {showHeader && (
          <View style={styles.headerContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }, isDesktop && styles.sectionTitleDesktop]}>
              Community Progress
            </Text>
          </View>
        )}

        <View style={[styles.communityProgressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {(isGeocoding || isProgressLoading) ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2bb8b3" />
              <Text style={[styles.loadingText, { color: colors.text, opacity: 0.7 }]}>
                Detecting your location…
              </Text>
            </View>
          ) : (
            <>
              {/* Header */}
              <View style={styles.progressHeader}>
                <View style={[styles.progressIconContainer, { backgroundColor: '#2bb8b315' }]}>
                  <Flag size={24} color="#2bb8b3" />
                </View>
                <View style={styles.progressHeaderText}>
                  <Text style={[styles.progressTitle, { color: colors.text }]}>
                    Help Bring Uthutho to {locationInfo?.city || 'Your City'}
                  </Text>
                  <Text style={[styles.progressSubtitle, { color: colors.text, opacity: 0.7 }]}>
                    {communityProgress.contributors === 0
                      ? 'Be the first to start the movement'
                      : `${communityProgress.contributors} community ${communityProgress.contributors === 1 ? 'member' : 'members'} making this happen`}
                  </Text>
                </View>
              </View>

              {/* Overall Progress Bar */}
              <View style={styles.overallProgressContainer}>
                <View style={[styles.progressBarBackground, { backgroundColor: colors.border }]}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { backgroundColor: '#2bb8b3', width: `${communityProgress.percentageComplete}%` }
                    ]}
                  />
                </View>
                <Text style={[styles.progressPercentage, { color: '#2bb8b3' }]}>
                  {communityProgress.percentageComplete}% Complete
                </Text>
              </View>

              {/* Stops Progress */}
              <View style={styles.progressItem}>
                <View style={styles.progressItemHeader}>
                  <View style={styles.progressItemLeft}>
                    <MapPin size={20} color="#2bb8b3" />
                    <Text style={[styles.progressItemTitle, { color: colors.text }]}>
                      Stops in {locationInfo?.city?.split(' ')[0] || 'Your City'}
                    </Text>
                  </View>
                  <Text style={[styles.progressItemCount, { color: '#2bb8b3' }]}>
                    {communityProgress.currentStops}/{communityProgress.requiredStops}
                  </Text>
                </View>
                <View style={[styles.progressBarBackground, { backgroundColor: colors.border }]}>
                  <View
                    style={[styles.progressBarFill, { backgroundColor: '#2bb8b3', width: `${stopsBarWidth}%` }]}
                  />
                </View>
                <Text style={[styles.progressItemSubtext, { color: colors.text, opacity: 0.6 }]}>
                  {stopsLeft > 0 ? `${stopsLeft} more stops needed` : '✓ Stop goal reached!'}
                </Text>
              </View>

              {/* Contributors Progress */}
              <View style={styles.progressItem}>
                <View style={styles.progressItemHeader}>
                  <View style={styles.progressItemLeft}>
                    <Users size={20} color="#2bb8b3" />
                    <Text style={[styles.progressItemTitle, { color: colors.text }]}>
                      Community Members
                    </Text>
                  </View>
                  <Text style={[styles.progressItemCount, { color: '#2bb8b3' }]}>
                    {communityProgress.currentUsers}/{communityProgress.requiredUsers}
                  </Text>
                </View>
                <View style={[styles.progressBarBackground, { backgroundColor: colors.border }]}>
                  <View
                    style={[styles.progressBarFill, { backgroundColor: '#2bb8b3', width: `${usersBarWidth}%` }]}
                  />
                </View>
                <Text style={[styles.progressItemSubtext, { color: colors.text, opacity: 0.6 }]}>
                  {usersLeft > 0 ? `${usersLeft} more contributors needed` : '✓ Community goal reached!'}
                </Text>
              </View>

              {/* CTA Buttons */}
              <View style={styles.ctaContainer}>
                <TouchableOpacity
                  style={[styles.ctaButton, { backgroundColor: '#2bb8b3' }]}
                  onPress={() => router.push('/AddStop?mode=community')}
                  activeOpacity={0.85}
                >
                  <Plus size={16} color="#FFF" />
                  <Text style={styles.ctaButtonText}>Suggest a Stop</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.ctaButton, styles.ctaButtonOutline, { borderColor: '#2bb8b3' }]}
                  onPress={handleShare}
                  disabled={isSharing}
                  activeOpacity={0.85}
                >
                  <Share2 size={16} color="#2bb8b3" />
                  <Text style={[styles.ctaButtonTextOutline, { color: '#2bb8b3' }]}>
                    {isSharing ? 'Sharing…' : 'Invite Friends'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Milestone Badges */}
              <View style={styles.milestonesContainer}>
                <Text style={[styles.milestonesTitle, { color: colors.text, opacity: 0.7 }]}>
                  Next Milestones:
                </Text>
                <View style={styles.milestonesList}>
                  <View style={[
                    styles.milestoneBadge,
                    {
                      backgroundColor: milestone1Done ? '#f18f0125' : '#f18f0110',
                      borderColor: milestone1Done ? '#f18f01' : '#f18f0130',
                    }
                  ]}>
                    {milestone1Done
                      ? <CheckCircle size={14} color="#f18f01" />
                      : <Target size={14} color="#f18f01" />}
                    <Text style={[styles.milestoneText, { color: milestone1Done ? '#f18f01' : colors.text }]}>
                      {milestone1Target} Stops{milestone1Done ? ' ✓' : ''}
                    </Text>
                  </View>

                  <View style={[
                    styles.milestoneBadge,
                    {
                      backgroundColor: milestone2Done ? '#bdd35825' : '#bdd35810',
                      borderColor: milestone2Done ? '#bdd358' : '#bdd35830',
                    }
                  ]}>
                    {milestone2Done
                      ? <CheckCircle size={14} color="#bdd358" />
                      : <Users size={14} color="#bdd358" />}
                    <Text style={[styles.milestoneText, { color: milestone2Done ? '#bdd358' : colors.text }]}>
                      {milestone2Target} Members{milestone2Done ? ' ✓' : ''}
                    </Text>
                  </View>

                  <View style={[
                    styles.milestoneBadge,
                    {
                      backgroundColor: launchDone ? '#e151af25' : '#e151af10',
                      borderColor: launchDone ? '#e151af' : '#e151af30',
                    }
                  ]}>
                    {launchDone
                      ? <CheckCircle size={14} color="#e151af" />
                      : <TrendingUp size={14} color="#e151af" />}
                    <Text style={[styles.milestoneText, { color: launchDone ? '#e151af' : colors.text }]}>
                      Launch Ready{launchDone ? ' ✓' : ''}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Impact Note */}
              <View style={[styles.impactNote, { backgroundColor: '#2bb8b308', borderColor: '#2bb8b320' }]}>
                <TrendingUp size={16} color="#2bb8b3" />
                <Text style={[styles.impactText, { color: colors.text, opacity: 0.8 }]}>
                  Once your community reaches these goals, Uthutho will launch in {locationInfo?.city || 'your area'}
                </Text>
              </View>
            </>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.section, isDesktop && styles.sectionDesktop, compact && styles.sectionCompact]}>
      {showHeader && (
        <Text style={[styles.sectionTitle, { color: colors.text }, isDesktop && styles.sectionTitleDesktop]}>
          Nearby Stops
        </Text>
      )}

      {locationError ? (
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.errorText, { color: '#ef4444' }]}>{locationError}</Text>
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

const styles = StyleSheet.create({
  section: { marginBottom: 24 },
  sectionDesktop: { marginBottom: 20 },
  sectionCompact: { marginBottom: 0 },
  sectionTitle: {
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 20,
    letterSpacing: -1,
  },
  sectionTitleDesktop: { fontSize: 16, marginBottom: 10 },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  errorText: { fontSize: 14 },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: { marginTop: 12, fontSize: 14 },

  communityProgressCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  progressHeaderText: { flex: 1 },
  progressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  progressSubtitle: { fontSize: 13 },
  overallProgressContainer: { marginBottom: 24 },
  progressBarBackground: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'right',
  },
  progressItem: { marginBottom: 20 },
  progressItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressItemTitle: { fontSize: 15, fontWeight: '600' },
  progressItemCount: { fontSize: 15, fontWeight: 'bold' },
  progressItemSubtext: { fontSize: 12, marginTop: 6 },

  ctaContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
    marginBottom: 20,
  },
  ctaButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 12,
    gap: 8,
  },
  ctaButtonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
  },
  ctaButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  ctaButtonTextOutline: {
    fontWeight: '700',
    fontSize: 14,
  },

  milestonesContainer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    marginBottom: 16,
  },
  milestonesTitle: { fontSize: 12, marginBottom: 12 },
  milestonesList: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  milestoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
  },
  milestoneText: { fontSize: 12, fontWeight: '600' },

  impactNote: {
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
  },
  impactText: { flex: 1, fontSize: 12, lineHeight: 16 },
});

export default NearbySection;
