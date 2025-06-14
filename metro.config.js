const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Resolver to exclude problematic packages
config.resolver.blacklistRE = /node_modules\/.*\/node_modules\/react-native\/.*/;

// Exclude safe-area-context from being bundled
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;