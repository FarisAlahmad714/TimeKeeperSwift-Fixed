import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  Text,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS, ANIMATION_SETTINGS } from '../utils/constants';

const { width, height } = Dimensions.get('window');

const ConfettiParticle = ({ onComplete }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const rotation = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: (Math.random() - 0.5) * 200,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: Math.random() * 300 + 100,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.timing(rotation, {
        toValue: Math.random() * 720,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 1500,
        useNativeDriver: true,
      }),
    ]).start(onComplete);
  }, []);

  const colors = ['#FF6B9D', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];
  const color = colors[Math.floor(Math.random() * colors.length)];

  return (
    <Animated.View
      style={[
        styles.confetti,
        {
          backgroundColor: color,
          transform: [
            { translateX },
            { translateY },
            { rotate: rotation.interpolate({
              inputRange: [0, 720],
              outputRange: ['0deg', '720deg'],
            })},
          ],
          opacity,
        },
      ]}
    />
  );
};

const Drone = ({ type, onAdPress, delay = 0 }) => {
  const translateX = useRef(new Animated.Value(-100)).current;
  const translateY = useRef(new Animated.Value(Math.random() * height * 0.5)).current;
  const propellerRotation = useRef(new Animated.Value(0)).current;
  const bannerSway = useRef(new Animated.Value(0)).current;
  const hoverY = useRef(new Animated.Value(0)).current;
  
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiParticles, setConfettiParticles] = useState([]);

  useEffect(() => {
    const startAnimation = () => {
      // Reset position
      translateX.setValue(-100);
      
      // Main movement animation
      Animated.timing(translateX, {
        toValue: width + 100,
        duration: 20000 + Math.random() * 10000, // 20-30 seconds
        useNativeDriver: true,
        delay: delay,
      }).start(() => {
        // Loop animation
        setTimeout(startAnimation, Math.random() * 8000);
      });

      // Propeller rotation
      Animated.loop(
        Animated.timing(propellerRotation, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        })
      ).start();

      // Banner sway
      Animated.loop(
        Animated.sequence([
          Animated.timing(bannerSway, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(bannerSway, {
            toValue: -1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Hover effect
      Animated.loop(
        Animated.sequence([
          Animated.timing(hoverY, {
            toValue: 10,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(hoverY, {
            toValue: -10,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    startAnimation();
  }, []);

  const handleAdPress = () => {
    // Create confetti effect
    const particles = Array.from({ length: 15 }, (_, i) => ({ id: i }));
    setConfettiParticles(particles);
    setShowConfetti(true);
    
    // Call parent handler
    onAdPress && onAdPress(type);
    
    // Clean up confetti after animation
    setTimeout(() => {
      setShowConfetti(false);
      setConfettiParticles([]);
    }, 2000);
  };

  const getDroneIcon = () => {
    switch (type) {
      case 'quadcopter':
        return 'settings';
      case 'hexacopter':
        return 'blur-on';
      default:
        return 'settings';
    }
  };

  const getDroneColor = () => {
    switch (type) {
      case 'quadcopter':
        return COLORS.space.secondary;
      case 'hexacopter':
        return COLORS.space.accent;
      default:
        return COLORS.space.secondary;
    }
  };

  return (
    <Animated.View
      style={[
        styles.drone,
        {
          transform: [
            { translateX },
            { translateY: Animated.add(translateY, hoverY) },
          ],
        },
      ]}
    >
      <View style={styles.droneContainer}>
        {/* Propellers */}
        <View style={styles.propellers}>
          {Array.from({ length: type === 'hexacopter' ? 6 : 4 }, (_, i) => (
            <Animated.View
              key={i}
              style={[
                styles.propeller,
                {
                  transform: [
                    { rotate: propellerRotation.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    })},
                  ],
                },
                type === 'hexacopter' && styles.hexaPropeller,
              ]}
            >
              <Icon name="radio-button-unchecked" size={8} color={getDroneColor()} />
            </Animated.View>
          ))}
        </View>
        
        {/* Drone body */}
        <Icon 
          name={getDroneIcon()} 
          size={24} 
          color={getDroneColor()} 
        />
        
        {/* Ad banner */}
        <Animated.View
          style={[
            styles.droneBanner,
            {
              transform: [
                { rotateZ: bannerSway.interpolate({
                  inputRange: [-1, 1],
                  outputRange: ['-5deg', '5deg'],
                })},
              ],
            },
          ]}
        >
          <TouchableOpacity onPress={handleAdPress} style={styles.bannerContent}>
            <Text style={styles.bannerText}>AD</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
      
      {/* Confetti effect */}
      {showConfetti && (
        <View style={styles.confettiContainer}>
          {confettiParticles.map((particle) => (
            <ConfettiParticle
              key={particle.id}
              onComplete={() => {
                setConfettiParticles(prev => prev.filter(p => p.id !== particle.id));
              }}
            />
          ))}
        </View>
      )}
    </Animated.View>
  );
};

const AnimatedDrones = ({ visible = true, onAdPress }) => {
  if (!visible) return null;

  const droneTypes = ANIMATION_SETTINGS.drone.types;
  
  return (
    <View style={styles.container} pointerEvents="box-none">
      {droneTypes.map((type, index) => (
        <Drone
          key={`${type}-${index}`}
          type={type}
          delay={index * 5000}
          onAdPress={onAdPress}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    pointerEvents: 'box-none',
  },
  drone: {
    position: 'absolute',
    zIndex: 2,
  },
  droneContainer: {
    alignItems: 'center',
    padding: 8,
  },
  propellers: {
    position: 'absolute',
    top: -10,
    left: -15,
    right: -15,
    bottom: -10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  propeller: {
    position: 'absolute',
  },
  hexaPropeller: {
    // Additional styling for hexacopter propellers
  },
  droneBanner: {
    marginTop: 12,
    minWidth: 40,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.space.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  bannerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  bannerText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.space.primary,
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confetti: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default AnimatedDrones;