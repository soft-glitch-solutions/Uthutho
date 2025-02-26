import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { MapPin, Clock, Users, Bus } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';

export default function StopDetailsScreen() {
  const { stopId } = useLocalSearchParams();
  const { colors } = useTheme();
  const [stop, setStop] = useState(null);
  const [arrivals, setArrivals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStopDetails();
  }, [stopId]);

  const fetchStopDetails = async () => {
    try {
      const { data: stopData, error: stopError } = await supabase
        .from('stops')
        .select('*')
        .eq('id', stopId)
        .single();

      if (stopError) throw stopError;
      setStop(stopData);

      // Fetch upcoming arrivals
      const { data: arrivalsData, error: arrivalsError } = await supabase
        .from('stop_arrivals')
        .select('*')
        .eq('stop_id', stopId)
        .order('arrival_time', { ascending: true });

      if (arrivalsError) throw arrivalsError;
      setArrivals(arrivalsData);
    } catch (error) {
      console.error('Error fetching stop details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsWaiting = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { error } = await supabase
        .from('stop_waiting')
        .insert({
          stop_id: stopId,
          user_id: session.user.id,
        });

      if (error) throw error;
      alert('Marked as waiting!');
      fetchStopDetails(); // Refresh data
    } catch (error) {
      console.error('Error marking as waiting:', error);
      alert('Failed to mark as waiting');
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
        <Text style={[styles.title, { color: colors.text }]}>{stop?.name}</Text>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.infoRow}>
            <MapPin size={20} color={colors.text} />
            <Text style={[styles.infoText, { color: colors.text }]}>
              {stop?.address}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Users size={20} color={colors.text} />
            <Text style={[styles.infoText, { color: colors.text }]}>
              {stop?.waiting_count || 0} people waiting
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.waitingButton, { backgroundColor: colors.primary }]}
          onPress={handleMarkAsWaiting}
        >
          <Text style={styles.waitingButtonText}>Mark as Waiting</Text>
        </TouchableOpacity>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Upcoming Arrivals
          </Text>
          {arrivals.map((arrival) => (
            <View 
              key={arrival.id}
              style={[styles.arrivalItem, { borderBottomColor: colors.border }]}
            >
              <Bus size={20} color={colors.text} />
              <View style={styles.arrivalInfo}>
                <Text style={[styles.routeName, { color: colors.text }]}>
                  Route {arrival.route_number}
                </Text>
                <Text style={[styles.destination, { color: colors.text }]}>
                  To: {arrival.destination}
                </Text>
              </View>
              <View style={styles.timeContainer}>
                <Clock size={16} color={colors.text} />
                <Text style={[styles.arrivalTime, { color: colors.text }]}>
                  {arrival.arrival_time}
                </Text>
              </View>
            </View>
          ))}
          {arrivals.length === 0 && (
            <Text style={[styles.noArrivals, { color: colors.text }]}>
              No upcoming arrivals at this time
            </Text>
          )}
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Available Routes
          </Text>
          {stop?.routes?.map((route, index) => (
            <View 
              key={index}
              style={[styles.routeItem, { borderBottomColor: colors.border }]}
            >
              <Text style={[styles.routeNumber, { color: colors.text }]}>
                {route.number}
              </Text>
              <Text style={[styles.routeDescription, { color: colors.text }]}>
                {route.description}
              </Text>
            </View>
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
  waitingButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  waitingButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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
  arrivalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    gap: 15,
  },
  arrivalInfo: {
    flex: 1,
  },
  routeName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  destination: {
    fontSize: 14,
    opacity: 0.8,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  arrivalTime: {
    fontSize: 14,
    fontWeight: '500',
  },
  noArrivals: {
    fontSize: 14,
    fontStyle: 'italic',
    opacity: 0.7,
    textAlign: 'center',
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  routeNumber: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 15,
  },
  routeDescription: {
    fontSize: 14,
    flex: 1,
  },
});