import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Vibration,
  StatusBar,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width, height } = Dimensions.get('window');

const AlarmOverlay = ({ visible, alarm, onSnooze, onDismiss }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const soundRef = useRef(null);

  useEffect(() => {
    if (visible) {
      // Start pulsing animation
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 750,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 750,
            useNativeDriver: true,
          }),
        ])
      );

      // Start shaking animation for alarm icon
      const shakeAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(shakeAnim, {
            toValue: -10,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: 10,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
        ])
      );

      pulseAnimation.start();
      shakeAnimation.start();

      // Start vibration pattern
      const vibrationPattern = [1000, 1000, 1000, 1000];
      Vibration.vibrate(vibrationPattern, true);

      // Play alarm sound
      playAlarmSound();

      return () => {
        pulseAnimation.stop();
        shakeAnimation.stop();
        Vibration.cancel();
        stopAlarmSound();
      };
    }
  }, [visible]);

  const playAlarmSound = async () => {
    try {
      // For now, we'll skip the actual sound playback until sound files are added
      // In production, this would load the alarm.soundFile
      console.log('Would play alarm sound:', alarm?.soundFile);
    } catch (error) {
      console.error('Error playing alarm sound:', error);
    }
  };

  const stopAlarmSound = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    } catch (error) {
      console.error('Error stopping alarm sound:', error);
    }
  };

  const handleSnooze = () => {
    Vibration.cancel();
    stopAlarmSound();
    onSnooze();
  };

  const handleDismiss = () => {
    Vibration.cancel();
    stopAlarmSound();
    onDismiss();
  };

  const getCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Current Time */}
      <View style={styles.timeContainer}>
        <Text style={styles.currentTime}>{getCurrentTime()}</Text>
      </View>

      {/* Pulsing Circle */}
      <View style={styles.centerContainer}>
        <Animated.View 
          style={[
            styles.pulsingCircle,
            {
              transform: [{ scale: pulseAnim }]
            }
          ]}
        />
        
        {/* Shaking Bell Icon */}
        <Animated.View 
          style={[
            styles.iconContainer,
            {
              transform: [{ rotate: shakeAnim.interpolate({
                inputRange: [-10, 10],
                outputRange: ['-10deg', '10deg']
              }) }]
            }
          ]}
        >
          <Icon name="alarm" size={80} color="#FFFFFF" />
        </Animated.View>
      </View>

      {/* Alarm Info */}
      <View style={styles.alarmInfoContainer}>
        <Text style={styles.alarmName}>{alarm?.name || 'Alarm'}</Text>
        <Text style={styles.alarmDescription}>
          {alarm?.description || 'Time to wake up!'}
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity 
          style={styles.snoozeButton}
          onPress={handleSnooze}
          activeOpacity={0.8}
        >
          <Icon name="snooze" size={24} color="#FFFFFF" />
          <Text style={styles.buttonText}>SNOOZE</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.dismissButton}
          onPress={handleDismiss}
          activeOpacity={0.8}
        >
          <Icon name="stop" size={24} color="#FFFFFF" />
          <Text style={styles.buttonText}>DISMISS</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    zIndex: 9999,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 60,
  },
  timeContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  currentTime: {
    fontSize: 60,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'SF Pro Display',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pulsingCircle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#FF0000',
    opacity: 0.3,
  },
  iconContainer: {
    zIndex: 1,
  },
  alarmInfoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  alarmName: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  alarmDescription: {
    fontSize: 17,
    color: '#8E8E93',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 20,
    paddingHorizontal: 40,
  },
  snoozeButton: {
    flex: 1,
    backgroundColor: '#FF9500',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dismissButton: {
    flex: 1,
    backgroundColor: '#FF0000',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default AlarmOverlay;