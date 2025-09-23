import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { MapPin } from 'lucide-react-native';

interface Location {
  display_name: string;
  lat: string;
  lon: string;
  place_id: string;
}

interface LocationAutocompleteProps {
  placeholder: string;
  onLocationSelect: (location: Location) => void;
  value: string;
  onChangeText: (text: string) => void;
}

export default function LocationAutocomplete({ 
  placeholder, 
  onLocationSelect, 
  value, 
  onChangeText 
}: LocationAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Location[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasSelected, setHasSelected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (hasSelected) {
      return;
    }

    if (!value || value.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      setError(null);
      return;
    }

    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }
    
    typingTimeout.current = setTimeout(() => {
      searchLocations(value);
    }, 1000); // Increased delay to be more polite
  }, [value, hasSelected]);

  const searchLocations = async (query: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=za&limit=5&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'Uthutho/1.0 (shaqeel@uthutho.co.za)',
            'Accept': 'application/json',
          }
        }
      );

      // Check if response is OK
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response format from server');
      }

      const data = await response.json();
      
      if (Array.isArray(data)) {
        setSuggestions(data);
        setShowSuggestions(true);
      } else {
        console.warn('Unexpected response format:', data);
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Error searching locations:', error);
      setError('Location service temporarily unavailable. Please try again shortly.');
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (location: Location) => {
    onLocationSelect(location);
    onChangeText(location.display_name);
    setHasSelected(true);
    setSuggestions([]);
    setShowSuggestions(false);
    setError(null);
  };

  const handleChangeText = (text: string) => {
    onChangeText(text);
    setHasSelected(false);
    setError(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <MapPin size={20} color="#1ea2b1" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#666666"
          value={value}
          onChangeText={handleChangeText}
          onFocus={() => value.length > 2 && suggestions.length > 0 && setShowSuggestions(true)}
        />
        {loading && (
          <Text style={styles.loadingText}>Searching...</Text>
        )}
      </View>
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
      
      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <ScrollView style={styles.suggestionsList} nestedScrollEnabled>
            {suggestions.map((location) => (
              <TouchableOpacity
                key={location.place_id}
                style={styles.suggestionItem}
                onPress={() => handleLocationSelect(location)}
              >
                <MapPin size={16} color="#1ea2b1" />
                <Text style={styles.suggestionText} numberOfLines={2}>
                  {location.display_name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    paddingVertical: 16,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
    marginTop: 4,
    maxHeight: 200,
    zIndex: 1001,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  suggestionText: {
    color: '#ffffff',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  loadingText: {
    color: '#1ea2b1',
    fontSize: 12,
    marginLeft: 8,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 8,
  },
});