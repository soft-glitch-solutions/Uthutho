import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Passenger {
  id: string;
  user_id: string;
  created_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
  };
  stops?: {
    name: string;
    order_number: number;
  };
}

interface PassengersListProps {
  passengers: Passenger[];
  getPassengerWaitingTime: (createdAt: string) => string;
}

export const PassengersList = ({ passengers, getPassengerWaitingTime }: PassengersListProps) => {
  if (passengers.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Fellow Passengers ({passengers.length})</Text>
      
      {passengers.map((passenger) => (
        <View key={passenger.id} style={styles.passengerItem}>
          <View style={styles.passengerInfo}>
            <Text style={styles.passengerName}>
              {passenger.profiles?.first_name} {passenger.profiles?.last_name}
            </Text>
            <Text style={styles.passengerStop}>
              Waiting at {passenger.stops?.name}
            </Text>
            <Text style={styles.passengerWaitTime}>
              Waiting for {getPassengerWaitingTime(passenger.created_at)}
            </Text>
          </View>
          
          <Text style={styles.passengerTime}>
            {new Date(passenger.created_at).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  passengerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  passengerInfo: {
    flex: 1,
  },
  passengerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: 2,
  },
  passengerStop: {
    fontSize: 14,
    color: '#666666',
  },
  passengerWaitTime: {
    fontSize: 12,
    color: '#1ea2b1',
    marginTop: 2,
  },
  passengerTime: {
    fontSize: 12,
    color: '#666666',
  },
});