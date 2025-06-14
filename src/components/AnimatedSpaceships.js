import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS, ANIMATION_SETTINGS } from '../utils/constants';

const { width, height } = Dimensions.get('window');

const Spaceship = ({ type, onPress, delay = 0 }) => {
  const translateX = useRef(new Animated.Value(-100)).current;
  const translateY = useRef(new Animated.Value(Math.random() * height * 0.6)).current;
  const rotation = useRef(new Animated.Value(0)).current;
  const thrusterScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const startAnimation = () => {
      // Reset position
      translateX.setValue(-100);
      
      // Main movement animation
      Animated.timing(translateX, {
        toValue: width + 100,
        duration: 15000 + Math.random() * 10000, // 15-25 seconds
        useNativeDriver: true,
        delay: delay,
      }).start(() => {
        // Loop animation
        setTimeout(startAnimation, Math.random() * 5000);
      });

      // Thruster animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(thrusterScale, {
            toValue: 1.3,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(thrusterScale, {
            toValue: 0.8,
            duration: 200,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Occasional direction changes
      const directionChange = () => {
        const newY = Math.random() * height * 0.6;
        const newRotation = (Math.random() - 0.5) * 30; // -15 to 15 degrees
        
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: newY,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(rotation, {
            toValue: newRotation,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]).start();
        
        setTimeout(directionChange, 3000 + Math.random() * 7000);
      };
      
      setTimeout(directionChange, 2000);
    };

    startAnimation();
  }, []);

  const getSpaceshipIcon = () => {
    switch (type) {
      case 'explorer':
        return 'rocket-launch';
      case 'cruiser':
        return 'flight';
      case 'fighter':
        return 'airplanemode-active';
      default:
        return 'rocket-launch';
    }
  };

  const getSpaceshipColor = () => {
    switch (type) {
      case 'explorer':
        return COLORS.space.primary;
      case 'cruiser':
        return COLORS.space.secondary;
      case 'fighter':
        return COLORS.space.accent;
      default:
        return COLORS.space.primary;
    }
  };

  return (
    <Animated.View
      style={[
        styles.spaceship,
        {
          transform: [
            { translateX },
            { translateY },
            { rotate: rotation.interpolate({
              inputRange: [-30, 30],
              outputRange: ['-30deg', '30deg'],
            })},
          ],
        },
      ]}
    >
      <TouchableOpacity onPress={onPress} style={styles.spaceshipContainer}>
        {/* Thruster flames */}
        <Animated.View
          style={[
            styles.thruster,
            {
              transform: [{ scaleX: thrusterScale }],
            },
          ]}
        >
          <Icon name="whatshot" size={12} color="#FF6B00" />
          <Icon name="whatshot" size={8} color="#FFD700" />
        </Animated.View>
        
        {/* Spaceship body */}
        <Icon 
          name={getSpaceshipIcon()} 
          size={type === 'cruiser' ? 40 : 32} 
          color={getSpaceshipColor()} 
        />
        
        {/* Ad banner */}
        <View style={styles.adBanner}>
          <Icon name="star" size={8} color="#FFD700" />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const AnimatedSpaceships = ({ visible = true, onSpaceshipPress }) => {
  if (!visible) return null;

  const spaceshipTypes = ANIMATION_SETTINGS.spaceship.types;
  
  return (
    <View style={styles.container} pointerEvents="box-none">
      {spaceshipTypes.map((type, index) => (
        <Spaceship
          key={`${type}-${index}`}
          type={type}
          delay={index * 3000}
          onPress={() => onSpaceshipPress && onSpaceshipPress(type)}
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
  spaceship: {
    position: 'absolute',
    zIndex: 2,
  },
  spaceshipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  thruster: {
    flexDirection: 'row',
    marginRight: 4,
    alignItems: 'center',
  },
  adBanner: {
    marginLeft: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 4,
    padding: 2,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
});

export default AnimatedSpaceships;