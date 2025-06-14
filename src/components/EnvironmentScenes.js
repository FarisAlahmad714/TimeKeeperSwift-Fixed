import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS, ENVIRONMENT_SETTINGS } from '../utils/constants';

const { width, height } = Dimensions.get('window');

const MovingElement = ({ icon, size, color, path, duration, delay = 0 }) => {
  const translateX = useRef(new Animated.Value(path.startX || 0)).current;
  const translateY = useRef(new Animated.Value(path.startY || 0)).current;
  const opacity = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    const animate = () => {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: path.endX || width,
          duration: duration,
          useNativeDriver: true,
          delay,
        }),
        Animated.timing(translateY, {
          toValue: path.endY || path.startY || 0,
          duration: duration,
          useNativeDriver: true,
          delay,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(opacity, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0.3,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        ),
      ]).start(() => {
        // Reset and restart
        translateX.setValue(path.startX || 0);
        translateY.setValue(path.startY || 0);
        setTimeout(animate, Math.random() * 3000);
      });
    };

    animate();
  }, []);

  return (
    <Animated.View
      style={[
        styles.movingElement,
        {
          transform: [{ translateX }, { translateY }],
          opacity,
        },
      ]}
    >
      <Icon name={icon} size={size} color={color} />
    </Animated.View>
  );
};

const BedroomScene = ({ visible }) => {
  const catAnimation = useRef(new Animated.Value(0)).current;
  const tvFlicker = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      // Cat movement
      Animated.loop(
        Animated.sequence([
          Animated.timing(catAnimation, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(catAnimation, {
            toValue: 0,
            duration: 3000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // TV flicker
      Animated.loop(
        Animated.sequence([
          Animated.timing(tvFlicker, {
            toValue: 0.7,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(tvFlicker, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.sceneContainer}>
      {/* Background */}
      <View style={[styles.background, { backgroundColor: '#1a1a2e' }]} />
      
      {/* Bed */}
      <View style={styles.bed}>
        <Icon name="hotel" size={40} color="#8B4513" />
        {/* Sleeping person */}
        <Icon name="person" size={24} color="#FFE4B5" style={styles.sleepingPerson} />
      </View>
      
      {/* TV */}
      <Animated.View style={[styles.tv, { opacity: tvFlicker }]}>
        <Icon name="tv" size={32} color="#36454F" />
      </Animated.View>
      
      {/* Cat */}
      <Animated.View
        style={[
          styles.cat,
          {
            transform: [
              {
                translateX: catAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 150],
                }),
              },
            ],
          },
        ]}
      >
        <Icon name="pets" size={20} color="#FF6B35" />
      </Animated.View>
      
      {/* Night sky with stars */}
      <View style={styles.stars}>
        {Array.from({ length: 8 }, (_, i) => (
          <Icon
            key={i}
            name="star"
            size={8}
            color="#FFD700"
            style={[
              styles.star,
              {
                left: Math.random() * width * 0.8,
                top: Math.random() * 100,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const BeachScene = ({ visible }) => {
  if (!visible) return null;

  return (
    <View style={styles.sceneContainer}>
      {/* Background */}
      <View style={[styles.background, { backgroundColor: '#87CEEB' }]} />
      
      {/* Ocean waves */}
      <MovingElement
        icon="waves"
        size={40}
        color="#006994"
        path={{ startX: -50, startY: height * 0.7, endX: width + 50, endY: height * 0.7 }}
        duration={8000}
      />
      
      {/* Palm trees */}
      <View style={styles.palmTrees}>
        <Icon name="park" size={60} color="#228B22" style={{ left: 50 }} />
        <Icon name="park" size={50} color="#228B22" style={{ left: width - 100 }} />
      </View>
      
      {/* Sun */}
      <View style={styles.sun}>
        <Icon name="wb-sunny" size={40} color="#FFD700" />
      </View>
      
      {/* Seagulls */}
      <MovingElement
        icon="airplanemode-active"
        size={16}
        color="#FFFFFF"
        path={{ startX: -30, startY: 100, endX: width + 30, endY: 80 }}
        duration={12000}
        delay={2000}
      />
    </View>
  );
};

const CityScene = ({ visible }) => {
  if (!visible) return null;

  return (
    <View style={styles.sceneContainer}>
      {/* Background */}
      <View style={[styles.background, { backgroundColor: '#2C3E50' }]} />
      
      {/* Buildings */}
      <View style={styles.cityscape}>
        {Array.from({ length: 6 }, (_, i) => (
          <View
            key={i}
            style={[
              styles.building,
              {
                height: 80 + Math.random() * 60,
                left: i * (width / 6),
                backgroundColor: i % 2 === 0 ? '#34495E' : '#2C3E50',
              },
            ]}
          >
            {/* Building windows */}
            {Array.from({ length: 4 }, (_, j) => (
              <View
                key={j}
                style={[
                  styles.window,
                  {
                    backgroundColor: Math.random() > 0.5 ? '#FFD700' : '#2C3E50',
                    top: 10 + j * 15,
                  },
                ]}
              />
            ))}
          </View>
        ))}
      </View>
      
      {/* Moving cars */}
      <MovingElement
        icon="directions-car"
        size={20}
        color="#FF6B35"
        path={{ startX: -30, startY: height * 0.8, endX: width + 30, endY: height * 0.8 }}
        duration={6000}
      />
      
      <MovingElement
        icon="local-taxi"
        size={18}
        color="#FFD700"
        path={{ startX: width + 30, startY: height * 0.85, endX: -30, endY: height * 0.85 }}
        duration={8000}
        delay={3000}
      />
      
      {/* City lights */}
      <View style={styles.cityLights}>
        {Array.from({ length: 12 }, (_, i) => (
          <Icon
            key={i}
            name="brightness-1"
            size={4}
            color="#FFD700"
            style={[
              styles.cityLight,
              {
                left: Math.random() * width,
                top: 50 + Math.random() * 100,
                opacity: Math.random() * 0.8 + 0.2,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const NeighborhoodScene = ({ visible }) => {
  if (!visible) return null;

  return (
    <View style={styles.sceneContainer}>
      {/* Background */}
      <View style={[styles.background, { backgroundColor: '#8FBC8F' }]} />
      
      {/* Houses */}
      <View style={styles.houses}>
        {Array.from({ length: 4 }, (_, i) => (
          <View key={i} style={[styles.house, { left: i * (width / 4) + 20 }]}>
            <Icon name="home" size={40} color="#8B4513" />
          </View>
        ))}
      </View>
      
      {/* Trees */}
      <View style={styles.trees}>
        {Array.from({ length: 6 }, (_, i) => (
          <Icon
            key={i}
            name="park"
            size={30}
            color="#228B22"
            style={[
              styles.tree,
              {
                left: Math.random() * width * 0.8,
                top: height * 0.4 + Math.random() * 60,
              },
            ]}
          />
        ))}
      </View>
      
      {/* Street lamp */}
      <View style={styles.streetLamp}>
        <Icon name="lightbulb-outline" size={24} color="#FFD700" />
      </View>
    </View>
  );
};

const EnvironmentScenes = ({ scene = 'bedroom', visible = true }) => {
  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      <BedroomScene visible={scene === 'bedroom'} />
      <BeachScene visible={scene === 'beach'} />
      <CityScene visible={scene === 'city'} />
      <NeighborhoodScene visible={scene === 'neighborhood'} />
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
    zIndex: 0,
  },
  sceneContainer: {
    flex: 1,
    position: 'relative',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.3,
  },
  movingElement: {
    position: 'absolute',
  },
  
  // Bedroom Scene
  bed: {
    position: 'absolute',
    bottom: height * 0.3,
    left: 50,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sleepingPerson: {
    marginLeft: 10,
    opacity: 0.8,
  },
  tv: {
    position: 'absolute',
    bottom: height * 0.4,
    right: 50,
  },
  cat: {
    position: 'absolute',
    bottom: height * 0.25,
  },
  stars: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  star: {
    position: 'absolute',
    opacity: 0.8,
  },
  
  // Beach Scene
  palmTrees: {
    position: 'absolute',
    bottom: height * 0.3,
    left: 0,
    right: 0,
  },
  sun: {
    position: 'absolute',
    top: 50,
    right: 50,
  },
  
  // City Scene
  cityscape: {
    position: 'absolute',
    bottom: height * 0.3,
    left: 0,
    right: 0,
    height: 200,
  },
  building: {
    position: 'absolute',
    bottom: 0,
    width: width / 6 - 10,
    backgroundColor: '#34495E',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  window: {
    position: 'absolute',
    width: 8,
    height: 8,
    left: 10,
    borderRadius: 2,
  },
  cityLights: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  cityLight: {
    position: 'absolute',
  },
  
  // Neighborhood Scene
  houses: {
    position: 'absolute',
    bottom: height * 0.4,
    left: 0,
    right: 0,
  },
  house: {
    position: 'absolute',
  },
  trees: {
    position: 'absolute',
    bottom: height * 0.3,
    left: 0,
    right: 0,
  },
  tree: {
    position: 'absolute',
  },
  streetLamp: {
    position: 'absolute',
    bottom: height * 0.35,
    left: width * 0.7,
  },
});

export default EnvironmentScenes;