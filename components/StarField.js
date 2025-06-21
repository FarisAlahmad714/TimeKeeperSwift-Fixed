import React, { useEffect } from 'react';
import { View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  interpolate,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

// Generate random stars using regular React Native components
const generateStars = (count) => {
  return Array.from({ length: count }, (_, index) => ({
    id: index,
    x: Math.random() * width,
    y: Math.random() * height,
    size: Math.random() * 3 + 1,
    opacity: Math.random() * 0.8 + 0.2,
    twinkleSpeed: Math.random() * 2000 + 1000,
  }));
};

const StarField = ({ starCount = 50, isVisible = true }) => {
  const stars = generateStars(starCount);
  const fieldOpacity = useSharedValue(isVisible ? 1 : 0);

  useEffect(() => {
    fieldOpacity.value = withTiming(isVisible ? 1 : 0, { duration: 1000 });
  }, [isVisible]);

  const fieldStyle = useAnimatedStyle(() => ({
    opacity: fieldOpacity.value,
  }));

  if (!isVisible) return null;

  return (
    <Animated.View style={[
      {
        position: 'absolute',
        width,
        height,
        zIndex: 1,
      },
      fieldStyle
    ]}>
      {stars.map((star) => (
        <TwinklingStar key={star.id} star={star} />
      ))}
    </Animated.View>
  );
};

const TwinklingStar = ({ star }) => {
  const twinkleOpacity = useSharedValue(star.opacity);

  useEffect(() => {
    twinkleOpacity.value = withRepeat(
      withTiming(star.opacity * 0.3, { duration: star.twinkleSpeed }),
      -1,
      true
    );
  }, []);

  const starStyle = useAnimatedStyle(() => ({
    opacity: twinkleOpacity.value,
    transform: [
      { scale: interpolate(twinkleOpacity.value, [0.2, 1], [0.5, 1.2]) }
    ]
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: star.x,
          top: star.y,
          width: star.size,
          height: star.size,
          backgroundColor: 'white',
          borderRadius: star.size / 2,
        },
        starStyle
      ]}
    />
  );
};

export default StarField;