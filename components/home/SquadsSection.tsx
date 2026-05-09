import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Image } from 'react-native';
import { Users, Share2, ShieldCheck, Plus, ArrowRight, Zap } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface SquadsSectionProps {
  userId: string | undefined;
  colors: any;
}

const SquadsSection = ({ userId, colors }: SquadsSectionProps) => {
  const [squad, setSquad] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchUserSquad();
    }
  }, [userId]);

  const fetchUserSquad = async () => {
    try {
      const { data: membership } = await supabase
        .from('squad_members')
        .select('squad_id')
        .eq('user_id', userId)
        .eq('status', 'accepted')
        .maybeSingle();

      if (membership) {
        const { data: squadData } = await supabase
          .from('squads')
          .select('*')
          .eq('id', membership.squad_id)
          .single();
        
        setSquad(squadData);
      }
    } catch (error) {
      console.error('Error fetching squad for section:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: 'Join me on Uthutho! Move smarter, earn rewards, and join the commute revolution. 🚀\n\nDownload here: https://uthutho.com/download',
      });
    } catch (error) {
      console.error('Error sharing app:', error);
    }
  };

  if (loading) return null;

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <View style={styles.titleRow}>
          <Users size={20} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: '#FFF' }]}>
            Communal Power
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        {squad ? (
          <Animated.View entering={FadeInDown.duration(600)}>
            <TouchableOpacity 
              style={styles.squadCard}
              onPress={() => router.push('/squads')}
            >
              <LinearGradient
                colors={['#111', '#050505']}
                style={styles.squadCardInner}
              >
                <View style={styles.squadInfo}>
                  <View style={styles.squadIconBox}>
                    <ShieldCheck size={28} color={colors.primary} />
                  </View>
                  <View style={styles.squadTextInfo}>
                    <Text style={styles.squadLabel}>YOUR LEGION</Text>
                    <Text style={styles.squadName}>{squad.name}</Text>
                    <View style={styles.squadStats}>
                      <Zap size={12} color={colors.primary} fill={colors.primary} />
                      <Text style={styles.squadLevel}>Level {squad.level}</Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity 
                  style={[styles.manageBtn, { backgroundColor: colors.primary }]}
                  onPress={() => router.push('/squads')}
                >
                  <ArrowRight size={20} color="#FFF" />
                </TouchableOpacity>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.duration(600)}>
            <TouchableOpacity 
              style={styles.joinCard}
              onPress={() => router.push('/squads')}
            >
              <View style={styles.joinContent}>
                <View style={styles.joinIconBox}>
                  <Users size={24} color={colors.primary} />
                </View>
                <View style={styles.joinTextInfo}>
                  <Text style={styles.joinTitle}>Join the Movement</Text>
                  <Text style={styles.joinSubtitle}>Find your squad and dominate together.</Text>
                </View>
                <Plus size={24} color={colors.primary} />
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(200).duration(600)}>
          <TouchableOpacity style={styles.shareCard} onPress={handleShare}>
            <LinearGradient
              colors={[colors.primary, '#15808d']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.shareCardInner}
            >
              <View style={styles.shareContent}>
                <View style={styles.shareTextInfo}>
                  <Text style={styles.shareTitle}>Grow the Revolution</Text>
                  <Text style={styles.shareSubtitle}>Invite friends to Uthutho and earn bonus power points.</Text>
                </View>
                <View style={styles.shareButton}>
                  <Share2 size={20} color={colors.primary} />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  content: {
    gap: 12,
  },
  squadCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#222',
  },
  squadCardInner: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  squadInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  squadIconBox: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: 'rgba(30, 162, 177, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(30, 162, 177, 0.2)',
  },
  squadTextInfo: {
    gap: 2,
  },
  squadLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#888',
    letterSpacing: 1.5,
  },
  squadName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFF',
  },
  squadStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  squadLevel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#30a2b1',
  },
  manageBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  joinCard: {
    backgroundColor: '#111',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#222',
  },
  joinContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  joinIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#1A1D1E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  joinTextInfo: {
    flex: 1,
    gap: 2,
  },
  joinTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
  },
  joinSubtitle: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
  },
  shareCard: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  shareCardInner: {
    padding: 24,
  },
  shareContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shareTextInfo: {
    flex: 1,
    marginRight: 20,
    gap: 4,
  },
  shareTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -0.5,
  },
  shareSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    lineHeight: 20,
  },
  shareButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});

export default SquadsSection;
