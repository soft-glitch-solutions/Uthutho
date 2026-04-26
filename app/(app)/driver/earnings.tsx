import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import {
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Calendar,
  Download,
  CreditCard,
  History,
  ChevronRight,
  TrendingDown,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hook/useAuth';
import { LineChart } from 'react-native-chart-kit';
import { useTheme } from '@/context/ThemeContext';
import { EarningsSkeleton } from '@/components/profile/SkeletonComponents';

const screenWidth = Dimensions.get('window').width;

interface MonthlyEarnings {
  month: string;
  earnings: number;
  rides: number;
}

interface Transaction {
  id: string;
  amount: number;
  type: 'payment' | 'payout' | 'refund';
  status: 'completed' | 'pending' | 'failed';
  description: string;
  created_at: string;
  reference: string;
}

export default function DriverEarningsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [earnings, setEarnings] = useState({
    total: 0,
    thisMonth: 0,
    lastMonth: 0,
    pending: 0,
    available: 0,
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyEarnings[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    if (user) {
      fetchEarningsData();
    }
  }, [user, selectedPeriod]);

  const fetchEarningsData = async () => {
    try {
      setLoading(true);
      
      const { data: driverData, error: driverError } = await supabase
        .from('drivers')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (driverError) throw driverError;

      const driverId = driverData.id;

      const { data: transportsData, error: transportsError } = await supabase
        .from('school_transports')
        .select('id, price_per_month, current_riders')
        .eq('driver_id', driverId)
        .eq('status', 'open');

      if (transportsError) throw transportsError;

      let totalEarnings = 0;
      let thisMonthEarnings = 0;
      let lastMonthEarnings = 0;
      let availableEarnings = 0;
      let pendingEarnings = 0;

      transportsData.forEach(transport => {
        const monthlyRevenue = (transport.price_per_month || 0) * (transport.current_riders || 0);
        totalEarnings += monthlyRevenue * 12; // Approximation for demo
        thisMonthEarnings += monthlyRevenue;
        availableEarnings += monthlyRevenue * 0.8; // Approximation
        pendingEarnings += monthlyRevenue * 0.2; // Approximation
      });

      const demoMonthlyData: MonthlyEarnings[] = [
        { month: 'Jan', earnings: 8500, rides: 15 },
        { month: 'Feb', earnings: 9200, rides: 18 },
        { month: 'Mar', earnings: 7800, rides: 14 },
        { month: 'Apr', earnings: 10500, rides: 21 },
        { month: 'May', earnings: 9500, rides: 19 },
        { month: 'Jun', earnings: 11000, rides: 22 },
      ];

      const demoTransactions: Transaction[] = [
        {
          id: '1',
          amount: 2500,
          type: 'payment',
          status: 'completed',
          description: 'Monthly payment - John Doe',
          created_at: '2024-06-15T10:30:00Z',
          reference: 'PAY-001234'
        },
        {
          id: '2',
          amount: 1800,
          type: 'payment',
          status: 'completed',
          description: 'Weekly payment - Sarah Smith',
          created_at: '2024-06-10T14:20:00Z',
          reference: 'PAY-001235'
        },
        {
          id: '3',
          amount: 3000,
          type: 'payout',
          status: 'completed',
          description: 'Payout to bank account',
          created_at: '2024-06-05T09:15:00Z',
          reference: 'PAYOUT-001236'
        },
        {
          id: '4',
          amount: 2200,
          type: 'payment',
          status: 'pending',
          description: 'Monthly payment - Mike Johnson',
          created_at: '2024-06-01T16:45:00Z',
          reference: 'PAY-001237'
        },
      ];

      setEarnings({
        total: totalEarnings,
        thisMonth: thisMonthEarnings,
        lastMonth: lastMonthEarnings,
        pending: pendingEarnings,
        available: availableEarnings,
      });

      setMonthlyData(demoMonthlyData);
      setTransactions(demoTransactions);

    } catch (error) {
      console.error('Error fetching earnings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchEarningsData();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const chartData = {
    labels: monthlyData.map(data => data.month),
    datasets: [
      {
        data: monthlyData.map(data => data.earnings / 1000),
        color: (opacity = 1) => `rgba(30, 162, 177, ${opacity})`,
        strokeWidth: 3,
      },
    ],
  };

  const chartConfig = {
    backgroundColor: '#000000',
    backgroundGradientFrom: '#000000',
    backgroundGradientTo: '#000000',
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(30, 162, 177, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: {
      borderRadius: 24,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#000',
    },
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'failed': return '#EF4444';
      default: return '#666';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'payment': return <DollarSign size={16} color="#10B981" />;
      case 'payout': return <CreditCard size={16} color="#1ea2b1" />;
      case 'refund': return <TrendingDown size={16} color="#EF4444" />;
      default: return <DollarSign size={16} color="#666" />;
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Premium Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/driver-dashboard');
              }
            }}
          >
            <ArrowLeft size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.brandText}>Uthutho</Text>
          <TouchableOpacity style={styles.settingsButton}>
            <Calendar size={22} color="#FFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.headerContent}>
          <Text style={styles.readyText}>EARNINGS OVERVIEW</Text>
          <Text style={styles.headingText}>Financial Insights</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#1ea2b1"
          />
        }
      >
        {loading ? (
          <EarningsSkeleton colors={colors} />
        ) : (
          <>
            {/* Total Earnings Card */}
            <View style={styles.totalCard}>
              <Text style={styles.totalLabel}>LIFETIME REVENUE</Text>
              <Text style={styles.totalAmount}>{formatCurrency(earnings.total)}</Text>
              <View style={styles.trendRow}>
                <TrendingUp size={16} color="#10B981" />
                <Text style={styles.trendText}>+12.5% from last month</Text>
              </View>
            </View>
            
            {/* Breakdown Grid */}
            <View style={styles.gridContainer}>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>THIS MONTH</Text>
                <Text style={styles.gridValue}>{formatCurrency(earnings.thisMonth)}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>AVAILABLE</Text>
                <Text style={[styles.gridValue, { color: '#10B981' }]}>{formatCurrency(earnings.available)}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>PENDING</Text>
                <Text style={[styles.gridValue, { color: '#F59E0B' }]}>{formatCurrency(earnings.pending)}</Text>
              </View>
            </View>

            {/* Chart Section */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>PERFORMANCE TREND</Text>
              <LineChart
                data={chartData}
                width={screenWidth - 64}
                height={200}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
                withInnerLines={false}
                withOuterLines={false}
              />
            </View>

            {/* Quick Actions */}
            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.actionCard}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(30, 162, 177, 0.1)' }]}>
                  <Download size={20} color="#1ea2b1" />
                </View>
                <Text style={styles.actionLabel}>Withdraw</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionCard}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                  <TrendingUp size={20} color="#10B981" />
                </View>
                <Text style={styles.actionLabel}>Analytic</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionCard}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                  <History size={20} color="#8B5CF6" />
                </View>
                <Text style={styles.actionLabel}>Invoices</Text>
              </TouchableOpacity>
            </View>

            {/* Transactions Section */}
            <View style={styles.transactionsSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>RECENT ACTIVITY</Text>
                <TouchableOpacity onPress={() => {}}>
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              </View>
              
              {transactions.map((transaction) => (
                <View key={transaction.id} style={styles.transactionCard}>
                  <View style={styles.transactionLeft}>
                    <View style={styles.transactionIconBox}>
                      {getTypeIcon(transaction.type)}
                    </View>
                    <View>
                      <Text style={styles.transactionTitle}>{transaction.description}</Text>
                      <Text style={styles.transactionDate}>
                        {new Date(transaction.created_at).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.transactionRight}>
                    <Text style={[
                      styles.transactionAmount,
                      transaction.type === 'payout' && { color: '#EF4444' }
                    ]}>
                      {transaction.type === 'payout' ? '-' : '+'}{formatCurrency(transaction.amount)}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(transaction.status)}10` }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(transaction.status) }]}>
                        {transaction.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    backgroundColor: '#000',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    marginBottom: 32,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -1,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    marginTop: 0,
  },
  readyText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#1ea2b1',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  headingText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    fontStyle: 'italic',
    letterSpacing: -1,
  },
  scrollContainer: {
    flex: 1,
  },
  totalCard: {
    marginHorizontal: 24,
    padding: 32,
    backgroundColor: '#111',
    borderRadius: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222',
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#666',
    marginBottom: 16,
  },
  totalAmount: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -1,
    marginBottom: 12,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  gridContainer: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginTop: 16,
    gap: 12,
  },
  gridItem: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#222',
    alignItems: 'center',
  },
  gridLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: '#444',
    marginBottom: 8,
  },
  gridValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFF',
  },
  sectionCard: {
    marginHorizontal: 24,
    marginTop: 24,
    padding: 24,
    backgroundColor: '#111',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#222',
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#444',
    marginBottom: 24,
  },
  chart: {
    marginLeft: -16,
  },
  actionsRow: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginTop: 24,
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 24,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  transactionsSection: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1ea2b1',
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#222',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  transactionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 11,
    color: '#666',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#10B981',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 8,
    fontWeight: '900',
  },
});