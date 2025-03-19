import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  Alert,
  TextInput,
  Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '../../lib/supabase';

// Shimmer Component for Loading Animation
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

// Skeleton Loading Component
const RouteDetailsSkeleton = ({ colors }) => {
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
  );
};

export default function RouteDetailsScreen() {
  const { routeId } = useLocalSearchParams();
  const { colors } = useTheme();
  const router = useRouter();
  const [route, setRoute] = useState(null);
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newPrice, setNewPrice] = useState('');
  const [priceChangeRequests, setPriceChangeRequests] = useState([]);

  useEffect(() => {
    fetchRouteDetails();
    fetchPriceChangeRequests();
  }, [routeId]);

  const fetchRouteDetails = async () => {
    try {
      const { data: routeData, error: routeError } = await supabase
        .from('routes')
        .select('*')
        .eq('id', routeId)
        .single();

      if (routeError) throw routeError;
      setRoute(routeData);

      const { data: stopsData, error: stopsError } = await supabase
        .from('stops')
        .select('*')
        .eq('route_id', routeId);

      if (stopsError) throw stopsError;

      // Fetch waiting count for each stop
      const stopsWithWaitingCount = await Promise.all(
        stopsData.map(async (stop) => {
          const { data: waitingData, error: waitingError } = await supabase
            .from('stop_waiting')
            .select('id')
            .eq('stop_id', stop.id)
            .gt('expires_at', new Date().toISOString());

          if (waitingError) throw waitingError;
          return { ...stop, waitingCount: waitingData.length };
        })
      );

      setStops(stopsWithWaitingCount);
    } catch (error) {
      console.error('Error fetching route details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPriceChangeRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('price_change_requests')
        .select('*')
        .eq('route_id', routeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPriceChangeRequests(data);
    } catch (error) {
      console.error('Error fetching price change requests:', error);
    }
  };

  const handlePriceChangeRequest = async () => {
    if (!newPrice || isNaN(Number(newPrice))) {
      Alert.alert('Error', 'Please enter a valid price.');
      return;
    }

    try {
      // Ensure the user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        Alert.alert('Error', 'You must be logged in to submit a price change request.');
        return;
      }

      // Insert the price change request
      const { error } = await supabase
        .from('price_change_requests')
        .insert([
          {
            route_id: routeId,
            user_id: user.id,
            current_price: route.cost,
            new_price: Number(newPrice),
            status: 'pending',
          },
        ]);

      if (error) throw error;

      Alert.alert('Success', 'Your price change request has been submitted.');
      setModalVisible(false);
      setNewPrice('');
      fetchPriceChangeRequests(); // Refresh the price change requests list
    } catch (error) {
      console.error('Error submitting price change request:', error);
      Alert.alert('Error', 'There was an error submitting your request.');
    }
  };

  const openPriceChangeModal = () => {
    setModalVisible(true);
  };

  if (loading) {
    return <RouteDetailsSkeleton colors={colors} />;
  }

  if (!route) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>
          Route not found.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Route Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>{route.name}</Text>
        </View>

        {/* Route Details */}
        <View style={styles.detailsContainer}>
          <Text style={[styles.detailLabel, { color: colors.text }]}>Cost</Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>
            R{route.cost.toFixed(2)}
          </Text>

          <Text style={[styles.detailLabel, { color: colors.text }]}>Transport Type</Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>
            {route.transport_type}
          </Text>

          {/* Start and End Points in Two Columns */}
          <View style={styles.pointsContainer}>
            <Pressable
              style={styles.pointColumn}
              onPress={() => router.push(`/hub-details?hubId=${route.start_hub_id}`)}>
              <Text style={[styles.detailLabel, { color: colors.text }]}>Start Point</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {route.start_point}
              </Text>
            </Pressable>

            <Pressable
              style={styles.pointColumn}
              onPress={() => router.push(`/hub-details?hubId=${route.end_hub_id}`)}>
              <Text style={[styles.detailLabel, { color: colors.text }]}>End Point</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {route.end_point}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Price Change Button */}
        <Pressable
          style={[styles.priceChangeButton, { backgroundColor: colors.primary }]}
          onPress={openPriceChangeModal}>
          <Text style={styles.buttonText}>Report Price Change</Text>
        </Pressable>

        {/* Price Change Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalContainer}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Report Price Change
              </Text>
              <Text style={[styles.modalDescription, { color: colors.text }]}>
                Please only submit a price change that is factual. If any data is submitted
                maliciously, your account will be banned. If your price is correct with
                current data, you will be awarded 10 points on your profile.
              </Text>

              <Text style={[styles.modalLabel, { color: colors.text }]}>
                Current Price: R{route.cost.toFixed(2)}
              </Text>

              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground }]}
                placeholder="Enter new price"
                placeholderTextColor={colors.text}
                value={newPrice}
                onChangeText={setNewPrice}
                keyboardType="numeric"
              />

              <View style={styles.modalButtons}>
                <Pressable
                  style={[styles.modalButton, { backgroundColor: colors.primary }]}
                  onPress={handlePriceChangeRequest}>
                  <Text style={styles.buttonText}>Submit</Text>
                </Pressable>
                <Pressable
                  style={[styles.modalButton, { backgroundColor: colors.border }]}
                  onPress={() => setModalVisible(false)}>
                  <Text style={styles.buttonText}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* Price Change Requests Section */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Price Change Requests
        </Text>
        {priceChangeRequests.length > 0 ? (
          priceChangeRequests.map((request) => (
            <View
              key={request.id}
              style={[styles.requestItem, { backgroundColor: colors.card }]}>
              <Text style={[styles.requestText, { color: colors.text }]}>
                Old Price: R{request.current_price.toFixed(2)}
              </Text>
              <Text style={[styles.requestText, { color: colors.text }]}>
                New Price: R{request.new_price.toFixed(2)}
              </Text>
              <Text style={[styles.requestText, { color: colors.text }]}>
                Status: {request.status}
              </Text>
            </View>
          ))
        ) : (
          <Text style={[styles.noRequestsText, { color: colors.text }]}>
            No price change requests available.
          </Text>
        )}

        {/* Stops Section */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Stops</Text>
        {stops.length > 0 ? (
          stops.map((stop) => (
            <Pressable
              key={stop.id}
              style={[styles.stopItem, { backgroundColor: colors.card }]}
              onPress={() => router.push(`/stop-details?stopId=${stop.id}`)}>
              <Text style={[styles.stopName, { color: colors.text }]}>{stop.name}</Text>
              <Text style={[styles.stopDetails, { color: colors.text }]}>
                People Waiting: {stop.waitingCount}
              </Text>
            </Pressable>
          ))
        ) : (
          <Text style={[styles.noStopsText, { color: colors.text }]}>
            No stops available for this route.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  detailsContainer: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    marginBottom: 12,
  },
  pointsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  pointColumn: {
    flex: 1,
    marginRight: 8,
  },
  priceChangeButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    padding: 16,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  stopItem: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  stopName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  stopDetails: {
    fontSize: 14,
  },
  noStopsText: {
    textAlign: 'center',
    fontSize: 16,
  },
  requestItem: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  requestText: {
    fontSize: 14,
  },
  noRequestsText: {
    textAlign: 'center',
    fontSize: 16,
  },
  skeletonText: {
    height: 14,
    borderRadius: 4,
    marginVertical: 4,
    backgroundColor: '#ccc',
  },
  errorText: {
    textAlign: 'center',
    fontSize: 16,
  },
});