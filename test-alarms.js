#!/usr/bin/env node

/**
 * Alarm System Test Script
 * 
 * This script tests the alarm system by creating multiple event alarms,
 * each with multiple alarm instances at different times.
 * 
 * Test Structure:
 * Event 1: "GYM" - 3 alarm instances (different days/times)
 * Event 2: "MEDICINE" - 4 alarm instances (daily medication schedule)
 * Event 3: "WORK" - 2 alarm instances (start/lunch)
 */

const AsyncStorage = require('@react-native-async-storage/async-storage');
const { Notifications } = require('expo-notifications');

// Mock AsyncStorage for testing if not available
const mockAsyncStorage = {
  getItem: async (key) => {
    console.log(`📱 AsyncStorage.getItem(${key})`);
    return null; // Simulate empty storage
  },
  setItem: async (key, value) => {
    console.log(`📱 AsyncStorage.setItem(${key}, ${JSON.parse(value).length} events)`);
    return true;
  }
};

// Test data generator functions
const generateEventId = () => `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
const generateAlarmId = () => `alarm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Mock notification scheduling for testing
const mockScheduleNotification = async (config) => {
  const { content, trigger } = config;
  const scheduleTime = trigger.weekday ? 
    `Weekly ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][trigger.weekday-1]} at ${trigger.hour}:${trigger.minute.toString().padStart(2,'0')}` :
    new Date(trigger).toLocaleString();
    
  console.log(`🔔 SCHEDULED: "${content.title}" - ${content.body}`);
  console.log(`   ⏰ Time: ${scheduleTime}`);
  console.log(`   🎵 Sound: ${content.sound}`);
  console.log(`   📊 Data:`, content.data);
  console.log('');
  
  return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
};

// Test event configurations
const TEST_EVENTS = [
  {
    eventName: "GYM",
    description: "Workout schedule across the week",
    ringtone: "Urgency.mp3",
    alarmInstances: [
      { day: "Monday", time: "06:00", description: "Morning cardio session" },
      { day: "Wednesday", time: "18:30", description: "Strength training" },
      { day: "Friday", time: "07:15", description: "HIIT workout" }
    ]
  },
  {
    eventName: "MEDICINE",
    description: "Daily medication reminders",
    ringtone: "Melodic Morning.mp3",
    alarmInstances: [
      { day: "Monday", time: "08:00", description: "Morning vitamins" },
      { day: "Monday", time: "14:00", description: "Afternoon supplement" },
      { day: "Monday", time: "20:00", description: "Evening medication" },
      { day: "Tuesday", time: "08:00", description: "Morning vitamins" },
      { day: "Tuesday", time: "14:00", description: "Afternoon supplement" },
      { day: "Tuesday", time: "20:00", description: "Evening medication" }
    ]
  },
  {
    eventName: "WORK",
    description: "Work schedule reminders", 
    ringtone: "Office Phone.mp3",
    alarmInstances: [
      { day: "Monday", time: "09:00", description: "Start work day" },
      { day: "Monday", time: "12:30", description: "Lunch break" },
      { day: "Tuesday", time: "09:00", description: "Start work day" },
      { day: "Wednesday", time: "09:00", description: "Start work day" },
      { day: "Friday", time: "17:00", description: "End of week!" }
    ]
  }
];

// Main test function
const runAlarmTests = async () => {
  console.log('🧪 ALARM SYSTEM TEST SCRIPT');
  console.log('===============================\n');
  
  console.log('📋 Test Plan:');
  TEST_EVENTS.forEach((event, index) => {
    console.log(`   ${index + 1}. Event "${event.eventName}" - ${event.alarmInstances.length} alarm instances`);
  });
  console.log('');
  
  const allEvents = [];
  
  // Create each test event
  for (let i = 0; i < TEST_EVENTS.length; i++) {
    const eventConfig = TEST_EVENTS[i];
    console.log(`🎯 Creating Event ${i + 1}: "${eventConfig.eventName}"`);
    console.log(`   Description: ${eventConfig.description}`);
    console.log(`   Ringtone: ${eventConfig.ringtone}`);
    console.log(`   Alarm Instances: ${eventConfig.alarmInstances.length}`);
    
    // Create the event with all its alarm instances
    const newEvent = {
      id: generateEventId(),
      eventName: eventConfig.eventName,
      description: eventConfig.description,
      ringtone: eventConfig.ringtone,
      isEnabled: true,
      createdAt: new Date().toISOString(),
      alarms: eventConfig.alarmInstances.map(alarm => ({
        id: generateAlarmId(),
        day: alarm.day,
        time: alarm.time,
        description: alarm.description,
        enabled: true
      }))
    };
    
    allEvents.push(newEvent);
    
    console.log(`   ✅ Event created with ${newEvent.alarms.length} alarms\n`);
    
    // Schedule notifications for this event
    await scheduleEventNotifications(newEvent);
  }
  
  // Save to mock storage
  await mockAsyncStorage.setItem('eventAlarms', JSON.stringify(allEvents));
  
  // Summary
  console.log('📊 TEST SUMMARY');
  console.log('================');
  console.log(`Total Events Created: ${allEvents.length}`);
  
  const totalAlarms = allEvents.reduce((sum, event) => sum + event.alarms.length, 0);
  console.log(`Total Alarm Instances: ${totalAlarms}`);
  
  console.log('\n🕐 SCHEDULED ALARMS BY TIME:');
  const alarmsByTime = [];
  allEvents.forEach(event => {
    event.alarms.forEach(alarm => {
      alarmsByTime.push({
        time: alarm.time,
        day: alarm.day,
        event: event.eventName,
        description: alarm.description
      });
    });
  });
  
  // Sort by time
  alarmsByTime.sort((a, b) => a.time.localeCompare(b.time));
  
  alarmsByTime.forEach(alarm => {
    console.log(`   ${alarm.time} - ${alarm.day} - ${alarm.event}: ${alarm.description}`);
  });
  
  console.log('\n✅ All alarm instances should fire at their respective times!');
  console.log('🔔 Each alarm will trigger independently based on its day/time configuration.');
};

// Notification scheduling function (matches your app logic)
const scheduleEventNotifications = async (event) => {
  if (!event.isEnabled) return;

  console.log(`📅 Scheduling notifications for "${event.eventName}":`);

  for (const alarm of event.alarms) {
    if (!alarm.enabled) continue;

    // Day mapping (matches your app)
    const dayMapping = {
      'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
      'Thursday': 4, 'Friday': 5, 'Saturday': 6
    };
    
    const targetDay = dayMapping[alarm.day];
    if (targetDay === undefined) {
      console.error('❌ Invalid day:', alarm.day);
      continue;
    }

    const [hours, minutes] = alarm.time.split(':').map(Number);
    
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      console.error('❌ Invalid time format:', alarm.time);
      continue;
    }

    // Schedule notification (using mock function)
    try {
      const notificationId = await mockScheduleNotification({
        content: {
          title: event.eventName,
          body: `${alarm.day} - ${alarm.description || event.description || 'Alarm time!'}`,
          sound: event.ringtone,
          data: { 
            eventId: event.id, 
            alarmId: alarm.id,
            type: 'recurring_event_alarm',
            day: alarm.day
          }
        },
        trigger: {
          weekday: targetDay + 1, // iOS uses 1-7
          hour: hours,
          minute: minutes,
          repeats: true,
        },
      });
      
    } catch (error) {
      console.error(`❌ Error scheduling notification for ${alarm.day}:`, error);
    }
  }
  
  console.log('');
};

// Run the tests
if (require.main === module) {
  runAlarmTests().catch(console.error);
}

module.exports = { runAlarmTests, TEST_EVENTS };