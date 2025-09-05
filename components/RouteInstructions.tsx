import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Navigation, Clock, MapPin, ArrowRight } from 'lucide-react-native';

interface RouteStep {
  instruction: string;
  transport_type: string;
  duration: string;
  cost?: number;
}

interface RouteInstructionsProps {
  fromLocation: string;
  toLocation: string;
  steps: RouteStep[];
  totalDuration: string;
  totalCost: number;
}

export default function RouteInstructions({ 
  fromLocation, 
  toLocation, 
  steps, 
  totalDuration, 
  totalCost 
}: RouteInstructionsProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Navigation size={24} color="#1ea2b1" />
        <Text style={styles.title}>Route Instructions</Text>
      </View>

      <View style={styles.routeOverview}>
        <Text style={styles.routeText}>{fromLocation} → {toLocation}</Text>
        <View style={styles.routeStats}>
          <View style={styles.statItem}>
            <Clock size={16} color="#1ea2b1" />
            <Text style={styles.statText}>{totalDuration}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.costText}>R {totalCost}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.stepsContainer}>
        {steps.map((step, index) => (
          <View key={index} style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{index + 1}</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepInstruction}>{step.instruction}</Text>
              <View style={styles.stepDetails}>
                <Text style={styles.transportType}>{step.transport_type}</Text>
                <Text style={styles.stepDuration}>{step.duration}</Text>
                {step.cost && (
                  <Text style={styles.stepCost}>R {step.cost}</Text>
                )}
              </View>
            </View>
            {index < steps.length - 1 && (
              <ArrowRight size={16} color="#666666" style={styles.stepArrow} />
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 8,
  },
  routeOverview: {
    marginBottom: 20,
  },
  routeText: {
    fontSize: 16,
    color: '#1ea2b1',
    fontWeight: '500',
    marginBottom: 8,
  },
  routeStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    color: '#cccccc',
    fontSize: 14,
    marginLeft: 4,
  },
  costText: {
    color: '#1ea2b1',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepsContainer: {
    maxHeight: 300,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1ea2b1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
  },
  stepInstruction: {
    color: '#ffffff',
    fontSize: 14,
    marginBottom: 4,
  },
  stepDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  transportType: {
    color: '#1ea2b1',
    fontSize: 12,
    backgroundColor: '#1ea2b120',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  stepDuration: {
    color: '#666666',
    fontSize: 12,
  },
  stepCost: {
    color: '#1ea2b1',
    fontSize: 12,
    fontWeight: '500',
  },
  stepArrow: {
    marginLeft: 8,
    marginTop: 4,
  },
});