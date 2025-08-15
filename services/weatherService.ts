// Using OpenWeatherMap free API (requires API key)
// For demo purposes, we'll simulate weather data
export interface WeatherData {
  temperature: number;
  description: string;
  humidity: number;
  windSpeed: number;
  feelsLike: number;
}

export const getWeatherData = async (latitude: number, longitude: number): Promise<WeatherData> => {
  try {
    // For demo purposes, we'll simulate weather data based on location
    // In production, you would use a real weather API like OpenWeatherMap
    
    // Simulate different weather conditions based on coordinates
    const temp = Math.floor(Math.random() * 20) + 10; // 10-30°C
    const conditions = ['Clear', 'Cloudy', 'Rainy', 'Windy'];
    const condition = conditions[Math.floor(Math.random() * conditions.length)];
    
    return {
      temperature: temp,
      description: condition,
      humidity: Math.floor(Math.random() * 40) + 40, // 40-80%
      windSpeed: Math.floor(Math.random() * 15) + 5, // 5-20 km/h
      feelsLike: temp + Math.floor(Math.random() * 6) - 3, // ±3°C
    };
  } catch (error) {
    console.error('Error fetching weather:', error);
    // Return default weather data
    return {
      temperature: 20,
      description: 'Clear',
      humidity: 60,
      windSpeed: 10,
      feelsLike: 22,
    };
  }
};

export const getWeatherAdvice = (weather: WeatherData): string => {
  const { temperature, description, feelsLike } = weather;
  
  let advice = '';
  
  if (feelsLike < 15) {
    advice += '🧥 It\'s quite cold - wear a jacket or warm clothing. ';
  } else if (feelsLike < 20) {
    advice += '👕 It\'s a bit cool - consider bringing a light jacket. ';
  } else if (feelsLike > 28) {
    advice += '☀️ It\'s quite warm - dress lightly and stay hydrated. ';
  }
  
  if (description.toLowerCase().includes('rain')) {
    advice += '☔ Rain expected - bring an umbrella and allow extra travel time. ';
  } else if (description.toLowerCase().includes('wind')) {
    advice += '💨 It\'s windy - secure loose items and be careful at stops. ';
  }
  
  if (advice === '') {
    advice = '🌤️ Perfect weather for traveling! ';
  }
  
  return advice.trim();
};