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
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: '#000000' }]}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={[styles.skeletonTitle, { backgroundColor: colors.card }]} />
          <View style={styles.headerRight} />
        </View>
        <View style={styles.skeletonContainer}>
          <View style={[styles.skeletonContent, { backgroundColor: colors.card }]} />
          <View style={[styles.skeletonContent, { backgroundColor: colors.card }]} />
          <View style={[styles.skeletonContent, { backgroundColor: colors.card }]} />
        </View>
      </View>
    );
  }

  if (!topic) {
    return (
      <View style={[styles.container, styles.notFoundContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFoundText, { color: colors.text }]}>
          Help topic not found
        </Text>
        <TouchableOpacity 
          style={[styles.backButtonFull, { backgroundColor: colors.primary }]}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Back to Help Center</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: '#000000' }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={isDesktop ? 20 : 24} color="#FFFFFF" />
          {!isDesktop && (
            <Text style={styles.backButtonTextMobile}>Back</Text>
          )}
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: '#FFFFFF' }]} numberOfLines={1}>
          Help Topic
        </Text>
        
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={toggleBookmark}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {bookmarked ? (
              <BookmarkCheck size={isDesktop ? 18 : 22} color="#FFFFFF" />
            ) : (
              <Bookmark size={isDesktop ? 18 : 22} color="#FFFFFF" />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleShare}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Share2 size={isDesktop ? 18 : 22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          isDesktop && styles.contentDesktop
        ]}
        showsVerticalScrollIndicator={false}
      >
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 60,
  },
  backButtonTextMobile: {
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 8,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 60,
    justifyContent: 'flex-end',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  // Scroll View
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  contentDesktop: {
    paddingHorizontal: 32,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  // Title Section
  titleSection: {
    marginBottom: 24,
  },
  categoryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  topicOrder: {
    fontSize: 13,
    fontWeight: '500',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    lineHeight: 34,
  },
  description: {
    fontSize: 17,
    lineHeight: 24,
    opacity: 0.8,
  },
  // Tags Section
  tagsSection: {
    marginBottom: 24,
  },
  tagsTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '500',
  },
  // Content Section
  contentSection: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
  },
  contentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  contentText: {
    fontSize: 16,
    lineHeight: 26,
  },
  markdownContainer: {
    // Add markdown styling here if using markdown
  },
  noContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noContentText: {
    fontSize: 16,
    fontStyle: 'italic',
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
  },
  updatedText: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Related Section
  relatedSection: {
    marginTop: 10,
  },
  relatedTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  relatedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  relatedButtonText: {
    fontSize: 16,
    fontWeight: '500',
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
  },
  backButtonFull: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Skeleton
  skeletonContainer: {
    padding: 20,
  },
  skeletonTitle: {
    width: 120,
    height: 24,
    borderRadius: 6,
  },
  skeletonContent: {
    height: 100,
    borderRadius: 12,
    marginBottom: 16,
  },
});