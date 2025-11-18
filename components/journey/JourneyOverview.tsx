import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Navigation, Timer, Clock, Users, MapPin, UserCheck, UserX, ChevronRight } from 'lucide-react-native';
import { TransportProgressBar } from './TransportProgressBar'; // Adjust import path

interface JourneyOverviewProps {
  routeName: string;
  transportType: string;
  startPoint: string;
  endPoint: string;
  getProgressPercentage: () => number; // ADD THIS
  waitingTime: string;
  estimatedArrival: string;
  passengerCount: number;
  currentStop: number;
  totalStops: number;
  hasDriver?: boolean;
  driverName?: string | null;
  currentStopName?: string;
  nextStopName?: string;
  journeyStops?: Array<{
    id: string;
    name: string;
    order_number: number;
    passed: boolean;
    current: boolean;
    upcoming: boolean;
  }>;
}

export const JourneyOverview = ({
  routeName,
  transportType,
  startPoint,
  endPoint,
  getProgressPercentage, // ADD THIS
  waitingTime,
  estimatedArrival,
  passengerCount,
  currentStop,
  totalStops,
  hasDriver = false,
  driverName = null,
  currentStopName = 'Current Stop',
  nextStopName = 'Next Stop',
  journeyStops = []
}: JourneyOverviewProps) => {
  // Calculate progress percentage
  const progressPercentage = getProgressPercentage(); // USE THE FUNCTION

  // Find current and next stops from journeyStops
  const currentStopInfo = journeyStops.find(stop => stop.current) || journeyStops[currentStop - 1];
  const nextStopInfo = journeyStops.find(stop => stop.upcoming && !stop.passed);
  
  const displayCurrentStopName = currentStopInfo?.name || currentStopName;
  const displayNextStopName = nextStopInfo?.name || nextStopName;

  return (
    <View style={styles.journeyCard}>
      <View style={styles.journeyHeader}>
        <Navigation size={24} color="#1ea2b1" />
        
        <View style={styles.journeyInfo}>
          <Text style={styles.routeName}>{routeName}</Text>
          <Text style={styles.routeType}>{transportType}</Text>
        </View>
      </View>
      
      <Text style={styles.routeDestination}>
        {startPoint} → {endPoint}
      </Text>

      {/* Driver Status */}
      <View style={[
        styles.driverStatus, 
        hasDriver ? styles.driverPresent : styles.driverMissing
      ]}>
        {hasDriver ? (
          <>
            <UserCheck size={16} color="#34d399" />
            <Text style={styles.driverPresentText}>
              Driver: {driverName || 'Available'}
            </Text>
          </>
        ) : (
          <>
            <UserX size={16} color="#fca5a5" />
            <Text style={styles.driverMissingText}>
              No driver assigned
            </Text>
          </>
        )}
      </View>
      
      {/* Current Position */}
      <View style={styles.positionContainer}>
        <View style={styles.positionItem}>
          <View style={styles.positionIcon}>
            <MapPin size={14} color="#1ea2b1" />
          </View>
          <View style={styles.positionInfo}>
            <Text style={styles.positionLabel}>Current Stop</Text>
            <Text style={styles.positionValue}>{displayCurrentStopName}</Text>
            <Text style={styles.positionSubtext}>Stop {currentStop} of {totalStops}</Text>
          </View>
        </View>
        
        {displayNextStopName && (
          <>
            <View style={styles.positionArrow}>
              <ChevronRight size={16} color="#666666" />
            </View>
            
            <View style={styles.positionItem}>
              <View style={[styles.positionIcon, styles.nextStopIcon]}>
                <MapPin size={14} color="#fbbf24" />
              </View>
              <View style={styles.positionInfo}>
                <Text style={styles.positionLabel}>Next Stop</Text>
                <Text style={[styles.positionValue, styles.nextStopValue]}>{displayNextStopName}</Text>
                {nextStopInfo && (
                  <Text style={styles.positionSubtext}>
                    Stop {nextStopInfo.order_number} of {totalStops}
                  </Text>
                )}
              </View>
            </View>
          </>
        )}
      </View>
      
      {/* Progress Bar with Moving Vehicle */}
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Route Progress</Text>
          <Text style={styles.progressText}>
            {Math.round(progressPercentage)}% Complete
          </Text>
        </View>
        
        <TransportProgressBar 
          progressPercentage={progressPercentage}
          transportType={transportType}
          currentStop={currentStop}
          totalStops={totalStops}
          stops={journeyStops}
        />
      </View>
      
      {/* Journey Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Timer size={16} color="#1ea2b1" />
          <Text style={styles.statLabel}>Waiting</Text>
          <Text style={styles.statValue}>{waitingTime}</Text>
        </View>
        
        <View style={styles.statItem}>
          <Clock size={16} color="#1ea2b1" />
          <Text style={styles.statLabel}>ETA</Text>
          <Text style={styles.statValue}>{estimatedArrival}</Text>
        </View>
        
        <View style={styles.statItem}>
          <Users size={16} color="#1ea2b1" />
          <Text style={styles.statLabel}>Passengers</Text>
          <Text style={styles.statValue}>{passengerCount}</Text>
        </View>
        
        <View style={styles.statItem}>
          <MapPin size={16} color="#1ea2b1" />
          <Text style={styles.statLabel}>Progress</Text>
          <Text style={styles.statValue}>
            {currentStop}/{totalStops}
          </Text>
        </View>
      </View>

      {/* Route Summary */}
      <View style={styles.routeSummary}>
        <Text style={styles.summaryTitle}>Route Summary</Text>
        <View style={styles.summaryStats}>
          <View style={styles.summaryStat}>
            <Text style={styles.summaryNumber}>{totalStops}</Text>
            <Text style={styles.summaryLabel}>Total Stops</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryStat}>
            <Text style={styles.summaryNumber}>{currentStop - 1}</Text>
            <Text style={styles.summaryLabel}>Stops Passed</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryStat}>
            <Text style={styles.summaryNumber}>{totalStops - currentStop + 1}</Text>
            <Text style={styles.summaryLabel}>Stops Remaining</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

// ... keep your existing styles the same
const styles = StyleSheet.create({
  // ... your existing styles
  journeyCard: {
    backgroundColor: '#1a1a1a',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  journeyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  journeyInfo: {
    marginLeft: 12,
    flex: 1,
  },
  routeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2,
  },
  routeType: {
    fontSize: 14,
    color: '#1ea2b1',
    backgroundColor: '#1ea2b120',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  routeDestination: {
    fontSize: 14,
    color: '#cccccc',
    marginBottom: 16,
  },
  driverStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  driverPresent: {
    backgroundColor: '#065f46',
  },
  driverMissing: {
    backgroundColor: '#7f1d1d',
  },
  driverPresentText: {
    color: '#34d399',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  driverMissingText: {
    color: '#fca5a5',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  positionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#222222',
    borderRadius: 12,
    padding: 16,
  },
  positionItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  positionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1ea2b120',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  nextStopIcon: {
    backgroundColor: '#fbbf2420',
  },
  positionInfo: {
    flex: 1,
  },
  positionLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 2,
  },
  positionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  nextStopValue: {
    color: '#fbbf24',
  },
  positionSubtext: {
    fontSize: 10,
    color: '#666666',
  },
  positionArrow: {
    marginHorizontal: 8,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  progressText: {
    fontSize: 14,
    color: '#1ea2b1',
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  routeSummary: {
    backgroundColor: '#222222',
    borderRadius: 12,
    padding: 16,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  summaryStat: {
    alignItems: 'center',
    flex: 1,
  },
  summaryNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1ea2b1',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#333333',
  },
});