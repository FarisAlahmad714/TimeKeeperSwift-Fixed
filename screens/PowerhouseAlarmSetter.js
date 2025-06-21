import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  interpolate,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { PanGestureHandler, TapGestureHandler } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Polygon, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ConfettiCannon from 'react-native-confetti-cannon';
import StarField from '../components/StarField';

const { width, height } = Dimensions.get('window');

// Animation constants
const KNOB_SIZE = 32;
const SLIDER_WIDTH = width - 80;
const SLIDER_HEIGHT = 12;
const SCENE_TRANSITION_DURATION = 800;

// Scene configurations with advanced visual properties
const SCENES = {
  bedroom: {
    name: 'Bedroom',
    colors: ['#0f0f23', '#1a1a3a', '#2d2d5f', '#0f0f23'],
    emoji: '🌙',
    description: 'Night time',
    stars: 50,
    spaceshipCount: 1,
    spaceshipSpeed: 0.3,
    droneCount: 1,
    atmosphereIntensity: 0.8,
  },
  neighborhood: {
    name: 'Neighborhood',
    colors: ['#ff9a9e', '#fecfef', '#87ceeb', '#ffd89b'],
    emoji: '🏘️',
    description: 'Morning',
    stars: 0,
    spaceshipCount: 2,
    spaceshipSpeed: 0.7,
    droneCount: 2,
    atmosphereIntensity: 0.6,
  },
  beach: {
    name: 'Beach',
    colors: ['#74b9ff', '#0984e3', '#fdcb6e', '#e17055'],
    emoji: '🏖️',
    description: 'Afternoon',
    stars: 0,
    spaceshipCount: 4,
    spaceshipSpeed: 1.0,
    droneCount: 3,
    atmosphereIntensity: 0.3,
  },
  city: {
    name: 'City',
    colors: ['#fd79a8', '#e84393', '#74b9ff', '#2d3436'],
    emoji: '🌆',
    description: 'Evening',
    stars: 20,
    spaceshipCount: 3,
    spaceshipSpeed: 0.8,
    droneCount: 2,
    atmosphereIntensity: 0.7,
  }
};

// SVG Spaceship Component with Physics
const AnimatedSpaceship = ({ scene, index, onAdTap }) => {
  const translateX = useSharedValue(-150);
  const translateY = useSharedValue(Math.random() * 100 + 50);
  const rotation = useSharedValue(0);
  const thrusterOpacity = useSharedValue(0.3);
  const bannerSwing = useSharedValue(0);

  useEffect(() => {
    // Horizontal movement with varying speeds
    const duration = (20000 / scene.spaceshipSpeed) + (index * 2000);
    
    translateX.value = withRepeat(
      withTiming(width + 150, {
        duration: duration,
        easing: Easing.linear,
      }),
      -1,
      false
    );

    // Subtle vertical floating
    translateY.value = withRepeat(
      withSequence(
        withTiming(translateY.value - 20, { duration: 3000 + index * 500 }),
        withTiming(translateY.value + 20, { duration: 3000 + index * 500 })
      ),
      -1,
      true
    );

    // Enhanced thruster pulsing with realistic engine cycles
    thrusterOpacity.value = withRepeat(
      withSequence(
        withTiming(0.9 + Math.random() * 0.1, { 
          duration: 150 + Math.random() * 100,
          easing: Easing.inOut(Easing.quad)
        }),
        withTiming(0.4 + Math.random() * 0.2, { 
          duration: 150 + Math.random() * 100,
          easing: Easing.inOut(Easing.quad)
        }),
        withTiming(0.7 + Math.random() * 0.2, { 
          duration: 100 + Math.random() * 50,
          easing: Easing.inOut(Easing.quad)
        })
      ),
      -1,
      false
    );

    // Banner physics - realistic pendulum swing with air resistance
    bannerSwing.value = withRepeat(
      withSequence(
        withSpring(12 + Math.random() * 6, { 
          damping: 15 + Math.random() * 10, 
          stiffness: 80 + Math.random() * 40,
          mass: 1 + Math.random() * 0.5
        }),
        withSpring(-12 - Math.random() * 6, { 
          damping: 15 + Math.random() * 10, 
          stiffness: 80 + Math.random() * 40,
          mass: 1 + Math.random() * 0.5
        })
      ),
      -1,
      true
    );
  }, [scene.spaceshipSpeed, index]);

  const spaceshipStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotation.value}deg` }
    ],
  }));

  const thrusterStyle = useAnimatedStyle(() => ({
    opacity: thrusterOpacity.value,
  }));

  const bannerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${bannerSwing.value}deg` }],
  }));

  return (
    <Animated.View style={[styles.spaceshipContainer, spaceshipStyle]}>
      {/* Advanced SVG Spaceship */}
      <Svg width="60" height="30" viewBox="0 0 60 30">
        <Defs>
          <SvgGradient id="shipGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#74b9ff" />
            <Stop offset="50%" stopColor="#0984e3" />
            <Stop offset="100%" stopColor="#2d3436" />
          </SvgGradient>
        </Defs>
        
        {/* Main ship body */}
        <Path
          d="M10,15 L45,10 L50,15 L45,20 L10,15 Z"
          fill="url(#shipGradient)"
          stroke="#2d3436"
          strokeWidth="1"
        />
        
        {/* Ship wings */}
        <Path d="M15,15 L25,8 L35,15 L25,22 Z" fill="#636e72" />
        <Path d="M15,15 L25,8 L35,15 L25,22 Z" fill="#636e72" />
        
        {/* Cockpit */}
        <Circle cx="42" cy="15" r="4" fill="#00cec9" opacity="0.8" />
      </Svg>

      {/* Enhanced Thruster flames with multiple layers */}
      <Animated.View style={[styles.thruster, thrusterStyle]}>
        <Svg width="25" height="18" viewBox="0 0 25 18">
          <Defs>
            <SvgGradient id="thrusterGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#fd79a8" stopOpacity="0.9" />
              <Stop offset="50%" stopColor="#fdcb6e" stopOpacity="0.8" />
              <Stop offset="100%" stopColor="#e17055" stopOpacity="0.6" />
            </SvgGradient>
            <SvgGradient id="thrusterCore" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#ff7675" stopOpacity="1" />
              <Stop offset="100%" stopColor="#fdcb6e" stopOpacity="0.9" />
            </SvgGradient>
          </Defs>
          
          {/* Outer flame */}
          <Path
            d="M2,9 L18,4 L22,9 L18,14 L2,9 Z"
            fill="url(#thrusterGradient)"
          />
          
          {/* Inner core */}
          <Path
            d="M6,9 L15,6 L18,9 L15,12 L6,9 Z"
            fill="url(#thrusterCore)"
          />
          
          {/* Hot spot */}
          <Path
            d="M10,9 L14,7.5 L16,9 L14,10.5 L10,9 Z"
            fill="#ffffff"
            opacity="0.6"
          />
        </Svg>
      </Animated.View>

      {/* Ad Banner with Enhanced Physics */}
      <Animated.View style={[styles.adBanner, bannerStyle]}>
        <TouchableOpacity onPress={onAdTap} activeOpacity={0.8}>
          <LinearGradient
            colors={['#74b9ff', '#0984e3']}
            style={styles.bannerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.bannerText}>⚡ Quick Alarm!</Text>
          </LinearGradient>
          <View style={styles.bannerShadow} />
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

// SVG Drone Component with Advanced Physics
const AnimatedDrone = ({ scene, index }) => {
  const translateX = useSharedValue(width * 0.2 + index * 120);
  const translateY = useSharedValue(height * 0.3 + index * 80);
  const rotorRotation1 = useSharedValue(0);
  const rotorRotation2 = useSharedValue(0);
  const hoverY = useSharedValue(0);
  const bannerSwing = useSharedValue(0);

  useEffect(() => {
    // Hovering motion with individual patterns
    hoverY.value = withRepeat(
      withSequence(
        withTiming(-15 - index * 5, { 
          duration: 2000 + index * 300,
          easing: Easing.inOut(Easing.sin)
        }),
        withTiming(15 + index * 5, { 
          duration: 2000 + index * 300,
          easing: Easing.inOut(Easing.sin)
        })
      ),
      -1,
      true
    );

    // Rotor spinning - different speeds for realism
    rotorRotation1.value = withRepeat(
      withTiming(360, { duration: 100, easing: Easing.linear }),
      -1,
      false
    );

    rotorRotation2.value = withRepeat(
      withTiming(-360, { duration: 120, easing: Easing.linear }),
      -1,
      false
    );

    // Enhanced drone banner physics with turbulence
    bannerSwing.value = withRepeat(
      withSequence(
        withSpring((Math.random() * 16 - 8) + index * 2, { 
          damping: 12 + index * 3,
          stiffness: 60 + Math.random() * 30,
          mass: 0.8 + index * 0.2
        }),
        withSpring((Math.random() * -16 + 8) - index * 2, { 
          damping: 12 + index * 3,
          stiffness: 60 + Math.random() * 30,
          mass: 0.8 + index * 0.2
        })
      ),
      -1,
      true
    );
  }, [index]);

  const droneStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value + hoverY.value }
    ],
  }));

  const rotor1Style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotorRotation1.value}deg` }],
  }));

  const rotor2Style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotorRotation2.value}deg` }],
  }));

  const bannerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${bannerSwing.value}deg` }],
  }));

  return (
    <Animated.View style={[styles.droneContainer, droneStyle]}>
      {/* Advanced SVG Drone */}
      <Svg width="50" height="40" viewBox="0 0 50 40">
        <Defs>
          <SvgGradient id="droneGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#636e72" />
            <Stop offset="100%" stopColor="#2d3436" />
          </SvgGradient>
        </Defs>
        
        {/* Drone body */}
        <Circle cx="25" cy="20" r="8" fill="url(#droneGradient)" />
        
        {/* Camera gimbal */}
        <Circle cx="25" cy="25" r="3" fill="#00cec9" opacity="0.8" />
      </Svg>

      {/* Animated Rotors */}
      <Animated.View style={[styles.rotor, { top: 5, left: 5 }, rotor1Style]}>
        <Svg width="15" height="15" viewBox="0 0 15 15">
          <Path d="M1,7.5 L14,7.5 M7.5,1 L7.5,14" stroke="#2d3436" strokeWidth="2" />
        </Svg>
      </Animated.View>

      <Animated.View style={[styles.rotor, { top: 5, right: 5 }, rotor2Style]}>
        <Svg width="15" height="15" viewBox="0 0 15 15">
          <Path d="M1,7.5 L14,7.5 M7.5,1 L7.5,14" stroke="#2d3436" strokeWidth="2" />
        </Svg>
      </Animated.View>

      {/* Hanging Banner */}
      <View style={styles.droneChain}>
        <View style={[styles.chainLink, { height: 20 }]} />
        <Animated.View style={[styles.droneBanner, bannerStyle]}>
          <LinearGradient
            colors={['#fd79a8', '#e84393']}
            style={styles.droneBannerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.droneBannerText}>🕒 Timer!</Text>
          </LinearGradient>
          <View style={styles.droneBannerShadow} />
        </Animated.View>
      </View>
    </Animated.View>
  );
};

// Advanced Knob Component with Reanimated 2
const PowerKnob = ({ onTimeChange, initialPosition = 29.2 }) => {
  const translateX = useSharedValue(initialPosition);
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  const gestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      scale.value = withSpring(1.2);
      glowOpacity.value = withTiming(1, { duration: 200 });
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    },
    onActive: (event) => {
      const newPosition = Math.max(0, Math.min(100, (event.absoluteX - 40) / SLIDER_WIDTH * 100));
      translateX.value = newPosition;
      
      // Calculate time from position
      const totalMinutes = (newPosition / 100) * 1440;
      const hours = Math.floor(totalMinutes / 60) % 24;
      const minutes = Math.floor(totalMinutes % 60);
      
      runOnJS(onTimeChange)(hours, minutes);
    },
    onEnd: () => {
      scale.value = withSpring(1);
      glowOpacity.value = withTiming(0, { duration: 300 });
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
    },
  });

  const knobStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: (translateX.value / 100) * (SLIDER_WIDTH - KNOB_SIZE) },
      { scale: scale.value }
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <View style={styles.sliderContainer}>
      {/* Slider Track */}
      <View style={styles.sliderTrack} />
      
      {/* Knob Glow Effect */}
      <Animated.View style={[styles.knobGlow, glowStyle, knobStyle]} />
      
      {/* Main Knob */}
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={[styles.knob, knobStyle]}>
          <LinearGradient
            colors={['#74b9ff', '#0984e3', '#2d3436']}
            style={styles.knobGradient}
          >
            <View style={styles.knobCenter} />
          </LinearGradient>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

// Main Powerhouse Component
const PowerhouseAlarmSetter = ({ navigation }) => {
  const [selectedTime, setSelectedTime] = useState({ hours: 7, minutes: 0 });
  const [currentScene, setCurrentScene] = useState('neighborhood');
  const [displayTime, setDisplayTime] = useState('7:00 AM');
  const [showConfetti, setShowConfetti] = useState(false);

  // Request notification permissions on component mount
  useEffect(() => {
    const requestNotificationPermissions = async () => {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        await Notifications.requestPermissionsAsync();
      }
    };
    
    requestNotificationPermissions();
  }, []);

  // Shared values for scene transitions
  const sceneOpacity = useSharedValue(1);
  const timeScale = useSharedValue(1);
  const backgroundShift = useSharedValue(0);

  const formatTime = (hours, minutes) => {
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const getSceneForTime = (hours) => {
    if (hours >= 20 || hours < 6) return 'bedroom';
    if (hours >= 6 && hours < 12) return 'neighborhood';
    if (hours >= 12 && hours < 17) return 'beach';
    if (hours >= 17 && hours < 20) return 'city';
    return 'neighborhood';
  };

  const handleTimeChange = (hours, minutes) => {
    // Magnetic snap to common times
    let adjustedMinutes = minutes;
    if (minutes >= 57 || minutes <= 3) adjustedMinutes = 0;
    else if (minutes >= 27 && minutes <= 33) adjustedMinutes = 30;

    setSelectedTime({ hours, minutes: adjustedMinutes });
    setDisplayTime(formatTime(hours, adjustedMinutes));

    const newScene = getSceneForTime(hours);
    if (newScene !== currentScene) {
      setCurrentScene(newScene);
      
      // Scene transition animations
      sceneOpacity.value = withSequence(
        withTiming(0.3, { duration: SCENE_TRANSITION_DURATION / 2 }),
        withTiming(1, { duration: SCENE_TRANSITION_DURATION / 2 })
      );
      
      backgroundShift.value = withSpring(Math.random() * 20 - 10);
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }

    // Time display animation
    timeScale.value = withSequence(
      withSpring(1.1, { duration: 150 }),
      withSpring(1, { duration: 150 })
    );
  };

  const handleAdTap = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
    
    try {
      const quickEvent = await createQuickAlarm();
      
      Alert.alert(
        '🚀 Ad Banner Recurring Set!', 
        `"${quickEvent.eventName}" created!\n\n⏰ Repeats every weekday at ${displayTime}\n🎯 Created via ad banner interaction!\n\n${quickEvent.alarms.length} recurring alarms set!`,
        [
          { text: 'View Alarms', onPress: () => navigation.navigate('AlarmsList') },
          { text: 'Awesome!', style: 'default' }
        ]
      );
    } catch (error) {
      Alert.alert(
        'Quick Set Failed',
        'Unable to create alarm. Please try the main SET ALARM button.',
        [{ text: 'OK' }]
      );
    }
  };

  // Helper functions for Quick Set
  const generateEventId = () => `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const generateAlarmId = () => `alarm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const createQuickAlarm = async () => {
    try {
      // Load existing events
      const savedEvents = await AsyncStorage.getItem('eventAlarms');
      const existingEvents = savedEvents ? JSON.parse(savedEvents) : [];
      
      // Get appropriate day name (today if time hasn't passed, tomorrow if it has)
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const now = new Date();
      const targetTime = new Date();
      targetTime.setHours(selectedTime.hours, selectedTime.minutes, 0, 0);
      
      let targetDay;
      if (targetTime <= now) {
        // Time has passed today, use tomorrow
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        targetDay = dayNames[tomorrow.getDay()];
      } else {
        // Time hasn't passed today, use today
        targetDay = dayNames[now.getDay()];
      }
      
      // Create quick alarm event with recurring alarms for all weekdays
      const alarmTime = `${selectedTime.hours.toString().padStart(2, '0')}:${selectedTime.minutes.toString().padStart(2, '0')}`;
      const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      
      const quickEvent = {
        id: generateEventId(),
        eventName: `Quick Alarm ${displayTime}`,
        description: `Recurring weekday alarm set from Powerhouse Alarm Setter`,
        ringtone: 'Melodic Morning.mp3',
        isEnabled: true,
        createdAt: new Date().toISOString(),
        alarms: weekdays.map(day => ({
          id: generateAlarmId(),
          day: day,
          time: alarmTime,
          description: `Wake up! Set via ${scene.name} scene`,
          enabled: true
        }))
      };
      
      // Add to events list
      const updatedEvents = [...existingEvents, quickEvent];
      await AsyncStorage.setItem('eventAlarms', JSON.stringify(updatedEvents));
      
      // Schedule notification
      await scheduleQuickAlarmNotification(quickEvent);
      
      return quickEvent;
    } catch (error) {
      console.error('Error creating quick alarm:', error);
      throw error;
    }
  };

  const scheduleQuickAlarmNotification = async (event) => {
    try {
      console.log('Scheduling recurring alarms for event:', event.eventName);
      
      // Day mapping for notifications (0=Sunday, 1=Monday, ..., 6=Saturday)
      const dayMapping = {
        'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
        'Thursday': 4, 'Friday': 5, 'Saturday': 6
      };
      
      // Schedule notifications for each alarm (weekday)
      for (const alarm of event.alarms) {
        const [hours, minutes] = alarm.time.split(':').map(Number);
        const weekday = dayMapping[alarm.day];
        
        if (weekday === undefined) {
          console.error('Invalid day:', alarm.day);
          continue;
        }
        
        // Schedule repeating weekly notification
        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: event.eventName,
            body: `${alarm.day} - ${alarm.description || 'Time to wake up!'}`,
            sound: event.ringtone,
            data: { 
              eventId: event.id, 
              alarmId: alarm.id,
              type: 'recurring_alarm',
              day: alarm.day
            }
          },
          trigger: {
            weekday: weekday + 1, // iOS uses 1-7 (1=Sunday, 2=Monday, etc.)
            hour: hours,
            minute: minutes,
            repeats: true,
          },
        });
        
        console.log(`Scheduled recurring alarm for ${alarm.day} at ${alarm.time}, ID: ${notificationId}`);
      }
      
      // Schedule immediate test notification (1 minute from now)
      const now = new Date();
      const testDate = new Date(now.getTime() + 60000);
      const testId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `TEST: ${event.eventName}`,
          body: 'Recurring alarm test (1 min delay) - Your alarms are now set to repeat weekly!',
          sound: event.ringtone,
          data: { 
            eventId: event.id,
            type: 'test_recurring'
          }
        },
        trigger: testDate,
      });
      
      console.log('Test notification scheduled with ID:', testId, 'for:', testDate.toLocaleString());
      
    } catch (error) {
      console.error('Error scheduling recurring alarm notifications:', error);
    }
  };

  const handleSetAlarm = () => {
    // Create a vibrant feedback when setting alarm
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2000);
    
    Alert.alert(
      '⏰ Create Alarm',
      `Set an alarm for ${displayTime}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Create Event Alarm', 
          onPress: () => navigation.navigate('AlarmsList', {
            prefilledTime: {
              hours: selectedTime.hours,
              minutes: selectedTime.minutes,
              displayTime: displayTime
            }
          }),
          style: 'default'
        },
        {
          text: 'Quick Set',
          onPress: async () => {
            try {
              const quickEvent = await createQuickAlarm();
              
              // Show success and navigate to alarms list
              Alert.alert(
                '🎉 Recurring Alarm Set!',
                `"${quickEvent.eventName}" created successfully!\n\n⏰ Will repeat every weekday (Mon-Fri) at ${displayTime}\n🎬 Scene: ${scene.name}\n\n${quickEvent.alarms.length} alarms scheduled!`,
                [
                  { text: 'View Alarms', onPress: () => navigation.navigate('AlarmsList') },
                  { text: 'Set Another', style: 'default' }
                ]
              );
            } catch (error) {
              Alert.alert(
                'Error',
                'Failed to create quick alarm. Please try again.',
                [{ text: 'OK' }]
              );
            }
          }
        }
      ]
    );
  };

  const scene = SCENES[currentScene];

  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: sceneOpacity.value,
    transform: [{ translateX: backgroundShift.value }],
  }));

  const timeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: timeScale.value }],
  }));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Dynamic Background Scene */}
      <Animated.View style={[styles.sceneBackground, backgroundStyle]}>
        <LinearGradient
          colors={scene.colors}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        
        {/* Star Field for Night Scenes */}
        <StarField 
          starCount={scene.stars} 
          isVisible={currentScene === 'bedroom' || currentScene === 'city'} 
        />
      </Animated.View>

      {/* Flying Spaceships */}
      {Array.from({ length: scene.spaceshipCount }).map((_, index) => (
        <AnimatedSpaceship
          key={`spaceship-${index}`}
          scene={scene}
          index={index}
          onAdTap={handleAdTap}
        />
      ))}

      {/* Hovering Drones */}
      {Array.from({ length: scene.droneCount }).map((_, index) => (
        <AnimatedDrone
          key={`drone-${index}`}
          scene={scene}
          index={index}
        />
      ))}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.navigate('AlarmsList')}
        >
          <Icon name="list" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Power Alarm</Text>
        <TouchableOpacity style={styles.settingsButton}>
          <Icon name="settings" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Time Display */}
      <View style={styles.timeDisplay}>
        <Animated.Text style={[styles.timeText, timeStyle]}>
          {displayTime}
        </Animated.Text>
        <Text style={styles.sceneLabel}>
          {scene.emoji} {scene.name} • {scene.description}
        </Text>
        <Text style={styles.timeHint}>
          Drag knob to set your perfect wake time
        </Text>
      </View>

      {/* Power Knob Slider */}
      <PowerKnob onTimeChange={handleTimeChange} />

      {/* Time Markers */}
      <View style={styles.timeMarkers}>
        <Text style={styles.markerText}>12AM</Text>
        <Text style={styles.markerText}>6AM</Text>
        <Text style={styles.markerText}>12PM</Text>
        <Text style={styles.markerText}>6PM</Text>
        <Text style={styles.markerText}>12AM</Text>
      </View>

      {/* Action Button */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSetAlarm}>
        <LinearGradient
          colors={['#74b9ff', '#0984e3']}
          style={styles.saveGradient}
        >
          <Text style={styles.saveText}>🚀 SET ALARM</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Confetti Effect */}
      {showConfetti && (
        <ConfettiCannon
          count={200}
          origin={{ x: width / 2, y: 0 }}
          explosionSpeed={350}
          fallSpeed={3000}
          colors={['#74b9ff', '#0984e3', '#fd79a8', '#fdcb6e', '#00cec9']}
          autoStart={true}
          autoStartDelay={0}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  sceneBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradient: {
    flex: 1,
  },
  spaceshipContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 5,
  },
  thruster: {
    marginLeft: -10,
  },
  adBanner: {
    marginLeft: 15,
  },
  bannerGradient: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
  },
  bannerText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  bannerShadow: {
    position: 'absolute',
    top: 2,
    left: 2,
    right: 2,
    bottom: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 16,
    zIndex: -1,
  },
  droneContainer: {
    position: 'absolute',
    zIndex: 5,
  },
  rotor: {
    position: 'absolute',
  },
  droneChain: {
    position: 'absolute',
    top: 35,
    left: 20,
    alignItems: 'center',
  },
  chainLink: {
    width: 2,
    backgroundColor: '#636e72',
  },
  droneBanner: {
    marginTop: 5,
  },
  droneBannerGradient: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 4,
  },
  droneBannerText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
  droneBannerShadow: {
    position: 'absolute',
    top: 1,
    left: 1,
    right: 1,
    bottom: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: 10,
    zIndex: -1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: StatusBar.currentHeight + 10,
    paddingHorizontal: 20,
    paddingBottom: 10,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeDisplay: {
    alignItems: 'center',
    marginTop: height * 0.25,
    marginBottom: 60,
    zIndex: 10,
  },
  timeText: {
    fontSize: 64,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 8,
  },
  sceneLabel: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 12,
    fontWeight: '500',
  },
  timeHint: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 8,
    fontStyle: 'italic',
  },
  sliderContainer: {
    marginHorizontal: 40,
    marginBottom: 30,
    zIndex: 10,
    height: 50,
    justifyContent: 'center',
  },
  sliderTrack: {
    height: SLIDER_HEIGHT,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: SLIDER_HEIGHT / 2,
    position: 'absolute',
    width: SLIDER_WIDTH,
  },
  knobGlow: {
    position: 'absolute',
    width: KNOB_SIZE + 20,
    height: KNOB_SIZE + 20,
    borderRadius: (KNOB_SIZE + 20) / 2,
    backgroundColor: '#74b9ff',
    top: -14,
    left: -10,
  },
  knob: {
    position: 'absolute',
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    top: -10,
    borderRadius: KNOB_SIZE / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  knobGradient: {
    width: '100%',
    height: '100%',
    borderRadius: KNOB_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  knobCenter: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
  },
  timeMarkers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 40,
    marginBottom: 40,
    zIndex: 10,
  },
  markerText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    marginHorizontal: 40,
    marginBottom: 40,
    borderRadius: 30,
    overflow: 'hidden',
    zIndex: 10,
  },
  saveGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  saveText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default PowerhouseAlarmSetter;