import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function ConfirmationScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Check Your Email</Text>
        <Text style={styles.message}>
          We've sent a confirmation link to {email}. Please verify your email to complete registration.
        </Text>
        
        <Text style={styles.note}>
          Didn't receive the email? Check your spam folder or try signing up again.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace('/auth')}
        >
          <Text style={styles.buttonText}>Return to Sign In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    padding: 20,
    justifyContent: 'center',
  },
  content: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: '#333333',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1ea2b1',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 24,
    textAlign: 'center',
  },
  note: {
    fontSize: 14,
    color: '#cccccc',
    marginBottom: 32,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: '#1ea2b1',
    borderRadius: 8,
    padding: 16,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});