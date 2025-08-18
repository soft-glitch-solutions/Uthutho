import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Svg, Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons'; // Import icons
import { useProfile } from '@/hook/useProfile'; // Import the useProfile hook
import { useTheme } from '@/context/ThemeContext'; // Import the useTheme hook
import { router } from 'expo-router'; // Import router for navigation

interface Profile {
  firstName?: string | null;
  lastName?: string | null;
  avatar_url?: string | null; // Assuming this field exists for profile picture

}

const ProfileCheck: React.FC = () => {
  const { profile, loading } = useProfile(); // Use the useProfile hook
  const { colors } = useTheme(); // Use the useTheme hook for colors

  const fieldsToCheck: (keyof Profile)[] = [
    'firstName',
    'lastName',
 'avatar_url',
    // Add other field names here
  ];

  console.log("ProfileCheck - Received Profile:", profile);

  if (loading || !profile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  let completedFields = 0;
  fieldsToCheck.forEach(field => {
    if (profile[field]) {
      completedFields++;
    }
  });

  const totalFields = fieldsToCheck.length;
  console.log("ProfileCheck - Fields to Check:", fieldsToCheck);
  console.log("ProfileCheck - Completed Fields:", completedFields);
  const percentageComplete = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;

  return (
    <View style={[styles.containerOuter, {borderColor: colors.border}]}>
 <View style={styles.ringContainer}>
 <Svg height="120" width="120" viewBox="0 0 120 120">
 {/* Background Circle */}
 <Circle
 cx="60"
 cy="60"
 r="50"
 stroke={colors.border} // Light grey background ring color
 strokeWidth="10"
 fill="none"
 />
 {/* Progress Circle */}
 <Circle
 cx="60"
 cy="60"
 r="50"
 stroke={colors.primary} // Green progress ring color
 strokeWidth="10"
 fill="none"
 strokeDasharray={2 * Math.PI * 50}
 strokeDashoffset={(2 * Math.PI * 50) * (1 - percentageComplete / 100)}
 strokeLinecap="round"
 transform="rotate(-90 60 60)" // Start the ring from the top
 />
 </Svg>
 <View style={styles.percentageTextContainer}>
        <Text style={[styles.percentageText, { color: colors.primary }]}>{percentageComplete}%</Text>
 </View>
      </View>
      <View style={styles.textContainer}>
      {percentageComplete < 100 && (
        <Text style={[styles.messageText, {color: colors.text}]}>Complete your profile to unlock all features!</Text>
      )}
      {percentageComplete < 100 && (
        <TouchableOpacity style={[styles.editButton, {backgroundColor: colors.primary}]} onPress={() => router.push('/(app)/EditProfileScreen')}>
          <Text style={[styles.editButtonText, {color: colors.background}]}>Edit Profile</Text>
        </TouchableOpacity>
      )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  containerOuter: {
 flexDirection: 'row',
 justifyContent: 'space-between',
 alignItems: 'center',
 marginVertical: 20,
 paddingHorizontal: 20,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 15,
  },
  container: {
    alignItems: 'center',
 marginVertical: 20,
 flexDirection: 'row',
 justifyContent: 'space-between',
 width: '100%',
  },
  loadingContainer: {
    flex: 1, // Allow the loading container to take available space
    justifyContent: 'center', // Center content vertically
    alignItems: 'center', // Center content horizontally
  },
 ringContainer: {
 width: 120,
 height: 120,
 justifyContent: 'center',
 alignItems: 'center',
  },
  textContainer: {
    flex: 1, // Allow text container to take available space
  },
 percentageTextContainer: {
 position: 'absolute',
 justifyContent: 'center',
 alignItems: 'center',
  },
  percentageText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  messageText: {
    fontSize: 14,
    marginTop: 5,
    textAlign: 'center',
  },
  fieldRow: {
 flexDirection: 'row',
 alignItems: 'center',
  },
  fieldName: {
 fontSize: 16,
 marginRight: 8,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  editButton: {
    marginTop: 15,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
  }
});

export default ProfileCheck;