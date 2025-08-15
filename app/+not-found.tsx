import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Oops!',
          headerStyle: {
            backgroundColor: '#000000',
          },
          headerTintColor: '#ffffff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerLeft: () => (
            <Link href="/">
              <ArrowLeft color="#1ea2b1" size={24} style={{ marginLeft: 16 }} />
            </Link>
          )
        }} 
      />
      <View style={styles.container}>
        <Text style={styles.title}>404 - Page Not Found</Text>
        <Text style={styles.text}>The screen you're looking for doesn't exist.</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Go to home screen</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#000000',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1ea2b1',
    marginBottom: 16,
  },
  text: {
    fontSize: 16,
    color: '#cccccc',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  link: {
    backgroundColor: '#1a1a1a',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1ea2b1',
  },
  linkText: {
    color: '#1ea2b1',
    fontSize: 16,
    fontWeight: '600',
  },
});