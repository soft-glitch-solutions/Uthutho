import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  FlatList,
  Dimensions,
  Modal,
  Animated,
  Platform,
  ActivityIndicator
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { 
  Check, Lock, Star, Crown, Award, Target, Zap, Trophy, Shield, 
  X, Info, Sparkles, Gem, TrendingUp, MapPin, ChevronLeft
} from 'lucide-react-native';
import { useProfile } from '@/hook/useProfile';
import { router } from 'expo-router';

const { width: screenWidth } = Dimensions.get('window');
const CARD_MARGIN = 8;
const CARD_WIDTH = (screenWidth - 48 - CARD_MARGIN) / 2;

const TitleChangeScreen = () => {
  const { colors } = useTheme();
  const { loading, profile, titles, handleSelectTitle } = useProfile();
  const [selectedTitle, setSelectedTitle] = useState(profile?.selected_title || '');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedTitleDetail, setSelectedTitleDetail] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (profile?.selected_title) {
      setSelectedTitle(profile.selected_title);
    }
  }, [profile]);

  const getRarityConfig = (rarity: string) => {
    const configs: any = {
      common: { color: '#6B7280', icon: '⭐', name: 'Common' },
      uncommon: { color: '#10B981', icon: '🌿', name: 'Uncommon' },
      rare: { color: '#3B82F6', icon: '💎', name: 'Rare' },
      epic: { color: '#8B5CF6', icon: '⚡', name: 'Epic' },
      legendary: { color: '#F59E0B', icon: '👑', name: 'Legendary' },
      mythic: { color: '#EF4444', icon: '🔥', name: 'Mythic' }
    };
    return configs[rarity.toLowerCase()] || configs.common;
  };

  const getTitleIcon = (title: string) => {
    const iconProps = { size: 24, color: '#1ea2b1' };
    if (title.includes('Master') || title.includes('Legend') || title.includes('King') || title.includes('Queen')) 
      return <Crown {...iconProps} />;
    if (title.includes('Expert') || title.includes('Champion') || title.includes('Pro')) 
      return <Trophy {...iconProps} />;
    if (title.includes('Star') || title.includes('Boss') || title.includes('Guru')) 
      return <Star {...iconProps} />;
    if (title.includes('Saver') || title.includes('Guard')) 
      return <Shield {...iconProps} />;
    if (title.includes('Explorer') || title.includes('Scout') || title.includes('Navigator')) 
      return <Zap {...iconProps} />;
    return <Award {...iconProps} />;
  };

  const showTitleDetails = (title: any) => {
    setSelectedTitleDetail(title);
    setModalVisible(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const hideTitleDetails = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
      setSelectedTitleDetail(null);
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1ea2b1" />
      </View>
    );
  }

  const unlockedTitles = titles.filter((title: any) => profile?.titles?.includes(title.title));
  const lockedTitles = titles.filter((title: any) => !profile?.titles?.includes(title.title));

  const filteredTitles = activeTab === 'unlocked' 
    ? unlockedTitles 
    : activeTab === 'locked' 
    ? lockedTitles 
    : titles;

  const TitleCard = ({ title, isUnlocked, isSelected }: { title: any, isUnlocked: boolean, isSelected: boolean }) => {
    const rarityConfig = getRarityConfig(title.rarity);
    
    return (
      <TouchableOpacity
        style={[
          styles.titleCard,
          { 
            borderColor: isSelected ? '#1ea2b1' : '#222',
            opacity: isUnlocked ? 1 : 0.7,
          }
        ]}
        onPress={() => isUnlocked ? showTitleDetails(title) : null}
        onLongPress={() => {
          if (isUnlocked) {
            setSelectedTitle(title.title);
            handleSelectTitle(title.title);
          }
        }}
        disabled={!isUnlocked}
      >
        {/* Selection / Lock Badge */}
        <View style={styles.cardStatusBadge}>
          {isSelected ? (
            <View style={styles.selectedBadge}>
              <Check size={10} color="#FFF" />
            </View>
          ) : !isUnlocked ? (
            <Lock size={12} color="#444" />
          ) : null}
        </View>

        {/* Title Icon */}
        <View style={[
          styles.iconCircle,
          { 
            backgroundColor: isUnlocked ? 'rgba(30, 162, 177, 0.1)' : 'rgba(255, 255, 255, 0.05)',
          }
        ]}>
          {getTitleIcon(title.title)}
        </View>

        {/* Title Info */}
        <Text style={styles.cardTitleName} numberOfLines={1}>
          {title.title}
        </Text>
        
        <View style={[styles.rarityPill, { backgroundColor: `${rarityConfig.color}15` }]}>
          <Text style={[styles.rarityLabel, { color: rarityConfig.color }]}>
            {rarityConfig.name}
          </Text>
        </View>

        {!isUnlocked && (
          <View style={styles.cardProgressContainer}>
            <View style={styles.cardProgressBar}>
              <View 
                style={[
                  styles.cardProgressFill,
                  { width: `${Math.min((profile?.points || 0) / title.points_required * 100, 100)}%` }
                ]} 
              />
            </View>
            <Text style={styles.cardProgressText}>
              {title.points_required} pts
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header Navigation */}
        <View style={styles.navHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.brandText}>Uthutho</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.readyText}>TITLES & RANKS</Text>
          <Text style={styles.greetingText}>Uthutho Awards</Text>
          <Text style={styles.headingText}>Achievements</Text>
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statPill}>
            <Star size={14} color="#fbbf24" fill="#fbbf24" />
            <Text style={styles.statValue}>{unlockedTitles.length}</Text>
            <Text style={styles.statLabel}>Unlocked</Text>
          </View>
          <View style={styles.statPill}>
            <TrendingUp size={14} color="#1ea2b1" />
            <Text style={styles.statValue}>{profile?.points || 0}</Text>
            <Text style={styles.statLabel}>Total Points</Text>
          </View>
        </View>

        {/* Active Title Highlight */}
        {selectedTitle && (
          <View style={styles.activeTitleContainer}>
            <Text style={styles.activeTitleLabel}>CURRENTLY EQUIPPED</Text>
            <View style={styles.activeTitleCard}>
              <Crown size={20} color="#fbbf24" />
              <Text style={styles.activeTitleText}>{selectedTitle}</Text>
              <Sparkles size={16} color="#fbbf24" />
            </View>
          </View>
        )}

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'all' && styles.activeTab]}
            onPress={() => setActiveTab('all')}
          >
            <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'unlocked' && styles.activeTab]}
            onPress={() => setActiveTab('unlocked')}
          >
            <Text style={[styles.tabText, activeTab === 'unlocked' && styles.activeTabText]}>Unlocked</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'locked' && styles.activeTab]}
            onPress={() => setActiveTab('locked')}
          >
            <Text style={[styles.tabText, activeTab === 'locked' && styles.activeTabText]}>Locked</Text>
          </TouchableOpacity>
        </View>

        {/* Grid View */}
        <View style={styles.gridContainer}>
          {filteredTitles.map((item: any) => (
            <TitleCard 
              key={item.id} 
              title={item} 
              isUnlocked={profile?.titles?.includes(item.title)}
              isSelected={selectedTitle === item.title}
            />
          ))}
        </View>

        <View style={styles.footerSpace} />
      </ScrollView>

      {/* Detail Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalContent, { opacity: fadeAnim }]}>
            {selectedTitleDetail && (
              <View style={styles.modalInner}>
                <TouchableOpacity onPress={hideTitleDetails} style={styles.modalClose}>
                  <X size={20} color="#666" />
                </TouchableOpacity>

                <View style={styles.modalHeaderInfo}>
                  <View style={styles.modalIconBox}>
                    {getTitleIcon(selectedTitleDetail.title)}
                  </View>
                  <Text style={styles.modalTitleText}>{selectedTitleDetail.title}</Text>
                  <View style={[styles.modalRarityBadge, { backgroundColor: `${getRarityConfig(selectedTitleDetail.rarity).color}15` }]}>
                    <Text style={[styles.modalRarityText, { color: getRarityConfig(selectedTitleDetail.rarity).color }]}>
                      {getRarityConfig(selectedTitleDetail.rarity).name} Rank
                    </Text>
                  </View>
                </View>

                <View style={styles.modalDivider} />

                <Text style={styles.modalSectionLabel}>ABOUT THIS TITLE</Text>
                <Text style={styles.modalDescription}>{selectedTitleDetail.description || 'No description available.'}</Text>

                {selectedTitleDetail.backstory && (
                  <>
                    <Text style={[styles.modalSectionLabel, { marginTop: 16 }]}>BACKSTORY</Text>
                    <Text style={styles.modalBackstory}>{selectedTitleDetail.backstory}</Text>
                  </>
                )}

                <TouchableOpacity
                  style={[
                    styles.equipButton,
                    { backgroundColor: selectedTitle === selectedTitleDetail.title ? 'rgba(30, 162, 177, 0.2)' : '#1ea2b1' }
                  ]}
                  onPress={() => {
                    setSelectedTitle(selectedTitleDetail.title);
                    handleSelectTitle(selectedTitleDetail.title);
                    hideTitleDetails();
                  }}
                  disabled={selectedTitle === selectedTitleDetail.title}
                >
                  <Text style={[styles.equipButtonText, { color: selectedTitle === selectedTitleDetail.title ? '#1ea2b1' : '#FFF' }]}>
                    {selectedTitle === selectedTitleDetail.title ? 'CURRENTLY EQUIPPED' : 'EQUIP TITLE'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    marginBottom: 24,
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
  heroSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  readyText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#1ea2b1',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  greetingText: {
    fontSize: 32,
    fontWeight: '400',
    color: '#FFFFFF',
    marginBottom: 2,
    letterSpacing: -1,
  },
  headingText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1ea2b1',
    fontStyle: 'italic',
    letterSpacing: -1,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  statPill: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#222',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
  },
  activeTitleContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  activeTitleLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#444',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  activeTitleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.05)',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.2)',
    gap: 12,
  },
  activeTitleText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fbbf24',
    fontStyle: 'italic',
    flex: 1,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 12,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeTab: {
    backgroundColor: 'rgba(30, 162, 177, 0.1)',
    borderColor: '#1ea2b1',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#888',
  },
  activeTabText: {
    color: '#1ea2b1',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 0,
  },
  titleCard: {
    width: CARD_WIDTH,
    marginHorizontal: CARD_MARGIN,
    marginBottom: 16,
    padding: 20,
    backgroundColor: '#111',
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
  },
  cardStatusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  selectedBadge: {
    backgroundColor: '#1ea2b1',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardTitleName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 6,
    textAlign: 'center',
  },
  rarityPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 12,
  },
  rarityLabel: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  cardProgressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  cardProgressBar: {
    width: '80%',
    height: 3,
    backgroundColor: '#222',
    borderRadius: 1.5,
    marginBottom: 6,
    overflow: 'hidden',
  },
  cardProgressFill: {
    height: '100%',
    backgroundColor: '#1ea2b1',
  },
  cardProgressText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#444',
  },
  footerSpace: {
    height: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#111',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#222',
    overflow: 'hidden',
  },
  modalInner: {
    padding: 32,
  },
  modalClose: {
    position: 'absolute',
    top: 24,
    right: 24,
    zIndex: 10,
  },
  modalHeaderInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalIconBox: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(30, 162, 177, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitleText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  modalRarityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  modalRarityText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#222',
    width: '100%',
    marginBottom: 24,
  },
  modalSectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#444',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 15,
    color: '#BBB',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalBackstory: {
    fontSize: 14,
    color: '#888',
    lineHeight: 20,
    fontStyle: 'italic',
    marginBottom: 32,
  },
  equipButton: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  equipButtonText: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
});

export default TitleChangeScreen;