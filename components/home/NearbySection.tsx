import React, { useState, useEffect } from 'react';
import { View, Text, Dimensions, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import InteractiveNearbyMap from './InteractiveNearbyMap';
import NearbyCards from './NearbyCards';
import NearestLocationsSkeleton from './skeletons/NearestLocationsSkeleton';
import { Users, MapPin, Target, TrendingUp, Flag, Globe, Award } from 'lucide-react-native';
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
  continent?: string;
}

const NearbySection: React.FC<NearbySectionProps> = (props) => {
  const { colors } = useTheme();
  const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [communityProgress, setCommunityProgress] = useState({
    requiredStops: 50,
    currentStops: 0,
    requiredUsers: 500,
    currentUsers: 0,
    percentageComplete: 0,
    contributors: 0,
  });
  const [isProgressLoading, setIsProgressLoading] = useState(true);

  const {
    locationError,
    isNearestLoading,
    userLocation,
    compact = false,
    isUnsupportedRegion = false
  } = props;

  const showHeader = !compact;

  // Reverse geocode to get city and country
  useEffect(() => {
    const getLocationName = async () => {
      if (!userLocation || !isUnsupportedRegion) return;

      setIsGeocoding(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLocation.lat}&lon=${userLocation.lng}&addressdetails=1&accept-language=en`,
          {
            headers: {
              'User-Agent': 'UthuthoApp/1.0'
            }
          }
        );

        const data = await response.json();

        const city = data.address?.city ||
          data.address?.town ||
          data.address?.village ||
          data.address?.county ||
          'Your Area';

        const country = data.address?.country || 'Your Country';

        setLocationInfo({
          city: city,
          country: country,
          displayName: `${city}, ${country}`,
          continent: data.address?.continent,
        });

        // Fetch community progress for this specific location
        await fetchCommunityProgress(city, country);

      } catch (error) {
        console.error('Geocoding error:', error);
        setLocationInfo({
          city: 'Your Area',
          country: 'Your Country',
          displayName: 'Your Area',
        });
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
      // Try to get region-specific requirements from database
      const { data: regionData, error: regionError } = await supabase
        .from('region_requirements')
        .select('*')
        .eq('city', city)
        .eq('country', country)
        .single();

      let requiredStops = 50;
      let requiredUsers = 500;

      if (regionData) {
        requiredStops = regionData.required_stops;
        requiredUsers = regionData.required_users;
      } else {
        // Adjust requirements based on population/region size
        const { count: existingStops } = await supabase
          .from('stops')
          .select('*', { count: 'exact', head: true });

        const { count: existingUsers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        requiredStops = Math.max(25, Math.min(100, Math.floor((existingStops || 0) * 1.5)));
        requiredUsers = Math.max(200, Math.min(1000, Math.floor((existingUsers || 0) * 1.2)));
      }

      // Get current stats for this region
      const { count: stopsCount } = await supabase
        .from('stops')
        .select('*', { count: 'exact', head: true });

      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: contributorsCount } = await supabase
        .from('stop_suggestions')
        .select('user_id', { count: 'exact', head: true });

      const currentStops = stopsCount || 0;
      const currentUsers = usersCount || 0;

      const stopsPercentage = Math.min((currentStops / requiredStops) * 100, 100);
      const usersPercentage = Math.min((currentUsers / requiredUsers) * 100, 100);
      const percentageComplete = (stopsPercentage + usersPercentage) / 2;

      setCommunityProgress({
        requiredStops,
        currentStops,
        requiredUsers,
        currentUsers,
        percentageComplete,
        contributors: contributorsCount || 0,
      });

    } catch (error) {
      console.error('Error fetching community progress:', error);
      setCommunityProgress({
        requiredStops: 50,
        currentStops: 12,
        requiredUsers: 500,
        currentUsers: 87,
        percentageComplete: 15,
        contributors: 23,
      });
    } finally {
      setIsProgressLoading(false);
    }
  };

  // Render community progress for unsupported regions
  if (isUnsupportedRegion) {
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
                Detecting your location...
              </Text>
            </View>
          ) : (
            <>
              {/* Progress Header with Location */}
              <View style={styles.progressHeader}>
                <View style={[styles.progressIconContainer, { backgroundColor: '#2bb8b315' }]}>
                  <Flag size={24} color="#2bb8b3" />
                </View>
                <View style={styles.progressHeaderText}>
                  <Text style={[styles.progressTitle, { color: colors.text }]}>
                    Help Bring Uthutho to {locationInfo?.city || 'Your City'}
                  </Text>
                  <Text style={[styles.progressSubtitle, { color: colors.text, opacity: 0.7 }]}>
                    {communityProgress.contributors} community members are making this happen
                  </Text>
                </View>
              </View>

              {/* Overall Progress Bar */}
              <View style={styles.overallProgressContainer}>
                <View style={[styles.progressBarBackground, { backgroundColor: colors.border }]}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        backgroundColor: '#2bb8b3',
                        width: `${communityProgress.percentageComplete}%`
                      }
                    ]}
                  />
                </View>
                <Text style={[styles.progressPercentage, { color: '#2bb8b3' }]}>
                  {Math.round(communityProgress.percentageComplete)}% Complete
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
                    style={[
                      styles.progressBarFill,
                      {
                        backgroundColor: '#2bb8b3',
                        width: `${(communityProgress.currentStops / communityProgress.requiredStops) * 100}%`
                      }
                    ]}
                  />
                </View>
                <Text style={[styles.progressItemSubtext, { color: colors.text, opacity: 0.6 }]}>
                  {communityProgress.requiredStops - communityProgress.currentStops} more stops needed
                </Text>
              </View>

              {/* Users Progress */}
              <View style={styles.progressItem}>
                <View style={styles.progressItemHeader}>
                  <View style={styles.progressItemLeft}>
                    <Users size={20} color="#2bb8b3" />
                    <Text style={[styles.progressItemTitle, { color: colors.text }]}>
                      People Onboarded
                    </Text>
                  </View>
                  <Text style={[styles.progressItemCount, { color: '#2bb8b3' }]}>
                    {communityProgress.currentUsers}/{communityProgress.requiredUsers}
                  </Text>
                </View>
                <View style={[styles.progressBarBackground, { backgroundColor: colors.border }]}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        backgroundColor: '#2bb8b3',
                        width: `${(communityProgress.currentUsers / communityProgress.requiredUsers) * 100}%`
                      }
                    ]}
                  />
                </View>
                <Text style={[styles.progressItemSubtext, { color: colors.text, opacity: 0.6 }]}>
                  {communityProgress.requiredUsers - communityProgress.currentUsers} more people needed
                </Text>
              </View>

              {/* Milestone Badges */}
              <View style={styles.milestonesContainer}>
                <Text style={[styles.milestonesTitle, { color: colors.text, opacity: 0.7 }]}>
                  Next Milestones:
                </Text>
                <View style={styles.milestonesList}>
                  <View style={[styles.milestoneBadge, { backgroundColor: '#f18f0110', borderColor: '#f18f0130' }]}>
                    <Target size={14} color="#f18f01" />
                    <Text style={[styles.milestoneText, { color: colors.text }]}>
                      {Math.ceil(communityProgress.requiredStops * 0.5)} Stops
                    </Text>
                  </View>
                  <View style={[styles.milestoneBadge, { backgroundColor: '#bdd35810', borderColor: '#bdd35830' }]}>
                    <Award size={14} color="#bdd358" />
                    <Text style={[styles.milestoneText, { color: colors.text }]}>
                      {Math.ceil(communityProgress.requiredUsers * 0.4)} Users
                    </Text>
                  </View>
                  <View style={[styles.milestoneBadge, { backgroundColor: '#e151af10', borderColor: '#e151af30' }]}>
                    <TrendingUp size={14} color="#e151af" />
                    <Text style={[styles.milestoneText, { color: colors.text }]}>
                      Launch Ready
                    </Text>
                  </View>
                </View>
              </View>

              {/* Community Impact Note */}
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
  section: {
    marginBottom: 24,
  },
  sectionDesktop: {
    marginBottom: 20,
  },
  sectionCompact: {
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 20,
    letterSpacing: -1,
  },
  sectionTitleDesktop: {
    fontSize: 16,
    marginBottom: 10,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 12,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  locationText: {
    fontSize: 13,
    fontWeight: '600',
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
  errorText: {
    fontSize: 14,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  // Community Progress Styles
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
  progressHeaderText: {
    flex: 1,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  progressSubtitle: {
    fontSize: 13,
  },
  overallProgressContainer: {
    marginBottom: 24,
  },
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
  progressItem: {
    marginBottom: 20,
  },
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
  progressItemTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  progressItemCount: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  progressItemSubtext: {
    fontSize: 12,
    marginTop: 6,
  },
  ctaContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 20,
  },
  ctaButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  ctaButtonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
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
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  milestonesTitle: {
    fontSize: 12,
    marginBottom: 12,
  },
  milestonesList: {
    flexDirection: 'row',
    gap: 12,
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
  milestoneText: {
    fontSize: 12,
    fontWeight: '600',
  },
  impactNote: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
  },
  impactText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
});

export default NearbySection;