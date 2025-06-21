import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Switch,
  Alert,
  ScrollView,
  Dimensions,
  StatusBar
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import AlarmOverlay from '../components/AlarmOverlay';

const { width, height } = Dimensions.get('window');

// Days of the week
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Day selection options
const DAY_SELECTION_OPTIONS = [
  { label: 'Every Day', value: 'everyday' },
  { label: 'Every Weekday', value: 'weekdays' },
  { label: 'Every Weekend', value: 'weekends' },
  { label: 'Every 2 Days', value: 'every2days' },
  { label: 'Custom Days', value: 'custom' }
];

// Updated ringtones with the specified ones
const RINGTONES = [
  { label: 'Angels Harp', value: 'Angels Harp.mp3' },
  { label: 'Bell Hammer', value: 'Bell Hammer.mp3' },
  { label: 'Dev Special', value: 'Dev Special.mp3' },
  { label: 'Galactic Ambulance', value: 'Galactic Ambulance.mp3' },
  { label: 'Infinite Lasers', value: 'Infinite Lasers.mp3' },
  { label: 'Jeffery\'s Jingle', value: 'Jeffery\'s Jingle.mp3' },
  { label: 'Matrix Call', value: 'Matrix Call.mp3' },
  { label: 'Melodic Morning', value: 'Melodic Morning.mp3' },
  { label: 'Nuclear Awakening', value: 'Nuclear Awakening.mp3' },
  { label: 'Office Phone', value: 'Office Phone.mp3' },
  { label: 'PBJ Sandwich', value: 'PBJ Sandwich.mp3' },
  { label: 'Urgency', value: 'Urgency.mp3' }
];

const NewAlarms = ({ navigation, route }) => {
  const [events, setEvents] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  // Alarm overlay states
  const [showAlarmOverlay, setShowAlarmOverlay] = useState(false);
  const [activeAlarm, setActiveAlarm] = useState(null);
  
  // Details modal state
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Form states
  const [eventName, setEventName] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventAlarms, setEventAlarms] = useState([]);
  const [eventSoundFile, setEventSoundFile] = useState('Melodic Morning.mp3');
  
  // New alarm form states
  const [newAlarmDay, setNewAlarmDay] = useState('Monday');
  const [newAlarmTime, setNewAlarmTime] = useState('07:00');
  const [newAlarmDescription, setNewAlarmDescription] = useState('');
  const [daySelectionType, setDaySelectionType] = useState('custom'); // 'everyday', 'weekdays', 'weekends', 'every2days', 'custom'
  const [selectedDays, setSelectedDays] = useState([]);
  const [isAddingAlarm, setIsAddingAlarm] = useState(false);
  
  // Time picker states
  const [selectedHour, setSelectedHour] = useState(7);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState('AM');
  
  // Edit alarm form states (unused but kept for potential future functionality)
  const [alarmName, setAlarmName] = useState('');
  const [alarmDescription, setAlarmDescription] = useState('');
  const [alarmTimes, setAlarmTimes] = useState([]);
  const [alarmSoundFile, setAlarmSoundFile] = useState('Melodic Morning.mp3');

  useEffect(() => {
    loadEvents();
    requestNotificationPermissions();
    
    // Handle pre-filled time from PowerhouseAlarmSetter
    if (route.params?.prefilledTime) {
      const { hours, minutes, displayTime } = route.params.prefilledTime;
      
      // Set the time picker values
      const { hour, period } = convertTo12Hour(hours);
      setSelectedHour(hour);
      setSelectedMinute(minutes);
      setSelectedPeriod(period);
      
      // Set a default event name based on the time
      setEventName(`Wake Up Alarm ${displayTime}`);
      setEventDescription('Alarm created from Powerhouse Alarm Setter');
      
      // Auto-open the create modal
      setShowCreateModal(true);
      
      // Clear the route params to prevent re-execution
      navigation.setParams({ prefilledTime: undefined });
    }
    
    // Configure notification behavior
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    // Handle notification responses (when user taps notification)
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const { eventId, alarmId } = response.notification.request.content.data || {};
      if (eventId && alarmId) {
        handleAlarmTrigger(eventId, alarmId);
      }
    });

    // Handle notifications received while app is open
    const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
      const { eventId, alarmId } = notification.request.content.data || {};
      if (eventId && alarmId) {
        handleAlarmTrigger(eventId, alarmId);
      }
    });

    return () => {
      subscription.remove();
      foregroundSubscription.remove();
    };
  }, []);

  const loadEvents = async () => {
    try {
      const savedEvents = await AsyncStorage.getItem('eventAlarms');
      if (savedEvents) {
        setEvents(JSON.parse(savedEvents));
      }
    } catch (error) {
      console.error('Failed to load events:', error);
    }
  };

  const saveEvents = async (eventsToSave) => {
    try {
      await AsyncStorage.setItem('eventAlarms', JSON.stringify(eventsToSave));
    } catch (error) {
      console.error('Failed to save events:', error);
    }
  };

  const requestNotificationPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      await Notifications.requestPermissionsAsync();
    }
  };

  const generateEventId = () => `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const generateAlarmId = () => `alarm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Time picker helper functions
  const convertTo24Hour = (hour12, period) => {
    if (period === 'AM') {
      return hour12 === 12 ? 0 : hour12;
    } else {
      return hour12 === 12 ? 12 : hour12 + 12;
    }
  };

  const convertTo12Hour = (hour24) => {
    if (hour24 === 0) return { hour: 12, period: 'AM' };
    if (hour24 < 12) return { hour: hour24, period: 'AM' };
    if (hour24 === 12) return { hour: 12, period: 'PM' };
    return { hour: hour24 - 12, period: 'PM' };
  };

  const updateAlarmTime = () => {
    const hour24 = convertTo24Hour(selectedHour, selectedPeriod);
    const timeString = `${hour24.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`;
    setNewAlarmTime(timeString);
  };

  // Update newAlarmTime whenever time picker values change
  React.useEffect(() => {
    updateAlarmTime();
  }, [selectedHour, selectedMinute, selectedPeriod]);

  // Test function to verify alarm notifications work
  const testAlarmInOneMinute = async (event, alarmIndex = 0) => {
    try {
      if (!event.alarms || event.alarms.length === 0) {
        Alert.alert('No Alarms', 'This event has no alarms to test');
        return;
      }

      const alarm = event.alarms[alarmIndex];
      const testTime = new Date();
      testTime.setSeconds(testTime.getSeconds() + 60); // 1 minute from now

      console.log(`🧪 Testing alarm: ${event.eventName} - ${alarm.day} at ${alarm.time}`);
      console.log(`🧪 Test notification scheduled for: ${testTime.toLocaleString()}`);

      const testId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `🧪 TEST: ${event.eventName}`,
          body: `${alarm.day} - ${alarm.description || event.description || 'Alarm time!'}\n\nThis is a 1-minute test of your alarm system!`,
          sound: event.ringtone,
          data: { 
            eventId: event.id, 
            alarmId: alarm.id,
            type: 'test_alarm',
            originalDay: alarm.day,
            originalTime: alarm.time
          }
        },
        trigger: testTime,
      });

      Alert.alert(
        '🧪 Test Alarm Scheduled!',
        `Your "${event.eventName}" alarm will test in 1 minute!\n\nOriginal: ${alarm.day} at ${alarm.time}\nTest: ${testTime.toLocaleTimeString()}\n\nThis proves your alarm system works!`,
        [{ text: 'Got it!' }]
      );

      return testId;
    } catch (error) {
      console.error('Test alarm error:', error);
      Alert.alert('Test Failed', 'Unable to schedule test alarm');
    }
  };

  /* DEBUG FUNCTIONS - Commented out for production
  // Uncomment these functions if you need to debug scheduling issues in the future
  
  // Debug function to check scheduled notifications
  const debugScheduledNotifications = async (delay = 0) => {
    try {
      if (delay > 0) {
        console.log(`Waiting ${delay}ms before checking notifications...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      console.log('=== SCHEDULED NOTIFICATIONS ===');
      console.log(`Total notifications: ${notifications.length}`);
      console.log(`Current time: ${new Date().toLocaleString()}`);
      
      if (notifications.length === 0) {
        console.log('⚠️  NO NOTIFICATIONS FOUND');
      }
      
      notifications.forEach((notification, index) => {
        const trigger = notification.trigger;
        const data = notification.content.data;
        console.log(`${index + 1}. ${notification.content.title}`);
        console.log(`   ID: ${notification.identifier}`);
        console.log(`   Trigger Type: ${trigger?.type || 'unknown'}`);
        console.log(`   Trigger Details:`, trigger);
        console.log(`   Data:`, data);
        
        // Try to interpret the trigger
        if (trigger?.weekday && trigger?.hour !== undefined && trigger?.minute !== undefined) {
          const days = ['?', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const dayName = days[trigger.weekday] || `Day${trigger.weekday}`;
          const timeStr = `${trigger.hour.toString().padStart(2, '0')}:${trigger.minute.toString().padStart(2, '0')}`;
          console.log(`   📅 Scheduled for: ${dayName} at ${timeStr}`);
        }
        console.log('---');
      });
      console.log('=== END NOTIFICATIONS ===');
      
      // Show alert with notification count
      Alert.alert('Debug Info', `Found ${notifications.length} scheduled notifications. Check console for details.`);
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      Alert.alert('Error', 'Failed to get scheduled notifications');
    }
  };

  // Test function to schedule a notification 1 minute from now
  const testNotificationIn1Minute = async () => {
    try {
      const now = new Date();
      const testTime = new Date(now.getTime() + 60000); // 1 minute from now
      
      console.log('Scheduling test notification for:', testTime.toLocaleTimeString());
      
      const testId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Test Notification',
          body: 'This is a test notification scheduled 1 minute ago',
          sound: 'Melodic Morning.mp3',
          data: { type: 'test' }
        },
        trigger: {
          type: 'date',
          date: testTime,
        },
      });
      
      console.log('Test notification scheduled with ID:', testId);
      
      // Check if it was actually scheduled
      setTimeout(async () => {
        const allNotifications = await Notifications.getAllScheduledNotificationsAsync();
        const testNotif = allNotifications.find(n => n.identifier === testId);
        console.log('Test notification found in schedule:', !!testNotif);
        if (testNotif) {
          console.log('Test notification trigger:', testNotif.trigger);
        }
      }, 100);
      
      Alert.alert('Test Scheduled', `Test notification scheduled for ${testTime.toLocaleTimeString()}\nID: ${testId}`);
    } catch (error) {
      console.error('Error scheduling test notification:', error);
      Alert.alert('Error', 'Failed to schedule test notification');
    }
  };

  // Test new date-based scheduling specifically
  const testDateBasedScheduling = async () => {
    try {
      console.log('Testing new date-based scheduling...');
      
      const now = new Date();
      const testDate = new Date(now.getTime() + 2 * 60 * 1000); // 2 minutes from now
      
      console.log(`Scheduling for ${testDate.toLocaleString()}`);
      
      const testId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Date-Based Test',
          body: 'This is a date-based scheduling test (new method)',
          data: { type: 'date_test' }
        },
        trigger: {
          type: 'date',
          date: testDate,
        },
      });
      
      console.log('Date-based test notification scheduled with ID:', testId);
      
      // Check if it was actually scheduled
      setTimeout(async () => {
        const allNotifications = await Notifications.getAllScheduledNotificationsAsync();
        const testNotif = allNotifications.find(n => n.identifier === testId);
        console.log('Date-based test notification found in schedule:', !!testNotif);
        if (testNotif) {
          console.log('Date-based test notification trigger:', testNotif.trigger);
        } else {
          console.error('❌ Date-based test notification NOT found in schedule!');
        }
      }, 100);
      
      Alert.alert('Date-Based Test', `Date-based test scheduled for ${testDate.toLocaleString()}\nID: ${testId}`);
    } catch (error) {
      console.error('Error scheduling date-based test:', error);
      Alert.alert('Error', 'Failed to schedule date-based test');
    }
  };
  */

  const createEvent = async () => {
    console.log('🎯 createEvent called with eventAlarms:', eventAlarms.length, eventAlarms);
    
    if (!eventName.trim()) {
      Alert.alert('Missing Information', 'Please enter an event name');
      return;
    }

    if (eventAlarms.length === 0) {
      Alert.alert('Missing Information', 'Please add at least one alarm time');
      return;
    }

    const newEvent = {
      id: generateEventId(),
      eventName: eventName.trim(),
      description: eventDescription.trim(),
      ringtone: eventSoundFile,
      isEnabled: true,
      createdAt: new Date().toISOString(),
      alarms: eventAlarms.flatMap(alarm => {
        console.log('🔍 Processing alarm in createEvent:', alarm);
        console.log('🔍 alarm.days:', alarm.days);
        if (!alarm.days || !Array.isArray(alarm.days)) {
          console.error('🔍 Invalid alarm.days:', alarm.days);
          return [];
        }
        return alarm.days.map(day => ({
          id: generateAlarmId(),
          day: day,
          time: alarm.time,
          description: alarm.description || '',
          enabled: true
        }));
      })
    };

    console.log('🎯 Created event with alarms:', newEvent.alarms.length, newEvent.alarms);

    const updatedEvents = [...events, newEvent];
    setEvents(updatedEvents);
    saveEvents(updatedEvents);
    await scheduleEventNotifications(newEvent);

    // Reset form
    resetForm();
    setShowCreateModal(false);

    Alert.alert(
      '🎉 Recurring Event Created!', 
      `"${newEvent.eventName}" created successfully!\n\n⏰ ${newEvent.alarms.length} recurring alarm(s) scheduled\n🔄 Will repeat weekly on selected days`
    );
  };

  const getDaysFromSelectionType = (type, customDays = []) => {
    switch (type) {
      case 'everyday':
        return DAYS;
      case 'weekdays':
        return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      case 'weekends':
        return ['Saturday', 'Sunday'];
      case 'every2days':
        return ['Monday', 'Wednesday', 'Friday', 'Sunday'];
      case 'custom':
        return customDays;
      default:
        return customDays;
    }
  };

  const addAlarmToEvent = React.useCallback(() => {
    if (isAddingAlarm) {
      console.log('🔍 Already adding alarm, ignoring duplicate call');
      return;
    }
    
    setIsAddingAlarm(true);
    console.log('🔍 addAlarmToEvent called - Current eventAlarms:', eventAlarms.length);
    
    const daysToAdd = getDaysFromSelectionType(daySelectionType, selectedDays);
    
    if (daysToAdd.length === 0) {
      Alert.alert('No Days Selected', 'Please select at least one day for the alarm');
      setIsAddingAlarm(false);
      return;
    }

    // Create ONE alarm instance with multiple days (not separate alarms per day)
    const newAlarm = {
      id: generateAlarmId(),
      days: daysToAdd,  // ✅ Array of days in ONE alarm
      time: newAlarmTime,
      description: newAlarmDescription.trim(),
      enabled: true
    };

    console.log('🔍 New alarm instance to add:', newAlarm);

    // Check for duplicate time (regardless of days)
    const duplicateTime = eventAlarms.some(existingAlarm => 
      existingAlarm.time === newAlarm.time && existingAlarm.description === newAlarm.description
    );

    if (duplicateTime) {
      Alert.alert('Duplicate Alarm', `Alarm "${newAlarm.description}" at ${newAlarm.time} already exists`);
      setIsAddingAlarm(false);
      return;
    }

    console.log('🔍 Adding single alarm instance with', newAlarm.days.length, 'days');
    
    // Add ONE alarm instance (not multiple)
    setEventAlarms(prevAlarms => {
      const updatedAlarms = [...prevAlarms, newAlarm];
      console.log('🔍 Functional update - Previous:', prevAlarms.length, 'New total:', updatedAlarms.length, 'alarm instances');
      return updatedAlarms;
    });
    
    // Reset alarm form
    setNewAlarmTime('07:00');
    setNewAlarmDescription('');
    setDaySelectionType('custom');
    setSelectedDays([]);
    
    // Reset loading state
    setTimeout(() => setIsAddingAlarm(false), 100);
  }, [eventAlarms, daySelectionType, selectedDays, newAlarmTime, newAlarmDescription, isAddingAlarm]);

  const removeAlarmFromEvent = (index) => {
    const updatedAlarms = eventAlarms.filter((_, i) => i !== index);
    setEventAlarms(updatedAlarms);
  };

  // Quick time presets for faster selection
  const TIME_PRESETS = [
    '06:00', '06:30', '07:00', '07:30', '08:00', '08:30',
    '09:00', '12:00', '13:00', '17:00', '18:00', '19:00',
    '20:00', '21:00', '22:00', '23:00'
  ];

  const updateEvent = async () => {
    if (!eventName.trim()) {
      Alert.alert('Missing Information', 'Please enter an event name');
      return;
    }

    if (eventAlarms.length === 0) {
      Alert.alert('Missing Information', 'Please add at least one alarm time');
      return;
    }

    if (!selectedEvent) return;

    const updatedEvent = {
      ...selectedEvent,
      eventName: eventName.trim(),
      description: eventDescription.trim(),
      alarms: eventAlarms.map(alarm => ({
        id: alarm.id || generateAlarmId(),
        day: alarm.day,
        time: alarm.time,
        description: alarm.description || '',
        enabled: true
      })),
      ringtone: eventSoundFile,
    };

    const updatedEvents = events.map(event => 
      event.id === selectedEvent.id ? updatedEvent : event
    );
    
    setEvents(updatedEvents);
    saveEvents(updatedEvents);
    
    // Cancel old notifications and schedule new ones
    await cancelEventNotifications(selectedEvent);
    await scheduleEventNotifications(updatedEvent);

    // Reset form and close modal
    resetForm();
    setShowEditModal(false);
    setSelectedEvent(null);

    Alert.alert(
      '✅ Recurring Event Updated!', 
      `"${updatedEvent.eventName}" updated successfully!\n\n⏰ ${updatedEvent.alarms.length} recurring alarm(s) rescheduled\n🔄 Will repeat weekly on selected days`
    );
  };

  const prepareEditForm = (event) => {
    setEventName(event.eventName);
    setEventDescription(event.description);
    setEventAlarms(event.alarms || []);
    setEventSoundFile(event.ringtone);
  };

  const resetForm = () => {
    setEventName('');
    setEventDescription('');
    setEventAlarms([]);
    setEventSoundFile('Melodic Morning.mp3');
    setNewAlarmTime('07:00');
    setNewAlarmDescription('');
    setDaySelectionType('custom');
    setSelectedDays([]);
    
    // Reset time picker
    setSelectedHour(7);
    setSelectedMinute(0);
    setSelectedPeriod('AM');
  };

  const handleAlarmTrigger = (eventId, alarmId) => {
    const event = events.find(e => e.id === eventId);
    if (event) {
      const alarm = event.alarms.find(a => a.id === alarmId);
      if (alarm) {
        // Create combined alarm info for overlay
        const alarmData = {
          id: alarmId,
          name: event.eventName,
          description: alarm.description || event.description,
          soundFile: event.ringtone,
          eventId: eventId,
          day: alarm.day,
          time: alarm.time
        };
        setActiveAlarm(alarmData);
        setShowAlarmOverlay(true);
      }
    }
  };

  const handleSnooze = () => {
    if (activeAlarm) {
      // Add 9 minutes to current time and schedule new notification
      const snoozeTime = new Date();
      snoozeTime.setMinutes(snoozeTime.getMinutes() + 9);
      
      // Schedule snooze notification
      Notifications.scheduleNotificationAsync({
        content: {
          title: activeAlarm.name,
          body: `Snoozed - ${activeAlarm.description || 'Alarm time!'}`,
          sound: activeAlarm.soundFile,
          data: { eventId: activeAlarm.eventId, alarmId: activeAlarm.id }
        },
        trigger: snoozeTime,
      });

      setShowAlarmOverlay(false);
      setActiveAlarm(null);
    }
  };

  const handleDismiss = () => {
    if (activeAlarm) {
      setShowAlarmOverlay(false);
      setActiveAlarm(null);
    }
  };

  const addAlarmTime = () => {
    // Check if this time already exists
    const exists = alarmTimes.some(time => 
      time.hour === tempHour && time.minute === tempMinute
    );

    if (exists) {
      Alert.alert('Duplicate Time', 'This time already exists for this alarm');
      return;
    }

    const newTime = {
      hour: tempHour,
      minute: tempMinute
    };

    setAlarmTimes([...alarmTimes, newTime]);
  };

  const removeAlarmTime = (index) => {
    const updatedTimes = alarmTimes.filter((_, i) => i !== index);
    setAlarmTimes(updatedTimes);
  };

  const toggleAlarmEnabled = (alarmId) => {
    const updatedAlarms = alarms.map(alarm => {
      if (alarm.id === alarmId) {
        const updatedAlarm = { ...alarm, isEnabled: !alarm.isEnabled };
        
        if (updatedAlarm.isEnabled) {
          scheduleAlarmNotifications(updatedAlarm);
        } else {
          cancelAlarmNotifications(updatedAlarm);
        }

        return updatedAlarm;
      }
      return alarm;
    });

    setAlarms(updatedAlarms);
    saveAlarms(updatedAlarms);
  };

  const toggleTimeEnabled = (alarmId, timeIndex) => {
    const updatedAlarms = alarms.map(alarm => {
      if (alarm.id === alarmId) {
        const updatedAlarm = {
          ...alarm,
          times: alarm.times.map((time, index) => 
            index === timeIndex ? { ...time, enabled: !time.enabled } : time
          )
        };

        // Reschedule notifications
        cancelAlarmNotifications(alarm);
        if (updatedAlarm.isEnabled) {
          scheduleAlarmNotifications(updatedAlarm);
        }

        return updatedAlarm;
      }
      return alarm;
    });

    setAlarms(updatedAlarms);
    saveAlarms(updatedAlarms);
  };

  const deleteAlarm = (alarmId) => {
    const alarmToDelete = alarms.find(a => a.id === alarmId);
    Alert.alert(
      'Delete Alarm',
      `Are you sure you want to delete "${alarmToDelete.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            cancelAlarmNotifications(alarmToDelete);
            
            const updatedAlarms = alarms.filter(a => a.id !== alarmId);
            setAlarms(updatedAlarms);
            saveAlarms(updatedAlarms);
          }
        }
      ]
    );
  };

  const scheduleAlarmNotifications = async (alarm) => {
    if (!alarm.isEnabled) return;

    for (const [index, time] of alarm.times.entries()) {
      if (!time.enabled) continue;

      try {
        // Schedule for each day of the week
        for (let day = 1; day <= 7; day++) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: alarm.name,
              body: alarm.description || 'Alarm time!',
              sound: alarm.soundFile,
              data: { 
                alarmId: alarm.id, 
                timeIndex: index,
                hour: time.hour,
                minute: time.minute
              }
            },
            trigger: {
              weekday: day,
              hour: time.hour,
              minute: time.minute,
              repeats: true,
            },
          });
        }
      } catch (error) {
        console.error('Error scheduling notification:', error);
      }
    }
  };

  const cancelAlarmNotifications = async (alarm) => {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      
      for (const notification of notifications) {
        if (notification.content.data?.alarmId === alarm.id) {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
      }
    } catch (error) {
      console.error('Error canceling notifications:', error);
    }
  };

  const formatTime = (hour, minute) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
  };

  const formatTimesDisplay = (times) => {
    const enabledTimes = times.filter(time => time.enabled);
    if (enabledTimes.length === 0) return 'No active times';
    
    return enabledTimes
      .map(time => formatTime(time.hour, time.minute))
      .join(', ');
  };

  const renderEventItem = ({ item }) => {
    // Group alarms by time to show user-friendly summary
    const alarmsByTime = item.alarms.reduce((acc, alarm) => {
      if (!alarm.enabled) return acc;
      if (!acc[alarm.time]) {
        acc[alarm.time] = {
          time: alarm.time,
          days: [],
          description: alarm.description
        };
      }
      acc[alarm.time].days.push(alarm.day);
      return acc;
    }, {});
    
    const uniqueAlarms = Object.values(alarmsByTime);
    const totalActiveDays = [...new Set(item.alarms.filter(a => a.enabled).map(a => a.day))];
    const eventIcon = getEventIcon(item.eventName);
    
    return (
      <View style={[styles.eventCard, !item.isEnabled && styles.eventCardDisabled]}>
        <TouchableOpacity 
          style={styles.eventCardContent}
          onPress={() => {
            setSelectedEvent(item);
            setShowDetailsModal(true);
          }}
          activeOpacity={0.7}
        >
          <View style={styles.eventHeader}>
            <View style={styles.eventIconContainer}>
              <Text style={styles.eventIcon}>{eventIcon}</Text>
            </View>
            
            <View style={styles.eventMainInfo}>
              <Text style={styles.eventName}>{item.eventName}</Text>
              <Text style={styles.eventDescription}>
                {item.description || 'No description'}
              </Text>
              <Text style={styles.eventDays}>
                {totalActiveDays.length > 0 ? totalActiveDays.slice(0, 3).join(', ') + (totalActiveDays.length > 3 ? ` +${totalActiveDays.length - 3}` : '') : 'No active days'}
              </Text>
              <Text style={styles.eventSound}>🔔 {item.ringtone.replace('.mp3', '')}</Text>
            </View>
            
            <View style={styles.eventControls}>
              <Switch
                value={item.isEnabled}
                onValueChange={() => toggleEventEnabled(item.id)}
                trackColor={{ false: '#374151', true: '#DC2626' }}
                thumbColor={item.isEnabled ? '#FFFFFF' : '#9CA3AF'}
                ios_backgroundColor="#374151"
              />
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => {
                  setSelectedEvent(item);
                  prepareEditForm(item);
                  setShowEditModal(true);
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="edit" size={20} color="#8E8E93" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => deleteEvent(item.id)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="delete-outline" size={20} color="#DC2626" />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.eventStats}>
            <Text style={styles.statText}>
              {uniqueAlarms.length} alarm time{uniqueAlarms.length !== 1 ? 's' : ''} • {totalActiveDays.length} day{totalActiveDays.length !== 1 ? 's' : ''}
            </Text>
            {uniqueAlarms.slice(0, 2).map((alarm, index) => (
              <Text key={index} style={styles.alarmSummary}>
                {alarm.time} - {alarm.days.length === 7 ? 'Every day' : alarm.days.join(', ')}
              </Text>
            ))}
            {uniqueAlarms.length > 2 && (
              <Text style={styles.alarmSummary}>+{uniqueAlarms.length - 2} more...</Text>
            )}
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const getEventIcon = (eventName) => {
    const name = eventName.toUpperCase();
    const iconMap = {
      'GYM': '🏋️',
      'MEDICINE': '💊',
      'WORK': '💼',
      'STUDY': '📚',
      'MEETING': '🤝',
      'FOOD': '🍽️',
      'SLEEP': '😴',
      'SCHOOL': '🎓',
      'WORKOUT': '🏋️',
      'PILLS': '💊',
      'MEDICATION': '💊'
    };
    
    for (const [key, icon] of Object.entries(iconMap)) {
      if (name.includes(key)) return icon;
    }
    return '⏰';
  };

  const toggleEventEnabled = async (eventId) => {
    const updatedEvents = events.map(event => {
      if (event.id === eventId) {
        const updatedEvent = { ...event, isEnabled: !event.isEnabled };
        return updatedEvent;
      }
      return event;
    });

    // Update state first
    setEvents(updatedEvents);
    saveEvents(updatedEvents);

    // Then handle notifications
    const updatedEvent = updatedEvents.find(e => e.id === eventId);
    if (updatedEvent.isEnabled) {
      await scheduleEventNotifications(updatedEvent);
    } else {
      await cancelEventNotifications(updatedEvent);
    }
  };

  const toggleIndividualAlarm = async (eventId, alarmId) => {
    const updatedEvents = events.map(event => {
      if (event.id === eventId) {
        const updatedAlarms = event.alarms.map(alarm => {
          if (alarm.id === alarmId) {
            return { ...alarm, enabled: !alarm.enabled };
          }
          return alarm;
        });
        return { ...event, alarms: updatedAlarms };
      }
      return event;
    });

    // Update state first
    setEvents(updatedEvents);
    saveEvents(updatedEvents);

    // Update the selected event for the details modal
    const updatedSelectedEvent = updatedEvents.find(e => e.id === eventId);
    setSelectedEvent(updatedSelectedEvent);

    // Reschedule notifications for this event
    const targetEvent = updatedEvents.find(e => e.id === eventId);
    if (targetEvent.isEnabled) {
      await cancelEventNotifications(targetEvent);
      await scheduleEventNotifications(targetEvent);
    }
  };

  const deleteEvent = (eventId) => {
    const eventToDelete = events.find(e => e.id === eventId);
    Alert.alert(
      'Delete Event',
      `Are you sure you want to delete "${eventToDelete.eventName}"?\n\nThis will remove all ${eventToDelete.alarms.length} alarm(s) for this event.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await cancelEventNotifications(eventToDelete);
            
            const updatedEvents = events.filter(e => e.id !== eventId);
            setEvents(updatedEvents);
            saveEvents(updatedEvents);
          }
        }
      ]
    );
  };

  const scheduleEventNotifications = async (event) => {
    if (!event.isEnabled) return;

    for (const alarm of event.alarms) {
      if (!alarm.enabled) continue;

      // Convert day name to JavaScript day number (0=Sunday, 1=Monday, ..., 6=Saturday)
      const dayMapping = {
        'Sunday': 0,
        'Monday': 1,
        'Tuesday': 2,
        'Wednesday': 3,
        'Thursday': 4,
        'Friday': 5,
        'Saturday': 6
      };
      
      const targetDay = dayMapping[alarm.day];
      if (targetDay === undefined) {
        console.error('Invalid day:', alarm.day);
        continue;
      }

      const [hours, minutes] = alarm.time.split(':').map(Number);
      
      // Validate time
      if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        console.error('Invalid time format:', alarm.time);
        continue;
      }

      // Calculate next occurrence of this day and time
      const now = new Date();
      const nextAlarmDate = new Date();
      
      // Set the target time for today first
      nextAlarmDate.setHours(hours, minutes, 0, 0);
      
      // Calculate days until target day
      const currentDay = now.getDay();
      let daysUntilTarget = targetDay - currentDay;
      
      // If target day is today but time has passed, or target day is in the past this week
      if (daysUntilTarget < 0 || (daysUntilTarget === 0 && nextAlarmDate <= now)) {
        daysUntilTarget += 7; // Schedule for next week
      }
      
      // For testing in Expo Go, add buffer if time is very close
      if (daysUntilTarget === 0) {
        const timeDiff = nextAlarmDate.getTime() - now.getTime();
        if (timeDiff < 300000) { // Less than 5 minutes
          daysUntilTarget += 7; // Schedule for next week instead
          console.log(`⚠️ Time ${alarm.time} on ${alarm.day} is too close (${Math.round(timeDiff/60000)} min), scheduling for next week`);
        }
      }
      
      // Set the final date
      nextAlarmDate.setDate(now.getDate() + daysUntilTarget);

      // Schedule proper recurring weekly notification
      try {
        const notificationId = await Notifications.scheduleNotificationAsync({
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
            weekday: targetDay + 1, // iOS uses 1-7 (1=Sunday, 2=Monday, etc.)
            hour: hours,
            minute: minutes,
            repeats: true,
          },
        });
        
        console.log(`Scheduled recurring event alarm for ${alarm.day} at ${alarm.time}, Event: ${event.eventName}, ID: ${notificationId}`);
        
      } catch (error) {
        console.error(`Error scheduling recurring notification for ${alarm.day}:`, error);
      }
    }
  };

  const cancelEventNotifications = async (event) => {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      
      for (const notification of notifications) {
        if (notification.content.data?.eventId === event.id) {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
      }
    } catch (error) {
      console.error('Error canceling notifications:', error);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Event Alarms</Text>
          <Text style={styles.headerSubtitle}>
            {events.filter(e => e.isEnabled).length} active events • {events.reduce((total, e) => total + e.alarms.filter(a => a.enabled).length, 0)} total alarms
          </Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.knobButton}
            onPress={() => navigation.navigate('PowerhouseAlarmSetter')}
            activeOpacity={0.8}
          >
            <Icon name="tune" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => {
              resetForm();
              setSelectedEvent(null);
              setShowCreateModal(true);
            }}
            activeOpacity={0.8}
          >
            <Icon name="add" size={32} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Events List */}
      {events.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="event-note" size={100} color="#374151" />
          <Text style={styles.emptyTitle}>No Event Alarms</Text>
          <Text style={styles.emptySubtitle}>
            Create event-based alarms like GYM, MEDICINE, or WORK with multiple times
          </Text>
          <TouchableOpacity 
            style={styles.emptyActionButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Icon name="add" size={24} color="white" />
            <Text style={styles.emptyActionText}>Create Event</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={renderEventItem}
          contentContainerStyle={styles.alarmsList}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Create Alarm Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowCreateModal(false)}
            >
              <Icon name="close" size={24} color="#DC2626" />
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>New Event</Text>
            <TouchableOpacity 
              style={[styles.modalCloseButton, styles.createHeaderButton]}
              onPress={createEvent}
              disabled={eventAlarms.length === 0}
            >
              <Icon name="check" size={24} color={eventAlarms.length === 0 ? "#666" : "#34C759"} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Basic Info */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Event Information</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Event Name</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g., GYM, MEDICINE, WORK"
                  value={eventName}
                  onChangeText={setEventName}
                  placeholderTextColor="#6B7280"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description (Optional)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Workout schedule, medication times, etc."
                  value={eventDescription}
                  onChangeText={setEventDescription}
                  placeholderTextColor="#6B7280"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Sound</Text>
                <TouchableOpacity 
                  style={styles.soundSelector}
                  onPress={() => {
                    Alert.alert(
                      'Select Sound',
                      'Choose a sound for this alarm',
                      RINGTONES.map(ringtone => ({
                        text: ringtone.label,
                        onPress: () => setEventSoundFile(ringtone.value)
                      })).concat([{ text: 'Cancel', style: 'cancel' }])
                    );
                  }}
                >
                  <Text style={styles.soundSelectorText}>
                    🔔 {eventSoundFile.replace('.mp3', '')}
                  </Text>
                  <Icon name="keyboard-arrow-down" size={24} color="#DC2626" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Add Event Alarms */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Event Alarms</Text>
              
              
              {/* Add New Alarm Section */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Alarm Time</Text>
                
                
                {/* Time Picker */}
                <View style={styles.timePickerContainer}>
                  {/* Hour Picker */}
                  <View style={styles.timePickerColumn}>
                    <Text style={styles.timePickerLabel}>Hour</Text>
                    <ScrollView 
                      style={styles.timePickerScrollContainer}
                      showsVerticalScrollIndicator={false}
                      nestedScrollEnabled={true}
                    >
                      {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((hour) => (
                        <TouchableOpacity
                          key={hour}
                          style={[
                            styles.timePickerItem,
                            selectedHour === hour && styles.timePickerItemSelected
                          ]}
                          onPress={() => setSelectedHour(hour)}
                        >
                          <Text style={[
                            styles.timePickerText,
                            selectedHour === hour && styles.timePickerTextSelected
                          ]}>
                            {hour.toString().padStart(2, '0')}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  {/* Minute Picker */}
                  <View style={styles.timePickerColumn}>
                    <Text style={styles.timePickerLabel}>Minute</Text>
                    <ScrollView 
                      style={styles.timePickerScrollContainer}
                      showsVerticalScrollIndicator={false}
                      nestedScrollEnabled={true}
                    >
                      {Array.from({ length: 60 }, (_, i) => i).map((minute) => (
                        <TouchableOpacity
                          key={minute}
                          style={[
                            styles.timePickerItem,
                            selectedMinute === minute && styles.timePickerItemSelected
                          ]}
                          onPress={() => setSelectedMinute(minute)}
                        >
                          <Text style={[
                            styles.timePickerText,
                            selectedMinute === minute && styles.timePickerTextSelected
                          ]}>
                            {minute.toString().padStart(2, '0')}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  {/* AM/PM Picker */}
                  <View style={styles.timePickerColumn}>
                    <Text style={styles.timePickerLabel}>Period</Text>
                    <ScrollView 
                      style={styles.timePickerScrollContainer}
                      showsVerticalScrollIndicator={false}
                      nestedScrollEnabled={true}
                    >
                      {['AM', 'PM'].map((period) => (
                        <TouchableOpacity
                          key={period}
                          style={[
                            styles.timePickerItem,
                            selectedPeriod === period && styles.timePickerItemSelected
                          ]}
                          onPress={() => setSelectedPeriod(period)}
                        >
                          <Text style={[
                            styles.timePickerText,
                            selectedPeriod === period && styles.timePickerTextSelected
                          ]}>
                            {period}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>

                {/* Selected Time Display */}
                <View style={styles.selectedTimeDisplay}>
                  <Text style={styles.selectedTimeText}>
                    Selected: {selectedHour.toString().padStart(2, '0')}:{selectedMinute.toString().padStart(2, '0')} {selectedPeriod}
                  </Text>
                  <Text style={styles.selectedTime24}>
                    ({newAlarmTime})
                  </Text>
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Day Selection</Text>
                <TouchableOpacity 
                  style={styles.dayTypeSelector}
                  onPress={() => {
                    Alert.alert(
                      'Select Days',
                      'Choose when this alarm should repeat',
                      DAY_SELECTION_OPTIONS.map(option => ({
                        text: option.label,
                        onPress: () => setDaySelectionType(option.value)
                      })).concat([{ text: 'Cancel', style: 'cancel' }])
                    );
                  }}
                >
                  <Text style={styles.dayTypeSelectorText}>
                    {DAY_SELECTION_OPTIONS.find(o => o.value === daySelectionType)?.label || 'Custom Days'}
                  </Text>
                  <Icon name="keyboard-arrow-down" size={24} color="#DC2626" />
                </TouchableOpacity>
              </View>
              
              {daySelectionType === 'custom' && (
                <View style={styles.customDaysContainer}>
                  <Text style={styles.inputLabel}>Select Days</Text>
                  <View style={styles.daysGrid}>
                    {DAYS.map((day) => (
                      <TouchableOpacity
                        key={day}
                        style={[
                          styles.dayChip,
                          selectedDays.includes(day) && styles.dayChipSelected
                        ]}
                        onPress={() => {
                          if (selectedDays.includes(day)) {
                            setSelectedDays(selectedDays.filter(d => d !== day));
                          } else {
                            setSelectedDays([...selectedDays, day]);
                          }
                        }}
                      >
                        <Text style={[
                          styles.dayChipText,
                          selectedDays.includes(day) && styles.dayChipTextSelected
                        ]}>
                          {day.slice(0, 3)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Alarm Description (Optional)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Custom description for this alarm"
                  value={newAlarmDescription}
                  onChangeText={setNewAlarmDescription}
                  placeholderTextColor="#6B7280"
                />
              </View>
              
              <TouchableOpacity 
                style={[styles.addAlarmButton, isAddingAlarm && styles.addAlarmButtonDisabled]}
                onPress={addAlarmToEvent}
                disabled={isAddingAlarm}
              >
                <Icon name={isAddingAlarm ? "hourglass-empty" : "add"} size={20} color="white" />
                <Text style={styles.addAlarmButtonText}>
                  {isAddingAlarm ? "Adding..." : "Add Alarm"}
                </Text>
              </TouchableOpacity>

              {/* Created Alarms Preview */}
              {eventAlarms.length > 0 && (
                <View style={styles.timesPreview}>
                  <Text style={styles.previewTitle}>
                    ✅ {eventAlarms.length} Alarm{eventAlarms.length !== 1 ? 's' : ''} Created
                  </Text>
                  {eventAlarms.map((alarm, index) => (
                    <View key={index} style={styles.timePreviewItem}>
                      <View style={styles.alarmPreviewInfo}>
                        <Text style={styles.timePreviewText}>
                          {alarm.time} - {alarm.days.join(', ')}
                        </Text>
                        {alarm.description && (
                          <Text style={styles.alarmPreviewDescription}>
                            {alarm.description}
                          </Text>
                        )}
                      </View>
                      <TouchableOpacity 
                        onPress={() => removeAlarmFromEvent(index)}
                        style={styles.removeTimeButton}
                      >
                        <Icon name="close" size={18} color="#DC2626" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>

        </View>
      </Modal>

      {/* Edit Alarm Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowEditModal(false)}
            >
              <Icon name="close" size={24} color="#8E8E93" />
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>
              Edit Event
            </Text>
            <TouchableOpacity 
              style={[styles.modalCloseButton, styles.createHeaderButton]}
              onPress={updateEvent}
              disabled={eventAlarms.length === 0}
            >
              <Icon name="check" size={24} color={eventAlarms.length === 0 ? "#666" : "#34C759"} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Same form as create, but pre-populated */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Event Information</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Event Name</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g., GYM, MEDICINE, WORK"
                  value={eventName}
                  onChangeText={setEventName}
                  placeholderTextColor="#8E8E93"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description (Optional)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Workout schedule, medication times, etc."
                  value={eventDescription}
                  onChangeText={setEventDescription}
                  placeholderTextColor="#8E8E93"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Sound</Text>
                <TouchableOpacity 
                  style={styles.soundSelector}
                  onPress={() => {
                    Alert.alert(
                      'Select Sound',
                      'Choose a sound for this event',
                      RINGTONES.map(sound => ({
                        text: sound.label,
                        onPress: () => setEventSoundFile(sound.value)
                      })).concat([{ text: 'Cancel', style: 'cancel' }])
                    );
                  }}
                >
                  <Text style={styles.soundSelectorText}>
                    🔔 {eventSoundFile.replace('.mp3', '')}
                  </Text>
                  <Icon name="keyboard-arrow-down" size={24} color="#8E8E93" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Current Event Alarms */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Current Alarms</Text>
              
              {eventAlarms.length > 0 ? (
                <View style={styles.timesPreview}>
                  <Text style={styles.previewTitle}>
                    {eventAlarms.length} Alarm{eventAlarms.length !== 1 ? 's' : ''} Set
                  </Text>
                  {eventAlarms.map((alarm, index) => (
                    <View key={index} style={styles.timePreviewItem}>
                      <View style={styles.alarmPreviewInfo}>
                        <Text style={styles.timePreviewText}>
                          {alarm.day} at {alarm.time}
                        </Text>
                        {alarm.description && (
                          <Text style={styles.alarmPreviewDescription}>
                            {alarm.description}
                          </Text>
                        )}
                      </View>
                      <TouchableOpacity 
                        onPress={() => removeAlarmFromEvent(index)}
                        style={styles.removeTimeButton}
                      >
                        <Icon name="close" size={18} color="#FF0000" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyText}>No alarms set for this event</Text>
              )}
              
              {/* Add New Alarm Section */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Add Alarm Time</Text>
                
                
                {/* Time Picker */}
                <View style={styles.timePickerContainer}>
                  {/* Hour Picker */}
                  <View style={styles.timePickerColumn}>
                    <Text style={styles.timePickerLabel}>Hour</Text>
                    <ScrollView 
                      style={styles.timePickerScrollContainer}
                      showsVerticalScrollIndicator={false}
                      nestedScrollEnabled={true}
                    >
                      {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((hour) => (
                        <TouchableOpacity
                          key={hour}
                          style={[
                            styles.timePickerItem,
                            selectedHour === hour && styles.timePickerItemSelected
                          ]}
                          onPress={() => setSelectedHour(hour)}
                        >
                          <Text style={[
                            styles.timePickerText,
                            selectedHour === hour && styles.timePickerTextSelected
                          ]}>
                            {hour.toString().padStart(2, '0')}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  {/* Minute Picker */}
                  <View style={styles.timePickerColumn}>
                    <Text style={styles.timePickerLabel}>Minute</Text>
                    <ScrollView 
                      style={styles.timePickerScrollContainer}
                      showsVerticalScrollIndicator={false}
                      nestedScrollEnabled={true}
                    >
                      {Array.from({ length: 60 }, (_, i) => i).map((minute) => (
                        <TouchableOpacity
                          key={minute}
                          style={[
                            styles.timePickerItem,
                            selectedMinute === minute && styles.timePickerItemSelected
                          ]}
                          onPress={() => setSelectedMinute(minute)}
                        >
                          <Text style={[
                            styles.timePickerText,
                            selectedMinute === minute && styles.timePickerTextSelected
                          ]}>
                            {minute.toString().padStart(2, '0')}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  {/* AM/PM Picker */}
                  <View style={styles.timePickerColumn}>
                    <Text style={styles.timePickerLabel}>Period</Text>
                    <ScrollView 
                      style={styles.timePickerScrollContainer}
                      showsVerticalScrollIndicator={false}
                      nestedScrollEnabled={true}
                    >
                      {['AM', 'PM'].map((period) => (
                        <TouchableOpacity
                          key={period}
                          style={[
                            styles.timePickerItem,
                            selectedPeriod === period && styles.timePickerItemSelected
                          ]}
                          onPress={() => setSelectedPeriod(period)}
                        >
                          <Text style={[
                            styles.timePickerText,
                            selectedPeriod === period && styles.timePickerTextSelected
                          ]}>
                            {period}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>

                {/* Selected Time Display */}
                <View style={styles.selectedTimeDisplay}>
                  <Text style={styles.selectedTimeText}>
                    Selected: {selectedHour.toString().padStart(2, '0')}:{selectedMinute.toString().padStart(2, '0')} {selectedPeriod}
                  </Text>
                  <Text style={styles.selectedTime24}>
                    ({newAlarmTime})
                  </Text>
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Day Selection</Text>
                <TouchableOpacity 
                  style={styles.dayTypeSelector}
                  onPress={() => {
                    Alert.alert(
                      'Select Days',
                      'Choose when this alarm should repeat',
                      DAY_SELECTION_OPTIONS.map(option => ({
                        text: option.label,
                        onPress: () => setDaySelectionType(option.value)
                      })).concat([{ text: 'Cancel', style: 'cancel' }])
                    );
                  }}
                >
                  <Text style={styles.dayTypeSelectorText}>
                    {DAY_SELECTION_OPTIONS.find(o => o.value === daySelectionType)?.label || 'Custom Days'}
                  </Text>
                  <Icon name="keyboard-arrow-down" size={24} color="#8E8E93" />
                </TouchableOpacity>
              </View>
              
              {daySelectionType === 'custom' && (
                <View style={styles.customDaysContainer}>
                  <Text style={styles.inputLabel}>Select Days</Text>
                  <View style={styles.daysGrid}>
                    {DAYS.map((day) => (
                      <TouchableOpacity
                        key={day}
                        style={[
                          styles.dayChip,
                          selectedDays.includes(day) && styles.dayChipSelected
                        ]}
                        onPress={() => {
                          if (selectedDays.includes(day)) {
                            setSelectedDays(selectedDays.filter(d => d !== day));
                          } else {
                            setSelectedDays([...selectedDays, day]);
                          }
                        }}
                      >
                        <Text style={[
                          styles.dayChipText,
                          selectedDays.includes(day) && styles.dayChipTextSelected
                        ]}>
                          {day.slice(0, 3)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Alarm Description (Optional)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Custom description for this alarm"
                  value={newAlarmDescription}
                  onChangeText={setNewAlarmDescription}
                  placeholderTextColor="#8E8E93"
                />
              </View>
              
              <TouchableOpacity 
                style={[styles.addAlarmButton, isAddingAlarm && styles.addAlarmButtonDisabled]}
                onPress={addAlarmToEvent}
                disabled={isAddingAlarm}
              >
                <Icon name={isAddingAlarm ? "hourglass-empty" : "add"} size={20} color="white" />
                <Text style={styles.addAlarmButtonText}>
                  {isAddingAlarm ? "Adding..." : "Add Alarm"}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

        </View>
      </Modal>

      {/* Alarm Details Modal */}
      <Modal
        visible={showDetailsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowDetailsModal(false)}
            >
              <Icon name="close" size={24} color="#8E8E93" />
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>
              Event Details
            </Text>
            <TouchableOpacity 
              style={styles.modalEditButton}
              onPress={() => {
                prepareEditForm(selectedEvent);
                setShowDetailsModal(false);
                setShowEditModal(true);
              }}
            >
              <Icon name="edit" size={24} color="#FF0000" />
            </TouchableOpacity>
          </View>

          {selectedEvent && (
            <ScrollView style={styles.modalContent}>
              {/* Event Info */}
              <View style={styles.detailsSection}>
                <Text style={styles.detailsTitle}>{selectedEvent.eventName}</Text>
                <Text style={styles.detailsDescription}>
                  {selectedEvent.description || 'No description provided'}
                </Text>
                
                <View style={styles.detailsMetaContainer}>
                  <View style={styles.detailsMetaItem}>
                    <Icon name="volume-up" size={20} color="#8E8E93" />
                    <Text style={styles.detailsMetaText}>
                      {RINGTONES.find(r => r.value === selectedEvent.ringtone)?.label || 'Unknown'}
                    </Text>
                  </View>
                  
                  <View style={styles.detailsMetaItem}>
                    <Icon name="schedule" size={20} color="#8E8E93" />
                    <Text style={styles.detailsMetaText}>
                      {selectedEvent.alarms.length} alarm{selectedEvent.alarms.length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  
                  <View style={styles.detailsMetaItem}>
                    <Icon name="power-settings-new" size={20} color="#8E8E93" />
                    <Text style={styles.detailsMetaText}>
                      {selectedEvent.isEnabled ? 'Enabled' : 'Disabled'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Event Alarms */}
              <View style={styles.detailsSection}>
                <Text style={styles.sectionTitle}>Event Alarms</Text>
                
                {selectedEvent.alarms.map((alarm, index) => (
                  <View key={index} style={styles.timeDetailItem}>
                    <View style={styles.timeDetailInfo}>
                      <Text style={styles.timeDetailText}>
                        {alarm.day} at {alarm.time}
                      </Text>
                      <Text style={styles.timeDetailStatus}>
                        {alarm.enabled ? '✓ Active' : '✗ Inactive'}
                      </Text>
                      {alarm.description && (
                        <Text style={styles.alarmPreviewDescription}>
                          {alarm.description}
                        </Text>
                      )}
                    </View>
                    <Switch
                      value={alarm.enabled}
                      onValueChange={() => toggleIndividualAlarm(selectedEvent.id, alarm.id)}
                      trackColor={{ false: '#374151', true: '#DC2626' }}
                      thumbColor={alarm.enabled ? '#FFFFFF' : '#9CA3AF'}
                      ios_backgroundColor="#374151"
                    />
                  </View>
                ))}
              </View>

              {/* Test Alarm Button */}
              <View style={styles.detailsSection}>
                <Text style={styles.sectionTitle}>Test Your Alarm</Text>
                <TouchableOpacity 
                  style={styles.testAlarmButton}
                  onPress={() => testAlarmInOneMinute(selectedEvent)}
                  activeOpacity={0.8}
                >
                  <Icon name="play-circle-filled" size={24} color="#34C759" />
                  <Text style={styles.testAlarmButtonText}>Test Alarm in 1 Minute</Text>
                </TouchableOpacity>
                <Text style={styles.testAlarmHint}>
                  This will trigger a test notification in 1 minute to verify your alarm system works
                </Text>
              </View>

              {/* Event Statistics */}
              <View style={styles.detailsSection}>
                <Text style={styles.sectionTitle}>Statistics</Text>
                
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>
                      {selectedEvent.alarms.filter(a => a.enabled).length}
                    </Text>
                    <Text style={styles.statLabel}>Active Alarms</Text>
                  </View>
                  
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>
                      {[...new Set(selectedEvent.alarms.filter(a => a.enabled).map(a => a.day))].length}
                    </Text>
                    <Text style={styles.statLabel}>Active Days</Text>
                  </View>
                  
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>
                      {selectedEvent.createdAt ? 
                        new Date(selectedEvent.createdAt).toLocaleDateString() : 
                        'Unknown'
                      }
                    </Text>
                    <Text style={styles.statLabel}>Created</Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Alarm Overlay */}
      <AlarmOverlay 
        visible={showAlarmOverlay}
        alarm={activeAlarm}
        onSnooze={handleSnooze}
        onDismiss={handleDismiss}
      />
    </View>
  );
};

// New design system styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    backgroundColor: '#000000',
    paddingTop: StatusBar.currentHeight || 44,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1E',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'SF Pro Display',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  knobButton: {
    backgroundColor: '#8B5CF6',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  addButton: {
    backgroundColor: '#FF0000',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#FF0000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 32,
  },
  emptyActionButton: {
    backgroundColor: '#FF0000',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  emptyActionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  alarmsList: {
    padding: 16,
  },
  alarmCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  alarmCardDisabled: {
    opacity: 0.5,
  },
  alarmCardContent: {
    padding: 20,
  },
  alarmHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  alarmMainInfo: {
    flex: 1,
  },
  alarmName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  alarmTimes: {
    fontSize: 16,
    color: '#FF0000',
    marginBottom: 4,
  },
  alarmSound: {
    fontSize: 14,
    color: '#8E8E93',
  },
  alarmControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  deleteButton: {
    padding: 8,
  },
  alarmStats: {
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E',
    paddingTop: 16,
  },
  statText: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  alarmDescription: {
    fontSize: 14,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1E',
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 16 : 44,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createHeaderButton: {
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    borderRadius: 20,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  formSection: {
    marginVertical: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#1C1C1E',
    color: '#FFFFFF',
  },
  soundSelector: {
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#1C1C1E',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  soundSelectorText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  timeControls: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 20,
  },
  timeInputGroup: {
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 8,
  },
  timeButtonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeButton: {
    backgroundColor: '#FF0000',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeDisplay: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    minWidth: 40,
    textAlign: 'center',
  },
  timeSeparator: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  addTimeButton: {
    backgroundColor: '#34C759',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  timesPreview: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  timePreviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
    marginBottom: 8,
  },
  timePreviewText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  removeTimeButton: {
    padding: 4,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#1C1C1E',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#374151',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
  },
  createButton: {
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 25,
    backgroundColor: '#FF0000',
    gap: 8,
  },
  createButtonDisabled: {
    backgroundColor: '#374151',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  saveButton: {
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 25,
    backgroundColor: '#FF0000',
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#374151',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  
  // Edit button styles
  editButton: {
    padding: 8,
    marginRight: 8,
  },
  
  // Details modal styles
  modalEditButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsSection: {
    marginVertical: 20,
  },
  detailsTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  detailsDescription: {
    fontSize: 17,
    color: '#8E8E93',
    marginBottom: 20,
    lineHeight: 24,
  },
  detailsMetaContainer: {
    gap: 12,
  },
  detailsMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailsMetaText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  timeDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    marginBottom: 8,
  },
  timeDetailInfo: {
    flex: 1,
  },
  timeDetailText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  timeDetailStatus: {
    fontSize: 14,
    color: '#8E8E93',
  },
  timeDetailIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  timeDetailActive: {
    backgroundColor: '#34C759',
  },
  timeDetailInactive: {
    backgroundColor: '#8E8E93',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    paddingVertical: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF0000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
  },
  
  // Event-specific styles
  eventCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    marginBottom: 12,
  },
  eventCardDisabled: {
    opacity: 0.6,
  },
  eventCardContent: {
    padding: 16,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  eventIcon: {
    fontSize: 24,
  },
  eventMainInfo: {
    flex: 1,
  },
  eventName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  eventDays: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  eventSound: {
    fontSize: 12,
    color: '#8E8E93',
  },
  eventControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  eventStats: {
    marginTop: 8,
  },
  
  // Day selection styles
  dayTypeSelector: {
    borderWidth: 1,
    borderColor: '#1C1C1E',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1C1C1E',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayTypeSelectorText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  customDaysContainer: {
    marginTop: 12,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  dayChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#374151',
  },
  dayChipSelected: {
    backgroundColor: '#FF0000',
    borderColor: '#FF0000',
  },
  dayChipText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '600',
  },
  dayChipTextSelected: {
    color: '#FFFFFF',
  },
  
  // Time preset styles
  timePresets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  timePresetChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#374151',
  },
  timePresetChipSelected: {
    backgroundColor: '#FF0000',
    borderColor: '#FF0000',
  },
  timePresetText: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
  },
  timePresetTextSelected: {
    color: '#FFFFFF',
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#1C1C1E',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#1C1C1E',
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  
  // Add alarm button
  addAlarmButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FF0000',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 16,
  },
  addAlarmButtonDisabled: {
    backgroundColor: '#666666',
    opacity: 0.7,
  },
  addAlarmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  // Alarm preview styles
  alarmPreviewInfo: {
    flex: 1,
  },
  alarmPreviewDescription: {
    fontSize: 12,
    color: '#8E8E93',
    fontStyle: 'italic',
    marginTop: 2,
  },
  
  // Time picker styles
  timePickerContainer: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
  },
  timePickerColumn: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  timePickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  timePickerScrollContainer: {
    maxHeight: 120,
    width: '100%',
  },
  timePickerItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 2,
    borderRadius: 8,
    backgroundColor: '#2C2C2E',
    alignItems: 'center',
    minHeight: 36,
    justifyContent: 'center',
  },
  timePickerItemSelected: {
    backgroundColor: '#FF0000',
  },
  timePickerText: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
  timePickerTextSelected: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  selectedTimeDisplay: {
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    alignItems: 'center',
  },
  selectedTimeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  selectedTime24: {
    fontSize: 14,
    color: '#8E8E93',
  },
  
  // Test alarm button styles
  testAlarmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#34C759',
    gap: 12,
  },
  testAlarmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34C759',
  },
  testAlarmHint: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  alarmSummary: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
});

export default NewAlarms;