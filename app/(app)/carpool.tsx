import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Plus, Users, Clock, MapPin, DollarSign, Calendar, Car } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hook/useAuth';

interface CarpoolClub {
  id: string;
  name: string;
  description: string;
  creator_id: string;
  from_location: string;
  to_location: string;
  pickup_time: string;
  return_time: string;
  days_of_week: string[];
  max_members: number;
  current_members: number;
  price_per_trip: number;
  price_range: string;
  vehicle_info: string;
  is_full: boolean;
  created_at: string;
  profiles: {
    first_name: string;
    last_name: string;
  };
}

export default function CarpoolScreen() {
  const [carpools, setCarpools] = useState<CarpoolClub[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    from_location: '',
    to_location: '',
    pickup_time: '',
    return_time: '',
    days_of_week: [] as string[],
    max_members: 4,
    price_per_trip: '',
    price_range: '',
    vehicle_info: '',
    rules: '',
  });

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    fetchCarpools();
  }, []);

  const fetchCarpools = async () => {
    try {
      const { data, error } = await supabase
        .from('carpool_clubs')
        .select(`
          *,
          profiles:creator_id (first_name, last_name)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCarpools(data || []);
    } catch (error) {
      console.error('Error fetching carpools:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCarpool = async () => {
    if (!user) {
      Alert.alert('Error', 'Please sign in to create a carpool');
      return;
    }

    if (!formData.name || !formData.from_location || !formData.to_location || !formData.pickup_time) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const { error } = await supabase
        .from('carpool_clubs')
        .insert({
          ...formData,
          creator_id: user.id,
          price_per_trip: formData.price_per_trip ? parseFloat(formData.price_per_trip) : null,
        });

      if (error) throw error;

      Alert.alert('Success', 'Carpool created successfully!');
      setShowCreateForm(false);
      setFormData({
        name: '',
        description: '',
        from_location: '',
        to_location: '',
        pickup_time: '',
        return_time: '',
        days_of_week: [],
        max_members: 4,
        price_per_trip: '',
        price_range: '',
        vehicle_info: '',
        rules: '',
      });
      fetchCarpools();
    } catch (error) {
      console.error('Error creating carpool:', error);
      Alert.alert('Error', 'Failed to create carpool');
    }
  };

  const applyToCarpool = async (carpoolId: string) => {
    if (!user) {
      Alert.alert('Error', 'Please sign in to apply');
      return;
    }

    try {
      const { error } = await supabase
        .from('carpool_applications')
        .insert({
          carpool_id: carpoolId,
          applicant_id: user.id,
          message: 'I would like to join this carpool',
        });

      if (error) {
        if (error.code === '23505') {
          Alert.alert('Info', 'You have already applied to this carpool');
        } else {
          throw error;
        }
        return;
      }

      Alert.alert('Success', 'Application sent successfully!');
    } catch (error) {
      console.error('Error applying to carpool:', error);
      Alert.alert('Error', 'Failed to send application');
    }
  };

  const toggleDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(day)
        ? prev.days_of_week.filter(d => d !== day)
        : [...prev.days_of_week, day]
    }));
  };

  const filteredCarpools = carpools.filter(carpool =>
    carpool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    carpool.from_location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    carpool.to_location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (showCreateForm) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowCreateForm(false)}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Carpool</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Carpool Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Morning Commute to Sandton"
              placeholderTextColor="#888888"
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tell people about your carpool..."
              placeholderTextColor="#888888"
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>From Location *</Text>
            <TextInput
              style={styles.input}
              placeholder="Starting point"
              placeholderTextColor="#888888"
              value={formData.from_location}
              onChangeText={(text) => setFormData(prev => ({ ...prev, from_location: text }))}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>To Location *</Text>
            <TextInput
              style={styles.input}
              placeholder="Destination"
              placeholderTextColor="#888888"
              value={formData.to_location}
              onChangeText={(text) => setFormData(prev => ({ ...prev, to_location: text }))}
            />
          </View>

          <View style={styles.timeRow}>
            <View style={styles.timeInput}>
              <Text style={styles.label}>Pickup Time *</Text>
              <TextInput
                style={styles.input}
                placeholder="07:30"
                placeholderTextColor="#888888"
                value={formData.pickup_time}
                onChangeText={(text) => setFormData(prev => ({ ...prev, pickup_time: text }))}
              />
            </View>
            <View style={styles.timeInput}>
              <Text style={styles.label}>Return Time</Text>
              <TextInput
                style={styles.input}
                placeholder="17:30"
                placeholderTextColor="#888888"
                value={formData.return_time}
                onChangeText={(text) => setFormData(prev => ({ ...prev, return_time: text }))}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Days of Week</Text>
            <View style={styles.daysContainer}>
              {daysOfWeek.map(day => (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayChip,
                    formData.days_of_week.includes(day) && styles.dayChipSelected
                  ]}
                  onPress={() => toggleDay(day)}
                >
                  <Text style={[
                    styles.dayChipText,
                    formData.days_of_week.includes(day) && styles.dayChipTextSelected
                  ]}>
                    {day.slice(0, 3)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Max Members</Text>
            <TextInput
              style={styles.input}
              placeholder="4"
              placeholderTextColor="#888888"
              value={formData.max_members.toString()}
              onChangeText={(text) => setFormData(prev => ({ ...prev, max_members: parseInt(text) || 4 }))}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Price per Trip (R)</Text>
            <TextInput
              style={styles.input}
              placeholder="50.00"
              placeholderTextColor="#888888"
              value={formData.price_per_trip}
              onChangeText={(text) => setFormData(prev => ({ ...prev, price_per_trip: text }))}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Vehicle Info</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., White Toyota Corolla, License: ABC123GP"
              placeholderTextColor="#888888"
              value={formData.vehicle_info}
              onChangeText={(text) => setFormData(prev => ({ ...prev, vehicle_info: text }))}
            />
          </View>

          <TouchableOpacity style={styles.createButton} onPress={createCarpool}>
            <Text style={styles.createButtonText}>Create Carpool</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Carpool Clubs</Text>
        <Text style={styles.headerSubtitle}>Share rides, save money, help the environment</Text>
      </View>

      {/* Search and Create */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search carpools..."
            placeholderTextColor="#888888"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity 
          style={styles.createFab} 
          onPress={() => setShowCreateForm(true)}
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Carpools List */}
      <View style={styles.carpoolsContainer}>
        {loading ? (
          <Text style={styles.loadingText}>Loading carpools...</Text>
        ) : filteredCarpools.length === 0 ? (
          <View style={styles.emptyState}>
            <Car size={48} color="#888888" />
            <Text style={styles.emptyStateText}>No carpools found</Text>
            <Text style={styles.emptyStateSubtext}>
              {searchQuery ? 'Try a different search term' : 'Be the first to create one!'}
            </Text>
          </View>
        ) : (
          filteredCarpools.map((carpool) => (
            <View key={carpool.id} style={styles.carpoolCard}>
              <View style={styles.carpoolHeader}>
                <Text style={styles.carpoolName}>{carpool.name}</Text>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: carpool.is_full ? '#ff6b35' : '#1ea2b1' }
                ]}>
                  <Text style={styles.statusText}>
                    {carpool.is_full ? 'Full' : 'Available'}
                  </Text>
                </View>
              </View>

              <Text style={styles.carpoolCreator}>
                Created by {carpool.profiles?.first_name} {carpool.profiles?.last_name}
              </Text>

              {carpool.description && (
                <Text style={styles.carpoolDescription}>{carpool.description}</Text>
              )}

              <View style={styles.routeInfo}>
                <MapPin size={16} color="#1ea2b1" />
                <Text style={styles.routeText}>
                  {carpool.from_location} → {carpool.to_location}
                </Text>
              </View>

              <View style={styles.carpoolDetails}>
                <View style={styles.detailItem}>
                  <Clock size={16} color="#888888" />
                  <Text style={styles.detailText}>
                    {carpool.pickup_time}
                    {carpool.return_time && ` - ${carpool.return_time}`}
                  </Text>
                </View>

                <View style={styles.detailItem}>
                  <Users size={16} color="#888888" />
                  <Text style={styles.detailText}>
                    {carpool.current_members}/{carpool.max_members} members
                  </Text>
                </View>

                {carpool.price_per_trip && (
                  <View style={styles.detailItem}>
                    <DollarSign size={16} color="#888888" />
                    <Text style={styles.detailText}>R{carpool.price_per_trip}/trip</Text>
                  </View>
                )}
              </View>

              <View style={styles.daysContainer}>
                {carpool.days_of_week.map(day => (
                  <View key={day} style={styles.dayTag}>
                    <Text style={styles.dayTagText}>{day.slice(0, 3)}</Text>
                  </View>
                ))}
              </View>

              {!carpool.is_full && carpool.creator_id !== user?.id && (
                <TouchableOpacity 
                  style={styles.applyButton}
                  onPress={() => applyToCarpool(carpool.id)}
                >
                  <Text style={styles.applyButtonText}>Apply to Join</Text>
                </TouchableOpacity>
              )}

              {carpool.creator_id === user?.id && (
                <View style={styles.ownerBadge}>
                  <Text style={styles.ownerBadgeText}>Your Carpool</Text>
                </View>
              )}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    padding: 24,
    paddingTop: 60,
  },
  backButton: {
    color: '#1ea2b1',
    fontSize: 16,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#888888',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchInputContainer: {
    flex: 1,
    backgroundColor: '#111111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  searchInput: {
    padding: 16,
    color: '#FFFFFF',
    fontSize: 16,
  },
  createFab: {
    backgroundColor: '#1ea2b1',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  carpoolsContainer: {
    paddingHorizontal: 16,
  },
  loadingText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 16,
    marginTop: 40,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyStateSubtext: {
    color: '#888888',
    fontSize: 14,
    marginTop: 8,
  },
  carpoolCard: {
    backgroundColor: '#111111',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  carpoolHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  carpoolName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  carpoolCreator: {
    color: '#888888',
    fontSize: 14,
    marginBottom: 12,
  },
  carpoolDescription: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  routeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  carpoolDetails: {
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    color: '#888888',
    fontSize: 14,
    marginLeft: 8,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  dayTag: {
    backgroundColor: '#1ea2b1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 4,
  },
  dayTagText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  applyButton: {
    backgroundColor: '#1ea2b1',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  ownerBadge: {
    backgroundColor: '#333333',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  ownerBadgeText: {
    color: '#888888',
    fontSize: 14,
  },
  formContainer: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#222222',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#444444',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeInput: {
    flex: 0.48,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayChip: {
    backgroundColor: '#333333',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  dayChipSelected: {
    backgroundColor: '#1ea2b1',
  },
  dayChipText: {
    color: '#888888',
    fontSize: 14,
    fontWeight: '600',
  },
  dayChipTextSelected: {
    color: '#FFFFFF',
  },
  createButton: {
    backgroundColor: '#1ea2b1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});