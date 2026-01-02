import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  TextInput,
  RefreshControl
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { ChevronRight, Search, HelpCircle, Filter, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isDesktop = SCREEN_WIDTH >= 1024;

interface HelpTopic {
  id: string;
  title: string;
  description: string;
  category: string;
  order: number;
  screen: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Skeleton Loading Component
const HelpSkeleton = ({ isDesktop = false }) => {
  const skeletons = [1, 2, 3, 4, 5];

  return (
    <View style={[styles.skeletonContainer, isDesktop && styles.skeletonContainerDesktop]}>
      {/* Search Skeleton */}
      <View style={[styles.skeletonSearch, isDesktop && styles.skeletonSearchDesktop]} />
      
      {/* Categories Skeleton */}
      <View style={styles.skeletonCategories}>
        {[1, 2, 3].map((item) => (
          <View key={item} style={[styles.skeletonCategory, isDesktop && styles.skeletonCategoryDesktop]} />
        ))}
      </View>
      
      {/* Topics Skeleton */}
      <View style={styles.skeletonTopics}>
        {skeletons.map((item) => (
          <View key={item} style={[styles.skeletonTopicCard, isDesktop && styles.skeletonTopicCardDesktop]}>
            <View style={styles.skeletonTopicHeader}>
              <View style={[styles.skeletonCategoryTag, isDesktop && styles.skeletonCategoryTagDesktop]} />
            </View>
            <View style={styles.skeletonTopicContent}>
              <View style={[styles.skeletonTitle, isDesktop && styles.skeletonTitleDesktop]} />
              <View style={[styles.skeletonDescription, isDesktop && styles.skeletonDescriptionDesktop]} />
            </View>
            <View style={[styles.skeletonChevron, isDesktop && styles.skeletonChevronDesktop]} />
          </View>
        ))}
      </View>
    </View>
  );
};

export default function HelpScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [helpTopics, setHelpTopics] = useState<HelpTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTopics, setFilteredTopics] = useState<HelpTopic[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    fetchHelpTopics();
  }, []);

  useEffect(() => {
    filterTopics();
  }, [searchQuery, selectedCategory, helpTopics]);

  const fetchHelpTopics = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('help_topics')
        .select('*')
        .eq('is_active', true)
        .order('category')
        .order('order', { ascending: true });

      if (error) {
        console.error('Error fetching help topics:', error);
        Alert.alert('Error', 'Failed to load help topics. Please try again.');
        return;
      }

      if (data) {
        setHelpTopics(data);
        
        // Extract unique categories
        const uniqueCategories = ['all', ...Array.from(new Set(data.map(topic => topic.category)))];
        setCategories(uniqueCategories);
      }
    } catch (error) {
      console.error('Error fetching help topics:', error);
      Alert.alert('Error', 'Failed to load help topics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHelpTopics();
    setRefreshing(false);
  };

  const filterTopics = () => {
    let filtered = [...helpTopics];

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(topic => topic.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(topic => 
        topic.title.toLowerCase().includes(query) || 
        topic.description.toLowerCase().includes(query) ||
        topic.category.toLowerCase().includes(query)
      );
    }

    setFilteredTopics(filtered);
  };

  const handleTopicPress = (topic: HelpTopic) => {
    // Navigate to the dynamic route: app/help/[id].tsx
    router.push(`/help/${topic.id}`);
  };

  const handleCategoryPress = (category: string) => {
    setSelectedCategory(category);
    // Scroll to top when category changes
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: true });
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    if (showSearch && !isDesktop) {
      setShowSearch(false);
    }
  };

  const renderEmptyState = () => (
    <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
      <HelpCircle size={isDesktop ? 56 : 48} color={colors.text} opacity={0.5} />
      <Text style={[styles.emptyStateTitle, { color: colors.text }, isDesktop && styles.emptyStateTitleDesktop]}>
        No help topics found
      </Text>
      <Text style={[styles.emptyStateText, { color: colors.text }, isDesktop && styles.emptyStateTextDesktop]}>
        {searchQuery ? 'Try a different search term' : 'Check back later for help topics'}
      </Text>
    </View>
  );

  const scrollViewRef = React.useRef<ScrollView>(null);

  if (loading && !refreshing) {
    return <HelpSkeleton isDesktop={isDesktop} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, isDesktop && styles.headerDesktop]}>
        <View style={styles.headerTop}>
          <Text style={[styles.title, { color: colors.text }, isDesktop && styles.titleDesktop]}>
            Help Center
          </Text>
          {!isDesktop && (
            <TouchableOpacity
              style={styles.searchToggle}
              onPress={() => setShowSearch(!showSearch)}
            >
              <Search size={24} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
        <Text style={[styles.subtitle, { color: colors.text }, isDesktop && styles.subtitleDesktop]}>
          Find answers to common questions
        </Text>
      </View>

      {/* Search Bar - Always visible on desktop, toggleable on mobile */}
      {(isDesktop || showSearch) && (
        <View style={[styles.searchContainer, isDesktop && styles.searchContainerDesktop]}>
          <View style={[styles.searchInputWrapper, { backgroundColor: colors.card }]}>
            <Search size={isDesktop ? 18 : 20} color={colors.text} opacity={0.6} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search help topics..."
              placeholderTextColor={colors.text + '80'}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              autoFocus={!isDesktop && showSearch}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={handleClearSearch} style={styles.clearButton}>
                <X size={16} color={colors.text} opacity={0.6} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Main Content */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          isDesktop && styles.contentDesktop,
          !isDesktop && !showSearch && styles.contentMobile
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Category Filters */}
        {categories.length > 1 && (
          <View style={[styles.categoriesSection, isDesktop && styles.categoriesSectionDesktop]}>
            <View style={styles.categoriesHeader}>
              <Text style={[styles.categoriesTitle, { color: colors.text }]}>
                Categories
              </Text>
              <Filter size={isDesktop ? 16 : 18} color={colors.text} opacity={0.6} />
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.categoriesContainer}
              contentContainerStyle={[
                styles.categoriesContent,
                isDesktop && styles.categoriesContentDesktop
              ]}
            >
              {categories.map((category, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.categoryButton,
                    isDesktop && styles.categoryButtonDesktop,
                    { 
                      backgroundColor: selectedCategory === category 
                        ? colors.primary 
                        : colors.card,
                      borderColor: selectedCategory === category 
                        ? colors.primary 
                        : colors.border || '#333333'
                    }
                  ]}
                  onPress={() => handleCategoryPress(category)}
                >
                  <Text style={[
                    styles.categoryText,
                    isDesktop && styles.categoryTextDesktop,
                    { 
                      color: selectedCategory === category 
                        ? '#FFFFFF' 
                        : colors.text 
                    }
                  ]}>
                    {category === 'all' ? 'All Topics' : category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Results Header */}
        <View style={[styles.resultsHeader, isDesktop && styles.resultsHeaderDesktop]}>
          <Text style={[styles.resultsTitle, { color: colors.text }, isDesktop && styles.resultsTitleDesktop]}>
            Help Topics
          </Text>
          {filteredTopics.length > 0 && (
            <View style={styles.resultsBadge}>
              <Text style={[styles.resultsBadgeText, { color: colors.primary }]}>
                {filteredTopics.length}
              </Text>
            </View>
          )}
        </View>

        {/* Results Count */}
        {filteredTopics.length > 0 && (
          <Text style={[styles.resultsCount, { color: colors.text }, isDesktop && styles.resultsCountDesktop]}>
            {filteredTopics.length} {filteredTopics.length === 1 ? 'topic' : 'topics'} found
            {selectedCategory !== 'all' && ` in ${selectedCategory}`}
            {searchQuery && ` for "${searchQuery}"`}
          </Text>
        )}

        {/* Help Topics */}
        <View style={[
          styles.topics,
          isDesktop && styles.topicsDesktop
        ]}>
          {filteredTopics.length > 0 ? (
            filteredTopics.map((topic, index) => (
              <TouchableOpacity
                key={topic.id}
                style={[
                  styles.topicCard,
                  isDesktop && styles.topicCardDesktop,
                  { 
                    backgroundColor: colors.card,
                    borderColor: colors.border || '#333333'
                  }
                ]}
                onPress={() => handleTopicPress(topic)}
                activeOpacity={0.7}
              >
                <View style={styles.topicCardContent}>
                  <View style={styles.topicHeader}>
                    <View style={[
                      styles.topicCategory,
                      { backgroundColor: colors.primary + '15' }
                    ]}>
                      <Text style={[
                        styles.topicCategoryText,
                        { color: colors.primary }
                      ]}>
                        {topic.category}
                      </Text>
                    </View>
                    <View style={styles.topicOrder}>
                      <Text style={[styles.topicOrderText, { color: colors.text + '60' }]}>
                        #{topic.order}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.topicContent}>
                    <Text style={[
                      styles.topicTitle,
                      { color: colors.text },
                      isDesktop && styles.topicTitleDesktop
                    ]} numberOfLines={2}>
                      {topic.title}
                    </Text>
                    <Text
                      style={[
                        styles.topicDescription,
                        { color: colors.text + 'CC' },
                        isDesktop && styles.topicDescriptionDesktop
                      ]}
                      numberOfLines={3}
                    >
                      {topic.description}
                    </Text>
                  </View>
                  
                  <View style={styles.topicFooter}>
                    <View style={styles.topicMeta}>
                      <Text style={[styles.topicMetaText, { color: colors.text + '80' }]}>
                        Updated {new Date(topic.updated_at).toLocaleDateString()}
                      </Text>
                    </View>
                    <ChevronRight 
                      size={isDesktop ? 18 : 20} 
                      color={colors.primary} 
                      strokeWidth={2.5}
                    />
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : !loading ? (
            renderEmptyState()
          ) : null}
        </View>

        {/* Contact Support Footer */}
        {filteredTopics.length > 0 && (
          <View style={[styles.footer, isDesktop && styles.footerDesktop]}>
            <View style={[
              styles.footerCard, 
              { backgroundColor: colors.card },
              isDesktop && styles.footerCardDesktop
            ]}>
              <View style={styles.footerIcon}>
                <HelpCircle size={isDesktop ? 32 : 28} color={colors.primary} />
              </View>
              <View style={styles.footerContent}>
                <Text style={[
                  styles.footerTitle, 
                  { color: colors.text },
                  isDesktop && styles.footerTitleDesktop
                ]}>
                  Still need help?
                </Text>
                <Text style={[
                  styles.footerText, 
                  { color: colors.text + 'CC' },
                  isDesktop && styles.footerTextDesktop
                ]}>
                  Can't find what you're looking for? Our support team is here to help.
                </Text>
                <TouchableOpacity 
                  style={[
                    styles.contactButton, 
                    { backgroundColor: colors.primary },
                    isDesktop && styles.contactButtonDesktop
                  ]}
                  onPress={() => router.push('/help/contact-support')}
                >
                  <Text style={[
                    styles.contactButtonText,
                    isDesktop && styles.contactButtonTextDesktop
                  ]}>
                    Contact Support
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Header Styles
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#000000',
  },
  headerDesktop: {
    paddingTop: 40,
    paddingHorizontal: 32,
    paddingBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  titleDesktop: {
    fontSize: 36,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
    lineHeight: 22,
  },
  subtitleDesktop: {
    fontSize: 18,
    lineHeight: 24,
  },
  searchToggle: {
    padding: 8,
  },
  // Search Styles
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  searchContainerDesktop: {
    paddingHorizontal: 32,
    paddingBottom: 24,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
  },
  // Scroll View
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  contentDesktop: {
    paddingHorizontal: 32,
  },
  contentMobile: {
    paddingHorizontal: 20,
  },
  // Categories
  categoriesSection: {
    marginBottom: 24,
  },
  categoriesSectionDesktop: {
    marginBottom: 32,
  },
  categoriesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoriesTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  categoriesContainer: {
    marginHorizontal: -20,
  },
  categoriesContent: {
    paddingHorizontal: 20,
  },
  categoriesContentDesktop: {
    paddingHorizontal: 0,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  categoryButtonDesktop: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginRight: 12,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryTextDesktop: {
    fontSize: 15,
  },
  // Results Header
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  resultsHeaderDesktop: {
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  resultsTitleDesktop: {
    fontSize: 26,
  },
  resultsBadge: {
    backgroundColor: 'rgba(30, 162, 177, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  resultsBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  resultsCount: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 20,
  },
  resultsCountDesktop: {
    fontSize: 15,
    marginBottom: 24,
  },
  // Topics
  topics: {
    gap: 16,
  },
  topicsDesktop: {
    gap: 20,
  },
  topicCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  topicCardDesktop: {
    borderRadius: 20,
  },
  topicCardContent: {
    padding: 20,
  },
  topicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  topicCategory: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  topicCategoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  topicOrder: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  topicOrderText: {
    fontSize: 12,
    fontWeight: '500',
  },
  topicContent: {
    marginBottom: 20,
  },
  topicTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    lineHeight: 24,
  },
  topicTitleDesktop: {
    fontSize: 20,
    lineHeight: 26,
  },
  topicDescription: {
    fontSize: 15,
    lineHeight: 22,
    opacity: 0.8,
  },
  topicDescriptionDesktop: {
    fontSize: 16,
    lineHeight: 24,
  },
  topicFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topicMeta: {
    flex: 1,
  },
  topicMetaText: {
    fontSize: 13,
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
    borderRadius: 16,
    marginTop: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateTitleDesktop: {
    fontSize: 22,
    marginTop: 24,
  },
  emptyStateText: {
    fontSize: 15,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyStateTextDesktop: {
    fontSize: 17,
    lineHeight: 24,
  },
  // Footer
  footer: {
    marginTop: 40,
  },
  footerDesktop: {
    marginTop: 60,
  },
  footerCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  footerCardDesktop: {
    padding: 32,
    borderRadius: 20,
  },
  footerIcon: {
    marginBottom: 20,
  },
  footerContent: {
    alignItems: 'center',
  },
  footerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  footerTitleDesktop: {
    fontSize: 24,
    marginBottom: 12,
  },
  footerText: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  footerTextDesktop: {
    fontSize: 17,
    lineHeight: 24,
    marginBottom: 32,
  },
  contactButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  contactButtonDesktop: {
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 14,
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  contactButtonTextDesktop: {
    fontSize: 18,
  },
  // Skeleton Styles
  skeletonContainer: {
    flex: 1,
    backgroundColor: '#000000',
    padding: 20,
    paddingTop: 80,
  },
  skeletonContainerDesktop: {
    paddingHorizontal: 32,
    paddingTop: 40,
  },
  skeletonSearch: {
    height: 48,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 24,
  },
  skeletonSearchDesktop: {
    height: 52,
    borderRadius: 14,
  },
  skeletonCategories: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  skeletonCategory: {
    width: 100,
    height: 40,
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    marginRight: 8,
  },
  skeletonCategoryDesktop: {
    width: 120,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  skeletonTopics: {
    gap: 16,
  },
  skeletonTopicCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
  },
  skeletonTopicCardDesktop: {
    borderRadius: 20,
    padding: 24,
  },
  skeletonTopicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  skeletonCategoryTag: {
    width: 80,
    height: 28,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
  },
  skeletonCategoryTagDesktop: {
    width: 100,
    height: 32,
  },
  skeletonTopicContent: {
    marginBottom: 20,
  },
  skeletonTitle: {
    width: '70%',
    height: 22,
    backgroundColor: '#2a2a2a',
    borderRadius: 4,
    marginBottom: 12,
  },
  skeletonTitleDesktop: {
    height: 24,
  },
  skeletonDescription: {
    width: '90%',
    height: 16,
    backgroundColor: '#2a2a2a',
    borderRadius: 4,
  },
  skeletonDescriptionDesktop: {
    height: 18,
  },
  skeletonChevron: {
    width: 20,
    height: 20,
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
  },
  skeletonChevronDesktop: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
});