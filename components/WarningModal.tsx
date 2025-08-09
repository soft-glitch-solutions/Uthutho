import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { AlertTriangle } from "lucide-react-native";

interface WarningModalProps {
  visible: boolean;
  onAccept: () => void;
  onReject: () => void;
  colors: any;
  type: 'stop' | 'hub';
}

export default function WarningModal({ visible, onAccept, onReject, colors, type }: WarningModalProps) {
  const title = type === 'hub' ? 'Hub Submission Notice' : 'Stop Submission Notice';
  const typeName = type === 'hub' ? 'hub' : 'stop';

  return (
    <Modal animationType="fade" transparent visible={visible}>
      <View style={styles.modalOverlay}>
        <View style={[styles.warningContent, { backgroundColor: colors.card }]}>
          <AlertTriangle size={50} color="#FFA500" style={styles.warningIcon} />
          <Text style={[styles.warningTitle, { color: colors.text }]}>{title}</Text>

          <ScrollView style={styles.warningTextContainer}>
            <Text style={[styles.warningText, { color: colors.text }]}>
              Thank you for helping keep our app updated by adding a new {typeName}.
              {"\n\n"}
              If approved by our admin team, you will earn <Text style={{ fontWeight: 'bold' }}>100 points</Text>.
              {"\n\n"}
              Please ensure all information is accurate and valid. We fact-check all submissions:
              {"\n\n"}
              • Submitting fake or inaccurate data will result in rejection.
              {"\n"}
              • Repeated violations could risk your account being <Text style={{ fontWeight: 'bold' }}>banned</Text>.
              {"\n\n"}
              By submitting, you confirm your data is accurate to the best of your knowledge.
            </Text>
          </ScrollView>

          <View style={styles.warningButtons}>
            <TouchableOpacity
              style={[styles.warningButton, { backgroundColor: colors.danger }]}
              onPress={onReject}
            >
              <Text style={styles.warningButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.warningButton, { backgroundColor: colors.primary }]}
              onPress={onAccept}
            >
              <Text style={styles.warningButtonText}>I Understand</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  warningContent: {
    borderRadius: 15,
    padding: 20,
    maxHeight: '80%',
  },
  warningIcon: {
    alignSelf: 'center',
    marginBottom: 15,
  },
  warningTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  warningTextContainer: {
    maxHeight: '60%',
    marginBottom: 20,
  },
  warningText: {
    fontSize: 16,
    lineHeight: 22,
  },
  warningButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  warningButton: {
    borderRadius: 8,
    padding: 12,
    width: '48%',
    alignItems: 'center',
  },
  warningButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
