// app/(app)/driver/earnings.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Calendar,
  Download,
  CreditCard,
  History,
  ChevronRight,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hook/useAuth';
import { LineChart } from 'react-native-chart-kit';

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
      
      // Get driver ID
      const { data: driverData, error: driverError } = await supabase
        .from('drivers')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (driverError) throw driverError;

      const driverId = driverData.id;

      // Get all transports by this driver
      const { data: transportsData, error: transportsError } = await supabase
        .from('school_transports')
        .select('id, price_per_month, current_riders')
        .eq('driver_id', driverId)
        .eq('is_active', true);

      if (transportsError) throw transportsError;

      // Calculate earnings
      let totalEarnings = 0;
      let thisMonthEarnings = 0;
      let lastMonthEarnings = 0;
      let availableEarnings = 0;
      let pendingEarnings = 0;

      transportsData.forEach(transport => {
        const monthlyRevenue = transport.price_per_month * transport.current_riders;
        totalEarnings += monthlyRevenue;
        thisMonthEarnings += monthlyRevenue;
        availableEarnings += monthlyRevenue;
      });

      // For demo purposes, generate monthly data
      const demoMonthlyData: MonthlyEarnings[] = [
        { month: 'Jan', earnings: 8500, rides: 15 },
        { month: 'Feb', earnings: 9200, rides: 18 },
        { month: 'Mar', earnings: 7800, rides: 14 },
        { month: 'Apr', earnings: 10500, rides: 21 },
        { month: 'May', earnings: 9500, rides: 19 },
        { month: 'Jun', earnings: 11000, rides: 22 },
      ];

      // Demo transactions
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

  const handleGoBack = () => {
    router.back();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const chartData = {
    labels: monthlyData.map(data => data.month),
    datasets: [
      {
        data: monthlyData.map(data => data.earnings / 1000), // Convert to thousands
        color: (opacity = 1) => `rgba(30, 162, 177, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  const chartConfig = {
    backgroundColor: '#111111',
    backgroundGradientFrom: '#111111',
    backgroundGradientTo: '#111111',
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#1ea2b1',
    },
    propsForLabels: {
      fontSize: 12,
    },
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'failed': return '#EF4444';
      default: return '#888888';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'payment': return <DollarSign size={16} color="#10B981" />;
      case 'payout': return <CreditCard size={16} color="#1ea2b1" />;
      case 'refund': return <History size={16} color="#EF4444" />;
      default: return <DollarSign size={16} color="#888888" />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleGoBack}
        >
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Earnings</Text>
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#1ea2b1"
            colors={["#1ea2b1"]}
          />
        }
      >
        {/* Earnings Summary */}
        <View style={styles.earningsSummary}>
          <View style={styles.totalEarnings}>
            <Text style={styles.totalLabel}>Total Earnings</Text>
            <Text style={styles.totalAmount}>{formatCurrency(earnings.total)}</Text>
            <Text style={styles.totalSubtext}>Lifetime earnings</Text>
          </View>
          
          <View style={styles.earningsBreakdown}>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>This Month</Text>
              <Text style={styles.breakdownAmount}>{formatCurrency(earnings.thisMonth)}</Text>
            </View>
            
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Available</Text>
              <Text style={styles.breakdownAmount}>{formatCurrency(earnings.available)}</Text>
            </View>
            
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Pending</Text>
              <Text style={styles.breakdownAmount}>{formatCurrency(earnings.pending)}</Text>
            </View>
          </View>
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          <TouchableOpacity 
            style={[styles.periodButton, selectedPeriod === 'week' && styles.periodButtonActive]}
            onPress={() => setSelectedPeriod('week')}
          >
            <Text style={[styles.periodButtonText, selectedPeriod === 'week' && styles.periodButtonTextActive]}>
              Week
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.periodButton, selectedPeriod === 'month' && styles.periodButtonActive]}
            onPress={() => setSelectedPeriod('month')}
          >
            <Text style={[styles.periodButtonText, selectedPeriod === 'month' && styles.periodButtonTextActive]}>
              Month
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.periodButton, selectedPeriod === 'year' && styles.periodButtonActive]}
            onPress={() => setSelectedPeriod('year')}
          >
            <Text style={[styles.periodButtonText, selectedPeriod === 'year' && styles.periodButtonTextActive]}>
              Year
            </Text>
          </TouchableOpacity>
        </View>

        {/* Earnings Chart */}
        {monthlyData.length > 0 && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Earnings Overview</Text>
            <LineChart
              data={chartData}
              width={screenWidth - 32}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
              formatYLabel={(value) => `R${parseFloat(value) * 1000}`}
            />
            <Text style={styles.chartSubtitle}>
              Earnings in thousands (ZAR) per month
            </Text>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction}>
            <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(30, 162, 177, 0.1)' }]}>
              <Download size={24} color="#1ea2b1" />
            </View>
            <Text style={styles.quickActionText}>Request Payout</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickAction}>
            <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <TrendingUp size={24} color="#10B981" />
            </View>
            <Text style={styles.quickActionText}>View Stats</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickAction}>
            <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
              <Calendar size={24} color="#8B5CF6" />
            </View>
            <Text style={styles.quickActionText}>Reports</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>View All</Text>
              <ChevronRight size={16} color="#1ea2b1" />
            </TouchableOpacity>
          </View>
          
          {transactions.length === 0 ? (
            <View style={styles.emptyTransactions}>
              <Text style={styles.emptyText}>No transactions yet</Text>
              <Text style={styles.emptySubtext}>
                Transactions will appear here when you receive payments
              </Text>
            </View>
          ) : (
            <View style={styles.transactionsList}>
              {transactions.map((transaction) => (
                <View key={transaction.id} style={styles.transactionCard}>
                  <View style={styles.transactionHeader}>
                    <View style={styles.transactionInfo}>
                      {getTypeIcon(transaction.type)}
                      <View>
                        <Text style={styles.transactionDescription}>
                          {transaction.description}
                        </Text>
                        <Text style={styles.transactionReference}>
                          Ref: {transaction.reference}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.transactionAmount}>
                      <Text style={[
                        styles.amountText,
                        transaction.type === 'refund' && styles.amountTextNegative
                      ]}>
                        {transaction.type === 'refund' ? '-' : '+'}{formatCurrency(transaction.amount)}
                      </Text>
                      <View style={[
                        styles.statusBadge,
                        { backgroundColor: `${getStatusColor(transaction.status)}20` }
                      ]}>
                        <Text style={[
                          styles.statusText,
                          { color: getStatusColor(transaction.status) }
                        ]}>
                          {transaction.status}
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  <Text style={styles.transactionDate}>
                    {new Date(transaction.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Bottom Padding */}
        <View style={styles.bottomPadding} />
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
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#111111',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#222222',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scrollContainer: {
    flex: 1,
  },
  earningsSummary: {
    backgroundColor: '#111111',
    margin: 16,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#333333',
  },
  totalEarnings: {
    alignItems: 'center',
    marginBottom: 24,
  },
  totalLabel: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  totalSubtext: {
    fontSize: 12,
    color: '#888888',
  },
  earningsBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  breakdownItem: {
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 12,
    color: '#888888',
    marginBottom: 4,
  },
  breakdownAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#111111',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#1ea2b1',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888888',
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
  },
  chartContainer: {
    backgroundColor: '#111111',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartSubtitle: {
    fontSize: 12,
    color: '#888888',
    textAlign: 'center',
    marginTop: 8,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  quickAction: {
    flex: 1,
    backgroundColor: '#111111',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#111111',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    color: '#1ea2b1',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyTransactions: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#888888',
    fontSize: 14,
    textAlign: 'center',
  },
  transactionsList: {
    gap: 12,
  },
  transactionCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  transactionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  transactionReference: {
    fontSize: 12,
    color: '#888888',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 4,
  },
  amountTextNegative: {
    color: '#EF4444',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  transactionDate: {
    fontSize: 12,
    color: '#888888',
  },
  bottomPadding: {
    height: 100,
  },
});