import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/hook/useAuth';
import { supabase } from '@/lib/supabase';
import {
  Target,
  Trophy,
  Star,
  Gift,
  Zap,
  Clock,
  CheckCircle,
  ArrowRight,
  X,
  Coins,
  RotateCw,
  Award,
  Tag,
  Calendar,
  AlertTriangle,
  Plus,
} from 'lucide-react-native';
import { router } from 'expo-router';

const { width, height } = Dimensions.get('window');
const WHEEL_SIZE = Math.min(width * 0.8, 300);
const SPIN_DURATION = 4000;

interface Mission {
  id: string;
  title: string;
  description: string;
  points_cost: number;
  category: 'daily' | 'weekly' | 'special';
  is_active: boolean;
  completed?: boolean;
}

interface Reward {
  id: string;
  name: string;
  description: string;
  points_value: number;
  type: 'points' | 'discount' | 'badge' | 'feature';
  icon: string;
  color: string;
  probability: number;
}

export default function MissionsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [userPoints, setUserPoints] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showWheelModal, setShowWheelModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [spinResult, setSpinResult] = useState<Reward | null>(null);
  const [loading, setLoading] = useState(true);
  const [spinsRemaining, setSpinsRemaining] = useState(3);
  const [modalMessage, setModalMessage] = useState('');
  const [setupCompleted, setSetupCompleted] = useState(false);
  const spinValue = useRef(new Animated.Value(0)).current;

  const defaultRewards: Reward[] = [
    { id: '1', name: 'Points Jackpot', description: '1000 Points', points_value: 1000, type: 'points', icon: 'trophy', color: '#FFD700', probability: 0.05 },
    { id: '2', name: 'Big Win', description: '500 Points', points_value: 500, type: 'points', icon: 'star', color: '#FF6B35', probability: 0.10 },
    { id: '3', name: 'Good Win', description: '250 Points', points_value: 250, type: 'points', icon: 'star', color: '#1EA2B1', probability: 0.15 },
    { id: '4', name: 'Small Win', description: '100 Points', points_value: 100, type: 'points', icon: 'star', color: '#ED67B1', probability: 0.20 },
    { id: '5', name: 'Try Again', description: 'Better luck next time!', points_value: 0, type: 'points', icon: 'refresh', color: '#666666', probability: 0.20 },
    { id: '6', name: 'Discount Coupon', description: '10% off next ride', points_value: 0, type: 'discount', icon: 'tag', color: '#10B981', probability: 0.15 },
    { id: '7', name: 'Free Ride', description: 'One free ride credit', points_value: 0, type: 'feature', icon: 'car', color: '#FD602D', probability: 0.10 },
    { id: '8', name: 'Special Badge', description: 'Limited edition badge', points_value: 0, type: 'badge', icon: 'award', color: '#8B5CF6', probability: 0.05 },
  ];

  const defaultMissions: Mission[] = [
    { id: '1', title: 'Daily Login', description: 'Log in every day to earn points', points_cost: 0, category: 'daily', is_active: true },
    { id: '2', title: 'Complete Profile', description: 'Fill out your profile completely', points_cost: 0, category: 'special', is_active: true },
    { id: '3', title: 'First Ride', description: 'Complete your first ride', points_cost: 0, category: 'special', is_active: true },
    { id: '4', title: 'Invite Friend', description: 'Invite a friend to Uthutho', points_cost: 0, category: 'special', is_active: true },
    { id: '5', title: 'Weekly Challenge', description: 'Complete 5 rides this week', points_cost: 0, category: 'weekly', is_active: true },
    { id: '6', title: 'Spin Wheel', description: 'Spin the wheel for rewards', points_cost: 50, category: 'special', is_active: true },
  ];

  const wheelColors = [
    '#FF6B35', '#1EA2B1', '#ED67B1', '#FD602D', '#10B981',
    '#8B5CF6', '#FFD700', '#666666'
  ];

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchUserPoints(),
        fetchMissions(),
        fetchRewards(),
      ]);
    } catch (error) {
      console.error('Error loading mission data:', error);
      // Use default data if tables don't exist
      setRewards(defaultRewards);
      setMissions(defaultMissions);
      setSetupCompleted(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchMissions = async () => {
    try {
      const { data, error } = await supabase
        .from('missions')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true });

      if (error) {
        console.log('Using default missions due to:', error.message);
        return defaultMissions;
      }

      if (data && data.length > 0) {
        if (user) {
          try {
            const { data: userMissions } = await supabase
              .from('user_missions')
              .select('mission_id')
              .eq('user_id', user.id);

            const completedMissionIds = new Set(userMissions?.map(m => m.mission_id));
            
            const missionsWithStatus = data.map(mission => ({
              ...mission,
              completed: completedMissionIds.has(mission.id)
            }));

            setMissions(missionsWithStatus);
            return;
          } catch (error) {
            console.log('user_missions table might not exist, using missions without status');
          }
        }
        setMissions(data);
      } else {
        setMissions(defaultMissions);
      }
    } catch (error) {
      console.log('Using default missions');
      setMissions(defaultMissions);
    }
  };

  const fetchRewards = async () => {
    try {
      const { data, error } = await supabase
        .from('wheel_rewards')
        .select('*')
        .eq('is_active', true)
        .order('probability', { ascending: false });

      if (error) {
        console.log('Using default rewards due to:', error.message);
        return defaultRewards;
      }

      if (data && data.length > 0) {
        setRewards(data);
      } else {
        setRewards(defaultRewards);
      }
    } catch (error) {
      console.log('Using default rewards');
      setRewards(defaultRewards);
    }
  };

  const fetchUserPoints = async () => {
    if (!user) {
      setUserPoints(100); // Default starting points
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', user.id)
        .single();

      if (error) {
        console.log('Error fetching points:', error.message);
        setUserPoints(100); // Default starting points
        return;
      }

      setUserPoints(data?.points || 100);
    } catch (error) {
      console.log('Using default points');
      setUserPoints(100);
    }
  };

  const fetchUserSpins = async () => {
    if (!user) {
      setSpinsRemaining(3); // Default spins
      return;
    }
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from('user_wheel_spins')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString());

      if (error) {
        console.log('user_wheel_spins table might not exist, using default spins');
        setSpinsRemaining(3);
        return;
      }
      
      const spinsToday = data?.length || 0;
      setSpinsRemaining(Math.max(0, 3 - spinsToday));
    } catch (error) {
      console.log('Using default spins');
      setSpinsRemaining(3);
    }
  };

  useEffect(() => {
    fetchUserSpins();
  }, [user]);

  const showModalWithMessage = (message: string, type: 'success' | 'error' | 'info') => {
    setModalMessage(message);
    if (type === 'success') {
      setShowSuccessModal(true);
    } else if (type === 'error') {
      setShowErrorModal(true);
    }
  };

  const handleSpinWheel = () => {
    if (!user) {
      showModalWithMessage('Please sign in to spin the wheel', 'error');
      return;
    }

    if (spinsRemaining <= 0) {
      showModalWithMessage('You have used all your spins for today. Come back tomorrow!', 'error');
      return;
    }

    const spinCost = 50;
    if (userPoints < spinCost) {
      showModalWithMessage(`You need ${spinCost} points to spin the wheel. Complete missions to earn more points!`, 'error');
      return;
    }

    setShowConfirmModal(true);
  };

  const confirmSpin = () => {
    setShowConfirmModal(false);
    setShowWheelModal(true);
    setTimeout(() => startSpinning(), 500);
  };

  const startSpinning = () => {
    setIsSpinning(true);
    
    const randomReward = getRandomReward();
    const rewardIndex = rewards.findIndex(r => r.id === randomReward.id);
    const totalSegments = rewards.length;
    const segmentAngle = 360 / totalSegments;
    
    const fullRotations = 5;
    const randomOffset = Math.random() * segmentAngle * 0.5;
    const finalRotation = -(fullRotations * 360 + (rewardIndex * segmentAngle) + segmentAngle/2 + randomOffset);

    spinValue.setValue(0);
    
    Animated.timing(spinValue, {
      toValue: finalRotation,
      duration: SPIN_DURATION,
      useNativeDriver: true,
      easing: (t) => {
        return 1 - Math.pow(1 - t, 4);
      }
    }).start(async () => {
      setIsSpinning(false);
      await processSpinResult(randomReward);
    });
  };

  const getRandomReward = (): Reward => {
    const totalProbability = rewards.reduce((sum, reward) => sum + reward.probability, 0);
    let random = Math.random() * totalProbability;
    
    for (const reward of rewards) {
      if (random < reward.probability) {
        return reward;
      }
      random -= reward.probability;
    }
    
    return rewards[0];
  };

  const processSpinResult = async (reward: Reward) => {
    if (!user) return;

    try {
      const spinCost = 50;
      const newPoints = userPoints - spinCost + reward.points_value;
      
      // Try to update points in database
      try {
        const { error: pointsError } = await supabase
          .from('profiles')
          .update({ points: newPoints })
          .eq('id', user.id);

        if (pointsError) {
          console.log('Could not update points in database, using local state only');
        }
      } catch (error) {
        console.log('profiles table might not have points column');
      }

      // Try to record spin
      try {
        await supabase
          .from('user_wheel_spins')
          .insert({
            user_id: user.id,
            points_spent: spinCost,
            points_won: reward.points_value,
            spin_result: reward
          });
      } catch (error) {
        console.log('Could not record spin in database');
      }

      setUserPoints(newPoints);
      setSpinResult(reward);
      setSpinsRemaining(prev => Math.max(0, prev - 1));
      
      setTimeout(() => {
        setShowWheelModal(false);
        setTimeout(() => setShowResultModal(true), 300);
      }, 1500);

    } catch (error) {
      console.error('Error processing spin:', error);
      showModalWithMessage('Failed to process spin result', 'error');
    }
  };

  const handleCompleteMission = async (mission: Mission) => {
    if (!user || mission.completed) return;

    try {
      // Try to record mission completion
      try {
        await supabase
          .from('user_missions')
          .insert({
            user_id: user.id,
            mission_id: mission.id,
            completed_at: new Date().toISOString(),
            points_earned: 0
          });
      } catch (error) {
        console.log('Could not record mission completion in database');
      }

      // Update points for mission completion
      const missionPoints = 50; // Default points for completing a mission
      const newPoints = userPoints + missionPoints;
      
      try {
        await supabase
          .from('profiles')
          .update({ points: newPoints })
          .eq('id', user.id);
      } catch (error) {
        console.log('Could not update points for mission completion');
      }

      setUserPoints(newPoints);
      setMissions(prev => prev.map(m => 
        m.id === mission.id ? { ...m, completed: true } : m
      ));

      showModalWithMessage(`Mission Complete! You earned ${missionPoints} points for: ${mission.title}`, 'success');
    } catch (error) {
      console.error('Error completing mission:', error);
      showModalWithMessage('Failed to complete mission', 'error');
    }
  };

  const renderCategoryIcon = (category: string) => {
    switch (category) {
      case 'daily':
        return <Clock size={16} color="#1EA2B1" />;
      case 'weekly':
        return <Calendar size={16} color="#ED67B1" />;
      case 'special':
        return <Trophy size={16} color="#FD602D" />;
      default:
        return <Target size={16} color="#666" />;
    }
  };

  const renderRewardIcon = (type: string, color: string) => {
    switch (type) {
      case 'points':
        return <Coins size={32} color={color} />;
      case 'discount':
        return <Tag size={32} color={color} />;
      case 'badge':
        return <Award size={32} color={color} />;
      case 'feature':
        return <Gift size={32} color={color} />;
      default:
        return <Star size={32} color={color} />;
    }
  };

  const getWheelSlices = () => {
    const totalSegments = rewards.length;
    const segmentAngle = 360 / totalSegments;
    
    return rewards.map((reward, index) => {
      const rotate = `${index * segmentAngle}deg`;
      const skew = `${90 - segmentAngle}deg`;
      
      return {
        id: reward.id,
        name: reward.name,
        color: wheelColors[index % wheelColors.length],
        rotate,
        skew,
      };
    });
  };

  const setupDatabaseTables = async () => {
    setLoading(true);
    try {
      // Create tables and insert default data
      const createTablesResponse = await fetch('/api/setup-missions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (createTablesResponse.ok) {
        setSetupCompleted(true);
        setShowSetupModal(false);
        loadData();
        showModalWithMessage('Mission system setup complete!', 'success');
      } else {
        throw new Error('Failed to setup database');
      }
    } catch (error) {
      console.error('Error setting up database:', error);
      showModalWithMessage('Failed to setup database. Using local data instead.', 'error');
      setSetupCompleted(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !setupCompleted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#1EA2B1" style={styles.loading} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Loading missions...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Missions & Rewards</Text>
          <Text style={[styles.subtitle, { color: colors.text }]}>
            Complete missions to earn points, then spin the wheel for amazing rewards!
          </Text>
        </View>

        {/* Database Setup Alert */}
        {!setupCompleted && (
          <View style={[styles.setupAlert, { backgroundColor: '#FF6B3520', borderColor: '#FF6B35' }]}>
            <AlertTriangle size={24} color="#FF6B35" />
            <View style={styles.setupAlertContent}>
              <Text style={[styles.setupAlertTitle, { color: colors.text }]}>
                Mission System Not Setup
              </Text>
              <Text style={[styles.setupAlertText, { color: colors.text }]}>
                Database tables need to be created for full functionality.
              </Text>
              <TouchableOpacity
                style={styles.setupButton}
                onPress={() => setShowSetupModal(true)}
              >
                <Text style={styles.setupButtonText}>Setup Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Points and Spins Overview */}
        <View style={styles.overviewContainer}>
          <View style={[styles.pointsCard, { backgroundColor: colors.card }]}>
            <View style={styles.pointsInfo}>
              <Coins size={24} color="#FFD700" />
              <Text style={[styles.pointsText, { color: colors.text }]}>Your Points</Text>
              <Text style={[styles.pointsValue, { color: '#1EA2B1' }]}>{userPoints}</Text>
            </View>
            <View style={styles.spinsInfo}>
              <RotateCw size={20} color="#ED67B1" />
              <Text style={[styles.spinsText, { color: colors.text }]}>Spins Today</Text>
              <Text style={[styles.spinsValue, { color: '#ED67B1' }]}>{spinsRemaining}/3</Text>
            </View>
          </View>
        </View>

        {/* Spin Wheel Button */}
        <TouchableOpacity
          style={[styles.spinButton, { backgroundColor: '#1EA2B1' }]}
          onPress={handleSpinWheel}
          disabled={isSpinning || spinsRemaining <= 0}
        >
          <View style={styles.spinButtonContent}>
            <RotateCw size={24} color="white" />
            <View style={styles.spinButtonText}>
              <Text style={styles.spinButtonMainText}>Spin The Wheel</Text>
              <Text style={styles.spinButtonSubText}>50 points per spin • {spinsRemaining} spins left today</Text>
            </View>
            <ArrowRight size={20} color="white" />
          </View>
        </TouchableOpacity>

        {/* Missions Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Target size={20} color="#1EA2B1" />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Available Missions</Text>
          </View>

          {missions.map((mission) => (
            <TouchableOpacity
              key={mission.id}
              style={[styles.missionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => !mission.completed && handleCompleteMission(mission)}
              disabled={mission.completed}
            >
              <View style={styles.missionHeader}>
                {renderCategoryIcon(mission.category)}
                <Text style={[styles.missionTitle, { color: colors.text }]}>{mission.title}</Text>
                {mission.completed ? (
                  <View style={styles.completedBadge}>
                    <CheckCircle size={16} color="#10B981" />
                    <Text style={styles.completedText}>Completed</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.completeButton}
                    onPress={() => handleCompleteMission(mission)}
                  >
                    <Text style={styles.completeButtonText}>Complete</Text>
                  </TouchableOpacity>
                )}
              </View>
              <Text style={[styles.missionDescription, { color: colors.text }]}>
                {mission.description}
              </Text>
              <View style={styles.missionFooter}>
                <View style={styles.categoryBadge}>
                  <Text style={[styles.categoryText, { 
                    color: mission.category === 'daily' ? '#1EA2B1' : 
                          mission.category === 'weekly' ? '#ED67B1' : '#FD602D'
                  }]}>
                    {mission.category.charAt(0).toUpperCase() + mission.category.slice(1)}
                  </Text>
                </View>
                <View style={styles.pointsBadge}>
                  <Star size={12} color="#FFD700" />
                  <Text style={styles.pointsBadgeText}>Earn 50 points</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Rewards Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Gift size={20} color="#ED67B1" />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Possible Rewards</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rewardsScroll}>
            {rewards.map((reward) => (
              <View
                key={reward.id}
                style={[styles.rewardCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={[styles.rewardIconContainer, { backgroundColor: reward.color + '20' }]}>
                  {renderRewardIcon(reward.type, reward.color)}
                </View>
                <Text style={[styles.rewardName, { color: colors.text }]}>{reward.name}</Text>
                <Text style={[styles.rewardDescription, { color: colors.text }]}>
                  {reward.description}
                </Text>
                {reward.points_value > 0 && (
                  <View style={styles.rewardPoints}>
                    <Coins size={12} color="#FFD700" />
                    <Text style={styles.rewardPointsText}>+{reward.points_value} points</Text>
                  </View>
                )}
                <View style={styles.probabilityBadge}>
                  <Text style={styles.probabilityText}>
                    {(reward.probability * 100).toFixed(1)}% chance
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Database Setup Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showSetupModal}
        onRequestClose={() => setShowSetupModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <View style={[styles.modalIconContainer, { backgroundColor: '#1EA2B1' }]}>
                <Plus size={24} color="white" />
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowSetupModal(false)}
              >
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalTitle, { color: colors.text }]}>Setup Mission System</Text>
            <Text style={[styles.modalMessage, { color: colors.text }]}>
              This will create the necessary database tables for missions and rewards. 
              This only needs to be done once.
            </Text>

            <View style={styles.setupInfo}>
              <Text style={[styles.setupInfoTitle, { color: colors.text }]}>What will be created:</Text>
              {[
                'missions table',
                'wheel_rewards table',
                'user_wheel_spins table',
                'user_missions table',
                'Sample missions and rewards'
              ].map((item, index) => (
                <View key={index} style={styles.setupItem}>
                  <CheckCircle size={16} color="#10B981" />
                  <Text style={[styles.setupItemText, { color: colors.text }]}>{item}</Text>
                </View>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowSetupModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#1EA2B1' }]}
                onPress={setupDatabaseTables}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.modalButtonText}>Setup Now</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Confirm Spin Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showConfirmModal}
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <View style={[styles.modalIconContainer, { backgroundColor: '#1EA2B1' }]}>
                <RotateCw size={24} color="white" />
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowConfirmModal(false)}
              >
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalTitle, { color: colors.text }]}>Spin The Wheel</Text>
            <Text style={[styles.modalMessage, { color: colors.text }]}>
              Do you want to spend 50 points to spin the wheel for amazing rewards?
            </Text>

            <View style={styles.pointsInfoModal}>
              <View style={styles.currentPoints}>
                <Text style={[styles.pointsLabel, { color: colors.text }]}>Current Points:</Text>
                <Text style={[styles.pointsValueModal, { color: '#1EA2B1' }]}>{userPoints}</Text>
              </View>
              <View style={styles.afterPoints}>
                <Text style={[styles.pointsLabel, { color: colors.text }]}>After Spin:</Text>
                <Text style={[styles.pointsValueModal, { color: '#1EA2B1' }]}>{userPoints - 50}</Text>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#1EA2B1' }]}
                onPress={confirmSpin}
              >
                <Text style={styles.modalButtonText}>Spin Now!</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Wheel Spin Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showWheelModal}
        onRequestClose={() => !isSpinning && setShowWheelModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContentLarge, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Spinning...</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => !isSpinning && setShowWheelModal(false)}
                disabled={isSpinning}
              >
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.wheelContainer}>
              <Animated.View
                style={[
                  styles.wheel,
                  {
                    width: WHEEL_SIZE,
                    height: WHEEL_SIZE,
                    borderRadius: WHEEL_SIZE / 2,
                    transform: [{ rotate: spinValue.interpolate({
                      inputRange: [-1000, 0, 1000],
                      outputRange: ['-1000deg', '0deg', '1000deg']
                    }) }]
                  }
                ]}
              >
                {getWheelSlices().map((slice, index) => (
                  <View
                    key={slice.id}
                    style={[
                      styles.wheelSlice,
                      {
                        backgroundColor: slice.color,
                        transform: [
                          { rotate: slice.rotate },
                          { skewY: slice.skew }
                        ]
                      }
                    ]}
                  >
                    <View style={styles.sliceContent}>
                      <Text style={styles.sliceText} numberOfLines={1}>
                        {rewards[index]?.name}
                      </Text>
                    </View>
                  </View>
                ))}
              </Animated.View>

              <View style={styles.wheelCenter}>
                <View style={styles.wheelCenterInner}>
                  <RotateCw size={32} color="#1EA2B1" />
                </View>
              </View>

              <View style={styles.pointer}>
                <View style={styles.pointerTriangle} />
              </View>
            </View>

            <Text style={[styles.spinningText, { color: colors.text }]}>
              {isSpinning ? 'Spinning... Get ready!' : 'Processing your reward...'}
            </Text>
          </View>
        </View>
      </Modal>

      {/* Result Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showResultModal}
        onRequestClose={() => setShowResultModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <View style={[
                styles.modalIconContainer,
                { backgroundColor: spinResult?.color || '#1EA2B1' }
              ]}>
                {spinResult && renderRewardIcon(spinResult.type, 'white')}
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowResultModal(false)}
              >
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {spinResult?.points_value > 0 ? '🎉 Congratulations!' : 'Spin Result'}
            </Text>
            
            <Text style={[styles.resultName, { color: spinResult?.color || '#1EA2B1' }]}>
              {spinResult?.name}
            </Text>
            
            <Text style={[styles.resultDescription, { color: colors.text }]}>
              {spinResult?.description}
            </Text>

            {spinResult?.points_value > 0 && (
              <View style={styles.resultPoints}>
                <Coins size={20} color="#FFD700" />
                <Text style={[styles.resultPointsText, { color: '#1EA2B1' }]}>
                  +{spinResult.points_value} points!
                </Text>
              </View>
            )}

            <View style={styles.pointsSummary}>
              <View style={styles.pointsSummaryItem}>
                <Text style={[styles.pointsSummaryLabel, { color: colors.text }]}>Points Spent:</Text>
                <Text style={[styles.pointsSummaryValue, { color: '#EF4444' }]}>-50</Text>
              </View>
              <View style={styles.pointsSummaryItem}>
                <Text style={[styles.pointsSummaryLabel, { color: colors.text }]}>Points Won:</Text>
                <Text style={[styles.pointsSummaryValue, { color: '#10B981' }]}>
                  +{spinResult?.points_value || 0}
                </Text>
              </View>
              <View style={styles.pointsSummaryItem}>
                <Text style={[styles.pointsSummaryLabel, { color: colors.text }]}>New Total:</Text>
                <Text style={[styles.pointsSummaryValue, { color: '#1EA2B1' }]}>
                  {userPoints}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: '#1EA2B1' }]}
              onPress={() => {
                setShowResultModal(false);
                loadData();
              }}
            >
              <Text style={styles.modalButtonText}>Awesome!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showSuccessModal}
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <View style={[styles.modalIconContainer, { backgroundColor: '#10B981' }]}>
                <CheckCircle size={24} color="white" />
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowSuccessModal(false)}
              >
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Success!</Text>
            <Text style={[styles.modalMessage, { color: colors.text }]}>{modalMessage}</Text>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: '#10B981' }]}
              onPress={() => setShowSuccessModal(false)}
            >
              <Text style={styles.modalButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Error Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showErrorModal}
        onRequestClose={() => setShowErrorModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <View style={[styles.modalIconContainer, { backgroundColor: '#EF4444' }]}>
                <X size={24} color="white" />
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowErrorModal(false)}
              >
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Oops!</Text>
            <Text style={[styles.modalMessage, { color: colors.text }]}>{modalMessage}</Text>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: '#EF4444' }]}
              onPress={() => setShowErrorModal(false)}
            >
              <Text style={styles.modalButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    textAlign: 'center',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
    lineHeight: 22,
  },
  setupAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    gap: 12,
  },
  setupAlertContent: {
    flex: 1,
  },
  setupAlertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  setupAlertText: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 12,
  },
  setupButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  setupButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  overviewContainer: {
    marginBottom: 20,
  },
  pointsCard: {
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  pointsInfo: {
    alignItems: 'center',
  },
  pointsText: {
    fontSize: 14,
    marginTop: 8,
    marginBottom: 4,
    fontWeight: '500',
  },
  pointsValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  spinsInfo: {
    alignItems: 'center',
  },
  spinsText: {
    fontSize: 14,
    marginTop: 8,
    marginBottom: 4,
    fontWeight: '500',
  },
  spinsValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  spinButton: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  spinButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  spinButtonText: {
    flex: 1,
    marginHorizontal: 12,
  },
  spinButtonMainText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  spinButtonSubText: {
    color: 'white',
    fontSize: 12,
    opacity: 0.9,
    marginTop: 2,
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  missionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  missionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  missionTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B98120',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 5,
  },
  completedText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
  },
  completeButton: {
    backgroundColor: '#1EA2B1',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  completeButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  missionDescription: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 12,
    lineHeight: 18,
  },
  missionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD70020',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
  },
  pointsBadgeText: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: '600',
  },
  rewardsScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  rewardCard: {
    width: 140,
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  rewardIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  rewardName: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  rewardDescription: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: 8,
    flex: 1,
  },
  rewardPoints: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD70020',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
    marginBottom: 8,
  },
  rewardPointsText: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '600',
  },
  probabilityBadge: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  probabilityText: {
    color: '#666',
    fontSize: 10,
    fontWeight: '500',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalContentLarge: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 20,
    padding: 24,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: 24,
  },
  setupInfo: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  setupInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  setupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  setupItemText: {
    fontSize: 14,
    flex: 1,
  },
  pointsInfoModal: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  currentPoints: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  afterPoints: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  pointsLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  pointsValueModal: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#333333',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Wheel Styles
  wheelContainer: {
    width: WHEEL_SIZE + 80,
    height: WHEEL_SIZE + 80,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginVertical: 30,
  },
  wheel: {
    position: 'absolute',
    borderWidth: 8,
    borderColor: '#1a1a1a',
    overflow: 'hidden',
  },
  wheelSlice: {
    position: 'absolute',
    width: '50%',
    height: '50%',
    top: 0,
    left: '50%',
    transformOrigin: '0% 100%',
  },
  sliceContent: {
    position: 'absolute',
    width: '200%',
    height: '200%',
    transform: [{ rotate: '-45deg' }],
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliceText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    width: 80,
    transform: [{ rotate: '90deg' }],
  },
  wheelCenter: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  wheelCenterInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pointer: {
    position: 'absolute',
    top: -20,
    zIndex: 20,
    alignItems: 'center',
  },
  pointerTriangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 20,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#EF4444',
  },
  spinningText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 20,
  },
  // Result Modal Styles
  resultName: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  resultDescription: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: 24,
    lineHeight: 22,
  },
  resultPoints: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
    backgroundColor: '#FFD70010',
    padding: 16,
    borderRadius: 12,
  },
  resultPointsText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  pointsSummary: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  pointsSummaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pointsSummaryLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  pointsSummaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});