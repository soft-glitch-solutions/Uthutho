import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { MapPin, Clock, Users } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';

export default function FavoriteDetailsScreen() {
  const { favoriteId } = useLocalSearchParams();
  const { colors } = useTheme();
  const [favorite, setFavorite] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavoriteDetails();
  }, [favoriteId]);

  const fetchFavoriteDetails = async () => {
    try {
      // First try to find in stops
      let { data: stopData } = await supabase
        .from('stops')
        .select('*')
        .eq('name', favoriteId)
        .single();

      if (stopData) {
        setFavorite({ ...stopData, type: 'stop' });
        setLoading(false);
        return;
      }

      // Then try hubs
      let { data: hubData } = await supabase
        .from('hubs')
        .select('*')
        .eq('name', favoriteId)
        .single();

      if (hubData) {
        setFavorite({ ...hubData, type: 'hub' });
        setLoading(false);
        return;
      }

      // Finally try routes
      let { data: routeData } = await supabase
        .from('routes')
        .select('*')
        .eq('name', favoriteId)
        .single();

      if (routeData) {
        setFavorite({ ...routeData, type: 'route' });
      }
    } catch (error) {
      console.error('Error fetching favorite details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>{favorite?.name}</Text>
        <Text style={[styles.type, { color: colors.primary }]}>
          {favorite?.type?.charAt(0).toUpperCase() + favorite?.type?.slice(1)}
        </Text>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.infoRow}>
            <MapPin size={20} color={colors.text} />
            <Text style={[styles.infoText, { color: colors.text }]}>
              {favorite?.address || favorite?.location}
            </Text>
          </View>

          {favorite?.operating_hours && (
            <View style={styles.infoRow}>
              <Clock size={20} color={colors.text} />
              <Text style={[styles.infoText, { color: colors.text }]}>
                {favorite.operating_hours}
              </Text>
            </View>
          )}

          {favorite?.capacity && (
            <View style={styles.infoRow}>
              <Users size={20} color={colors.text} />
              <Text style={[styles.infoText, { color: colors.text }]}>
                Capacity: {favorite.capacity}
              </Text>
            </View>
          )}
        </View>

        {favorite?.type === 'stop' && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Next Arrivals
            </Text>
            {/* Add real-time arrival data here */}
            <Text style={[styles.placeholder, { color: colors.text }]}>
              Real-time arrival data will be displayed here
            </Text>
          </View>
        )}

        {favorite?.type === 'hub' && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Available Services
            </Text>
            <View style={styles.servicesGrid}>
              {favorite?.services?.map((service, index) => (
                <View 
                  key={index}
                  style={[styles.serviceTag, { backgroundColor: colors.primary }]}
                >
                  <Text style={styles.serviceText}>{service}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {favorite?.type === 'route' && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Route Information
            </Text>
            <Text style={[styles.routeInfo, { color: colors.text }]}>
              From: {favorite.start_point}
            </Text>
            <Text style={[styles.routeInfo, { color: colors.text }]}>
              To: {favorite.end_point}
            </Text>
            <Text style={[styles.routeInfo, { color: colors.text }]}>
              Cost: R{favorite.cost}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  type: {
    fontSize: 16,
    marginBottom: 20,
  },
  card: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 15,
  },
  infoText: {
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
  routeInfo: {
    fontSize: 16,
    marginBottom: 10,
  },
  placeholder: {
    fontSize: 14,
    fontStyle: 'italic',
    opacity: 0.7,
  },
});