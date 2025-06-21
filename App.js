import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import NewAlarms from './screens/NewAlarms';
import WorldClockScreen from './screens/WorldClockScreen';
import PowerhouseAlarmSetter from './screens/PowerhouseAlarmSetter';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Alarms Stack Navigator
function AlarmsStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyleInterpolator: ({ current, layouts }) => {
          return {
            cardStyle: {
              transform: [
                {
                  translateX: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [layouts.screen.width, 0],
                  }),
                },
              ],
            },
          };
        },
      }}
    >
      <Stack.Screen name="PowerhouseAlarmSetter" component={PowerhouseAlarmSetter} />
      <Stack.Screen name="AlarmsList" component={NewAlarms} />
    </Stack.Navigator>
  );
}

// Full Timer Screen
function TimerScreen() {
  const [hours, setHours] = React.useState(0);
  const [minutes, setMinutes] = React.useState(5);
  const [seconds, setSeconds] = React.useState(0);
  const [totalSeconds, setTotalSeconds] = React.useState(0);
  const [running, setRunning] = React.useState(false);
  const intervalRef = React.useRef(null);

  React.useEffect(() => {
    if (totalSeconds === 0 && running) {
      setRunning(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      alert('Timer Complete!');
    }
  }, [totalSeconds, running]);

  const startTimer = () => {
    const total = hours * 3600 + minutes * 60 + seconds;
    if (total === 0) return;
    
    setTotalSeconds(total);
    setRunning(true);
    
    intervalRef.current = setInterval(() => {
      setTotalSeconds(prevTime => {
        if (prevTime <= 1) return 0;
        return prevTime - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    setRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setTotalSeconds(0);
  };

  const formatTime = (totalSecs) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.screen}>
      {!running ? (
        <>
          <Text style={styles.title}>Set Timer</Text>
          <View style={styles.timeInputContainer}>
            <View style={styles.timeInput}>
              <Text style={styles.inputLabel}>Hours</Text>
              <Text style={styles.timeValue} onPress={() => setHours((h) => (h + 1) % 24)}>{hours}</Text>
            </View>
            <View style={styles.timeInput}>
              <Text style={styles.inputLabel}>Minutes</Text>
              <Text style={styles.timeValue} onPress={() => setMinutes((m) => (m + 1) % 60)}>{minutes}</Text>
            </View>
            <View style={styles.timeInput}>
              <Text style={styles.inputLabel}>Seconds</Text>
              <Text style={styles.timeValue} onPress={() => setSeconds((s) => (s + 1) % 60)}>{seconds}</Text>
            </View>
          </View>
          <View style={styles.quickButtons}>
            <TouchableOpacity style={styles.quickButton} onPress={() => { setHours(0); setMinutes(1); setSeconds(0); }}>
              <Text style={styles.quickButtonText}>1m</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickButton} onPress={() => { setHours(0); setMinutes(5); setSeconds(0); }}>
              <Text style={styles.quickButtonText}>5m</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickButton} onPress={() => { setHours(0); setMinutes(25); setSeconds(0); }}>
              <Text style={styles.quickButtonText}>25m</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.button} onPress={startTimer}>
            <Text style={styles.buttonText}>Start Timer</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.title}>Timer Running</Text>
          <Text style={styles.timerDisplay}>{formatTime(totalSeconds)}</Text>
          <TouchableOpacity style={[styles.button, styles.stopButton]} onPress={stopTimer}>
            <Text style={styles.buttonText}>Stop Timer</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

// Full Stopwatch Screen
function StopwatchScreen() {
  const [time, setTime] = React.useState(0);
  const [running, setRunning] = React.useState(false);
  const [laps, setLaps] = React.useState([]);
  const intervalRef = React.useRef(null);

  const startStopwatch = () => {
    setRunning(true);
    intervalRef.current = setInterval(() => {
      setTime(prevTime => prevTime + 1);
    }, 10);
  };

  const stopStopwatch = () => {
    setRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const resetStopwatch = () => {
    setRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setTime(0);
    setLaps([]);
  };

  const addLap = () => {
    if (running) {
      const lapTime = time;
      const lapNumber = laps.length + 1;
      setLaps([...laps, { number: lapNumber, time: lapTime }]);
    }
  };

  const formatTime = (centiseconds) => {
    const totalMs = centiseconds * 10;
    const minutes = Math.floor(totalMs / 60000);
    const seconds = Math.floor((totalMs % 60000) / 1000);
    const milliseconds = Math.floor((totalMs % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Stopwatch</Text>
      <Text style={styles.timerDisplay}>{formatTime(time)}</Text>
      
      <View style={styles.stopwatchButtons}>
        <TouchableOpacity 
          style={[styles.button, running ? styles.stopButton : styles.startButton]} 
          onPress={running ? stopStopwatch : startStopwatch}
        >
          <Text style={styles.buttonText}>{running ? 'Stop' : 'Start'}</Text>
        </TouchableOpacity>
        
        {running && (
          <TouchableOpacity style={styles.button} onPress={addLap}>
            <Text style={styles.buttonText}>Lap</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity style={styles.button} onPress={resetStopwatch}>
          <Text style={styles.buttonText}>Reset</Text>
        </TouchableOpacity>
      </View>

      {laps.length > 0 && (
        <View style={styles.lapsContainer}>
          <Text style={styles.lapsTitle}>Laps</Text>
          {laps.slice().reverse().map((lap) => (
            <Text key={lap.number} style={styles.lapText}>
              Lap {lap.number}: {formatTime(lap.time)}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}



export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            switch (route.name) {
              case 'Alarms':
                iconName = 'alarm';
                break;
              case 'World Clock':
                iconName = 'schedule';
                break;
              case 'Timer':
                iconName = 'timer';
                break;
              case 'Stopwatch':
                iconName = 'av-timer';
                break;
              default:
                iconName = 'circle';
            }
            return <Icon name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#FF0000',
          tabBarInactiveTintColor: '#8E8E93',
          tabBarStyle: {
            backgroundColor: '#1C1C1E',
          },
          headerStyle: {
            backgroundColor: '#000000',
          },
          headerTintColor: '#FFFFFF',
        })}
      >
        <Tab.Screen name="Alarms" component={AlarmsStackNavigator} />
        <Tab.Screen name="World Clock" component={WorldClockScreen} />
        <Tab.Screen name="Timer" component={TimerScreen} />
        <Tab.Screen name="Stopwatch" component={StopwatchScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    color: '#FFFFFF',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#FF0000',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    margin: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    textAlign: 'center',
  },
  
  // Timer styles
  timeInputContainer: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  timeInput: {
    alignItems: 'center',
    marginHorizontal: 20,
  },
  inputLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 10,
  },
  timeValue: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 60,
    textAlign: 'center',
  },
  quickButtons: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  quickButton: {
    backgroundColor: '#06B6D4',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 15,
    marginHorizontal: 5,
  },
  quickButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  timerDisplay: {
    fontSize: 48,
    color: '#FFFFFF',
    fontFamily: 'monospace',
    marginBottom: 30,
  },
  stopButton: {
    backgroundColor: '#FF3B30',
  },
  startButton: {
    backgroundColor: '#34C759',
  },
  
  // Stopwatch styles
  stopwatchButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 30,
  },
  lapsContainer: {
    maxHeight: 200,
    width: '100%',
  },
  lapsTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  lapText: {
    color: '#CCCCCC',
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 2,
  },
  
  // Common styles
  emptyText: {
    color: '#CCCCCC',
    fontSize: 18,
    marginBottom: 30,
  },
  
  // Alarm styles
  alarmsContainer: {
    width: '100%',
    maxHeight: 300,
    marginBottom: 20,
  },
  alarmItem: {
    flexDirection: 'row',
    backgroundColor: '#24243e',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  alarmInfo: {
    flex: 1,
  },
  alarmTime: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  alarmName: {
    color: '#CCCCCC',
    fontSize: 16,
  },
  alarmControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    marginRight: 10,
  },
  enabled: {
    backgroundColor: '#4CAF50',
  },
  disabled: {
    backgroundColor: '#666666',
  },
  toggleText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#F44336',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  
  // Modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#24243e',
    borderRadius: 15,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  textInputContainer: {
    backgroundColor: '#0F0C29',
    borderRadius: 8,
    marginBottom: 15,
  },
  textInput: {
    color: '#FFFFFF',
    fontSize: 16,
    padding: 12,
  },
  timeButton: {
    backgroundColor: '#8B5CF6',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  timeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  modalButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: '#666666',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  
  // Time control styles
  timeControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  timeControlGroup: {
    alignItems: 'center',
  },
  timeControlLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 10,
  },
  timeControlButtons: {
    flexDirection: 'row',
  },
  timeControlButton: {
    backgroundColor: '#8B5CF6',
    width: 35,
    height: 35,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  timeControlButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  
  // World Clock styles
  clocksContainer: {
    width: '100%',
    maxHeight: 300,
    marginBottom: 20,
  },
  clockItem: {
    flexDirection: 'row',
    backgroundColor: '#24243e',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  clockInfo: {
    flex: 1,
  },
  cityName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cityTime: {
    color: '#8B5CF6',
    fontSize: 20,
    fontFamily: 'monospace',
  },
  cityDate: {
    color: '#CCCCCC',
    fontSize: 14,
  },
});