import { Audio } from 'expo-av';

class AudioService {
  constructor() {
    this.currentSound = null;
    this.isPlaying = false;
    this.setupAudioMode();
  }

  async setupAudioMode() {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.error('Error setting up audio mode:', error);
    }
  }

  getSoundFile(soundName) {
    const soundMap = {
      'default': require('../../assets/sounds/default.mp3'),
      'Ringtone1': require('../../assets/sounds/Ringtone1.mp3'),
      'Ringtone2': require('../../assets/sounds/Ringtone2.mp3'),
      'Ringtone3': require('../../assets/sounds/Ringtone3.mp3'),
      // Premium sounds - you can add more here
      'Angels Harp': require('../../assets/sounds/default.mp3'), // Placeholder
      'Bell Hammer': require('../../assets/sounds/default.mp3'), // Placeholder
      'Dev Special': require('../../assets/sounds/default.mp3'), // Placeholder
      'Galactic Ambulance': require('../../assets/sounds/default.mp3'), // Placeholder
      'Infinite Lasers': require('../../assets/sounds/default.mp3'), // Placeholder
      'Jeffery\'s Jingle': require('../../assets/sounds/default.mp3'), // Placeholder
      'Matrix Call': require('../../assets/sounds/default.mp3'), // Placeholder
      'Melodic Morning': require('../../assets/sounds/default.mp3'), // Placeholder
      'Nuclear Awakening': require('../../assets/sounds/default.mp3'), // Placeholder
      'Office Phone': require('../../assets/sounds/default.mp3'), // Placeholder
      'PBJ Sandwich': require('../../assets/sounds/default.mp3'), // Placeholder
      'Urgency': require('../../assets/sounds/default.mp3'), // Placeholder
    };
    
    return soundMap[soundName] || soundMap['default'];
  }

  async playAlarmSound(soundName, loop = true) {
    try {
      // Stop current sound if playing
      await this.stopCurrentSound();

      const soundFile = this.getSoundFile(soundName);
      const { sound } = await Audio.loadAsync(soundFile);
      
      this.currentSound = sound;
      
      // Set looping if requested
      if (loop) {
        await sound.setIsLoopingAsync(true);
      }
      
      // Play the sound
      await sound.playAsync();
      this.isPlaying = true;
      
      console.log(`Playing alarm sound: ${soundName}`);
      
      return sound;
    } catch (error) {
      console.error('Error playing alarm sound:', error);
      throw error;
    }
  }

  async playPreviewSound(soundName) {
    try {
      const soundFile = this.getSoundFile(soundName);
      const { sound } = await Audio.loadAsync(soundFile);
      
      // Play once without looping
      await sound.playAsync();
      
      // Auto-stop after 3 seconds
      setTimeout(async () => {
        try {
          await sound.stopAsync();
          await sound.unloadAsync();
        } catch (error) {
          console.error('Error stopping preview sound:', error);
        }
      }, 3000);
      
      return sound;
    } catch (error) {
      console.error('Error playing preview sound:', error);
      throw error;
    }
  }

  async stopCurrentSound() {
    if (this.currentSound) {
      try {
        await this.currentSound.stopAsync();
        await this.currentSound.unloadAsync();
        this.currentSound = null;
        this.isPlaying = false;
        console.log('Stopped current sound');
      } catch (error) {
        console.error('Error stopping current sound:', error);
      }
    }
  }

  async pauseCurrentSound() {
    if (this.currentSound && this.isPlaying) {
      try {
        await this.currentSound.pauseAsync();
        this.isPlaying = false;
        console.log('Paused current sound');
      } catch (error) {
        console.error('Error pausing current sound:', error);
      }
    }
  }

  async resumeCurrentSound() {
    if (this.currentSound && !this.isPlaying) {
      try {
        await this.currentSound.playAsync();
        this.isPlaying = true;
        console.log('Resumed current sound');
      } catch (error) {
        console.error('Error resuming current sound:', error);
      }
    }
  }

  async setVolume(volume) {
    if (this.currentSound) {
      try {
        await this.currentSound.setVolumeAsync(volume);
        console.log(`Set volume to: ${volume}`);
      } catch (error) {
        console.error('Error setting volume:', error);
      }
    }
  }

  isCurrentlyPlaying() {
    return this.isPlaying;
  }

  getCurrentSound() {
    return this.currentSound;
  }

  // Cleanup method
  async cleanup() {
    await this.stopCurrentSound();
  }
}

// Export a singleton instance
export default new AudioService();