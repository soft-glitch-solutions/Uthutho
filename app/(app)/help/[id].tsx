import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  Alert,
  Dimensions,
  TouchableOpacity,
  Share
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Share2, Calendar, Tag, Bookmark, BookmarkCheck } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isDesktop = SCREEN_WIDTH >= 1024;

interface HelpTopicDetail {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Skeleton Loading Component
const SkeletonLoader = ({ isDesktop: propIsDesktop = false }) => {
  const { colors } = useTheme();
  const desktopMode = isDesktop || propIsDesktop;
  
  if (desktopMode) {
    return (
      <View style={[styles.container, styles.containerDesktop, { backgroundColor: colors.background }]}>
        {/* Header Skeleton */}
        <View style={[styles.header, styles.headerDesktop]}>
          <View style={[styles.backButton, styles.backButtonDesktop, styles.skeleton]} />
          <View style={[styles.headerRight, styles.skeleton]} />
        </View>
        
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[styles.content, styles.contentDesktop]}
          showsVerticalScrollIndicator={false}
        >
          {/* Title Section Skeleton */}
          <View style={styles.titleSection}>
            <View style={styles.categoryContainer}>
              <View style={[styles.categoryBadge, styles.skeleton, { height: 32 }]} />
              <View style={[styles.skeleton, { width: 80, height: 20 }]} />
            </View>
            
            <View style={[styles.skeleton, { height: 36, width: '80%', marginBottom: 12 }]} />
            <View style={[styles.skeleton, { height: 24, width: '100%', marginBottom: 8 }]} />
            <View style={[styles.skeleton, { height: 24, width: '90%' }]} />
          </View>

          {/* Tags Skeleton */}
          <View style={styles.tagsSection}>
            <View style={[styles.skeleton, { height: 20, width: 120, marginBottom: 8 }]} />
            <View style={styles.tagsContainer}>
              {[1, 2, 3].map((item) => (
                <View key={item} style={[styles.tag, styles.skeleton, { height: 32 }]} />
              ))}
            </View>
          </View>

          {/* Content Skeleton */}
          <View style={[styles.contentSection, styles.skeleton, { height: 300 }]} />

          {/* Last Updated Skeleton */}
          <View style={[styles.updatedSection, styles.skeleton, { height: 48 }]} />

          {/* Related Topics Skeleton */}
          <View style={styles.relatedSection}>
            <View style={[styles.skeleton, { height: 24, width: 150, marginBottom: 16 }]} />
            <View style={[styles.relatedButton, styles.skeleton, { height: 56 }]} />
          </View>
        </ScrollView>
      </View>
    );
  }

  // Mobile skeleton
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Skeleton */}
      <View style={styles.header}>
        <View style={[styles.backButton, styles.skeleton]} />
        <View style={[styles.headerRight, styles.skeleton]} />
      </View>
      
      <View style={styles.skeletonContainer}>
        <View style={[styles.skeletonContent, styles.skeleton]} />
        <View style={[styles.skeletonContent, styles.skeleton]} />
        <View style={[styles.skeletonContent, styles.skeleton]} />
      </View>
    </View>
  );
};

export default function HelpDetailScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const topicId = id as string;
  
  const [topic, setTopic] = useState<HelpTopicDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    if (topicId) {
      fetchTopicDetail();
    }
  }, [topicId]);

  const fetchTopicDetail = async () => {
    try {
      const { data, error } = await supabase
        .from('help_topics')
        .select('*')
        .eq('id', topicId)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      
      // Parse tags if they're stored as JSON string
      const parsedTopic = {
        ...data,
        tags: data.tags ? (Array.isArray(data.tags) ? data.tags : JSON.parse(data.tags)) : []
      };
      
      setTopic(parsedTopic);
    } catch (error) {
      console.error('Error fetching topic detail:', error);
      Alert.alert('Error', 'Failed to load help topic. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleBookmark = async () => {
    setBookmarked(!bookmarked);
  };

  const handleShare = async () => {
    if (!topic) return;
    
    try {
      const shareUrl = `https://uthutho.app/help/${topic.id}`;
      const shareMessage = `Check out this help topic from Uthutho: ${topic.title}\n\n${shareUrl}`;
      
      await Share.share({
        message: shareMessage,
        title: topic.title,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Render loading skeleton
  if (loading) {
    return <SkeletonLoader isDesktop={isDesktop} />;
  }

  if (!topic) {
    return (
      <View style={[styles.container, styles.notFoundContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFoundText, styles.notFoundTextDesktop, { color: colors.text }]}>
          Help topic not found
        </Text>
        <TouchableOpacity 
          style={[styles.backButtonFull, styles.backButtonFullDesktop, { backgroundColor: colors.primary }]}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Back to Help Center</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isDesktop) {
    return (
      <ScrollView style={[styles.container, styles.containerDesktop, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, styles.headerDesktop]}>
          <TouchableOpacity 
            style={[styles.backButton, styles.backButtonDesktop]} 
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#ffffff" />
          </TouchableOpacity>
          
          <View style={styles.headerActionsDesktop}>
            <TouchableOpacity 
              style={[styles.favoriteButton, styles.favoriteButtonDesktop]} 
              onPress={toggleBookmark}
            >
              {bookmarked ? (
                <BookmarkCheck size={24} color="#1ea2b1" fill="#1ea2b1" />
              ) : (
                <Bookmark size={24} color="#ffffff" />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.favoriteButton, styles.favoriteButtonDesktop]} 
              onPress={handleShare}
            >
              <Share2 size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.desktopWrapper}>
          <View style={styles.contentDesktop}>
            {/* Title and Category */}
            <View style={[styles.titleSection, styles.titleSectionDesktop]}>
              <View style={[styles.categoryContainer, styles.categoryContainerDesktop]}>
                <View style={[
                  styles.categoryBadge, 
                  styles.categoryBadgeDesktop,
                  { backgroundColor: colors.primary + '15' }
                ]}>
                  <Tag size={14} color={colors.primary} />
                  <Text style={[styles.categoryText, styles.categoryTextDesktop, { color: colors.primary }]}>
                    {topic.category}
                  </Text>
                </View>
                <Text style={[styles.topicOrder, styles.topicOrderDesktop, { color: colors.text + '60' }]}>
                  Topic #{topic.order}
                </Text>
              </View>
              
              <Text style={[styles.title, styles.titleDesktop, { color: colors.text }]}>
                {topic.title}
              </Text>
              
              <Text style={[styles.description, styles.descriptionDesktop, { color: colors.text + 'CC' }]}>
                {topic.description}
              </Text>
            </View>

            {/* Tags */}
            {topic.tags && topic.tags.length > 0 && (
              <View style={[styles.tagsSection, styles.tagsSectionDesktop]}>
                <Text style={[styles.tagsTitle, styles.tagsTitleDesktop, { color: colors.text + '80' }]}>
                  Related Topics
                </Text>
                <View style={[styles.tagsContainer, styles.tagsContainerDesktop]}>
                  {topic.tags.map((tag, index) => (
                    <View 
                      key={index} 
                      style={[styles.tag, styles.tagDesktop, { backgroundColor: colors.primary + '10' }]}
                    >
                      <Text style={[styles.tagText, styles.tagTextDesktop, { color: colors.primary }]}>
                        {tag}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Content */}
            <View style={[styles.contentSection, styles.contentSectionDesktop, { backgroundColor: colors.card }]}>
              {topic.content ? (
                <View style={styles.markdownContainer}>
                  <Text style={[styles.contentTitle, styles.contentTitleDesktop, { color: colors.text }]}>
                    Detailed Guide
                  </Text>
                  <Text style={[styles.contentText, styles.contentTextDesktop, { color: colors.text + 'CC' }]}>
                    {topic.content}
                  </Text>
                </View>
              ) : (
                <View style={styles.noContent}>
                  <Text style={[styles.noContentText, styles.noContentTextDesktop, { color: colors.text + '80' }]}>
                    Content coming soon...
                  </Text>
                </View>
              )}
            </View>

            {/* Last Updated */}
            <View style={[styles.updatedSection, styles.updatedSectionDesktop, { backgroundColor: colors.card }]}>
              <Calendar size={16} color={colors.text + '60'} />
              <Text style={[styles.updatedText, styles.updatedTextDesktop, { color: colors.text + '80' }]}>
                Last updated {formatDate(topic.updated_at)}
              </Text>
            </View>

            {/* Related Topics */}
            <View style={[styles.relatedSection, styles.relatedSectionDesktop]}>
              <Text style={[styles.relatedTitle, styles.relatedTitleDesktop, { color: colors.text }]}>
                Need more help?
              </Text>
              <TouchableOpacity 
                style={[styles.relatedButton, styles.relatedButtonDesktop, { borderColor: colors.border || '#333333' }]}
                onPress={() => router.back()}
              >
                <Text style={[styles.relatedButtonText, styles.relatedButtonTextDesktop, { color: colors.text }]}>
                  Back to Help Center
                </Text>
                <ArrowLeft size={20} color={colors.text} style={{ transform: [{ rotate: '180deg' }] }} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>
    );
  }

  // Mobile layout
  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.favoriteButton} 
            onPress={toggleBookmark}
          >
            {bookmarked ? (
              <BookmarkCheck size={24} color="#1ea2b1" fill="#1ea2b1" />
            ) : (
              <Bookmark size={24} color="#ffffff" />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.favoriteButton} 
            onPress={handleShare}
          >
            <Share2 size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Title and Category */}
        <View style={styles.titleSection}>
          <View style={styles.categoryContainer}>
            <View style={[
              styles.categoryBadge, 
              { backgroundColor: colors.primary + '15' }
            ]}>
              <Tag size={14} color={colors.primary} />
              <Text style={[styles.categoryText, { color: colors.primary }]}>
                {topic.category}
              </Text>
            </View>
            <Text style={[styles.topicOrder, { color: colors.text + '60' }]}>
              Topic #{topic.order}
            </Text>
          </View>
          
          <Text style={[styles.title, { color: colors.text }]}>
            {topic.title}
          </Text>
          
          <Text style={[styles.description, { color: colors.text + 'CC' }]}>
            {topic.description}
          </Text>
        </View>

        {/* Tags */}
        {topic.tags && topic.tags.length > 0 && (
          <View style={styles.tagsSection}>
            <Text style={[styles.tagsTitle, { color: colors.text + '80' }]}>
              Related Topics
            </Text>
            <View style={styles.tagsContainer}>
              {topic.tags.map((tag, index) => (
                <View 
                  key={index} 
                  style={[styles.tag, { backgroundColor: colors.primary + '10' }]}
                >
                  <Text style={[styles.tagText, { color: colors.primary }]}>
                    {tag}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Content */}
        <View style={[styles.contentSection, { backgroundColor: colors.card }]}>
          {topic.content ? (
            <View style={styles.markdownContainer}>
              <Text style={[styles.contentTitle, { color: colors.text }]}>
                Detailed Guide
              </Text>
              <Text style={[styles.contentText, { color: colors.text + 'CC' }]}>
                {topic.content}
              </Text>
            </View>
          ) : (
            <View style={styles.noContent}>
              <Text style={[styles.noContentText, { color: colors.text + '80' }]}>
                Content coming soon...
              </Text>
            </View>
          )}
        </View>

        {/* Last Updated */}
        <View style={[styles.updatedSection, { backgroundColor: colors.card }]}>
          <Calendar size={16} color={colors.text + '60'} />
          <Text style={[styles.updatedText, { color: colors.text + '80' }]}>
            Last updated {formatDate(topic.updated_at)}
          </Text>
        </View>

        {/* Related Topics */}
        <View style={styles.relatedSection}>
          <Text style={[styles.relatedTitle, { color: colors.text }]}>
            Need more help?
          </Text>
          <TouchableOpacity 
            style={[styles.relatedButton, { borderColor: colors.border || '#333333' }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.relatedButtonText, { color: colors.text }]}>
              Back to Help Center
            </Text>
            <ArrowLeft size={20} color={colors.text} style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.bottomSpace} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  containerDesktop: {
    width: '100%',
  },
  
  // Desktop layout
  desktopWrapper: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 24,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  
  // Skeleton styles
  skeleton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  skeletonContainer: {
    padding: 20,
  },
  skeletonContent: {
    height: 100,
    borderRadius: 12,
    marginBottom: 16,
  },
  
  // Header - Now matching HubDetailScreen exactly
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#000000',
  },
  headerDesktop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 24,
    paddingBottom: 24,
    backgroundColor: '#000000',
  },
  backButton: {
    backgroundColor: '#1a1a1a',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonDesktop: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  favoriteButton: {
    backgroundColor: '#1a1a1a',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButtonDesktop: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerActionsDesktop: {
    flexDirection: 'row',
    gap: 12,
  },
  headerRight: {
    width: 44,
    height: 44,
  },
  
  // Content
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  contentDesktop: {
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
  },
  
  // Title Section
  titleSection: {
    marginBottom: 24,
  },
  titleSectionDesktop: {
    marginBottom: 32,
  },
  categoryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryContainerDesktop: {
    marginBottom: 20,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  categoryBadgeDesktop: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryTextDesktop: {
    fontSize: 13,
  },
  topicOrder: {
    fontSize: 13,
    fontWeight: '500',
  },
  topicOrderDesktop: {
    fontSize: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    lineHeight: 34,
    color: '#ffffff',
  },
  titleDesktop: {
    fontSize: 32,
    lineHeight: 38,
  },
  description: {
    fontSize: 17,
    lineHeight: 24,
    opacity: 0.8,
    color: '#cccccc',
  },
  descriptionDesktop: {
    fontSize: 18,
    lineHeight: 26,
  },
  
  // Tags Section
  tagsSection: {
    marginBottom: 24,
  },
  tagsSectionDesktop: {
    marginBottom: 32,
  },
  tagsTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#cccccc',
  },
  tagsTitleDesktop: {
    fontSize: 13,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagsContainerDesktop: {
    gap: 10,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tagDesktop: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '500',
  },
  tagTextDesktop: {
    fontSize: 12,
  },
  
  // Content Section
  contentSection: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    backgroundColor: '#1a1a1a',
  },
  contentSectionDesktop: {
    borderRadius: 20,
    padding: 32,
    marginBottom: 24,
  },
  contentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#ffffff',
  },
  contentTitleDesktop: {
    fontSize: 22,
    marginBottom: 20,
  },
  contentText: {
    fontSize: 16,
    lineHeight: 26,
    color: '#cccccc',
  },
  contentTextDesktop: {
    fontSize: 17,
    lineHeight: 28,
  },
  markdownContainer: {
    // Add markdown styling here if using markdown
  },
  noContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noContentDesktop: {
    paddingVertical: 60,
  },
  noContentText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#666666',
  },
  noContentTextDesktop: {
    fontSize: 17,
  },
  
  // Updated Section
  updatedSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 30,
    gap: 8,
    backgroundColor: '#1a1a1a',
  },
  updatedSectionDesktop: {
    padding: 20,
    borderRadius: 14,
    marginBottom: 40,
  },
  updatedText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  updatedTextDesktop: {
    fontSize: 15,
  },
  
  // Related Section
  relatedSection: {
    marginTop: 10,
  },
  relatedSectionDesktop: {
    marginTop: 20,
  },
  relatedTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#ffffff',
  },
  relatedTitleDesktop: {
    fontSize: 20,
    marginBottom: 20,
  },
  relatedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  relatedButtonDesktop: {
    padding: 22,
    borderRadius: 14,
  },
  relatedButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
  },
  relatedButtonTextDesktop: {
    fontSize: 17,
  },
  
  // Not Found
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notFoundText: {
    fontSize: 18,
    opacity: 0.7,
    marginBottom: 20,
    color: '#ffffff',
  },
  notFoundTextDesktop: {
    fontSize: 20,
    marginBottom: 24,
  },
  backButtonFull: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#1ea2b1',
  },
  backButtonFullDesktop: {
    paddingHorizontal: 36,
    paddingVertical: 16,
    borderRadius: 14,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Bottom space
  bottomSpace: {
    height: 20,
  },
});