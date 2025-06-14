import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  FlatList,
  Alert,
  TextInput
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
// TouchableOpacity already imported above
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Notifications from 'expo-notifications';
import moment from 'moment';
import StorageService from '../src/services/StorageService';
import AudioService from '../src/services/AudioService';
import { COLORS, TIMER_SETTINGS } from '../src/utils/constants';

const { width } = Dimensions.get('window');

export default function TimerScreen() {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(5);
  const [seconds, setSeconds] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [timerLabel, setTimerLabel] = useState('');
  const [timerHistory, setTimerHistory] = useState([]);
  const intervalRef = useRef(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadTimerHistory();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (totalSeconds === 0 && running) {
      handleTimerComplete();
    }
  }, [totalSeconds, running]);

  const loadTimerHistory = async () => {
    const history = await StorageService.loadTimerHistory();
    setTimerHistory(history);
  };

  const startTimer = () => {
    const total = hours * 3600 + minutes * 60 + seconds;
    if (total === 0) {
      Alert.alert('Invalid Timer', 'Please set a time greater than 0');
      return;
    }

    setTotalSeconds(total);
    setRunning(true);
    setPaused(false);
    
    // Start progress animation
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: total * 1000,
      useNativeDriver: false,
    }).start();

    intervalRef.current = setInterval(() => {
      setTotalSeconds(prevTime => {
        if (prevTime <= 1) {
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
  };

  const pauseTimer = () => {
    if (running && !paused) {
      setPaused(true);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      progressAnim.stopAnimation();
    }
  };

  const resumeTimer = () => {
    if (running && paused) {
      setPaused(false);
      
      // Resume progress animation
      const remaining = totalSeconds;
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: remaining * 1000,
        useNativeDriver: false,
      }).start();

      intervalRef.current = setInterval(() => {
        setTotalSeconds(prevTime => {
          if (prevTime <= 1) {
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
  };

  const stopTimer = () => {
    setRunning(false);
    setPaused(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    progressAnim.stopAnimation();
    progressAnim.setValue(0);
  };

  const resetTimer = () => {
    stopTimer();
    setTotalSeconds(0);
    setHours(0);
    setMinutes(5);
    setSeconds(0);
  };

  const handleTimerComplete = async () => {
    setRunning(false);
    setPaused(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Save to history
    const timerEntry = {
      id: Date.now().toString(),
      label: timerLabel || 'Timer',
      duration: hours * 3600 + minutes * 60 + seconds,
      completedAt: moment().toISOString(),
    };
    
    const newHistory = await StorageService.addTimerEntry(timerEntry);
    setTimerHistory(newHistory);

    // Show notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Timer Complete!',
        body: timerLabel || 'Your timer has finished',
        sound: 'default',
      },
      trigger: null,
    });

    // Play completion sound
    AudioService.playPreviewSound('default');

    Alert.alert('Timer Complete!', timerLabel || 'Your timer has finished');
  };

  const setQuickTimer = (minutes) => {
    setHours(0);
    setMinutes(minutes);
    setSeconds(0);
  };

  const formatTime = (totalSecs) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const renderHistoryItem = ({ item }) => (
    <View style={styles.historyCard}>
      <View style={styles.historyContent}>
        <Text style={styles.historyLabel}>{item.label}</Text>
        <Text style={styles.historyDuration}>{formatTime(item.duration)}</Text>
        <Text style={styles.historyDate}>{moment(item.completedAt).format('MMM DD, YYYY HH:mm')}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {!running ? (
        <>
          {/* Timer Setup */}
          <View style={styles.setupContainer}>
            <TextInput
              style={styles.labelInput}
              placeholder="Timer label (optional)"
              value={timerLabel}
              onChangeText={setTimerLabel}
              placeholderTextColor={COLORS.textSecondary}
            />
            
            {/* Time Pickers */}
            <View style={styles.timePickerContainer}>
              <View style={styles.timePickerSection}>
                <Text style={styles.timePickerLabel}>Hours</Text>
                <Picker
                  selectedValue={hours}
                  onValueChange={setHours}
                  style={styles.timePicker}
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <Picker.Item key={i} label={i.toString()} value={i} />
                  ))}
                </Picker>
              </View>
              
              <View style={styles.timePickerSection}>
                <Text style={styles.timePickerLabel}>Minutes</Text>
                <Picker
                  selectedValue={minutes}
                  onValueChange={setMinutes}
                  style={styles.timePicker}
                >
                  {Array.from({ length: 60 }, (_, i) => (
                    <Picker.Item key={i} label={i.toString()} value={i} />
                  ))}
                </Picker>
              </View>
              
              <View style={styles.timePickerSection}>
                <Text style={styles.timePickerLabel}>Seconds</Text>
                <Picker
                  selectedValue={seconds}
                  onValueChange={setSeconds}
                  style={styles.timePicker}
                >
                  {Array.from({ length: 60 }, (_, i) => (
                    <Picker.Item key={i} label={i.toString()} value={i} />
                  ))}
                </Picker>
              </View>
            </View>
            
            {/* Quick Timer Buttons */}
            <View style={styles.quickTimerContainer}>
              <TouchableOpacity style={styles.quickTimerButton} onPress={() => setQuickTimer(1)}>
                <Text style={styles.quickTimerText}>1m</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickTimerButton} onPress={() => setQuickTimer(5)}>
                <Text style={styles.quickTimerText}>5m</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickTimerButton} onPress={() => setQuickTimer(10)}>
                <Text style={styles.quickTimerText}>10m</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickTimerButton} onPress={() => setQuickTimer(25)}>
                <Text style={styles.quickTimerText}>25m</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      ) : (
        /* Timer Display */
        <View style={styles.timerContainer}>
          <Text style={styles.timerLabel}>{timerLabel || 'Timer'}</Text>
          
          {/* Circular Progress */}
          <View style={styles.progressContainer}>
            <Animated.View 
              style={[
                styles.progressCircle,
                {
                  borderColor: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [COLORS.accent, COLORS.success]
                  })
                }
              ]}
            />
            <Text style={styles.timerDisplay}>{formatTime(totalSeconds)}</Text>
          </View>
          
          {paused && <Text style={styles.pausedText}>PAUSED</Text>}
        </View>
      )}
      
      {/* Control Buttons */}
      <View style={styles.controlContainer}>
        {!running ? (
          <TouchableOpacity
            style={[styles.fab, styles.startFab]}
            onPress={startTimer}
          >
            <Icon name="play-arrow" size={24} color="white" />
            <Text style={styles.fabText}>Start</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.fab, styles.pauseFab]}
              onPress={paused ? resumeTimer : pauseTimer}
            >
              <Icon name={paused ? "play-arrow" : "pause"} size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.fab, styles.stopFab]}
              onPress={stopTimer}
            >
              <Icon name="stop" size={24} color="white" />
            </TouchableOpacity>
          </>
        )}
        
        {!running && (
          <TouchableOpacity
            style={[styles.fab, styles.resetFab]}
            onPress={resetTimer}
          >
            <Icon name="refresh" size={24} color="white" />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Timer History */}
      {timerHistory.length > 0 && !running && (
        <View style={styles.historyContainer}>
          <Text style={styles.historyTitle}>Recent Timers</Text>
          <FlatList
            data={timerHistory.slice(0, 5)}
            keyExtractor={item => item.id}
            renderItem={renderHistoryItem}
            showsVerticalScrollIndicator={false}
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
  setupContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  labelInput: {
    backgroundColor: COLORS.space.surface,
    color: COLORS.textPrimary,
    padding: 15,
    borderRadius: 10,
    marginBottom: 30,
    fontSize: 16,
  },
  timePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  timePickerSection: {
    alignItems: 'center',
    flex: 1,
  },
  timePickerLabel: {
    color: COLORS.textPrimary,
    fontSize: 16,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  timePicker: {
    height: 150,
    width: '100%',
    color: COLORS.textPrimary,
  },
  quickTimerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  quickTimerButton: {
    backgroundColor: COLORS.space.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  quickTimerText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  timerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerLabel: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  progressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  progressCircle: {
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    borderWidth: 8,
    position: 'absolute',
  },
  timerDisplay: {
    color: COLORS.textPrimary,
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  pausedText: {
    color: COLORS.warning,
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  controlContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 20,
  },
  fab: {
    elevation: 8,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabText: {
    color: 'white',
    fontSize: 12,
    marginTop: 2,
  },
  historyContent: {
    padding: 15,
  },
  startFab: {
    backgroundColor: COLORS.success,
  },
  pauseFab: {
    backgroundColor: COLORS.warning,
  },
  stopFab: {
    backgroundColor: COLORS.error,
  },
  resetFab: {
    backgroundColor: COLORS.info,
  },
  historyContainer: {
    maxHeight: 200,
    marginTop: 20,
  },
  historyTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  historyCard: {
    backgroundColor: COLORS.space.surface,
    marginBottom: 8,
  },
  historyLabel: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  historyDuration: {
    color: COLORS.space.primary,
    fontSize: 14,
    marginTop: 2,
  },
  historyDate: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
});
