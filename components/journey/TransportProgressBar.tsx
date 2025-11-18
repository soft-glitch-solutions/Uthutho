import React, { useEffect, useRef } from 'react';
import { View, Animated, Image, StyleSheet, Text } from 'react-native';

interface JourneyStop {
  id: string;
  name: string;
  order_number: number;
  passed: boolean;
  current: boolean;
  upcoming: boolean;
}

interface TransportProgressBarProps {
  progressPercentage: number;
  transportType: string;
  currentStop: number;
  totalStops: number;
  stops?: JourneyStop[];
}

export const TransportProgressBar: React.FC<TransportProgressBarProps> = ({
  progressPercentage,
  transportType,
  currentStop,
  totalStops,
  stops = [],
}) => {
  const vehiclePosition = useRef(new Animated.Value(0)).current;

  // Get the appropriate vehicle icon based on transport type
  const getVehicleIcon = () => {
    switch (transportType.toLowerCase()) {
      case 'train':
        return require('@/assets/icons/train-icon.png');
      case 'minibus':
        return require('@/assets/icons/minibus-icon.png');
      default:
        return require('@/assets/icons/default-vehicle-icon.png');
    }
  };

  // Get vehicle size based on type
  const getVehicleSize = () => {
    switch (transportType.toLowerCase()) {
      case 'train':
        return { width: 45, height: 28 };
      case 'minibus':
        return { width: 36, height: 22 };
      default:
        return { width: 40, height: 24 };
    }
  };

  useEffect(() => {
    // Animate vehicle position when progress changes
    Animated.timing(vehiclePosition, {
      toValue: progressPercentage,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [progressPercentage]);

  const vehicleSize = getVehicleSize();

  // Calculate stop positions for display along the progress bar
  const getStopPosition = (stopOrder: number) => {
    if (totalStops <= 1) return 0;
    return ((stopOrder - 1) / (totalStops - 1)) * 100;
  };

  // Get current stop info for display
  const currentStopInfo = stops.find(stop => stop.current) || stops[currentStop - 1];

  return (
    <View style={styles.container}>
      {/* Progress Bar with Stops */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBar}>
          {/* Progress Fill */}
          <View 
            style={[
              styles.progressFill, 
              { width: `${progressPercentage}%` }
            ]} 
          />
          
          {/* Stop Markers */}
          {stops.map((stop) => (
            <View
              key={stop.id}
              style={[
                styles.stopMarker,
                {
                  left: `${getStopPosition(stop.order_number)}%`,
                },
              ]}
            >
              <View style={[
                styles.stopDot,
                stop.passed && styles.stopDotPassed,
                stop.current && styles.stopDotCurrent,
                stop.upcoming && styles.stopDotUpcoming,
              ]} />
              
              {/* Show stop number for current stop */}
              {stop.current && (
                <View style={styles.currentStopLabel}>
                  <Text style={styles.currentStopText}>
                    {stop.order_number}
                  </Text>
                </View>
              )}
            </View>
          ))}
          
          {/* Moving Vehicle */}
          <Animated.View
            style={[
              styles.vehicleContainer,
              {
                left: vehiclePosition.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
                transform: [
                  { 
                    translateX: vehiclePosition.interpolate({
                      inputRange: [0, 100],
                      outputRange: [-vehicleSize.width / 2, -vehicleSize.width / 2],
                    })
                  }
                ],
              },
            ]}
          >
            <Image
              source={getVehicleIcon()}
              style={[
                styles.vehicleIcon,
                { width: vehicleSize.width, height: vehicleSize.height }
              ]}
              resizeMode="contain"
            />
          </Animated.View>
        </View>
      </View>
      
      {/* Route Information */}
      <View style={styles.routeInfo}>
        <View style={styles.routeEnd}>
          <Text style={styles.routeEndLabel}>Start</Text>
          <Text style={styles.routeEndName} numberOfLines={1}>
            {stops[0]?.name || 'Start Point'}
          </Text>
        </View>
        
        <View style={styles.progressInfo}>
          <Text style={styles.progressPercentage}>
            {Math.round(progressPercentage)}%
          </Text>
          <Text style={styles.stopProgress}>
            Stop {currentStop} of {totalStops}
          </Text>
          {currentStopInfo && (
            <Text style={styles.currentStopName} numberOfLines={1}>
              {currentStopInfo.name}
            </Text>
          )}
        </View>
        
        <View style={styles.routeEnd}>
          <Text style={styles.routeEndLabel}>End</Text>
          <Text style={styles.routeEndName} numberOfLines={1}>
            {stops[stops.length - 1]?.name || 'End Point'}
          </Text>
        </View>
      </View>

      {/* Stop Legend */}
      {stops.length > 0 && (
        <View style={styles.stopLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.passedDot]} />
            <Text style={styles.legendText}>Passed</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.currentDot]} />
            <Text style={styles.legendText}>Current</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.upcomingDot]} />
            <Text style={styles.legendText}>Upcoming</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  progressBarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  progressBar: {
    height: 16,
    backgroundColor: '#333333',
    borderRadius: 8,
    position: 'relative',
    overflow: 'visible',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1ea2b1',
    borderRadius: 8,
  },
  stopMarker: {
    position: 'absolute',
    top: -6,
    alignItems: 'center',
    transform: [{ translateX: -4 }], // Center the marker
  },
  stopDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#666666',
    borderWidth: 2,
    borderColor: '#1a1a1a',
  },
  stopDotPassed: {
    backgroundColor: '#4ade80',
    borderColor: '#1a1a1a',
  },
  stopDotCurrent: {
    backgroundColor: '#1ea2b1',
    width: 12,
    height: 12,
    borderRadius: 6,
    borderColor: '#1a1a1a',
  },
  stopDotUpcoming: {
    backgroundColor: '#666666',
    borderColor: '#1a1a1a',
  },
  currentStopLabel: {
    position: 'absolute',
    top: 15,
    backgroundColor: '#1ea2b1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 20,
    alignItems: 'center',
  },
  currentStopText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  vehicleContainer: {
    position: 'absolute',
    top: -18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleIcon: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
  },
  routeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  routeEnd: {
    flex: 1,
    alignItems: 'flex-start',
  },
  routeEndLabel: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
    marginBottom: 4,
  },
  routeEndName: {
    fontSize: 11,
    color: '#cccccc',
    fontWeight: '400',
    maxWidth: 80,
  },
  progressInfo: {
    alignItems: 'center',
    paddingHorizontal: 16,
    flex: 1,
  },
  progressPercentage: {
    fontSize: 18,
    color: '#1ea2b1',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  stopProgress: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
    marginBottom: 4,
  },
  currentStopName: {
    fontSize: 11,
    color: '#1ea2b1',
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: 120,
  },
  stopLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  passedDot: {
    backgroundColor: '#4ade80',
  },
  currentDot: {
    backgroundColor: '#1ea2b1',
  },
  upcomingDot: {
    backgroundColor: '#666666',
  },
  legendText: {
    fontSize: 10,
    color: '#cccccc',
  },
});