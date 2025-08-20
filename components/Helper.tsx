import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Dimensions, Animated, Easing } from 'react-native';
import { ArrowDown, ArrowUp, ArrowLeft, ArrowRight } from 'lucide-react-native'; // Assuming you use lucide-react-native for icons
import MaskedView from '@react-native-masked-view/masked-view';
import { BlurView } from 'expo-blur';
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface TutorialStep {
  title: string;
  description: string;
  targetElement?: { // Define the target element structure
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface HelperProps {
  visible: boolean;
  steps: TutorialStep[];
  onClose: () => void;
}

const Helper: React.FC<HelperProps> = ({ visible, onClose, steps }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.ease,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible, fadeAnim]);

  if (!visible) {
    return null;
  }

  const currentStep = steps[currentStepIndex];
  const target = currentStep.targetElement;

  // Calculate the position for the helper content box
  const contentBoxStyle: any = {
    position: 'absolute',
    alignSelf: 'center',
    maxWidth: screenWidth * 0.8,
    zIndex: 1002, // Above the overlay and spotlight
  };

  const arrowStyle: any = {
    position: 'absolute',
    zIndex: 1003, // Above everything
  };

  const arrowSize = 30; // Size of the arrow icon
  const arrowOffset = 15; // Distance from content box or target to arrow base

  if (target) {
    const targetCenterX = target.x + target.width / 2;
    const targetCenterY = target.y + target.height / 2;

    // Determine if content box should be above or below the target
    // Simple logic: if target is in upper half, put box below; otherwise, put box above
    const positionBelow = targetCenterY < screenHeight / 2;

    if (positionBelow) {
      contentBoxStyle.top = target.y + target.height + 20;
    } else {
      contentBoxStyle.bottom = screenHeight - target.y + 20;
    }

    // Calculate arrow position and rotation
    const contentBoxHeight = 150; // Estimate height for positioning
    const contentBoxWidth = contentBoxStyle.maxWidth; // Use max width for estimation

    // Crude estimation for content box center based on potential position
    const contentBoxEstY = positionBelow ? contentBoxStyle.top + contentBoxHeight / 2 : screenHeight - contentBoxStyle.bottom + contentBoxHeight / 2;
    const contentBoxEstX = screenWidth / 2; // Assuming centered horizontally

    const deltaX = targetCenterX - contentBoxEstX;
    const deltaY = targetCenterY - contentBoxEstY;

    const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

    // Position the arrow relative to the closest edge of the content box or target
    if (positionBelow) { // Arrow points up from content box to target
      arrowStyle.bottom = screenHeight - (target.y - arrowOffset);
      arrowStyle.left = targetCenterX - arrowSize / 2;
      arrowStyle.transform = [{ rotate: '180deg' }]; // Point up
    } else { // Arrow points down from content box to target
      arrowStyle.top = target.y + target.height + arrowOffset;
      arrowStyle.left = targetCenterX - arrowSize / 2;
      arrowStyle.transform = [{ rotate: '0deg' }]; // Point down
    }

    // Add left/right arrow logic if needed (more complex)
    // For simplicity, sticking to up/down based on vertical position difference

  } else {
    // Center the box if no target element
    contentBoxStyle.justifyContent = 'center';
    contentBoxStyle.alignItems = 'center';
    contentBoxStyle.flex = 1;
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none" // Use the Animated.View for fading
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <MaskedView
          style={StyleSheet.absoluteFillObject}
          maskElement={
            <View style={styles.maskContainer}>
              <View style={styles.transparentBackground} />
              {target && (
                <View
                  style={[
                    styles.maskHole,
                    {
                      left: target.x,
                      top: target.y,
                      width: target.width,
                      height: target.height,
                    },
                  ]}
                />
              )}
            </View>
          }
        >
          {/* The background that will be masked */}
          <BlurView intensity={50} style={styles.overlayBackground} />
        </MaskedView>

        {/* Tutorial Content Box */}
        <View style={[styles.container, contentBoxStyle]}>
          <Text style={styles.title}>{currentStep.title}</Text>
          <Text style={styles.description}>
            {currentStep.description}
          </Text>

          {/* Navigation Buttons */}
          <View style={styles.buttonContainer}>
            {currentStepIndex > 0 && (
              <TouchableOpacity
                style={[styles.button, styles.prevButton]}
                onPress={() => setCurrentStepIndex(currentStepIndex - 1)}
              >
                <Text style={styles.buttonText}>Previous</Text>
              </TouchableOpacity>
            )}

            {currentStepIndex < steps.length - 1 ? (
              <TouchableOpacity
                style={[styles.button, styles.nextButton]}
                onPress={() => setCurrentStepIndex(currentStepIndex + 1)}
              >
                <Text style={styles.buttonText}>Next</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.button, styles.closeButton]} onPress={onClose}>
                <Text style={styles.buttonText}>Got it!</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Arrow */}
        {target && (
          <View style={arrowStyle}>
            {/* Choose arrow direction based on content box position relative to target */}
            {contentBoxStyle.bottom !== undefined ? ( // If content box is above target
               <ArrowDown size={arrowSize} color="white" />
             ) : ( // If content box is below target
               <ArrowUp size={arrowSize} color="white" />
             )}
          </View>
        )}
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    ...StyleSheet.absoluteFillObject, // Cover the entire screen
    zIndex: 1000, // Ensure it's on top
  },
  maskContainer: {
    flex: 1,
    backgroundColor: 'transparent', // This background is necessary for the mask to work
  },
  overlayBackground: {
    ...StyleSheet.absoluteFillObject, // Cover the entire screen
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // Semi-transparent dark background
    // For iOS, you could use react-native/Libraries/Components/BlurView
    // For Android, you might need a third-party library or different approach
  },
  transparentBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'black', // The color here doesn't matter, only its presence for masking
  },
  maskHole: {
    position: 'absolute',
    backgroundColor: 'transparent', // The "hole"
    overflow: 'hidden', // Hide overflow to ensure the hole is clean
    borderRadius: 8, // Match border radius of potential target elements
    borderWidth: 2, // Add a border to the spotlight
    borderColor: 'white', // White border for visibility
  },
  container: {
    position: 'absolute', // Position absolutely within the overlay
    justifyContent: 'center',
    alignItems: 'center',
    alignItems: 'center',
    maxWidth: screenWidth * 0.8, // Limit max width
  },
  title: {
    fontSize: 22, // Slightly larger title
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  description: {
    fontSize: 15, // Slightly smaller font
    textAlign: 'center',
    marginBottom: 25, // Increased bottom margin
    color: '#555',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    paddingVertical: 12, // Increased vertical padding
    paddingHorizontal: 25, // Increased horizontal padding
    borderRadius: 8, // Slightly more rounded
    minWidth: 100, // Ensure minimum width for buttons
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600', // Slightly bolder text
  },
  nextButton: {
    backgroundColor: '#3b82f6',
  },
  closeButton: {
    backgroundColor: '#f43f5e', // Use a different color for the final button
  },
  prevButton: {
    backgroundColor: '#6b7280', // Grey for previous button
  },
});

export default Helper;