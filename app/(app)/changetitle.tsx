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
  Animated
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { 
  Check, Lock, Star, Crown, Award, Target, Zap, Trophy, Shield, 
  X, Info, Sparkles, Gem, TrendingUp
} from 'lucide-react-native';
import { useProfile } from '@/hook/useProfile';

const { width: screenWidth } = Dimensions.get('window');

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

  const getRarityConfig = (rarity) => {
    const configs = {
      common: { color: '#6B7280', icon: '⭐', name: 'Common', bgOpacity: 0.1 },
      uncommon: { color: '#10B981', icon: '🌿', name: 'Uncommon', bgOpacity: 0.15 },
      rare: { color: '#3B82F6', icon: '💎', name: 'Rare', bgOpacity: 0.2 },
      epic: { color: '#8B5CF6', icon: '⚡', name: 'Epic', bgOpacity: 0.25 },
      legendary: { color: '#F59E0B', icon: '👑', name: 'Legendary', bgOpacity: 0.3 },
      mythic: { color: '#EF4444', icon: '🔥', name: 'Mythic', bgOpacity: 0.35 }
    };
    return configs[rarity] || configs.common;
  };

  const getTitleIcon = (title: string) => {
    const iconProps = { size: 24, color: colors.primary };
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

  const showTitleDetails = (title) => {
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

  const SkeletonLoader = () => (
    <View style={styles.skeletonContainer}>
      <View style={[styles.skeletonHeader, { backgroundColor: colors.border }]} />
      <View style={[styles.skeletonSubheader, { backgroundColor: colors.border }]} />
      
      <View style={styles.grid}>
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <View key={item} style={[styles.skeletonCard, { backgroundColor: colors.card }]}>
            <View style={[styles.skeletonIcon, { backgroundColor: colors.border }]} />
            <View style={[styles.skeletonText, { backgroundColor: colors.border }]} />
            <View style={[styles.skeletonSubtext, { backgroundColor: colors.border }]} />
          </View>
        ))}
      </View>
    </View>
  );

  if (loading) {
    return (
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <SkeletonLoader />
      </ScrollView>
    );
  }

  const unlockedTitles = titles.filter((title) => profile?.titles?.includes(title.title));
  const lockedTitles = titles.filter((title) => !profile?.titles?.includes(title.title));

  const filteredTitles = activeTab === 'unlocked' 
    ? unlockedTitles 
    : activeTab === 'locked' 
    ? lockedTitles 
    : titles;

  const TitleCard = ({ title, isUnlocked, isSelected }) => {
    const rarityConfig = getRarityConfig(title.rarity);
    
    return (
      <TouchableOpacity
        style={[
          styles.titleCard,
          { 
            backgroundColor: colors.card,
            borderColor: isSelected ? colors.primary : rarityConfig.color,
            opacity: isUnlocked ? 1 : 0.6,
          }
        ]}
        onPress={() => {
          if (isUnlocked) {
            showTitleDetails(title);
          }
        }}
        onLongPress={() => {
          if (isUnlocked) {
            setSelectedTitle(title.title);
            handleSelectTitle(title.title);
          }
        }}
        disabled={!isUnlocked}
      >
        {/* Rarity Badge */}
        <View style={[styles.rarityBadge, { backgroundColor: rarityConfig.color }]}>
          <Text style={styles.rarityText}>{rarityConfig.icon}</Text>
        </View>

        {/* Status Badge */}
        <View style={[styles.statusBadge, { 
          backgroundColor: isSelected 
            ? colors.primary 
            : isUnlocked 
            ? `${colors.primary}20` 
            : colors.border 
        }]}>
          {isSelected ? (
            <Check size={12} color="#fff" />
          ) : isUnlocked ? (
            <Text style={[styles.statusText, { color: colors.primary }]}>✓</Text>
          ) : (
            <Lock size={12} color={colors.text} />
          )}
        </View>

        {/* Title Icon */}
        <View style={[
          styles.iconContainer,
          { 
            backgroundColor: isUnlocked 
              ? `${rarityConfig.color}${Math.round(rarityConfig.bgOpacity * 255).toString(16).padStart(2, '0')}`
              : colors.border,
            borderColor: rarityConfig.color
          }
        ]}>
          {getTitleIcon(title.title)}
        </View>

        {/* Title Info */}
        <View style={styles.titleInfo}>
          <Text 
            style={[
              styles.titleName, 
              { 
                color: colors.text,
                textAlign: 'center'
              }
            ]}
            numberOfLines={2}
          >
            {title.title}
          </Text>
          
          <View style={[styles.rarityContainer, { backgroundColor: `${rarityConfig.color}20` }]}>
            <Text style={[styles.rarityName, { color: rarityConfig.color }]}>
              {rarityConfig.name}
            </Text>
          </View>

          <View style={styles.pointsContainer}>
            <TrendingUp size={12} color={colors.text} />
            <Text style={[styles.pointsText, { color: colors.text }]}>
              {title.points_required} pts
            </Text>
          </View>
        </View>

        {/* Progress Bar for Locked Titles */}
        {!isUnlocked && (
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
              <View 
                style={[
                  styles.progressFill,
                  { 
                    width: `${Math.min((profile?.points || 0) / title.points_required * 100, 100)}%`,
                    backgroundColor: rarityConfig.color
                  }
                ]} 
              />
            </View>
            <Text style={[styles.progressText, { color: colors.text }]}>
              {Math.round((profile?.points || 0) / title.points_required * 100)}%
            </Text>
          </View>
        )}

        {/* Locked Overlay */}
        {!isUnlocked && (
          <View style={[styles.lockedOverlay, { backgroundColor: `${colors.background}99` }]}>
            <Lock size={24} color={colors.text} />
            <Text style={[styles.lockedText, { color: colors.text }]}>
              Locked
            </Text>
          </View>
        )}

        {/* Info Button */}
        <TouchableOpacity 
          style={styles.infoButton}
          onPress={() => showTitleDetails(title)}
        >
          <Info size={14} color={colors.text} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const TitleDetailModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={hideTitleDetails}
    >
      <View style={styles.modalOverlay}>
        <Animated.View 
          style={[
            styles.modalContent,
            { backgroundColor: colors.card },
            { opacity: fadeAnim }
          ]}
        >
          {selectedTitleDetail && (
            <>
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleSection}>
                  <View style={[
                    styles.modalIcon,
                    { backgroundColor: `${getRarityConfig(selectedTitleDetail.rarity).color}20` }
                  ]}>
                    {getTitleIcon(selectedTitleDetail.title)}
                  </View>
                  <View>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>
                      {selectedTitleDetail.title}
                    </Text>
                    <View style={[
                      styles.modalRarity,
                      { backgroundColor: `${getRarityConfig(selectedTitleDetail.rarity).color}20` }
                    ]}>
                      <Text style={[
                        styles.modalRarityText,
                        { color: getRarityConfig(selectedTitleDetail.rarity).color }
                      ]}>
                        {getRarityConfig(selectedTitleDetail.rarity).icon} {getRarityConfig(selectedTitleDetail.rarity).name}
                      </Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity onPress={hideTitleDetails} style={styles.closeButton}>
                  <X size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <View style={styles.descriptionSection}>
                  <Text style={[styles.sectionLabel, { color: colors.text }]}>Description</Text>
                  <Text style={[styles.descriptionText, { color: colors.text }]}>
                    {selectedTitleDetail.description}
                  </Text>
                </View>

                <View style={styles.backstorySection}>
                  <Text style={[styles.sectionLabel, { color: colors.text }]}>Backstory</Text>
                  <Text style={[styles.backstoryText, { color: colors.text }]}>
                    {selectedTitleDetail.backstory}
                  </Text>
                </View>

                <View style={styles.requirementsSection}>
                  <Text style={[styles.sectionLabel, { color: colors.text }]}>Requirements</Text>
                  <View style={styles.requirementsRow}>
                    <TrendingUp size={16} color={colors.text} />
                    <Text style={[styles.requirementsText, { color: colors.text }]}>
                      {selectedTitleDetail.points_required} points required
                    </Text>
                  </View>
                  <View style={styles.progressRow}>
                    <Text style={[styles.progressLabel, { color: colors.text }]}>
                      Your progress: {profile?.points || 0} / {selectedTitleDetail.points_required}
                    </Text>
                    <View style={[styles.modalProgressBar, { backgroundColor: colors.border }]}>
                      <View 
                        style={[
                          styles.modalProgressFill,
                          { 
                            width: `${Math.min((profile?.points || 0) / selectedTitleDetail.points_required * 100, 100)}%`,
                            backgroundColor: getRarityConfig(selectedTitleDetail.rarity).color
                          }
                        ]} 
                      />
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.modalFooter}>
                {profile?.titles?.includes(selectedTitleDetail.title) ? (
                  <TouchableOpacity
                    style={[
                      styles.selectButton,
                      { 
                        backgroundColor: selectedTitle === selectedTitleDetail.title ? colors.primary : `${colors.primary}20`
                      }
                    ]}
                    onPress={() => {
                      setSelectedTitle(selectedTitleDetail.title);
                      handleSelectTitle(selectedTitleDetail.title);
                      hideTitleDetails();
                    }}
                  >
                    {selectedTitle === selectedTitleDetail.title ? (
                      <>
                        <Check size={16} color="#fff" />
                        <Text style={styles.selectButtonTextActive}>Selected</Text>
                      </>
                    ) : (
                      <Text style={[styles.selectButtonText, { color: colors.primary }]}>
                        Select Title
                      </Text>
                    )}
                  </TouchableOpacity>
                ) : (
                  <View style={[styles.lockedButton, { backgroundColor: colors.border }]}>
                    <Lock size={16} color={colors.text} />
                    <Text style={[styles.lockedButtonText, { color: colors.text }]}>
                      Locked - Need {selectedTitleDetail.points_required - (profile?.points || 0)} more points
                    </Text>
                  </View>
                )}
              </View>
            </>
          )}
        </Animated.View>
      </View>
    </Modal>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Achievements</Text>
        <Text style={[styles.subtitle, { color: colors.text }]}>
          Collect titles and show off your progress
        </Text>
        
        {/* Stats Bar */}
        <View style={[styles.statsBar, { backgroundColor: colors.card }]}>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {unlockedTitles.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text }]}>Unlocked</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {lockedTitles.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text }]}>Locked</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {profile?.points || 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text }]}>Points</Text>
          </View>
        </View>

        {/* Current Title */}
        {selectedTitle && (
          <View style={[styles.currentContainer, { backgroundColor: colors.primary }]}>
            <Text style={[styles.currentLabel, { color: '#fff' }]}>ACTIVE TITLE</Text>
            <View style={styles.currentTitle}>
              {getTitleIcon(selectedTitle)}
              <Text style={[styles.currentTitleText, { color: '#fff' }]}>
                {selectedTitle}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: colors.card }]}>
        {['all', 'unlocked', 'locked'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && [styles.activeTab, { backgroundColor: colors.primary }]
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === tab ? '#fff' : colors.text }
            ]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Titles Grid */}
      <FlatList
        data={filteredTitles}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TitleCard
            title={item}
            isUnlocked={profile?.titles?.includes(item.title)}
            isSelected={selectedTitle === item.title}
          />
        )}
      />

      {/* Title Detail Modal */}
      <TitleDetailModal />
    </View>
  );
};

const CARD_MARGIN = 8;
const CARD_WIDTH = (screenWidth - 40 - CARD_MARGIN) / 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skeletonContainer: {
    padding: 20,
  },
  skeletonHeader: {
    height: 32,
    borderRadius: 8,
    marginBottom: 8,
  },
  skeletonSubheader: {
    height: 16,
    borderRadius: 8,
    marginBottom: 24,
    width: '60%',
  },
  grid: {
    padding: 12,
  },
  skeletonCard: {
    width: CARD_WIDTH,
    margin: CARD_MARGIN,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  skeletonIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 12,
  },
  skeletonText: {
    height: 16,
    borderRadius: 4,
    marginBottom: 8,
    width: '80%',
  },
  skeletonSubtext: {
    height: 12,
    borderRadius: 4,
    width: '60%',
  },
  header: {
    padding: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 16,
    textAlign: 'center',
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  currentContainer: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  currentLabel: {
    fontSize: 10,
    fontWeight: '600',
    opacity: 0.9,
    marginBottom: 8,
    letterSpacing: 1,
  },
  currentTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currentTitleText: {
    fontSize: 16,
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  titleCard: {
    width: CARD_WIDTH,
    margin: CARD_MARGIN,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rarityBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rarityText: {
    fontSize: 10,
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
  },
  titleInfo: {
    alignItems: 'center',
    flex: 1,
    width: '100%',
  },
  titleName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    flexShrink: 1,
  },
  rarityContainer: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 6,
  },
  rarityName: {
    fontSize: 10,
    fontWeight: '700',
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pointsText: {
    fontSize: 10,
    fontWeight: '600',
    opacity: 0.8,
  },
  progressContainer: {
    width: '100%',
    marginTop: 12,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    opacity: 0.7,
    textAlign: 'center',
  },
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockedText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  infoButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    padding: 4,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    borderRadius: 20,
    padding: 0,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalRarity: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  modalRarityText: {
    fontSize: 12,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  descriptionSection: {
    marginBottom: 20,
  },
  backstorySection: {
    marginBottom: 20,
  },
  requirementsSection: {
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    opacity: 0.8,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 22,
  },
  backstoryText: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
    opacity: 0.9,
  },
  requirementsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  requirementsText: {
    fontSize: 14,
  },
  progressRow: {
    marginTop: 8,
  },
  progressLabel: {
    fontSize: 12,
    marginBottom: 4,
    opacity: 0.8,
  },
  modalProgressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  modalProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
  },
  selectButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  selectButtonText: {
    fontWeight: '600',
    fontSize: 16,
  },
  lockedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
  },
  lockedButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
});

export default TitleChangeScreen;