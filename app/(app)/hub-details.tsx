import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Pressable, Animated } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { MapPin, Bus, Clock } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';

// Add the Shimmer component
const Shimmer = ({ children, colors }) => {
  const animatedValue = new Animated.Value(0);

  React.useEffect(() => {
    const shimmerAnimation = () => {
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => shimmerAnimation());
    };

    shimmerAnimation();
  }, []);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 100],
  });

  return (
    <View style={{ overflow: 'hidden' }}>
      {children}
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: colors.text,
          opacity: 0.1,
          transform: [{ translateX }],
        }}
      />
    </View>
  );
};

// Add skeleton components
const HubDetailsSkeleton = ({ colors }) => {
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Shimmer colors={colors}>
        <View style={styles.imageSkeleton} />
      </Shimmer>
      <View style={styles.content}>
        <Shimmer colors={colors}>
          <View style={[styles.skeletonText, { width: '60%' }]} />
        </Shimmer>
        <Shimmer colors={colors}>
          <View style={[styles.skeletonText, { width: '80%' }]} />
        </Shimmer>
        <Shimmer colors={colors}>
          <View style={[styles.skeletonText, { width: '40%' }]} />
        </Shimmer>
      </View>
    </View>
  );
};

export default function HubDetailsScreen() {
  const { hubId } = useLocalSearchParams();
  const { colors } = useTheme();
  const router = useRouter();
  const [hub, setHub] = useState(null);
  const [relatedRoutes, setRelatedRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHubDetails();
  }, [hubId]);

  const fetchHubDetails = async () => {
    try {
      // Fetch hub details
      const { data: hubData, error: hubError } = await supabase
        .from('hubs')
        .select('*')
        .eq('id', hubId)
        .single();

      if (hubError) throw hubError;
      setHub(hubData);

      // Fetch related routes
      const { data: routesData, error: routesError } = await supabase
        .from('routes')
        .select('*')
        .eq('hub_id', hubId);

      if (routesError) throw routesError;
      setRelatedRoutes(routesData);
    } catch (error) {
      console.error('Error fetching hub details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <HubDetailsSkeleton colors={colors} />;
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Image
        source={{ uri: hub?.image }}
        style={styles.image}
        resizeMode="cover"
      />
      
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>{hub?.name}</Text>
        
        <View style={styles.infoRow}>
          <MapPin size={20} color={colors.text} />
          <Text style={[styles.address, { color: colors.text }]}>{hub?.address}</Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Operating Hours</Text>
          <View style={styles.hoursContainer}>
            <Clock size={20} color={colors.text} />
            <Text style={[styles.hoursText, { color: colors.text }]}>
              {hub?.operating_hours || '24/7'}
            </Text>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Available Services</Text>
          <View style={styles.servicesGrid}>
          <Text style={styles.hoursText}>{hub?.transport_type}</Text>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Related Routes</Text>
          {relatedRoutes.map((route) => (
            <Pressable 
              key={route.id}
              style={[styles.routeItem, { borderBottomColor: colors.border }]}
              onPress={() => router.push(`/route-details?routeId=${route.id}`)}
            >
              <Bus size={20} color={colors.text} />
              <View style={styles.routeInfo}>
                <Text style={[styles.routeName, { color: colors.text }]}>
                  {route.name}
                </Text>
                <Text style={[styles.routeDetails, { color: colors.text }]}>
                  {route.start_point} → {route.end_point}
                </Text>
              </View>
              <Text style={[styles.routePrice, { color: colors.primary }]}>
                R{route.cost}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageSkeleton: {
    width: '100%',
    height: 200,
    backgroundColor: '#ccc',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
  },
  image: {
    width: '100%',
    height: 200,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  address: {
    fontSize: 16,
    flex: 1,
  },
  section: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  hoursContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  hoursText: {
    fontSize: 16,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  serviceTag: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  serviceText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    gap: 15,
  },
  routeInfo: {
    flex: 1,
  },
  routeName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  routeDetails: {
    fontSize: 14,
    opacity: 0.8,
  },
  routePrice: {
    fontSize: 16,
    fontWeight: '600',
  },
  skeletonText: {
    height: 14,
    borderRadius: 4,
    marginVertical: 4,
    backgroundColor: '#ccc',
  },
});