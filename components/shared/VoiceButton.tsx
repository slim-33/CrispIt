import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { API_URL } from '@/lib/constants';

interface VoiceButtonProps {
  text: string;
  size?: number;
  color?: string;
}

export default function VoiceButton({ text, size = 32, color = '#FFFFFF' }: VoiceButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handlePress() {
    if (isPlaying || isLoading || !text) return;

    setIsLoading(true);
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      const response = await fetch(`${API_URL}/api/speak`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) throw new Error('TTS failed');

      const blob = await response.blob();
      const reader = new FileReader();

      await new Promise<void>((resolve, reject) => {
        reader.onload = async () => {
          try {
            const base64 = (reader.result as string).split(',')[1];
            const { sound } = await Audio.Sound.createAsync(
              { uri: `data:audio/mpeg;base64,${base64}` },
              { shouldPlay: true }
            );

            setIsPlaying(true);
            setIsLoading(false);

            sound.setOnPlaybackStatusUpdate((status) => {
              if ('didJustFinish' in status && status.didJustFinish) {
                setIsPlaying(false);
                sound.unloadAsync();
              }
            });
            resolve();
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Voice playback error:', error);
      setIsLoading(false);
      setIsPlaying(false);
    }
  }

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={handlePress}
      disabled={isPlaying || isLoading}>
      {isLoading ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <FontAwesome
          name={isPlaying ? 'volume-up' : 'volume-off'}
          size={size}
          color={color}
          style={isPlaying ? styles.playing : undefined}
        />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  playing: {
    opacity: 0.7,
  },
});
