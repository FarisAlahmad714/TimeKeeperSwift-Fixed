import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import Icon from 'react-native-vector-icons/MaterialIcons';

import TimerScreen from './screens/Timer';
import StopWatchScreen from './screens/Stopwatch';
import Alarms from './screens/Alarms';
import WorldClockScreen from './screens/Worldclock';

// Import our new animation components
import AnimatedSpaceships from './src/components/AnimatedSpaceships';
import AnimatedDrones from './src/components/AnimatedDrones';
import EnvironmentScenes from './src/components/EnvironmentScenes';
import { COLORS } from './src/utils/constants';

const Tab = createBottomTabNavigator();

// Removed Paper theme to fix font error

export default function App() {
  const [showAnimations, setShowAnimations] = useState(true);
  const [currentScene, setCurrentScene] = useState('bedroom');

  const handleSpaceshipPress = (type) => {
    console.log(`Spaceship ${type} pressed!`);
    // You can add premium features here
  };

  const handleDroneAdPress = (type) => {
    console.log(`Drone ${type} ad pressed!`);
    // You can add ad functionality here
  };

  return (
      <View style={styles.appContainer}>
        {/* Environment Scenes Background */}
        <EnvironmentScenes 
          scene={currentScene} 
          visible={showAnimations} 
        />
        
        {/* Animated Elements */}
        <AnimatedSpaceships 
          visible={showAnimations} 
          onSpaceshipPress={handleSpaceshipPress} 
        />
        <AnimatedDrones 
          visible={showAnimations} 
          onAdPress={handleDroneAdPress} 
        />
        
        <NavigationContainer
          theme={{
            dark: true,
            colors: {
              primary: '#8B5CF6',
              background: 'transparent', // Make transparent to show animations
              card: '#24243e',
              text: '#FFFFFF',
              border: '#8B5CF6',
              notification: '#F59E0B',
            },
          }}
        >
        <StatusBar style="light" backgroundColor="#0F0C29" />
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;
              switch (route.name) {
                case 'Timer':
                  iconName = 'timer';
                  break;
                case 'Stopwatch':
                  iconName = 'av-timer';
                  break;
                case 'Alarms':
                  iconName = 'alarm';
                  break;
                case 'World Clock':
                  iconName = 'schedule';
                  break;
                default:
                  iconName = 'circle';
              }
              return <Icon name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#8B5CF6',
            tabBarInactiveTintColor: '#9CA3AF',
            tabBarStyle: {
              backgroundColor: '#1F1F2E',
              borderTopColor: '#8B5CF6',
              borderTopWidth: 1,
              shadowColor: '#8B5CF6',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            },
            headerStyle: {
              backgroundColor: '#0F0C29',
              shadowColor: '#8B5CF6',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: {
              fontWeight: 'bold',
              fontSize: 18,
            },
          })}
        >
          <Tab.Screen 
            name="Timer" 
            component={TimerScreen} 
            options={{
              tabBarLabel: 'Timer',
              headerTitle: '🚀 Timer'
            }}
          />
          <Tab.Screen 
            name="Stopwatch" 
            component={StopWatchScreen} 
            options={{
              tabBarLabel: 'Stopwatch',
              headerTitle: '⏱️ Stopwatch'
            }}
          />
          <Tab.Screen 
            name="Alarms" 
            component={Alarms} 
            options={{
              tabBarLabel: 'Alarms',
              headerTitle: '⏰ Alarms'
            }}
          />
          <Tab.Screen 
            name="World Clock" 
            component={WorldClockScreen} 
            options={{
              tabBarLabel: 'World Clock',
              headerTitle: '🌍 World Clock'
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
      </View>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: COLORS.space.background,
    paddingTop: 50, // Replace SafeAreaProvider with manual padding
  },
});
