import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  PanResponder,
  Dimensions,
  Animated,
  StatusBar,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

// Scene configurations based on time of day
const SCENES = {
  bedroom: {
    name: 'Bedroom',
    colors: ['#0f0f23', '#1a1a3a', '#2d2d5f'],
    emoji: '🌙',
    description: 'Night time',
    spaceshipSpeed: 0.3,
    droneCount: 1
  },
  neighborhood: {
    name: 'Neighborhood', 
    colors: ['#ff9a9e', '#fecfef', '#87ceeb'],
    emoji: '🏘️',
    description: 'Morning',
    spaceshipSpeed: 0.7,
    droneCount: 2
  },
  beach: {
    name: 'Beach',
    colors: ['#74b9ff', '#0984e3', '#fdcb6e'],
    emoji: '🏖️',
    description: 'Afternoon',
    spaceshipSpeed: 1.0,
    droneCount: 3
  },
  city: {
    name: 'City',
    colors: ['#fd79a8', '#e84393', '#74b9ff'],
    emoji: '🌆',
    description: 'Evening',
    spaceshipSpeed: 0.8,
    droneCount: 2
  }
};

const KnobAlarmSetter = ({ navigation, route }) => {
  // Time state
  const [selectedTime, setSelectedTime] = useState({ hours: 7, minutes: 0 });
  const [currentScene, setCurrentScene] = useState('neighborhood');
  const [displayTime, setDisplayTime] = useState('7:00 AM');
  
  // Animation values
  const knobPosition = useRef(new Animated.Value(29.2)).current; // Start at 7:00 AM (29.2%)
  const sceneOpacity = useRef(new Animated.Value(1)).current;
  const spaceshipX = useRef(new Animated.Value(-100)).current;
  const droneY = useRef(new Animated.Value(0)).current;

  // Knob slider dimensions
  const sliderWidth = width - 60;
  const sliderHeight = 8;
  const knobSize = 24;

  useEffect(() => {
    // Start animations
    startSpaceshipAnimation();
    startDroneAnimation();
  }, [currentScene]);

  // Calculate time from knob position (0-100%)
  const calculateTimeFromPosition = (position) => {
    const totalMinutes = (position / 100) * 1440; // 24 hours = 1440 minutes
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = Math.floor(totalMinutes % 60);
    
    // Magnetic snap to common times
    let adjustedMinutes = minutes;
    if (minutes >= 57 || minutes <= 3) adjustedMinutes = 0;
    else if (minutes >= 27 && minutes <= 33) adjustedMinutes = 30;
    
    return { hours, minutes: adjustedMinutes };
  };

  // Format time for display
  const formatTime = (hours, minutes) => {
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Get scene based on time
  const getSceneForTime = (hours) => {
    if (hours >= 20 || hours < 6) return 'bedroom';      // 8PM-6AM
    if (hours >= 6 && hours < 12) return 'neighborhood'; // 6AM-12PM
    if (hours >= 12 && hours < 17) return 'beach';      // 12PM-5PM
    if (hours >= 17 && hours < 20) return 'city';       // 5PM-8PM
    return 'neighborhood';
  };

  // Haptic feedback for hour marks
  const triggerHapticForTime = (hours) => {
    const keyHours = [6, 7, 8, 9, 12, 17, 18, 19, 22];
    if (keyHours.includes(hours)) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // Pan responder for knob
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    onPanResponderMove: (evt, gestureState) => {
      const newPosition = Math.max(0, Math.min(100, (gestureState.moveX - 30) / sliderWidth * 100));
      
      // Update knob position
      knobPosition.setValue(newPosition);
      
      // Calculate new time
      const newTime = calculateTimeFromPosition(newPosition);
      setSelectedTime(newTime);
      setDisplayTime(formatTime(newTime.hours, newTime.minutes));
      
      // Check for scene change
      const newScene = getSceneForTime(newTime.hours);
      if (newScene !== currentScene) {
        setCurrentScene(newScene);
        triggerHapticForTime(newTime.hours);
        transitionScene();
      }
    },
    onPanResponderRelease: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  });

  // Scene transition animation
  const transitionScene = () => {
    Animated.sequence([
      Animated.timing(sceneOpacity, {
        toValue: 0.7,
        duration: 200,
        useNativeDriver: false
      }),
      Animated.timing(sceneOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false
      })
    ]).start();
  };

  // Spaceship animation
  const startSpaceshipAnimation = () => {
    const scene = SCENES[currentScene];
    const duration = 15000 / scene.spaceshipSpeed;
    
    spaceshipX.setValue(-100);
    Animated.loop(
      Animated.timing(spaceshipX, {
        toValue: width + 100,
        duration: duration,
        useNativeDriver: false
      })
    ).start();
  };

  // Drone hovering animation
  const startDroneAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(droneY, {
          toValue: -15,
          duration: 2000,
          useNativeDriver: false
        }),
        Animated.timing(droneY, {
          toValue: 15,
          duration: 2000,
          useNativeDriver: false
        })
      ])
    ).start();
  };

  // Quick time jump
  const jumpToTime = (targetHours) => {
    const targetPosition = (targetHours / 24) * 100;
    const newTime = { hours: targetHours, minutes: 0 };
    
    Animated.spring(knobPosition, {
      toValue: targetPosition,
      tension: 100,
      friction: 8,
      useNativeDriver: false
    }).start();
    
    setSelectedTime(newTime);
    setDisplayTime(formatTime(newTime.hours, newTime.minutes));
    
    const newScene = getSceneForTime(newTime.hours);
    if (newScene !== currentScene) {
      setCurrentScene(newScene);
      transitionScene();
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  // Save alarm
  const saveAlarm = () => {
    const alarmData = {
      time: `${selectedTime.hours.toString().padStart(2, '0')}:${selectedTime.minutes.toString().padStart(2, '0')}`,
      displayTime: displayTime,
      scene: currentScene,
      enabled: true
    };
    
    Alert.alert(
      'Alarm Set!',
      `Your alarm is set for ${displayTime}`,
      [
        { text: 'View Alarms', onPress: () => navigation.navigate('Alarms') },
        { text: 'Set Another', style: 'cancel' }
      ]
    );
  };

  const scene = SCENES[currentScene];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Animated Background Scene */}
      <Animated.View style={[styles.sceneBackground, { opacity: sceneOpacity }]}>
        <LinearGradient
          colors={scene.colors}
          style={styles.gradient}
        />
        
        {/* Scene Elements */}
        <View style={styles.sceneElements}>
          <Text style={styles.sceneEmoji}>{scene.emoji}</Text>
          <Text style={styles.sceneDescription}>{scene.description}</Text>
        </View>
        
        {/* Flying Spaceship */}
        <Animated.View 
          style={[
            styles.spaceship,
            { 
              transform: [{ translateX: spaceshipX }],
              top: height * 0.15
            }
          ]}
        >
          <Text style={styles.spaceshipIcon}>🚀</Text>
          <View style={styles.adBanner}>
            <Text style={styles.adText}>Set your perfect wake time!</Text>
          </View>
        </Animated.View>
        
        {/* Hovering Drones */}
        {Array.from({ length: scene.droneCount }).map((_, index) => (
          <Animated.View
            key={index}
            style={[
              styles.drone,
              {
                transform: [{ translateY: droneY }],
                right: 50 + (index * 80),
                top: height * 0.25 + (index * 60)
              }
            ]}
          >
            <Text style={styles.droneIcon}>🚁</Text>
          </Animated.View>
        ))}
      </Animated.View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Set Alarm</Text>
        <TouchableOpacity 
          style={styles.listButton}
          onPress={() => navigation.navigate('Alarms')}
        >
          <Icon name="list" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Time Display */}
      <View style={styles.timeDisplay}>
        <Text style={styles.timeText}>{displayTime}</Text>
        <Text style={styles.sceneLabel}>{scene.name}</Text>
      </View>

      {/* Knob Slider */}
      <View style={styles.sliderContainer}>
        {/* Time Markers */}
        <View style={styles.timeMarkers}>
          <TouchableOpacity onPress={() => jumpToTime(0)}>
            <Text style={styles.markerText}>12AM</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => jumpToTime(6)}>
            <Text style={styles.markerText}>6AM</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => jumpToTime(12)}>
            <Text style={styles.markerText}>12PM</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => jumpToTime(18)}>
            <Text style={styles.markerText}>6PM</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => jumpToTime(23)}>
            <Text style={styles.markerText}>12AM</Text>
          </TouchableOpacity>
        </View>
        
        {/* Slider Track */}
        <View style={styles.sliderTrack}>
          {/* Knob */}
          <Animated.View
            style={[
              styles.knob,
              {
                transform: [{
                  translateX: knobPosition.interpolate({
                    inputRange: [0, 100],
                    outputRange: [0, sliderWidth - knobSize]
                  })
                }]
              }
            ]}
            {...panResponder.panHandlers}
          >
            <LinearGradient
              colors={['#FF6B6B', '#FF8E53']}
              style={styles.knobGradient}
            />
          </Animated.View>
        </View>
      </View>

      {/* Quick Time Buttons */}
      <View style={styles.quickTimes}>
        <TouchableOpacity 
          style={styles.quickButton}
          onPress={() => jumpToTime(6)}
        >
          <Text style={styles.quickButtonText}>6 AM</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.quickButton}
          onPress={() => jumpToTime(7)}
        >
          <Text style={styles.quickButtonText}>7 AM</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.quickButton}
          onPress={() => jumpToTime(8)}
        >
          <Text style={styles.quickButtonText}>8 AM</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.quickButton}
          onPress={() => jumpToTime(22)}
        >
          <Text style={styles.quickButtonText}>10 PM</Text>
        </TouchableOpacity>
      </View>

      {/* Save Button */}
      <TouchableOpacity style={styles.saveButton} onPress={saveAlarm}>
        <LinearGradient
          colors={['#FF6B6B', '#FF8E53']}
          style={styles.saveGradient}
        >
          <Text style={styles.saveText}>Set Alarm</Text>
          <Icon name="alarm" size={24} color="white" />
        </LinearGradient>
      </TouchableOpacity>
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
  sceneElements: {
    position: 'absolute',
    top: height * 0.1,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  sceneEmoji: {
    fontSize: 60,
    marginBottom: 10,
  },
  sceneDescription: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  spaceship: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceshipIcon: {
    fontSize: 30,
    marginRight: 10,
  },
  adBanner: {
    backgroundColor: 'rgba(255, 107, 107, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  adText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  drone: {
    position: 'absolute',
  },
  droneIcon: {
    fontSize: 24,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  listButton: {
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
    marginBottom: 40,
    zIndex: 10,
  },
  timeText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  sceneLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
    fontWeight: '500',
  },
  sliderContainer: {
    marginHorizontal: 30,
    marginBottom: 30,
    zIndex: 10,
  },
  timeMarkers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  markerText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontWeight: '500',
  },
  sliderTrack: {
    height: sliderHeight,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: sliderHeight / 2,
    position: 'relative',
  },
  knob: {
    position: 'absolute',
    width: knobSize,
    height: knobSize,
    top: -8,
    borderRadius: knobSize / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  knobGradient: {
    width: '100%',
    height: '100%',
    borderRadius: knobSize / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickTimes: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 30,
    marginBottom: 30,
    zIndex: 10,
  },
  quickButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  quickButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    marginHorizontal: 30,
    marginBottom: 40,
    borderRadius: 25,
    overflow: 'hidden',
    zIndex: 10,
  },
  saveGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  saveText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default KnobAlarmSetter;