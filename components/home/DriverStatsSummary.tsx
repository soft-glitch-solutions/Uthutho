import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Car, Users, TrendingUp, ChevronRight, Clock } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';

interface DriverStats {
  servicesCount: number;
  ridersCount: number;
  pendingRequests: number;
}

interface DriverStatsSummaryProps {
  userId: string;
  colors: any;
}

export const DriverStatsSummary: React.FC<DriverStatsSummaryProps> = ({ userId, colors }) => {
  const router = useRouter();
  const [stats, setStats] = useState<DriverStats>({
    servicesCount: 0,
    ridersCount: 0,
    pendingRequests: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchDriverStats();
    }
  }, [userId]);

  const fetchDriverStats = async () => {
    try {
      setLoading(true);
      
      // 1. Get Driver ID
      const { data: driver, error: driverError } = await supabase
        .from('drivers')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (driverError || !driver) {
        console.error('Error fetching driver:', driverError);
        return;
      }

      const driverId = driver.id;

      // 2. Fetch Active Services and Total Riders
      const { data: services, error: servicesError } = await supabase
        .from('school_transports')
        .select('current_riders')
        .eq('driver_id', driverId)
        .eq('status', 'open');

      if (servicesError) throw servicesError;

      const servicesCount = services?.length || 0;
      const ridersCount = services?.reduce((sum, s) => sum + (s.current_riders || 0), 0) || 0;

      // 3. Fetch Pending Requests
      // First get all transport IDs for this driver
      const { data: allServices } = await supabase
        .from('school_transports')
        .select('id')
        .eq('driver_id', driverId);

      const transportIds = allServices?.map(s => s.id) || [];
      
      let pendingRequests = 0;
      if (transportIds.length > 0) {
        const { count, error: requestsError } = await supabase
          .from('transport_requests')
          .select('*', { count: 'exact', head: true })
          .in('transport_id', transportIds)
          .eq('status', 'pending');
        
        if (!requestsError) {
          pendingRequests = count || 0;
        }
      }

      setStats({
        servicesCount,
        ridersCount,
        pendingRequests,
      });
    } catch (error) {
      console.error('Error in fetchDriverStats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: '#111', borderColor: '#222' }]}>
        <ActivityIndicator size="small" color="#1ea2b1" />
      </View>
    );
  }

  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: '#111', borderColor: '#222' }]}
      onPress={() => router.push('/driver-dashboard')}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.readyText}>DRIVER OVERVIEW</Text>
          <Text style={styles.headingText}>Fleet Performance</Text>
        </View>
        <ChevronRight size={20} color="#444" />
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <View style={[styles.iconBox, { backgroundColor: 'rgba(30, 162, 177, 0.1)' }]}>
            <Car size={16} color="#1ea2b1" />
          </View>
          <Text style={styles.statValue}>{stats.servicesCount}</Text>
          <Text style={styles.statLabel}>Services</Text>
        </View>

        <View style={styles.statItem}>
          <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
            <Users size={16} color="#10b981" />
          </View>
          <Text style={styles.statValue}>{stats.ridersCount}</Text>
          <Text style={styles.statLabel}>Riders</Text>
        </View>

        <View style={styles.statItem}>
          <View style={[styles.iconBox, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
            <Clock size={16} color="#f59e0b" />
          </View>
          <Text style={styles.statValue}>{stats.pendingRequests}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    marginHorizontal: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  readyText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: '#1ea2b1',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  headingText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: -0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
});
