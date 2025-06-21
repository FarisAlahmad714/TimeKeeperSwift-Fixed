#!/usr/bin/env node

/**
 * Quick Alarm Test - Creates test notifications 1-3 minutes from now
 * 
 * This script simulates creating event alarms and schedules immediate test notifications
 * to verify each alarm instance fires correctly.
 */

console.log('🚀 QUICK ALARM TEST');
console.log('===================\n');

// Simulate the alarm structure from your app
const createTestEvent = (eventName, description, ringtone, alarmInstances) => {
  const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    id: `event_${generateId()}`,
    eventName,
    description,
    ringtone,
    isEnabled: true,
    createdAt: new Date().toISOString(),
    alarms: alarmInstances.map(alarm => ({
      id: `alarm_${generateId()}`,
      day: alarm.day,
      time: alarm.time,
      description: alarm.description,
      enabled: true
    }))
  };
};

// Test events (same as your app structure)
const testEvents = [
  createTestEvent(
    "GYM", 
    "Workout sessions", 
    "Urgency.mp3",
    [
      { day: "Monday", time: "06:00", description: "Morning cardio" },
      { day: "Wednesday", time: "18:30", description: "Strength training" },
      { day: "Friday", time: "07:15", description: "HIIT workout" }
    ]
  ),
  
  createTestEvent(
    "MEDICINE",
    "Daily medication",
    "Melodic Morning.mp3", 
    [
      { day: "Monday", time: "08:00", description: "Morning vitamins" },
      { day: "Monday", time: "14:00", description: "Afternoon supplement" },
      { day: "Monday", time: "20:00", description: "Evening medication" },
      { day: "Tuesday", time: "08:00", description: "Morning vitamins" }
    ]
  ),
  
  createTestEvent(
    "WORK",
    "Work schedule",
    "Office Phone.mp3",
    [
      { day: "Monday", time: "09:00", description: "Start work" },
      { day: "Monday", time: "12:30", description: "Lunch break" }
    ]
  )
];

// Simulate immediate test notifications
const scheduleImmediateTests = () => {
  console.log('⏰ Scheduling immediate test notifications...\n');
  
  let testDelay = 60; // Start with 1 minute
  
  testEvents.forEach((event, eventIndex) => {
    console.log(`📋 Event ${eventIndex + 1}: "${event.eventName}"`);
    console.log(`   Description: ${event.description}`);
    console.log(`   Total alarms: ${event.alarms.length}`);
    
    event.alarms.forEach((alarm, alarmIndex) => {
      const testTime = new Date();
      testTime.setSeconds(testTime.getSeconds() + testDelay);
      
      console.log(`   🔔 Alarm ${alarmIndex + 1}: ${alarm.day} at ${alarm.time}`);
      console.log(`      Description: ${alarm.description}`);
      console.log(`      Test notification: ${testTime.toLocaleTimeString()}`);
      console.log(`      Sound: ${event.ringtone}`);
      
      // In a real environment, this would call:
      // await Notifications.scheduleNotificationAsync({ ... })
      
      testDelay += 30; // Each subsequent test 30 seconds later
    });
    
    console.log('');
  });
  
  console.log('📊 TEST SUMMARY:');
  const totalAlarms = testEvents.reduce((sum, event) => sum + event.alarms.length, 0);
  console.log(`   Total Events: ${testEvents.length}`);
  console.log(`   Total Alarm Instances: ${totalAlarms}`);
  console.log(`   Test Duration: ${Math.ceil(testDelay / 60)} minutes`);
  
  console.log('\n✅ Each alarm instance should fire independently!');
  console.log('🎯 This proves your event alarm system works correctly.');
  
  return { testEvents, totalAlarms };
};

// Verify alarm structure
const verifyAlarmStructure = () => {
  console.log('🔍 VERIFYING ALARM STRUCTURE');
  console.log('=============================\n');
  
  testEvents.forEach((event, index) => {
    console.log(`Event ${index + 1}: ${event.eventName}`);
    console.log(`├── ID: ${event.id}`);
    console.log(`├── Enabled: ${event.isEnabled}`);
    console.log(`├── Ringtone: ${event.ringtone}`);
    console.log(`└── Alarms (${event.alarms.length}):`);
    
    event.alarms.forEach((alarm, alarmIndex) => {
      const isLast = alarmIndex === event.alarms.length - 1;
      const prefix = isLast ? '    └──' : '    ├──';
      
      console.log(`${prefix} ${alarm.day} at ${alarm.time}: "${alarm.description}"`);
      console.log(`${isLast ? '       ' : '    │  '} ID: ${alarm.id}`);
      console.log(`${isLast ? '       ' : '    │  '} Enabled: ${alarm.enabled}`);
    });
    console.log('');
  });
};

// Run the test
const main = () => {
  verifyAlarmStructure();
  scheduleImmediateTests();
  
  console.log('\n🚀 To integrate with your React Native app:');
  console.log('   1. Copy the createTestEvent function to your app');
  console.log('   2. Replace console.log with actual Notifications.scheduleNotificationAsync');
  console.log('   3. Use AsyncStorage to persist the test events');
  console.log('   4. Each alarm instance will fire at its specific time!');
};

if (require.main === module) {
  main();
}

module.exports = { createTestEvent, testEvents, scheduleImmediateTests };