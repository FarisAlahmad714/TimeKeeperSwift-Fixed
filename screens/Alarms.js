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
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

const { width, height } = Dimensions.get('window');

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const RINGTONES = [
  { label: 'Default', value: 'default' },
  { label: 'Ringtone 1', value: 'Ringtone1.mp3' },
  { label: 'Ringtone 2', value: 'Ringtone2.mp3' },
  { label: 'Ringtone 3', value: 'Ringtone3.mp3' }
];

const EVENT_ICONS = {
  'GYM': '🏋️',
  'MEDICINE': '💊',
  'WORK': '💼',
  'STUDY': '📚',
  'MEETING': '🤝',
  'FOOD': '🍽️',
  'SLEEP': '😴',
  'DEFAULT': '⏰'
};

const Alarms = () => {
  const [events, setEvents] = useState([]);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showTimePickerModal, setShowTimePickerModal] = useState(false);
  const [tempHour, setTempHour] = useState(6);
  const [tempMinute, setTempMinute] = useState(0);
  
  // Form states
  const [eventName, setEventName] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventRingtone, setEventRingtone] = useState('default');
  const [eventAlarms, setEventAlarms] = useState([]);
  const [newAlarmDay, setNewAlarmDay] = useState('Monday');
  const [newAlarmTime, setNewAlarmTime] = useState('06:00');
  const [newAlarmDescription, setNewAlarmDescription] = useState('');

  useEffect(() => {
    loadEvents();
    requestNotificationPermissions();
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

  const createEvent = () => {
    if (!eventName.trim()) {
      Alert.alert('Missing Information', 'Please enter an event name');
      return;
    }

    if (eventAlarms.length === 0) {
      Alert.alert('Missing Information', 'Please add at least one alarm time');
      return;
    }

    const newEvent = {
      id: Date.now().toString(),
      eventName: eventName.trim(),
      description: eventDescription.trim(),
      ringtone: eventRingtone,
      isEnabled: true,
      createdAt: new Date().toISOString(),
      alarms: eventAlarms.map((alarm, index) => ({
        id: `${Date.now()}-${index}`,
        day: alarm.day,
        time: alarm.time,
        description: alarm.description,
        enabled: true
      }))
    };

    const updatedEvents = [...events, newEvent];
    setEvents(updatedEvents);
    saveEvents(updatedEvents);
    scheduleEventNotifications(newEvent);

    // Reset form
    setEventName('');
    setEventDescription('');
    setEventRingtone('default');
    setEventAlarms([]);
    setShowCreateEventModal(false);

    Alert.alert('Success!', `Event "${newEvent.eventName}" created with ${newEvent.alarms.length} alarms`);
  };

  const addAlarmTime = () => {
    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(newAlarmTime)) {
      Alert.alert('Invalid Time', 'Please enter time in HH:MM format (24-hour)');
      return;
    }

    // Check if this day/time combination already exists
    const exists = eventAlarms.some(alarm => 
      alarm.day === newAlarmDay && alarm.time === newAlarmTime
    );

    if (exists) {
      Alert.alert('Duplicate Alarm', 'This day and time combination already exists');
      return;
    }

    // Description is now optional

    const newAlarm = {
      day: newAlarmDay,
      time: newAlarmTime,
      description: newAlarmDescription.trim() || '' // Optional, empty if not provided
    };

    setEventAlarms([...eventAlarms, newAlarm]);
    setNewAlarmDescription(''); // Clear description for next alarm
  };

  const removeAlarmTime = (index) => {
    const updatedAlarms = eventAlarms.filter((_, i) => i !== index);
    setEventAlarms(updatedAlarms);
  };

  const toggleEventEnabled = async (eventId) => {
    const updatedEvents = events.map(event => {
      if (event.id === eventId) {
        const updatedEvent = { ...event, isEnabled: !event.isEnabled };
        
        if (updatedEvent.isEnabled) {
          scheduleEventNotifications(updatedEvent);
        } else {
          cancelEventNotifications(updatedEvent);
        }

        return updatedEvent;
      }
      return event;
    });

    setEvents(updatedEvents);
    saveEvents(updatedEvents);
  };

  const toggleAlarmEnabled = async (eventId, alarmId) => {
    const updatedEvents = events.map(event => {
      if (event.id === eventId) {
        const updatedEvent = {
          ...event,
          alarms: event.alarms.map(alarm => 
            alarm.id === alarmId ? { ...alarm, enabled: !alarm.enabled } : alarm
          )
        };

        // Reschedule notifications for this event
        cancelEventNotifications(event);
        if (updatedEvent.isEnabled) {
          scheduleEventNotifications(updatedEvent);
        }

        return updatedEvent;
      }
      return event;
    });

    setEvents(updatedEvents);
    saveEvents(updatedEvents);
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
          onPress: () => {
            cancelEventNotifications(eventToDelete);
            
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

      const dayIndex = DAYS.indexOf(alarm.day);
      const [hours, minutes] = alarm.time.split(':').map(Number);

      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: event.eventName,
            body: event.description || 'Alarm time!',
            sound: event.ringtone,
            data: { eventId: event.id, alarmId: alarm.id }
          },
          trigger: {
            weekday: dayIndex + 1,
            hour: hours,
            minute: minutes,
            repeats: true,
          },
        });
      } catch (error) {
        console.error('Error scheduling notification:', error);
      }
    }
  };

  const cancelEventNotifications = async (event) => {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      
      for (const notification of notifications) {
        if (notification.content.title === event.eventName) {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
      }
    } catch (error) {
      console.error('Error canceling notifications:', error);
    }
  };

  const getEventIcon = (eventName) => {
    const upperName = eventName.toUpperCase();
    for (const key in EVENT_ICONS) {
      if (upperName.includes(key)) {
        return EVENT_ICONS[key];
      }
    }
    return EVENT_ICONS.DEFAULT;
  };

  const getEventSummary = (event) => {
    const enabledAlarms = event.alarms.filter(alarm => alarm.enabled);
    const activeDays = [...new Set(enabledAlarms.map(alarm => alarm.day))];
    const alarmDescriptions = enabledAlarms.slice(0, 2).map(alarm => alarm.description).join(', ');
    
    return {
      activeAlarms: enabledAlarms.length,
      totalAlarms: event.alarms.length,
      activeDays: activeDays.slice(0, 3).join(', ') + (activeDays.length > 3 ? ` +${activeDays.length - 3} more` : ''),
      alarmDescriptions: alarmDescriptions + (enabledAlarms.length > 2 ? '...' : '')
    };
  };

  const openEventDetails = (event) => {
    setSelectedEvent(event);
    setShowEventDetailsModal(true);
  };

  const formatTime = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const formatTimeWithSpacing = (time) => {
    const formatted = formatTime(time);
    return formatted.replace(' ', '\u00A0'); // Non-breaking space for better alignment
  };

  const getTotalActiveAlarms = () => {
    return events.reduce((total, event) => {
      if (!event.isEnabled) return total;
      return total + event.alarms.filter(alarm => alarm.enabled).length;
    }, 0);
  };

  const renderEventItem = ({ item }) => {
    const summary = getEventSummary(item);
    const icon = getEventIcon(item.eventName);
    
    return (
      <TouchableOpacity 
        style={[styles.eventCard, !item.isEnabled && styles.eventCardDisabled]}
        onPress={() => openEventDetails(item)}
        activeOpacity={0.7}
      >
        <View style={styles.eventCardHeader}>
          <View style={styles.eventIconContainer}>
            <Text style={styles.eventIcon}>{icon}</Text>
          </View>
          
          <View style={styles.eventMainInfo}>
            <View style={styles.eventTitleRow}>
              <Text style={styles.eventName}>{item.eventName}</Text>
              <TouchableOpacity 
                style={styles.deleteEventButton}
                onPress={() => deleteEvent(item.id)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="delete-outline" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
            <Text style={styles.eventDescription} numberOfLines={1}>
              {item.description || 'No description'}
            </Text>
          </View>

          <View style={styles.eventToggleContainer}>
            <Switch
              value={item.isEnabled}
              onValueChange={() => toggleEventEnabled(item.id)}
              trackColor={{ false: '#E5E7EB', true: '#10B981' }}
              thumbColor={item.isEnabled ? '#FFFFFF' : '#9CA3AF'}
              ios_backgroundColor="#E5E7EB"
            />
          </View>
        </View>

        <View style={styles.eventCardBody}>
          <View style={styles.eventInfoSection}>
            <View style={styles.eventStats}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{summary.activeAlarms}</Text>
                <Text style={styles.statLabel}>Active</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{summary.totalAlarms}</Text>
                <Text style={styles.statLabel}>Total Alarms</Text>
              </View>
            </View>

            <View style={styles.eventDays}>
              <Text style={styles.eventDaysText} numberOfLines={1}>
                📅 {summary.activeDays || 'No active days'}
              </Text>
              {summary.alarmDescriptions && (
                <Text style={styles.eventAlarmDescriptions} numberOfLines={1}>
                  📝 {summary.alarmDescriptions}
                </Text>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1F2937" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Event Alarms</Text>
          <Text style={styles.headerSubtitle}>
            {getTotalActiveAlarms()} active alarm{getTotalActiveAlarms() !== 1 ? 's' : ''} • {events.length} event{events.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowCreateEventModal(true)}
          activeOpacity={0.8}
        >
          <Icon name="add" size={28} color="white" />
        </TouchableOpacity>
      </View>

      {/* Events List */}
      {events.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Icon name="event-note" size={80} color="#9CA3AF" />
          </View>
          <Text style={styles.emptyTitle}>No Events Yet</Text>
          <Text style={styles.emptySubtitle}>
            Create your first event alarm to organize your schedule by activities like GYM, MEDICINE, or WORK
          </Text>
          <TouchableOpacity 
            style={styles.emptyActionButton}
            onPress={() => setShowCreateEventModal(true)}
          >
            <Icon name="add" size={20} color="white" />
            <Text style={styles.emptyActionText}>Create Event</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={renderEventItem}
          contentContainerStyle={styles.eventsList}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Create Event Modal */}
      <Modal
        visible={showCreateEventModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateEventModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowCreateEventModal(false)}
            >
              <Icon name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>New Event</Text>
            <View style={styles.modalCloseButton} />
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Event Basic Info */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Event Information</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Event Name</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g., GYM, MEDICINE, WORK"
                  value={eventName}
                  onChangeText={setEventName}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description (Optional)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Brief description of this event"
                  value={eventDescription}
                  onChangeText={setEventDescription}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Ringtone</Text>
                <TouchableOpacity 
                  style={styles.ringtoneSelector}
                  onPress={() => {
                    Alert.alert(
                      'Select Ringtone',
                      'Choose a ringtone for this event',
                      RINGTONES.map(ringtone => ({
                        text: ringtone.label,
                        onPress: () => setEventRingtone(ringtone.value)
                      })).concat([{ text: 'Cancel', style: 'cancel' }])
                    );
                  }}
                >
                  <Text style={styles.ringtoneSelectorText}>
                    {RINGTONES.find(r => r.value === eventRingtone)?.label || 'Default'}
                  </Text>
                  <Icon name="keyboard-arrow-down" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Add Alarm Times */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Alarm Times</Text>
              
              <View style={styles.addAlarmContainer}>
                <View style={styles.addAlarmRow}>
                  <View style={styles.dayPickerContainer}>
                    <Text style={styles.miniLabel}>Day</Text>
                    <TouchableOpacity 
                      style={styles.daySelector}
                      onPress={() => {
                        Alert.alert(
                          'Select Day',
                          'Choose which day this alarm should trigger',
                          DAYS.map(day => ({
                            text: day,
                            onPress: () => setNewAlarmDay(day)
                          })).concat([{ text: 'Cancel', style: 'cancel' }])
                        );
                      }}
                    >
                      <Text style={styles.daySelectorText}>
                        {newAlarmDay.slice(0, 3)}
                      </Text>
                      <Icon name="keyboard-arrow-down" size={20} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.timeInputContainer}>
                    <Text style={styles.miniLabel}>Time (24h)</Text>
                    <TouchableOpacity 
                      style={styles.timeSelector}
                      onPress={() => {
                        console.log('Time selector pressed!');
                        
                        // Simple Alert-based time picker for now
                        const hours = Array.from({length: 24}, (_, i) => ({
                          text: `${i.toString().padStart(2, '0')}:XX`,
                          onPress: () => {
                            Alert.alert(
                              'Select Minutes',
                              `Hour: ${i.toString().padStart(2, '0')}`,
                              Array.from({length: 12}, (_, m) => ({
                                text: `${i.toString().padStart(2, '0')}:${(m * 5).toString().padStart(2, '0')}`,
                                onPress: () => setNewAlarmTime(`${i.toString().padStart(2, '0')}:${(m * 5).toString().padStart(2, '0')}`)
                              })).concat([{ text: 'Cancel', style: 'cancel' }])
                            );
                          }
                        }));
                        
                        Alert.alert(
                          'Select Hour',
                          'Choose the hour for your alarm',
                          hours.slice(0, 10).concat([{ text: 'More...', onPress: () => {
                            Alert.alert(
                              'Select Hour (10-23)',
                              'Choose the hour for your alarm',
                              hours.slice(10).concat([{ text: 'Cancel', style: 'cancel' }])
                            );
                          }}]).concat([{ text: 'Cancel', style: 'cancel' }])
                        );
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.timeSelectorText}>
                        {newAlarmTime}
                      </Text>
                      <Icon name="schedule" size={24} color="#3B82F6" />
                    </TouchableOpacity>
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.addTimeButton} 
                    onPress={addAlarmTime}
                    activeOpacity={0.7}
                  >
                    <Icon name="add" size={24} color="white" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.alarmDescriptionContainer}>
                  <Text style={styles.miniLabel}>Alarm Description (Optional)</Text>
                  <TextInput
                    style={styles.alarmDescriptionInput}
                    placeholder="e.g., Arms workout, Morning medicine (optional)"
                    value={newAlarmDescription}
                    onChangeText={setNewAlarmDescription}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              {/* Alarm Preview */}
              {eventAlarms.length > 0 && (
                <View style={styles.alarmsPreviewContainer}>
                  <Text style={styles.previewTitle}>
                    {eventAlarms.length} Alarm{eventAlarms.length !== 1 ? 's' : ''} Added
                  </Text>
                  {eventAlarms.map((alarm, index) => (
                    <View key={index} style={styles.alarmPreviewItem}>
                      <View style={styles.alarmPreviewInfo}>
                        <View style={styles.alarmPreviewRow}>
                          <Text style={styles.alarmPreviewDay}>{alarm.day}</Text>
                          <Text style={styles.alarmPreviewTime}>{formatTimeWithSpacing(alarm.time)}</Text>
                        </View>
                        {alarm.description && alarm.description.trim() && (
                          <Text style={styles.alarmPreviewDescription}>"{alarm.description}"</Text>
                        )}
                      </View>
                      <TouchableOpacity 
                        onPress={() => removeAlarmTime(index)}
                        style={styles.removeAlarmButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Icon name="close" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>

          {/* Modal Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setShowCreateEventModal(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.createButton, eventAlarms.length === 0 && styles.createButtonDisabled]}
              onPress={createEvent}
              disabled={eventAlarms.length === 0}
              activeOpacity={0.7}
            >
              <Icon name="check" size={20} color="white" />
              <Text style={styles.createButtonText}>Create Event</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Event Details Modal */}
      <Modal
        visible={showEventDetailsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEventDetailsModal(false)}
      >
        <View style={styles.modalContainer}>
          {selectedEvent && (
            <>
              <View style={styles.modalHeader}>
                <TouchableOpacity 
                  style={styles.modalCloseButton}
                  onPress={() => setShowEventDetailsModal(false)}
                >
                  <Icon name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
                <Text style={styles.modalHeaderTitle} numberOfLines={1}>
                  {getEventIcon(selectedEvent.eventName)} {selectedEvent.eventName}
                </Text>
                <View style={styles.modalCloseButton} />
              </View>

              <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                <View style={styles.eventDetailsHeader}>
                  <Text style={styles.eventDetailsDescription}>
                    {selectedEvent.description || 'No description'}
                  </Text>
                  <View style={styles.eventDetailsMeta}>
                    <Text style={styles.eventDetailsMetaText}>
                      Ringtone: {RINGTONES.find(r => r.value === selectedEvent.ringtone)?.label || 'Default'}
                    </Text>
                  </View>
                </View>

                <View style={styles.alarmDetailsContainer}>
                  <Text style={styles.sectionTitle}>Alarm Schedule</Text>
                  
                  {DAYS.map(day => {
                    const dayAlarms = selectedEvent.alarms.filter(alarm => alarm.day === day);
                    
                    if (dayAlarms.length === 0) return null;
                    
                    return (
                      <View key={day} style={styles.daySection}>
                        <Text style={styles.dayTitle}>{day}</Text>
                        {dayAlarms.map(alarm => (
                          <View key={alarm.id} style={styles.alarmDetailItem}>
                            <View style={styles.alarmDetailContent}>
                              <View style={styles.alarmTimeAndDescription}>
                                <View style={styles.timeWithIcon}>
                                  <Icon name="schedule" size={16} color="#3B82F6" />
                                  <Text style={styles.alarmDetailTime}>
                                    {formatTimeWithSpacing(alarm.time)}
                                  </Text>
                                </View>
                                {alarm.description && alarm.description.trim() && (
                                  <View style={styles.descriptionWithIcon}>
                                    <Icon name="description" size={14} color="#6B7280" />
                                    <Text style={styles.alarmDetailDescription}>
                                      {alarm.description}
                                    </Text>
                                  </View>
                                )}
                              </View>
                              
                              <View style={styles.alarmDetailControls}>
                                <View style={[
                                  styles.alarmStatusBadge, 
                                  alarm.enabled ? styles.alarmStatusEnabled : styles.alarmStatusDisabled
                                ]}>
                                  <Text style={[
                                    styles.alarmStatusText,
                                    alarm.enabled ? styles.alarmStatusTextEnabled : styles.alarmStatusTextDisabled
                                  ]}>
                                    {alarm.enabled ? 'ON' : 'OFF'}
                                  </Text>
                                </View>
                                <Switch
                                  value={alarm.enabled}
                                  onValueChange={() => toggleAlarmEnabled(selectedEvent.id, alarm.id)}
                                  trackColor={{ false: '#E5E7EB', true: '#10B981' }}
                                  thumbColor={alarm.enabled ? '#FFFFFF' : '#9CA3AF'}
                                  ios_backgroundColor="#E5E7EB"
                                />
                              </View>
                            </View>
                          </View>
                        ))}
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            </>
          )}
        </View>
      </Modal>

      {/* Time Picker Modal */}
      {console.log('Rendering time picker modal, visible:', showTimePickerModal)}
      <Modal
        visible={showTimePickerModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowTimePickerModal(false)}
        statusBarTranslucent={true}
      >
        <View style={styles.timePickerOverlay}>
          <View style={styles.timePickerModal}>
            <Text style={styles.timePickerTitle}>Select Time</Text>
            
            <View style={styles.timePreviewContainer}>
              <Text style={styles.timePreviewText}>
                {tempHour.toString().padStart(2, '0')}:{tempMinute.toString().padStart(2, '0')}
              </Text>
            </View>
            
            <View style={styles.timePickerContainer}>
              <View style={styles.timePickerColumn}>
                <Text style={styles.timePickerLabel}>Hour</Text>
                <ScrollView style={styles.timePickerScroll} showsVerticalScrollIndicator={false}>
                  {Array.from({length: 24}, (_, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[
                        styles.timePickerItem,
                        tempHour === i && styles.timePickerItemSelected
                      ]}
                      onPress={() => setTempHour(i)}
                    >
                      <Text style={[
                        styles.timePickerItemText,
                        tempHour === i && styles.timePickerItemTextSelected
                      ]}>
                        {i.toString().padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              <Text style={styles.timePickerSeparator}>:</Text>
              
              <View style={styles.timePickerColumn}>
                <Text style={styles.timePickerLabel}>Minute</Text>
                <ScrollView style={styles.timePickerScroll} showsVerticalScrollIndicator={false}>
                  {Array.from({length: 60}, (_, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[
                        styles.timePickerItem,
                        tempMinute === i && styles.timePickerItemSelected
                      ]}
                      onPress={() => setTempMinute(i)}
                    >
                      <Text style={[
                        styles.timePickerItemText,
                        tempMinute === i && styles.timePickerItemTextSelected
                      ]}>
                        {i.toString().padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.timePickerButtons}>
              <TouchableOpacity 
                style={styles.timePickerCancelButton}
                onPress={() => setShowTimePickerModal(false)}
              >
                <Text style={styles.timePickerCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.timePickerConfirmButton}
                onPress={() => {
                  // Apply the selected time
                  const formattedTime = `${tempHour.toString().padStart(2, '0')}:${tempMinute.toString().padStart(2, '0')}`;
                  setNewAlarmTime(formattedTime);
                  setShowTimePickerModal(false);
                }}
              >
                <Text style={styles.timePickerConfirmText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#1F2937',
    paddingTop: StatusBar.currentHeight || 44,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  addButton: {
    backgroundColor: '#3B82F6',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyActionButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  emptyActionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  eventsList: {
    padding: 16,
  },
  eventCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    position: 'relative',
  },
  eventCardDisabled: {
    opacity: 0.6,
  },
  eventCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  eventIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
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
  eventTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
  },
  eventDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  eventToggleContainer: {
    marginLeft: 16,
  },
  eventCardBody: {
    marginTop: 8,
  },
  eventInfoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  eventStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  statLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  eventDays: {
    flex: 1,
    marginLeft: 16,
  },
  eventDaysText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'right',
  },
  eventAlarmDescriptions: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 2,
    fontStyle: 'italic',
  },
  deleteEventButton: {
    padding: 8,
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 16 : 44,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
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
    color: '#1F2937',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
  },
  picker: {
    height: 50,
  },
  addAlarmContainer: {
    marginTop: 8,
  },
  addAlarmRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  dayPickerContainer: {
    flex: 2,
  },
  timeInputContainer: {
    flex: 1,
  },
  miniLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 6,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
    textAlign: 'center',
  },
  timeInputFixed: {
    borderWidth: 2,
    borderColor: '#3B82F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#1F2937',
  },
  ringtoneSelector: {
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ringtoneSelectorText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  daySelector: {
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 50,
  },
  daySelectorText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
  },
  timeSelector: {
    borderWidth: 3,
    borderColor: '#3B82F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 60,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  timeSelectorText: {
    fontSize: 18,
    color: '#1F2937',
    fontWeight: 'bold',
  },
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeInputDirectly: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#3B82F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#1F2937',
  },
  timePickerButton: {
    backgroundColor: '#3B82F6',
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  timePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  timePickerModal: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 320,
  },
  timePickerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  timePreviewContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 24,
    alignItems: 'center',
  },
  timePreviewText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#3B82F6',
    fontFamily: 'monospace',
  },
  timePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  timePickerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  timePickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
  },
  timePickerScroll: {
    height: 120,
    width: 80,
  },
  timePickerItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginVertical: 2,
  },
  timePickerItemSelected: {
    backgroundColor: '#3B82F6',
  },
  timePickerItemText: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  timePickerItemTextSelected: {
    color: 'white',
    fontWeight: 'bold',
  },
  timePickerSeparator: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginHorizontal: 16,
  },
  timePickerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  timePickerCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  timePickerCancelText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  timePickerConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
  },
  timePickerConfirmText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  addTimeButton: {
    backgroundColor: '#10B981',
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alarmsPreviewContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  alarmPreviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 8,
  },
  alarmPreviewInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  alarmPreviewDay: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    minWidth: 60,
  },
  alarmPreviewTime: {
    fontSize: 14,
    color: '#6B7280',
  },
  alarmPreviewDescription: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  alarmDescriptionContainer: {
    marginTop: 16,
  },
  alarmDescriptionInput: {
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#1F2937',
  },
  alarmTimeAndDescription: {
    flex: 1,
  },
  alarmDetailDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
    fontStyle: 'italic',
  },
  timeWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  descriptionWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alarmPreviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  removeAlarmButton: {
    padding: 4,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  createButton: {
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    gap: 8,
  },
  createButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  eventDetailsHeader: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  eventDetailsDescription: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  eventDetailsMeta: {
    flexDirection: 'row',
  },
  eventDetailsMetaText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  alarmDetailsContainer: {
    paddingVertical: 20,
  },
  daySection: {
    marginBottom: 20,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  alarmDetailItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  alarmDetailContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alarmDetailControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  alarmDetailTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  alarmStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  alarmStatusEnabled: {
    backgroundColor: '#D1FAE5',
  },
  alarmStatusDisabled: {
    backgroundColor: '#FEE2E2',
  },
  alarmStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  alarmStatusTextEnabled: {
    color: '#065F46',
  },
  alarmStatusTextDisabled: {
    color: '#991B1B',
  },
});

export default Alarms;