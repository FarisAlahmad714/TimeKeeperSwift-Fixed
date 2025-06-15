import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
  StatusBar,
  Image,
  Dimensions,
  PanGestureHandler,
  Animated,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

// Comprehensive world cities database for fallback search
const WORLD_CITIES_DB = [
  // Major cities by continent
  // Asia
  { city: 'Beijing', country: 'China', timezone: 'Asia/Shanghai' },
  { city: 'Shanghai', country: 'China', timezone: 'Asia/Shanghai' },
  { city: 'Mumbai', country: 'India', timezone: 'Asia/Kolkata' },
  { city: 'Delhi', country: 'India', timezone: 'Asia/Kolkata' },
  { city: 'Kolkata', country: 'India', timezone: 'Asia/Kolkata' },
  { city: 'Chennai', country: 'India', timezone: 'Asia/Kolkata' },
  { city: 'Bangalore', country: 'India', timezone: 'Asia/Kolkata' },
  { city: 'Jakarta', country: 'Indonesia', timezone: 'Asia/Jakarta' },
  { city: 'Manila', country: 'Philippines', timezone: 'Asia/Manila' },
  { city: 'Bangkok', country: 'Thailand', timezone: 'Asia/Bangkok' },
  { city: 'Kuala Lumpur', country: 'Malaysia', timezone: 'Asia/Kuala_Lumpur' },
  { city: 'Seoul', country: 'South Korea', timezone: 'Asia/Seoul' },
  { city: 'Osaka', country: 'Japan', timezone: 'Asia/Tokyo' },
  { city: 'Kyoto', country: 'Japan', timezone: 'Asia/Tokyo' },
  { city: 'Tel Aviv', country: 'Palestine', timezone: 'Asia/Jerusalem' },
  { city: 'Jerusalem', country: 'Palestine', timezone: 'Asia/Jerusalem' },
  { city: 'Riyadh', country: 'Saudi Arabia', timezone: 'Asia/Riyadh' },
  { city: 'Tehran', country: 'Iran', timezone: 'Asia/Tehran' },
  { city: 'Baghdad', country: 'Iraq', timezone: 'Asia/Baghdad' },
  { city: 'Kabul', country: 'Afghanistan', timezone: 'Asia/Kabul' },
  { city: 'Karachi', country: 'Pakistan', timezone: 'Asia/Karachi' },
  { city: 'Lahore', country: 'Pakistan', timezone: 'Asia/Karachi' },
  { city: 'Islamabad', country: 'Pakistan', timezone: 'Asia/Karachi' },
  { city: 'Dhaka', country: 'Bangladesh', timezone: 'Asia/Dhaka' },
  { city: 'Ho Chi Minh City', country: 'Vietnam', timezone: 'Asia/Ho_Chi_Minh' },
  { city: 'Hanoi', country: 'Vietnam', timezone: 'Asia/Ho_Chi_Minh' },
  { city: 'Yangon', country: 'Myanmar', timezone: 'Asia/Yangon' },
  { city: 'Colombo', country: 'Sri Lanka', timezone: 'Asia/Colombo' },
  { city: 'Kathmandu', country: 'Nepal', timezone: 'Asia/Kathmandu' },
  { city: 'Phnom Penh', country: 'Cambodia', timezone: 'Asia/Phnom_Penh' },
  { city: 'Vientiane', country: 'Laos', timezone: 'Asia/Vientiane' },
  
  // Europe
  { city: 'Rome', country: 'Italy', timezone: 'Europe/Rome' },
  { city: 'Milan', country: 'Italy', timezone: 'Europe/Rome' },
  { city: 'Madrid', country: 'Spain', timezone: 'Europe/Madrid' },
  { city: 'Barcelona', country: 'Spain', timezone: 'Europe/Madrid' },
  { city: 'Amsterdam', country: 'Netherlands', timezone: 'Europe/Amsterdam' },
  { city: 'Vienna', country: 'Austria', timezone: 'Europe/Vienna' },
  { city: 'Prague', country: 'Czech Republic', timezone: 'Europe/Prague' },
  { city: 'Warsaw', country: 'Poland', timezone: 'Europe/Warsaw' },
  { city: 'Stockholm', country: 'Sweden', timezone: 'Europe/Stockholm' },
  { city: 'Copenhagen', country: 'Denmark', timezone: 'Europe/Copenhagen' },
  { city: 'Oslo', country: 'Norway', timezone: 'Europe/Oslo' },
  { city: 'Helsinki', country: 'Finland', timezone: 'Europe/Helsinki' },
  { city: 'Brussels', country: 'Belgium', timezone: 'Europe/Brussels' },
  { city: 'Zurich', country: 'Switzerland', timezone: 'Europe/Zurich' },
  { city: 'Geneva', country: 'Switzerland', timezone: 'Europe/Zurich' },
  { city: 'Athens', country: 'Greece', timezone: 'Europe/Athens' },
  { city: 'Budapest', country: 'Hungary', timezone: 'Europe/Budapest' },
  { city: 'Bucharest', country: 'Romania', timezone: 'Europe/Bucharest' },
  { city: 'Sofia', country: 'Bulgaria', timezone: 'Europe/Sofia' },
  { city: 'Kiev', country: 'Ukraine', timezone: 'Europe/Kiev' },
  { city: 'Moscow', country: 'Russia', timezone: 'Europe/Moscow' },
  { city: 'St. Petersburg', country: 'Russia', timezone: 'Europe/Moscow' },
  { city: 'Lisbon', country: 'Portugal', timezone: 'Europe/Lisbon' },
  { city: 'Porto', country: 'Portugal', timezone: 'Europe/Lisbon' },
  { city: 'Dublin', country: 'Ireland', timezone: 'Europe/Dublin' },
  { city: 'Reykjavik', country: 'Iceland', timezone: 'Atlantic/Reykjavik' },
  { city: 'Zagreb', country: 'Croatia', timezone: 'Europe/Zagreb' },
  { city: 'Belgrade', country: 'Serbia', timezone: 'Europe/Belgrade' },
  { city: 'Ljubljana', country: 'Slovenia', timezone: 'Europe/Ljubljana' },
  { city: 'Tallinn', country: 'Estonia', timezone: 'Europe/Tallinn' },
  { city: 'Riga', country: 'Latvia', timezone: 'Europe/Riga' },
  { city: 'Vilnius', country: 'Lithuania', timezone: 'Europe/Vilnius' },
  
  // Americas
  { city: 'Toronto', country: 'Canada', timezone: 'America/Toronto' },
  { city: 'Montreal', country: 'Canada', timezone: 'America/Montreal' },
  { city: 'Vancouver', country: 'Canada', timezone: 'America/Vancouver' },
  { city: 'Chicago', country: 'United States', timezone: 'America/Chicago' },
  { city: 'Houston', country: 'United States', timezone: 'America/Chicago' },
  { city: 'Phoenix', country: 'United States', timezone: 'America/Phoenix' },
  { city: 'Philadelphia', country: 'United States', timezone: 'America/New_York' },
  { city: 'San Antonio', country: 'United States', timezone: 'America/Chicago' },
  { city: 'San Diego', country: 'United States', timezone: 'America/Los_Angeles' },
  { city: 'Dallas', country: 'United States', timezone: 'America/Chicago' },
  { city: 'San Jose', country: 'United States', timezone: 'America/Los_Angeles' },
  { city: 'Austin', country: 'United States', timezone: 'America/Chicago' },
  { city: 'Miami', country: 'United States', timezone: 'America/New_York' },
  { city: 'Atlanta', country: 'United States', timezone: 'America/New_York' },
  { city: 'Boston', country: 'United States', timezone: 'America/New_York' },
  { city: 'Seattle', country: 'United States', timezone: 'America/Los_Angeles' },
  { city: 'Denver', country: 'United States', timezone: 'America/Denver' },
  { city: 'Las Vegas', country: 'United States', timezone: 'America/Los_Angeles' },
  { city: 'Mexico City', country: 'Mexico', timezone: 'America/Mexico_City' },
  { city: 'Guadalajara', country: 'Mexico', timezone: 'America/Mexico_City' },
  { city: 'Buenos Aires', country: 'Argentina', timezone: 'America/Argentina/Buenos_Aires' },
  { city: 'Lima', country: 'Peru', timezone: 'America/Lima' },
  { city: 'Bogota', country: 'Colombia', timezone: 'America/Bogota' },
  { city: 'Santiago', country: 'Chile', timezone: 'America/Santiago' },
  { city: 'Caracas', country: 'Venezuela', timezone: 'America/Caracas' },
  { city: 'Rio de Janeiro', country: 'Brazil', timezone: 'America/Sao_Paulo' },
  { city: 'Brasilia', country: 'Brazil', timezone: 'America/Sao_Paulo' },
  { city: 'Quito', country: 'Ecuador', timezone: 'America/Guayaquil' },
  { city: 'Montevideo', country: 'Uruguay', timezone: 'America/Montevideo' },
  { city: 'Asuncion', country: 'Paraguay', timezone: 'America/Asuncion' },
  { city: 'La Paz', country: 'Bolivia', timezone: 'America/La_Paz' },
  { city: 'Guatemala City', country: 'Guatemala', timezone: 'America/Guatemala' },
  { city: 'San Jose', country: 'Costa Rica', timezone: 'America/Costa_Rica' },
  { city: 'Panama City', country: 'Panama', timezone: 'America/Panama' },
  { city: 'Havana', country: 'Cuba', timezone: 'America/Havana' },
  { city: 'Kingston', country: 'Jamaica', timezone: 'America/Jamaica' },
  { city: 'Santo Domingo', country: 'Dominican Republic', timezone: 'America/Santo_Domingo' },
  
  // Africa
  { city: 'Cairo', country: 'Egypt', timezone: 'Africa/Cairo' },
  { city: 'Lagos', country: 'Nigeria', timezone: 'Africa/Lagos' },
  { city: 'Johannesburg', country: 'South Africa', timezone: 'Africa/Johannesburg' },
  { city: 'Cape Town', country: 'South Africa', timezone: 'Africa/Johannesburg' },
  { city: 'Casablanca', country: 'Morocco', timezone: 'Africa/Casablanca' },
  { city: 'Tunis', country: 'Tunisia', timezone: 'Africa/Tunis' },
  { city: 'Algiers', country: 'Algeria', timezone: 'Africa/Algiers' },
  { city: 'Nairobi', country: 'Kenya', timezone: 'Africa/Nairobi' },
  { city: 'Addis Ababa', country: 'Ethiopia', timezone: 'Africa/Addis_Ababa' },
  { city: 'Accra', country: 'Ghana', timezone: 'Africa/Accra' },
  { city: 'Kinshasa', country: 'Democratic Republic of Congo', timezone: 'Africa/Kinshasa' },
  { city: 'Dar es Salaam', country: 'Tanzania', timezone: 'Africa/Dar_es_Salaam' },
  { city: 'Kampala', country: 'Uganda', timezone: 'Africa/Kampala' },
  { city: 'Luanda', country: 'Angola', timezone: 'Africa/Luanda' },
  { city: 'Maputo', country: 'Mozambique', timezone: 'Africa/Maputo' },
  { city: 'Khartoum', country: 'Sudan', timezone: 'Africa/Khartoum' },
  { city: 'Tripoli', country: 'Libya', timezone: 'Africa/Tripoli' },
  { city: 'Harare', country: 'Zimbabwe', timezone: 'Africa/Harare' },
  
  // Oceania
  { city: 'Melbourne', country: 'Australia', timezone: 'Australia/Melbourne' },
  { city: 'Brisbane', country: 'Australia', timezone: 'Australia/Brisbane' },
  { city: 'Perth', country: 'Australia', timezone: 'Australia/Perth' },
  { city: 'Adelaide', country: 'Australia', timezone: 'Australia/Adelaide' },
  { city: 'Auckland', country: 'New Zealand', timezone: 'Pacific/Auckland' },
  { city: 'Wellington', country: 'New Zealand', timezone: 'Pacific/Auckland' },
  { city: 'Suva', country: 'Fiji', timezone: 'Pacific/Fiji' },
  { city: 'Port Moresby', country: 'Papua New Guinea', timezone: 'Pacific/Port_Moresby' },
  { city: 'Honolulu', country: 'United States', timezone: 'Pacific/Honolulu' },
  { city: 'Papeete', country: 'French Polynesia', timezone: 'Pacific/Tahiti' },
  { city: 'Apia', country: 'Samoa', timezone: 'Pacific/Apia' },
];

// Extended timezone data with city images
const TIMEZONE_DATA = [
  { 
    city: 'New York', 
    timezone: 'America/New_York',
    country: 'United States',
    searchTerms: ['new york', 'nyc', 'usa', 'united states', 'america'],
    imageUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&h=200&fit=crop'
  },
  { 
    city: 'London', 
    timezone: 'Europe/London',
    country: 'United Kingdom',
    searchTerms: ['london', 'uk', 'united kingdom', 'britain', 'england'],
    imageUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&h=200&fit=crop'
  },
  { 
    city: 'Tokyo', 
    timezone: 'Asia/Tokyo',
    country: 'Japan',
    searchTerms: ['tokyo', 'japan', 'asia'],
    imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=200&fit=crop'
  },
  { 
    city: 'Sydney', 
    timezone: 'Australia/Sydney',
    country: 'Australia',
    searchTerms: ['sydney', 'australia', 'aussie'],
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=200&fit=crop'
  },
  { 
    city: 'Dubai', 
    timezone: 'Asia/Dubai',
    country: 'UAE',
    searchTerms: ['dubai', 'uae', 'emirates', 'united arab emirates'],
    imageUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&h=200&fit=crop'
  },
  { 
    city: 'Los Angeles', 
    timezone: 'America/Los_Angeles',
    country: 'United States',
    searchTerms: ['los angeles', 'la', 'california', 'usa', 'america'],
    imageUrl: 'https://images.unsplash.com/photo-1534190760961-74e8c1b5c2ad?w=400&h=200&fit=crop&auto=format&q=80'
  },
  { 
    city: 'Paris', 
    timezone: 'Europe/Paris',
    country: 'France',
    searchTerms: ['paris', 'france', 'french'],
    imageUrl: 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=400&h=200&fit=crop&auto=format&q=80'
  },
  { 
    city: 'Berlin', 
    timezone: 'Europe/Berlin',
    country: 'Germany',
    searchTerms: ['berlin', 'germany', 'german'],
    imageUrl: 'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=400&h=200&fit=crop'
  },
  { 
    city: 'Mumbai', 
    timezone: 'Asia/Kolkata',
    country: 'India',
    searchTerms: ['mumbai', 'india', 'kolkata', 'indian'],
    imageUrl: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=400&h=200&fit=crop'
  },
  { 
    city: 'Singapore', 
    timezone: 'Asia/Singapore',
    country: 'Singapore',
    searchTerms: ['singapore', 'asia'],
    imageUrl: 'https://images.unsplash.com/photo-1565967511849-76a60a516170?w=400&h=200&fit=crop'
  },
  { 
    city: 'Hong Kong', 
    timezone: 'Asia/Hong_Kong',
    country: 'Hong Kong',
    searchTerms: ['hong kong', 'hk', 'asia'],
    imageUrl: 'https://images.unsplash.com/photo-1536599424071-0ba9b9f2b5f6?w=400&h=200&fit=crop'
  },
  { 
    city: 'São Paulo', 
    timezone: 'America/Sao_Paulo',
    country: 'Brazil',
    searchTerms: ['sao paulo', 'brazil', 'brasil'],
    imageUrl: 'https://images.unsplash.com/photo-1544489582-6dba3c0ce2a0?w=400&h=200&fit=crop'
  },
];

const WorldClockScreen = () => {
  const [worldClocks, setWorldClocks] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filteredCities, setFilteredCities] = useState(TIMEZONE_DATA);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedClock, setSelectedClock] = useState(null);
  const [allCities, setAllCities] = useState([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);

  useEffect(() => {
    loadWorldClocks();
    
    // Update time every second
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Filter cities based on search text
    const searchLower = searchText.toLowerCase();
    
    // Search local databases first
    let localResults = [];
    
    // Search predefined cities
    const timezoneCities = TIMEZONE_DATA.filter(city => {
      if (city.searchTerms) {
        return city.searchTerms.some(term => term.includes(searchLower)) ||
               city.city.toLowerCase().includes(searchLower) ||
               city.country.toLowerCase().includes(searchLower);
      }
      return city.city.toLowerCase().includes(searchLower) ||
             city.country.toLowerCase().includes(searchLower);
    });
    
    // Search world cities database
    const worldCities = WORLD_CITIES_DB.filter(city => 
      city.city.toLowerCase().includes(searchLower) ||
      city.country.toLowerCase().includes(searchLower)
    ).map(city => ({
      ...city,
      imageUrl: generateCityImageUrl(city.city, city.country),
      source: 'local'
    }));
    
    localResults = [...timezoneCities, ...worldCities];
    
    // Combine with API results
    const allAvailableCities = [...localResults, ...allCities];
    
    // Remove duplicates based on city-country combination
    const uniqueCities = removeDuplicateCities(allAvailableCities);
    
    setFilteredCities(uniqueCities);
  }, [searchText, allCities]);

  const loadWorldClocks = async () => {
    try {
      const savedClocks = await AsyncStorage.getItem('worldClocks');
      if (savedClocks) {
        setWorldClocks(JSON.parse(savedClocks));
      }
    } catch (error) {
      console.error('Failed to load world clocks:', error);
    }
  };

  const saveWorldClocks = async (clocks) => {
    try {
      await AsyncStorage.setItem('worldClocks', JSON.stringify(clocks));
    } catch (error) {
      console.error('Failed to save world clocks:', error);
    }
  };

  // API function to fetch cities from multiple sources
  const fetchCitiesFromAPI = async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 2) return [];
    
    console.log('Fetching cities for query:', searchQuery);
    setIsLoadingCities(true);
    
    try {
      // Using multiple APIs for comprehensive city data
      const cityPromises = await Promise.allSettled([
        fetchFromRestCountries(searchQuery),
        // fetchFromGeoNames(searchQuery), // Temporarily disabled due to demo limit
        fetchFromWorldCities(searchQuery)
      ]);

      let allFetchedCities = [];
      
      cityPromises.forEach((result, index) => {
        const sources = ['REST Countries', 'World Cities']; // Updated to match actual APIs
        console.log(`${sources[index]} result:`, result.status, result.value?.length || 0);
        
        if (result.status === 'fulfilled' && result.value && result.value.length > 0) {
          allFetchedCities = [...allFetchedCities, ...result.value];
        }
      });

      console.log('Total cities before deduplication:', allFetchedCities.length);

      // Remove duplicates and limit results
      const uniqueCities = removeDuplicateCities(allFetchedCities);
      console.log('Unique cities after deduplication:', uniqueCities.length);
      
      const finalCities = uniqueCities.slice(0, 50); // Limit to 50 results for performance
      console.log('Final cities to return:', finalCities.length);
      
      return finalCities;
    } catch (error) {
      console.error('Error fetching cities:', error);
      return [];
    } finally {
      setIsLoadingCities(false);
    }
  };

  // Fetch from REST Countries API (for major cities)
  const fetchFromRestCountries = async (searchQuery) => {
    try {
      console.log('Calling REST Countries API for:', searchQuery);
      const response = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(searchQuery)}`);
      console.log('REST Countries response status:', response.status);
      
      if (!response.ok) {
        console.log('REST Countries API returned non-ok status');
        return [];
      }
      
      const countries = await response.json();
      console.log('REST Countries found:', countries.length, 'countries');
      const cities = [];
      
      countries.forEach(country => {
        if (country.capital && country.capital.length > 0) {
          cities.push({
            city: country.capital[0],
            country: country.name.common,
            timezone: country.timezones[0],
            imageUrl: generateCityImageUrl(country.capital[0], country.name.common),
            source: 'restcountries'
          });
        }
      });
      
      console.log('REST Countries returning', cities.length, 'cities');
      return cities;
    } catch (error) {
      console.error('REST Countries API error:', error);
      return [];
    }
  };

  // Fetch from GeoNames API (comprehensive city database)
  const fetchFromGeoNames = async (searchQuery) => {
    try {
      // Using GeoNames API with HTTPS
      const response = await fetch(
        `https://secure.geonames.org/searchJSON?q=${encodeURIComponent(searchQuery)}&maxRows=20&username=demo&featureClass=P&style=full`
      );
      
      if (!response.ok) {
        console.log('GeoNames response not ok:', response.status);
        return [];
      }
      
      const data = await response.json();
      console.log('GeoNames data:', data);
      const cities = [];
      
      if (data.geonames && data.geonames.length > 0) {
        data.geonames.forEach(location => {
          cities.push({
            city: location.name,
            country: location.countryName,
            timezone: location.timezone?.timeZoneId || getTimezoneFromCoordinates(location.lat, location.lng),
            imageUrl: generateCityImageUrl(location.name, location.countryName),
            source: 'geonames',
            population: location.population
          });
        });
      }
      
      return cities;
    } catch (error) {
      console.error('GeoNames API error:', error);
      return [];
    }
  };

  // Fetch from World Cities API
  const fetchFromWorldCities = async (searchQuery) => {
    try {
      console.log('Calling API Ninjas for:', searchQuery);
      // Using a comprehensive cities API
      const response = await fetch(
        `https://api.api-ninjas.com/v1/city?name=${encodeURIComponent(searchQuery)}`,
        {
          headers: {
            'X-Api-Key': 'z5LZ+ULJnfIkQV2FAz/vPA==n2axsjBet8xhrJyX'
          }
        }
      );
      
      console.log('API Ninjas response status:', response.status);
      
      if (!response.ok) {
        console.log('API Ninjas returned non-ok status');
        return [];
      }
      
      const cities = await response.json();
      console.log('API Ninjas found:', cities.length, 'cities');
      
      const mappedCities = cities.map(city => ({
        city: city.name,
        country: city.country,
        timezone: getTimezoneFromCoordinates(city.latitude, city.longitude),
        imageUrl: generateCityImageUrl(city.name, city.country),
        source: 'worldcities',
        population: city.population
      }));
      
      console.log('API Ninjas returning', mappedCities.length, 'cities');
      return mappedCities;
    } catch (error) {
      console.error('World Cities API error:', error);
      return [];
    }
  };

  // Helper function to get timezone from coordinates
  const getTimezoneFromCoordinates = (lat, lng) => {
    // Simplified timezone mapping - in production, use a proper timezone API
    const timezoneMap = {
      'America': ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles'],
      'Europe': ['Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Rome'],
      'Asia': ['Asia/Tokyo', 'Asia/Shanghai', 'Asia/Kolkata', 'Asia/Dubai'],
      'Africa': ['Africa/Cairo', 'Africa/Lagos', 'Africa/Johannesburg'],
      'Australia': ['Australia/Sydney', 'Australia/Melbourne'],
      'Pacific': ['Pacific/Auckland', 'Pacific/Honolulu']
    };
    
    // Basic mapping based on longitude
    if (lng >= -180 && lng < -60) return 'America/New_York';
    if (lng >= -60 && lng < 0) return 'Atlantic/Azores';
    if (lng >= 0 && lng < 60) return 'Europe/London';
    if (lng >= 60 && lng < 120) return 'Asia/Kolkata';
    if (lng >= 120 && lng <= 180) return 'Asia/Tokyo';
    
    return 'UTC';
  };

  // Remove duplicate cities
  const removeDuplicateCities = (cities) => {
    const seen = new Set();
    return cities.filter(city => {
      const key = `${city.city}-${city.country}`.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  // Enhanced image URL generator with better fallbacks
  const generateCityImageUrl = (cityName, countryName) => {
    // Known city images for better reliability
    const knownCityImages = {
      'paris': 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=400&h=200&fit=crop&auto=format&q=80',
      'london': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&h=200&fit=crop&auto=format&q=80',
      'new york': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&h=200&fit=crop&auto=format&q=80',
      'tokyo': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=200&fit=crop&auto=format&q=80',
      'sydney': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=200&fit=crop&auto=format&q=80',
      'dubai': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&h=200&fit=crop&auto=format&q=80',
      'los angeles': 'https://images.unsplash.com/photo-1534190760961-74e8c1b5c2ad?w=400&h=200&fit=crop&auto=format&q=80',
      'berlin': 'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=400&h=200&fit=crop&auto=format&q=80',
      'mumbai': 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=400&h=200&fit=crop&auto=format&q=80',
      'singapore': 'https://images.unsplash.com/photo-1565967511849-76a60a516170?w=400&h=200&fit=crop&auto=format&q=80',
      'hong kong': 'https://images.unsplash.com/photo-1536599424071-0ba9b9f2b5f6?w=400&h=200&fit=crop&auto=format&q=80',
      'são paulo': 'https://images.unsplash.com/photo-1544489582-6dba3c0ce2a0?w=400&h=200&fit=crop&auto=format&q=80'
    };

    const cityKey = cityName.toLowerCase();
    
    // Return known image if available
    if (knownCityImages[cityKey]) {
      return knownCityImages[cityKey];
    }
    
    // Create search terms for dynamic cities
    const searchTerm = encodeURIComponent(`${cityName} city skyline`);
    
    // Use Picsum with consistent seed for each city (ensures same image each time)
    const cityHash = cityName.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    const seedId = Math.abs(cityHash) % 1000 + 100; // Generate seed between 100-1099
    
    // Multiple fallback options
    const imageOptions = [
      `https://picsum.photos/seed/${seedId}/400/200`, // Consistent random image
      `https://source.unsplash.com/400x200/?${searchTerm}`,
      'https://images.unsplash.com/photo-1514924013411-cbf25faa35bb?w=400&h=200&fit=crop&auto=format&q=80', // Generic city
      'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400&h=200&fit=crop&auto=format&q=80' // City lights
    ];
    
    return imageOptions[0];
  };

  // Enhanced search function
  const searchCities = async (query) => {
    console.log('searchCities called with:', query);
    if (query.length >= 2) {
      const apiCities = await fetchCitiesFromAPI(query);
      console.log('Setting allCities to:', apiCities.length, 'cities');
      setAllCities(apiCities);
    } else {
      console.log('Query too short, clearing cities');
      setAllCities([]);
    }
  };

  const addClock = (cityData) => {
    // Check if city already exists
    if (worldClocks.some(clock => clock.timezone === cityData.timezone)) {
      Alert.alert('City Already Added', `${cityData.city} is already in your world clocks.`);
      return;
    }

    const newClock = {
      id: Date.now().toString(),
      ...cityData,
      addedAt: new Date().toISOString(),
    };

    const updatedClocks = [...worldClocks, newClock];
    setWorldClocks(updatedClocks);
    saveWorldClocks(updatedClocks);
    setShowAddModal(false);
    setSearchText('');
  };

  const deleteClock = (clockId) => {
    const clockToDelete = worldClocks.find(c => c.id === clockId);
    Alert.alert(
      'Remove Clock',
      `Remove ${clockToDelete.city} from your world clocks?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const updatedClocks = worldClocks.filter(c => c.id !== clockId);
            setWorldClocks(updatedClocks);
            saveWorldClocks(updatedClocks);
          }
        }
      ]
    );
  };

  const getTimeForTimezone = (timezone) => {
    try {
      const cityTime = new Date().toLocaleString('en-US', {
        timeZone: timezone,
        hour12: true,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      return cityTime;
    } catch (error) {
      return 'Invalid timezone';
    }
  };

  const getDateForTimezone = (timezone) => {
    try {
      const cityDate = new Date().toLocaleDateString('en-US', {
        timeZone: timezone,
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
      return cityDate;
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getTimeDifference = (timezone) => {
    try {
      const now = new Date();
      
      // Create a formatter for the target timezone to get offset
      const targetFormatter = new Intl.DateTimeFormat('en', {
        timeZone: timezone,
        timeZoneName: 'longOffset'
      });
      
      const localFormatter = new Intl.DateTimeFormat('en', {
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timeZoneName: 'longOffset'
      });
      
      // Get the offset strings (e.g., "GMT+03:00")
      const targetParts = targetFormatter.formatToParts(now);
      const localParts = localFormatter.formatToParts(now);
      
      const targetOffset = targetParts.find(part => part.type === 'timeZoneName')?.value;
      const localOffset = localParts.find(part => part.type === 'timeZoneName')?.value;
      
      if (!targetOffset || !localOffset) {
        // Fallback: simple hour comparison
        const localHour = parseInt(now.toLocaleString('en-US', { 
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          hour: '2-digit',
          hour12: false 
        }));
        
        const targetHour = parseInt(now.toLocaleString('en-US', { 
          timeZone: timezone,
          hour: '2-digit',
          hour12: false 
        }));
        
        const diff = targetHour - localHour;
        if (diff === 0) return 'Same time';
        return diff > 0 ? `+${diff}h` : `${diff}h`;
      }
      
      // Parse GMT offsets (e.g., "GMT+03:00" -> 3, "GMT-05:00" -> -5)
      const parseOffset = (offsetStr) => {
        const match = offsetStr.match(/GMT([+-])(\d{2}):(\d{2})/);
        if (!match) return 0;
        const sign = match[1] === '+' ? 1 : -1;
        const hours = parseInt(match[2]);
        const minutes = parseInt(match[3]);
        return sign * (hours + minutes / 60);
      };
      
      const targetOffsetHours = parseOffset(targetOffset);
      const localOffsetHours = parseOffset(localOffset);
      const diff = targetOffsetHours - localOffsetHours;
      
      if (diff === 0) return 'Same time';
      if (diff % 1 === 0) {
        return diff > 0 ? `+${diff}h` : `${diff}h`;
      } else {
        const hours = Math.floor(Math.abs(diff));
        const minutes = Math.round((Math.abs(diff) % 1) * 60);
        const sign = diff > 0 ? '+' : '-';
        return `${sign}${hours}h${minutes}m`;
      }
    } catch (error) {
      console.error('Timezone difference error:', error);
      return 'Different time';
    }
  };

  const renderClockItem = ({ item, index }) => (
    <TouchableOpacity
      style={styles.clockCard}
      onPress={() => {
        setSelectedClock(item);
        setShowDetailsModal(true);
      }}
      activeOpacity={0.8}
    >
      <View style={styles.clockHeader}>
        <View style={styles.clockInfo}>
          <Text style={styles.cityName}>{item.city}</Text>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteClock(item.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="close" size={20} color="#FF3B30" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.clockImageContainer}>
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.cityImage}
          resizeMode="cover"
          onError={() => {
            // Fallback to generic city image if original fails
            const fallbackUrl = 'https://images.unsplash.com/photo-1514924013411-cbf25faa35bb?w=400&h=200&fit=crop&auto=format&q=80';
            if (item.imageUrl !== fallbackUrl) {
              item.imageUrl = fallbackUrl;
            }
          }}
          defaultSource={{
            uri: 'https://images.unsplash.com/photo-1514924013411-cbf25faa35bb?w=400&h=200&fit=crop&auto=format&q=80'
          }}
        />
        <View style={styles.timeOverlay}>
          <Text style={styles.timeText}>{getTimeForTimezone(item.timezone)}</Text>
          <Text style={styles.dateText}>{getDateForTimezone(item.timezone)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderSearchItem = ({ item }) => (
    <TouchableOpacity
      style={styles.searchResultItem}
      onPress={() => addClock(item)}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: item.imageUrl }}
        style={styles.searchResultImage}
        resizeMode="cover"
        onError={() => {
          // Fallback to generic city image if original fails
          const fallbackUrl = 'https://images.unsplash.com/photo-1514924013411-cbf25faa35bb?w=400&h=200&fit=crop&auto=format&q=80';
          if (item.imageUrl !== fallbackUrl) {
            item.imageUrl = fallbackUrl;
          }
        }}
        defaultSource={{
          uri: 'https://images.unsplash.com/photo-1514924013411-cbf25faa35bb?w=400&h=200&fit=crop&auto=format&q=80'
        }}
      />
      <View style={styles.searchResultInfo}>
        <Text style={styles.searchResultCity}>{item.city}</Text>
        <Text style={styles.searchResultCountry}>{item.country}</Text>
        <Text style={styles.searchResultTime}>{getTimeForTimezone(item.timezone)}</Text>
      </View>
      <Icon name="add" size={24} color="#34C759" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>World Clock</Text>
          <Text style={styles.headerSubtitle}>
            {worldClocks.length} cities • {currentTime.toLocaleTimeString()}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
          activeOpacity={0.8}
        >
          <Icon name="add" size={32} color="white" />
        </TouchableOpacity>
      </View>

      {/* World Clocks List */}
      {worldClocks.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="public" size={100} color="#374151" />
          <Text style={styles.emptyTitle}>No World Clocks</Text>
          <Text style={styles.emptySubtitle}>
            Add cities to track time around the world
          </Text>
          <TouchableOpacity
            style={styles.emptyActionButton}
            onPress={() => setShowAddModal(true)}
          >
            <Icon name="add" size={24} color="white" />
            <Text style={styles.emptyActionText}>Add City</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={worldClocks}
          keyExtractor={(item) => item.id}
          renderItem={renderClockItem}
          contentContainerStyle={styles.clocksList}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add City Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowAddModal(false)}
            >
              <Icon name="close" size={24} color="#8E8E93" />
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>Add City</Text>
            <View style={styles.modalCloseButton} />
          </View>

          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Icon name="search" size={20} color="#8E8E93" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search cities worldwide..."
                value={searchText}
                onChangeText={(text) => {
                  setSearchText(text);
                  // Debounce API search
                  if (text.length >= 2) {
                    if (searchTimeout) {
                      clearTimeout(searchTimeout);
                    }
                    const timeout = setTimeout(() => {
                      console.log('Searching for:', text);
                      searchCities(text);
                    }, 500);
                    setSearchTimeout(timeout);
                  } else {
                    setAllCities([]);
                    if (searchTimeout) {
                      clearTimeout(searchTimeout);
                    }
                  }
                }}
                placeholderTextColor="#8E8E93"
                autoCapitalize="none"
              />
              {isLoadingCities && (
                <ActivityIndicator size="small" color="#8E8E93" />
              )}
            </View>
            <Text style={styles.searchHint}>
              {searchText.length >= 2 ? 
                `${filteredCities.length} cities found` : 
                'Type to search worldwide cities'
              }
            </Text>
          </View>

          {isLoadingCities ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FF0000" />
              <Text style={styles.loadingText}>Searching cities worldwide...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredCities}
              keyExtractor={(item, index) => `${item.timezone || item.city}-${index}`}
              renderItem={renderSearchItem}
              contentContainerStyle={styles.searchResults}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                searchText.length >= 2 ? (
                  <View style={styles.emptySearchContainer}>
                    <Icon name="location-off" size={48} color="#8E8E93" />
                    <Text style={styles.emptySearchText}>No cities found</Text>
                    <Text style={styles.emptySearchSubtext}>Try a different search term</Text>
                  </View>
                ) : null
              }
            />
          )}
        </View>
      </Modal>

      {/* Details Modal */}
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
            <Text style={styles.modalHeaderTitle}>Clock Details</Text>
            <View style={styles.modalCloseButton} />
          </View>

          {selectedClock && (
            <View style={styles.detailsContent}>
              <Image
                source={{ uri: selectedClock.imageUrl }}
                style={styles.detailsImage}
                resizeMode="cover"
                onError={() => {
                  // Fallback to generic city image if original fails
                  const fallbackUrl = 'https://images.unsplash.com/photo-1514924013411-cbf25faa35bb?w=400&h=200&fit=crop&auto=format&q=80';
                  if (selectedClock.imageUrl !== fallbackUrl) {
                    selectedClock.imageUrl = fallbackUrl;
                  }
                }}
                defaultSource={{
                  uri: 'https://images.unsplash.com/photo-1514924013411-cbf25faa35bb?w=400&h=200&fit=crop&auto=format&q=80'
                }}
              />
              <View style={styles.detailsInfo}>
                <Text style={styles.detailsCity}>{selectedClock.city}</Text>
                <Text style={styles.detailsCountry}>{selectedClock.country}</Text>
                <Text style={styles.detailsTimezone}>{selectedClock.timezone}</Text>
                
                <View style={styles.timeInfoContainer}>
                  <Text style={styles.currentTimeLabel}>Current Time</Text>
                  <Text style={styles.currentTimeValue}>{getTimeForTimezone(selectedClock.timezone)}</Text>
                  <Text style={styles.currentDateValue}>{getDateForTimezone(selectedClock.timezone)}</Text>
                  <Text style={styles.timeDifferenceValue}>{getTimeDifference(selectedClock.timezone)}</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

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
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
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
  clocksList: {
    padding: 16,
  },
  clockCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  clockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
  },
  clockInfo: {
    flex: 1,
  },
  cityName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  timeDifference: {
    fontSize: 14,
    color: '#8E8E93',
  },
  deleteButton: {
    padding: 8,
  },
  clockImageContainer: {
    position: 'relative',
    height: 120,
  },
  cityImage: {
    width: '100%',
    height: '100%',
  },
  timeOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 16,
  },
  timeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: '#CCCCCC',
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
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  searchContainer: {
    padding: 20,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
  },
  searchResults: {
    paddingHorizontal: 20,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  searchResultImage: {
    width: 80,
    height: 60,
  },
  searchResultInfo: {
    flex: 1,
    padding: 16,
  },
  searchResultCity: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  searchResultCountry: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  searchResultTime: {
    fontSize: 14,
    color: '#34C759',
    fontFamily: 'monospace',
  },
  detailsContent: {
    flex: 1,
  },
  detailsImage: {
    width: '100%',
    height: 200,
  },
  detailsInfo: {
    padding: 20,
  },
  detailsCity: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  detailsCountry: {
    fontSize: 18,
    color: '#8E8E93',
    marginBottom: 8,
  },
  detailsTimezone: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 24,
    fontFamily: 'monospace',
  },
  timeInfoContainer: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  currentTimeLabel: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 8,
  },
  currentTimeValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  currentDateValue: {
    fontSize: 16,
    color: '#CCCCCC',
    marginBottom: 16,
  },
  timeDifferenceValue: {
    fontSize: 16,
    color: '#34C759',
    fontWeight: '600',
  },
  searchHint: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 8,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 16,
  },
  emptySearchContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptySearchText: {
    fontSize: 18,
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySearchSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
});

export default WorldClockScreen;