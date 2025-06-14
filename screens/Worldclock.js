import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Button,
  FlatList,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ImageBackground,
  Animated,
  Dimensions,
  TextInput
} from 'react-native';
import SearchableDropdown from 'react-native-searchable-dropdown';
import moment from 'moment-timezone';
// Removed react-native-paper to fix font error
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Swipeable, RectButton } from 'react-native-gesture-handler';
import StorageService from '../src/services/StorageService';
import { COLORS, WORLD_CLOCK_SETTINGS } from '../src/utils/constants';

const { width } = Dimensions.get('window');
const clockSize = width * 0.4;

// Enhanced timezone data with city information
const getAllTimezones = () => {
  return moment.tz.names().map(tz => {
    const parts = tz.split('/');
    const cityName = parts[parts.length - 1].replace(/_/g, ' ');
    const regionName = parts.length > 1 ? parts[0].replace(/_/g, ' ') : '';
    
    return {
      id: tz,
      name: `${cityName}`,
      fullName: `${cityName}, ${regionName}`,
      timezone: tz,
      region: regionName,
      city: cityName
    };
  }).sort((a, b) => a.city.localeCompare(b.city));
};

const timezones = getAllTimezones();

// City background images (you can replace these with actual Unsplash URLs)
const getCityBackground = (cityName) => {
  const cityBackgrounds = {
    'New York': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400',
    'London': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400',
    'Tokyo': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400',
    'Paris': 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=400',
    'Sydney': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
    'Dubai': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400',
    'Singapore': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400',
    'Los Angeles': 'https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=400',
  };
  
  return cityBackgrounds[cityName] || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400';
};

const WorldClockScreen = () => {
  const [clocks, setClocks] = useState([]);
  const [selectedTimezone, setSelectedTimezone] = useState('');
  const [currentTime, setCurrentTime] = useState(moment());
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTimezones, setFilteredTimezones] = useState(timezones);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    loadClocks();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(moment());
    }, WORLD_CLOCK_SETTINGS.updateInterval);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = timezones.filter(tz => 
        tz.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tz.region.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredTimezones(filtered);
    } else {
      setFilteredTimezones(timezones);
    }
  }, [searchQuery]);

  const loadClocks = async () => {
    try {
      const savedClocks = await StorageService.loadWorldClocks();
      setClocks(savedClocks);
    } catch (error) {
      console.error('Failed to load clocks', error);
    }
  };

  const saveClocks = async (newClocks) => {
    try {
      await StorageService.saveWorldClocks(newClocks);
    } catch (error) {
      console.error('Failed to save clocks', error);
    }
  };

  const addClock = (timezone) => {
    if (timezone) {
      if (clocks.length >= WORLD_CLOCK_SETTINGS.maxClocks) {
        Alert.alert('Limit reached', `You can only add up to ${WORLD_CLOCK_SETTINGS.maxClocks} clocks.`);
        return;
      }
      
      // Check if clock already exists
      if (clocks.some(clock => clock.timezone === timezone)) {
        Alert.alert('Clock exists', 'This city is already in your world clock list.');
        return;
      }
      
      const timezoneData = timezones.find(tz => tz.timezone === timezone);
      const newClock = {
        id: Date.now().toString(),
        timezone: timezone,
        city: timezoneData?.city || 'Unknown',
        region: timezoneData?.region || 'Unknown',
        background: getCityBackground(timezoneData?.city),
        order: clocks.length
      };
      
      const newClocks = [...clocks, newClock];
      setClocks(newClocks);
      saveClocks(newClocks);
      setSelectedTimezone('');
    }
  };

  const deleteClock = async (clockId) => {
    const newClocks = clocks.filter(clock => clock.id !== clockId);
    setClocks(newClocks);
    await saveClocks(newClocks);
  };

  const reorderClocks = async (newOrder) => {
    setClocks(newOrder);
    await saveClocks(newOrder);
  };

  const renderRightActions = (item) => {
    return (
      <RectButton style={styles.deleteButton} onPress={() => deleteClock(item.id)}>
        <Icon name="delete" size={24} color="white" />
        <Text style={styles.deleteText}>Delete</Text>
      </RectButton>
    );
  };

  const renderClockItem = ({ item, index, drag }) => {
    const currentClockTime = moment().tz(item.timezone);
    const hourAngle = (currentClockTime.hours() % 12) * 30 + currentClockTime.minutes() * 0.5;
    const minuteAngle = currentClockTime.minutes() * 6;
    const secondAngle = currentClockTime.seconds() * 6;
    
    const isDay = currentClockTime.hours() >= 6 && currentClockTime.hours() < 18;
    const timeDifference = currentClockTime.utcOffset() - moment().utcOffset();
    const timeDifferenceText = timeDifference >= 0 ? `+${timeDifference / 60}h` : `${timeDifference / 60}h`;

    return (
      <Swipeable renderRightActions={() => renderRightActions(item)}>
        <TouchableOpacity onLongPress={drag} style={styles.clockItemContainer}>
          <View style={styles.clockCard}>
            <ImageBackground 
              source={{ uri: item.background }} 
              style={styles.clockBackground}
              imageStyle={styles.backgroundImage}
            >
              <View style={styles.clockOverlay}>
                <View style={styles.clockHeader}>
                  <View>
                    <Text style={styles.cityName}>{item.city}</Text>
                    <Text style={styles.regionName}>{item.region}</Text>
                    <Text style={styles.timeDifference}>{timeDifferenceText}</Text>
                  </View>
                  <View style={styles.timeContainer}>
                    <Text style={styles.digitalTime}>{currentClockTime.format('HH:mm')}</Text>
                    <Text style={styles.digitalDate}>{currentClockTime.format('MMM DD')}</Text>
                    <View style={styles.dayNightIndicator}>
                      <Icon 
                        name={isDay ? "wb-sunny" : "brightness-3"} 
                        size={16} 
                        color={isDay ? "#FFD700" : "#C0C0C0"} 
                      />
                    </View>
                  </View>
                </View>
                
                <View style={styles.analogClockContainer}>
                  <View style={styles.analogClock}>
                    {/* Clock markings */}
                    {Array.from({ length: 12 }, (_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.clockMarking,
                          {
                            transform: [
                              { rotate: `${i * 30}deg` },
                              { translateY: -clockSize * 0.35 },
                            ],
                          },
                        ]}
                      />
                    ))}
                    
                    {/* Hour hand */}
                    <View
                      style={[
                        styles.clockHand,
                        styles.hourHand,
                        { transform: [{ rotate: `${hourAngle}deg` }] },
                      ]}
                    />
                    
                    {/* Minute hand */}
                    <View
                      style={[
                        styles.clockHand,
                        styles.minuteHand,
                        { transform: [{ rotate: `${minuteAngle}deg` }] },
                      ]}
                    />
                    
                    {/* Second hand */}
                    <View
                      style={[
                        styles.clockHand,
                        styles.secondHand,
                        { transform: [{ rotate: `${secondAngle}deg` }] },
                      ]}
                    />
                    
                    {/* Center dot */}
                    <View style={styles.centerDot} />
                  </View>
                </View>
              </View>
            </ImageBackground>
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color={COLORS.space.primary} style={styles.searchIcon} />
        <TextInput
          placeholder="Search for a city..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchInput}
          placeholderTextColor={COLORS.textSecondary}
        />
      </View>
      
      {/* City Selection */}
      {searchQuery && (
        <View style={styles.searchResults}>
          <FlatList
            data={filteredTimezones.slice(0, 5)}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.searchResultItem}
                onPress={() => {
                  addClock(item.timezone);
                  setSearchQuery('');
                }}
              >
                <Text style={styles.searchResultCity}>{item.city}</Text>
                <Text style={styles.searchResultRegion}>{item.region}</Text>
              </TouchableOpacity>
            )}
            style={styles.searchResultsList}
          />
        </View>
      )}
      
      {/* World Clocks List */}
      <FlatList
        data={clocks}
        keyExtractor={item => item.id}
        renderItem={renderClockItem}
        extraData={currentTime}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.clocksList}
      />
      
      {/* Quick Add Cities FAB */}
      {clocks.length === 0 && (
        <View style={styles.quickAddContainer}>
          <Text style={styles.quickAddTitle}>Popular Cities</Text>
          <View style={styles.quickAddButtons}>
            {WORLD_CLOCK_SETTINGS.defaultCities.map((city) => (
              <TouchableOpacity
                key={city.timezone}
                style={styles.quickAddButton}
                onPress={() => addClock(city.timezone)}
              >
                <Text style={styles.quickAddButtonText}>{city.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
      
      {clocks.length < WORLD_CLOCK_SETTINGS.maxClocks && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setSearchQuery('')}
        >
          <Icon name="add" size={24} color="white" />
          {clocks.length === 0 && <Text style={styles.fabText}>Add City</Text>}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.space.background,
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.space.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    height: 48,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 16,
  },
  searchResults: {
    position: 'absolute',
    top: 80,
    left: 16,
    right: 16,
    zIndex: 1000,
    backgroundColor: COLORS.space.surface,
    borderRadius: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    maxHeight: 200,
  },
  searchResultsList: {
    maxHeight: 200,
  },
  searchResultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.space.background,
  },
  searchResultCity: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  searchResultRegion: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  clocksList: {
    paddingBottom: 100,
  },
  clockItemContainer: {
    marginBottom: 16,
  },
  clockCard: {
    backgroundColor: COLORS.space.surface,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  clockBackground: {
    height: 200,
  },
  backgroundImage: {
    borderRadius: 8,
  },
  clockOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 16,
  },
  clockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cityName: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: 'bold',
  },
  regionName: {
    color: COLORS.textTertiary,
    fontSize: 14,
    marginTop: 2,
  },
  timeDifference: {
    color: COLORS.space.primary,
    fontSize: 12,
    marginTop: 4,
  },
  timeContainer: {
    alignItems: 'flex-end',
  },
  digitalTime: {
    color: COLORS.textPrimary,
    fontSize: 32,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  digitalDate: {
    color: COLORS.textTertiary,
    fontSize: 14,
    marginTop: 2,
  },
  dayNightIndicator: {
    marginTop: 4,
  },
  analogClockContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  analogClock: {
    width: clockSize,
    height: clockSize,
    borderRadius: clockSize / 2,
    borderWidth: 3,
    borderColor: COLORS.textPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  clockMarking: {
    position: 'absolute',
    width: 3,
    height: 15,
    backgroundColor: COLORS.textPrimary,
  },
  clockHand: {
    position: 'absolute',
    backgroundColor: COLORS.textPrimary,
    transformOrigin: 'bottom',
  },
  hourHand: {
    width: 4,
    height: clockSize * 0.25,
  },
  minuteHand: {
    width: 3,
    height: clockSize * 0.35,
  },
  secondHand: {
    width: 2,
    height: clockSize * 0.4,
    backgroundColor: COLORS.accent,
  },
  centerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
    position: 'absolute',
    zIndex: 10,
  },
  deleteButton: {
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    marginBottom: 16,
    borderRadius: 8,
  },
  deleteText: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
  },
  quickAddContainer: {
    padding: 20,
    alignItems: 'center',
  },
  quickAddTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  quickAddButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  quickAddButton: {
    backgroundColor: COLORS.space.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    margin: 4,
  },
  quickAddButtonText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.space.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fabText: {
    color: 'white',
    fontSize: 12,
    marginTop: 2,
  },
});

export default WorldClockScreen;
