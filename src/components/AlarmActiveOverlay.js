import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  BackHandler
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Audio } from 'expo-av';
// import * as Haptics from 'expo-haptics'; // Commented out to prevent crashes

const { width, height } = Dimensions.get('window');

const AlarmActiveOverlay = ({ 
  visible, 
  alarm, 
  onSnooze, 
  onDismiss,
  currentTime 
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [sound, setSound] = useState(null);
  
  useEffect(() => {
    if (visible) {
      // Start animations
      startPulseAnimation();
      startShakeAnimation();
      fadeIn();
      
      // Load and play alarm sound
      loadAndPlaySound();
      
      // Haptic feedback - commented out to prevent crashes
      // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      
      // Prevent back button dismissal
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
      
      return () => {
        backHandler.remove();
        stopSound();
      };
    } else {
      fadeOut();
      stopSound();
    }
  }, [visible]);

  const loadAndPlaySound = async () => {
    try {
      const soundFile = getSoundFile(alarm?.ringtone || 'default');
      const { sound: audioSound } = await Audio.loadAsync(soundFile);
      setSound(audioSound);
      
      // Configure audio session for background playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });
      
      // Play sound in loop
      await audioSound.setIsLoopingAsync(true);
      await audioSound.playAsync();
    } catch (error) {
      console.error('Error loading alarm sound:', error);
    }
  };

  const stopSound = async () => {
    if (sound) {
      try {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
      } catch (error) {
        console.error('Error stopping sound:', error);
      }
    }
  };

  const getSoundFile = (ringtone) => {
    const soundMap = {
      'default': require('../../assets/sounds/default.mp3'),
      'Ringtone1': require('../../assets/sounds/Ringtone1.mp3'),
      'Ringtone2': require('../../assets/sounds/Ringtone2.mp3'),
      'Ringtone3': require('../../assets/sounds/Ringtone3.mp3'),
    };
    return soundMap[ringtone] || soundMap['default'];
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startShakeAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: 10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const fadeIn = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const fadeOut = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleSnooze = async () => {
    // await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); // Commented out to prevent crashes
    stopSound();
    onSnooze();
  };

  const handleDismiss = async () => {
    // await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); // Commented out to prevent crashes
    stopSound();
    onDismiss();
  };

  if (!visible) return null;

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      <StatusBar backgroundColor="rgba(0,0,0,0.9)" barStyle="light-content" />
      
      {/* Background */}
      <View style={styles.backgroundContainer}>
        <View style={styles.gradientBackground} />
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        {/* Current Time */}
        <Text style={styles.currentTime}>
          {currentTime}
        </Text>

        {/* Alarm Info */}
        <View style={styles.alarmInfo}>
          <Text style={styles.alarmName}>{alarm?.name || 'Alarm'}</Text>
          <Text style={styles.alarmDescription}>
            {alarm?.description || 'Wake up!'}
          </Text>
        </View>

        {/* Pulsing Circle with Icon */}
        <Animated.View 
          style={[
            styles.alarmCircle,
            {
              transform: [
                { scale: pulseAnim },
                { translateX: shakeAnim }
              ]
            }
          ]}
        >
          <Icon name="alarm" size={120} color="#FFFFFF" />
        </Animated.View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.snoozeButton]}
            onPress={handleSnooze}
            activeOpacity={0.8}
          >
            <Icon name="snooze" size={30} color="#FFFFFF" />
            <Text style={styles.buttonText}>Snooze</Text>
            <Text style={styles.buttonSubtext}>9 min</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.dismissButton]}
            onPress={handleDismiss}
            activeOpacity={0.8}
          >
            <Icon name="stop" size={30} color="#FFFFFF" />
            <Text style={styles.buttonText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    elevation: 999,
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  gradientBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  currentTime: {
    fontSize: 60,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 30,
    textAlign: 'center',
  },
  alarmInfo: {
    alignItems: 'center',
    marginBottom: 50,
  },
  alarmName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  alarmDescription: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 22,
  },
  alarmCircle: {
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#FF0000',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 80,
    shadowColor: '#FF0000',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
  },
  actionButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  snoozeButton: {
    backgroundColor: '#2196F3',
    shadowColor: '#2196F3',
  },
  dismissButton: {
    backgroundColor: '#F44336',
    shadowColor: '#F44336',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
  },
  buttonSubtext: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
  },
});

export default AlarmActiveOverlay;