import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

const WaitingButton = ({ isWaiting, onPress }) => {
  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: isWaiting ? 'green' : 'blue' }]}
      onPress={onPress}
      disabled={isWaiting}
    >
      <Text style={styles.buttonText}>{isWaiting ? 'Got Picked Up' : "I'm Waiting"}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default WaitingButton;