import React from 'react';
import { View, ScrollView, Dimensions, StyleSheet } from 'react-native';
import Shimmer from './Shimmer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isDesktop = SCREEN_WIDTH >= 1024;

interface NearestLocationsSkeletonProps {
  colors: any;
  compact?: boolean;
}

const NearestLocationsSkeleton = ({ colors, compact = false }: NearestLocationsSkeletonProps) => {
  // Desktop layout - grid view
  if (isDesktop && !compact) {
    return (
      <View style={styles.desktopContainer}>
        <View style={styles.desktopGrid}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.desktopCardContainer}>
              <Shimmer colors={colors}>
                <View style={[styles.desktopCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.desktopContentOverlay}>
                    <View style={styles.desktopLeftContent}>
                      <View style={[styles.skeletonPinDesktop, { backgroundColor: colors.text }]} />
                      <View style={styles.desktopTextContainer}>
                        <View style={[styles.skeletonTitleDesktop, { backgroundColor: colors.text }]} />
                        <View style={[styles.skeletonSubtitleDesktop, { backgroundColor: colors.text }]} />
                      </View>
                    </View>
                    <View style={styles.desktopRightContent}>
                      <View style={[styles.skeletonButtonDesktop, { backgroundColor: colors.text }]} />
                    </View>
                  </View>
                </View>
              </Shimmer>
            </View>
          ))}
        </View>
      </View>
    );
  }

  // Compact desktop layout (sidebar view)
  if (isDesktop && compact) {
    return (
      <View style={styles.compactDesktopContainer}>
        {[1, 2].map((i) => (
          <View key={i} style={styles.compactDesktopCard}>
            <Shimmer colors={colors}>
              <View style={[styles.compactDesktopCardInner, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.compactDesktopRow}>
                  <View style={[styles.skeletonPinCompact, { backgroundColor: colors.text }]} />
                  <View style={styles.compactDesktopTextContainer}>
                    <View style={[styles.skeletonTitleCompact, { backgroundColor: colors.text }]} />
                    <View style={[styles.skeletonSubtitleCompact, { backgroundColor: colors.text }]} />
                  </View>
                  <View style={[styles.skeletonButtonCompact, { backgroundColor: colors.text }]} />
                </View>
              </View>
            </Shimmer>
          </View>
        ))}
      </View>
    );
  }

  // Mobile layout - horizontal scroll
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.carouselContainer}
    >
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.cardContainer}>
          <Shimmer colors={colors}>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.contentOverlay}>
                <View style={styles.leftContent}>
                  <View style={[styles.skeletonPin, { backgroundColor: colors.text }]} />

                  <View style={styles.textContainer}>
                    <View style={[styles.skeletonTitle, { backgroundColor: colors.text }]} />
                    <View style={[styles.skeletonSubtitle, { backgroundColor: colors.text }]} />
                  </View>
                </View>

                <View style={styles.rightContent}>
                  <View style={[styles.skeletonButton, { backgroundColor: colors.text }]} />
                </View>
              </View>
            </View>
          </Shimmer>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  // Mobile styles
  carouselContainer: {
    gap: 12,
    paddingRight: 16,
  },
  cardContainer: {
    width: 280,
    borderRadius: 12,
    overflow: 'hidden',
  },
  card: {
    width: '100%',
    minHeight: 140,
    borderRadius: 16,
    borderWidth: 1,
  },
  contentOverlay: {
    flex: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftContent: {
    flex: 1,
    justifyContent: 'space-between',
    height: '100%',
    paddingRight: 12,
  },
  rightContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  skeletonPin: {
    width: 22,
    height: 22,
    borderRadius: 11,
    opacity: 0.2,
    marginBottom: 8,
  },
  skeletonButton: {
    width: 70,
    height: 80,
    borderRadius: 14,
    opacity: 0.2,
  },
  textContainer: {
    marginTop: 'auto',
  },
  skeletonTitle: {
    width: '90%',
    height: 20,
    borderRadius: 4,
    marginBottom: 8,
    opacity: 0.2,
  },
  skeletonSubtitle: {
    width: '50%',
    height: 14,
    borderRadius: 4,
    opacity: 0.2,
  },

  // Desktop grid styles
  desktopContainer: {
    marginTop: 8,
  },
  desktopGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  desktopCardContainer: {
    width: 'calc(33.333% - 11px)',
    minWidth: 240,
    flex: 1,
  },
  desktopCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    minHeight: 160,
  },
  desktopContentOverlay: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  desktopLeftContent: {
    flex: 1,
    gap: 12,
  },
  desktopRightContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  skeletonPinDesktop: {
    width: 28,
    height: 28,
    borderRadius: 14,
    opacity: 0.2,
  },
  skeletonButtonDesktop: {
    width: 80,
    height: 90,
    borderRadius: 16,
    opacity: 0.2,
  },
  desktopTextContainer: {
    gap: 8,
  },
  skeletonTitleDesktop: {
    width: '85%',
    height: 22,
    borderRadius: 4,
    opacity: 0.2,
  },
  skeletonSubtitleDesktop: {
    width: '60%',
    height: 16,
    borderRadius: 4,
    opacity: 0.2,
  },

  // Compact desktop styles (sidebar)
  compactDesktopContainer: {
    gap: 12,
  },
  compactDesktopCard: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  compactDesktopCardInner: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  compactDesktopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  skeletonPinCompact: {
    width: 20,
    height: 20,
    borderRadius: 10,
    opacity: 0.2,
  },
  skeletonButtonCompact: {
    width: 50,
    height: 60,
    borderRadius: 10,
    opacity: 0.2,
  },
  compactDesktopTextContainer: {
    flex: 1,
    gap: 6,
  },
  skeletonTitleCompact: {
    width: '80%',
    height: 16,
    borderRadius: 4,
    opacity: 0.2,
  },
  skeletonSubtitleCompact: {
    width: '50%',
    height: 12,
    borderRadius: 4,
    opacity: 0.2,
  },
});

export default NearestLocationsSkeleton;