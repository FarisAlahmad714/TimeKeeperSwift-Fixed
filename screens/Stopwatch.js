import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Animated
} from 'react-native';
// Removed react-native-paper to fix font error
import Icon from 'react-native-vector-icons/MaterialIcons';
import StorageService from '../src/services/StorageService';
import { COLORS, STOPWATCH_SETTINGS } from '../src/utils/constants';

const { width } = Dimensions.get('window');

export default function StopWatchScreen() {
  const [time, setTime] = useState(0); // in centiseconds (1/100th of a second)
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState([]);
  const intervalRef = useRef(null);
  const rotationAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadLaps();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (running) {
      // Start continuous rotation animation
      Animated.loop(
        Animated.timing(rotationAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      rotationAnim.stopAnimation();
    }
  }, [running]);

  const loadLaps = async () => {
    const savedLaps = await StorageService.loadStopwatchLaps();
    setLaps(savedLaps);
  };

  const startStopwatch = () => {
    setRunning(true);
    intervalRef.current = setInterval(() => {
      setTime(prevTime => prevTime + 1);
    }, STOPWATCH_SETTINGS.updateInterval);
  };

  const stopStopwatch = () => {
    setRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const resetStopwatch = async () => {
    setRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setTime(0);
    
    // Clear laps
    await StorageService.clearLaps();
    setLaps([]);
    rotationAnim.setValue(0);
  };

  const addLap = async () => {
    if (running && laps.length < STOPWATCH_SETTINGS.maxLaps) {
      const lapTime = time;
      const lapNumber = laps.length + 1;
      const previousLapTime = laps.length > 0 ? laps[laps.length - 1].time : 0;
      const lapDuration = lapTime - previousLapTime;
      
      const newLap = {
        id: Date.now().toString(),
        number: lapNumber,
        time: lapTime,
        duration: lapDuration,
        timestamp: new Date().toISOString(),
      };
      
      const updatedLaps = await StorageService.addLap(newLap);
      setLaps(updatedLaps);
    }
  };

  const formatTime = (centiseconds) => {
    const totalMs = centiseconds * 10;
    const minutes = Math.floor(totalMs / 60000);
    const seconds = Math.floor((totalMs % 60000) / 1000);
    const milliseconds = Math.floor((totalMs % 1000) / 10);
    
    return {
      display: `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`,
      minutes,
      seconds,
      milliseconds
    };
  };

  const timeData = formatTime(time);
  
  // Calculate hand angles for analog clock
  const secondAngle = (timeData.seconds * 6) + (timeData.milliseconds * 6 / 100); // 360/60 = 6 degrees per second
  const minuteAngle = (timeData.minutes * 6) + (timeData.seconds * 0.1); // 360/60 = 6 degrees per minute

  const renderLapItem = ({ item, index }) => {
    const lapTimeData = formatTime(item.duration);
    const totalTimeData = formatTime(item.time);
    
    return (
      <View style={styles.lapCard}>
        <View style={styles.lapContent}>
          <Text style={styles.lapNumber}>Lap {item.number}</Text>
          <Text style={styles.lapTime}>{lapTimeData.display}</Text>
          <Text style={styles.totalTime}>{totalTimeData.display}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Analog Clock */}
      <View style={styles.clockContainer}>
        <View style={styles.analogClock}>
          {/* Clock face markings */}
          {Array.from({ length: 60 }, (_, i) => (
            <View
              key={i}
              style={[
                styles.clockMarking,
                {
                  transform: [
                    { rotate: `${i * 6}deg` },
                    { translateY: -width * 0.35 },
                  ],
                },
                i % 5 === 0 && styles.majorMarking,
              ]}
            />
          ))}
          
          {/* Minute hand */}
          <Animated.View
            style={[
              styles.clockHand,
              styles.minuteHand,
              {
                transform: [
                  { rotate: `${minuteAngle}deg` },
                ],
              },
            ]}
          />
          
          {/* Second hand */}
          <Animated.View
            style={[
              styles.clockHand,
              styles.secondHand,
              {
                transform: [
                  { rotate: `${secondAngle}deg` },
                ],
              },
            ]}
          />
          
          {/* Center dot */}
          <View style={styles.centerDot} />
        </View>
      </View>
      
      {/* Digital Display */}
      <View style={styles.digitalContainer}>
        <Text style={styles.digitalTime}>{timeData.display}</Text>
      </View>
      
      {/* Control Buttons */}
      <View style={styles.controlContainer}>
        <TouchableOpacity
          style={[styles.fab, running ? styles.stopFab : styles.startFab]}
          onPress={running ? stopStopwatch : startStopwatch}
        >
          <Icon name={running ? "pause" : "play-arrow"} size={30} color="white" />
        </TouchableOpacity>
        
        {running && (
          <TouchableOpacity
            style={[styles.fab, styles.lapFab]}
            onPress={addLap}
            disabled={laps.length >= STOPWATCH_SETTINGS.maxLaps}
          >
            <Icon name="flag" size={30} color="white" />
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[styles.fab, styles.resetFab]}
          onPress={resetStopwatch}
          disabled={running}
        >
          <Icon name="refresh" size={30} color="white" />
        </TouchableOpacity>
      </View>
      
      {/* Lap Times */}
      {laps.length > 0 && (
        <View style={styles.lapContainer}>
          <Text style={styles.lapTitle}>Lap Times</Text>
          <FlatList
            data={[...laps].reverse()}
            keyExtractor={item => item.id}
            renderItem={renderLapItem}
            showsVerticalScrollIndicator={false}
            style={styles.lapList}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.space.background,
    padding: 20,
  },
  clockContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  analogClock: {
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    borderWidth: 4,
    borderColor: COLORS.space.primary,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: COLORS.space.surface,
  },
  clockMarking: {
    position: 'absolute',
    width: 2,
    height: 15,
    backgroundColor: COLORS.textSecondary,
  },
  majorMarking: {
    width: 3,
    height: 25,
    backgroundColor: COLORS.textPrimary,
  },
  clockHand: {
    position: 'absolute',
    backgroundColor: COLORS.accent,
    transformOrigin: 'bottom',
  },
  minuteHand: {
    width: 4,
    height: width * 0.25,
    backgroundColor: COLORS.space.primary,
  },
  secondHand: {
    width: 2,
    height: width * 0.3,
    backgroundColor: COLORS.accent,
  },
  centerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.accent,
    position: 'absolute',
    zIndex: 10,
  },
  digitalContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  digitalTime: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    fontFamily: 'monospace',
  },
  controlContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    marginVertical: 20,
  },
  fab: {
    elevation: 8,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startFab: {
    backgroundColor: COLORS.success,
  },
  stopFab: {
    backgroundColor: COLORS.warning,
  },
  lapFab: {
    backgroundColor: COLORS.info,
  },
  resetFab: {
    backgroundColor: COLORS.error,
  },
  lapContainer: {
    flex: 1,
    marginTop: 20,
  },
  lapTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  lapList: {
    flex: 1,
  },
  lapCard: {
    backgroundColor: COLORS.space.surface,
    marginBottom: 8,
  },
  lapContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lapNumber: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  lapTime: {
    color: COLORS.space.primary,
    fontSize: 16,
    fontFamily: 'monospace',
    flex: 1,
    textAlign: 'center',
  },
  totalTime: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontFamily: 'monospace',
    flex: 1,
    textAlign: 'right',
  },
});
