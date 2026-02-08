import React, { useState, useEffect, useRef } from 'react';
import { TouchableOpacity, StyleSheet, ActivityIndicator, View, Text, Animated } from 'react-native';
import { Audio } from 'expo-av';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { API_URL } from '@/lib/constants';

interface VoicePlayerProps {
  text: string;
  label?: string;
  autoPlay?: boolean;
  onFinished?: () => void;
}

export default function VoicePlayer({ text, label, autoPlay, onFinished }: VoicePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const hasAutoPlayed = useRef(false);

  useEffect(() => {
    if (autoPlay && text && !hasAutoPlayed.current) {
      hasAutoPlayed.current = true;
      playAudio();
    }
    return () => {
      soundRef.current?.unloadAsync();
    };
  }, [autoPlay, text]);

  useEffect(() => {
    if (isPlaying) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.4, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isPlaying]);

  async function playAudio() {
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

            soundRef.current = sound;
            setIsPlaying(true);
            setIsLoading(false);

            sound.setOnPlaybackStatusUpdate((status) => {
              if ('didJustFinish' in status && status.didJustFinish) {
                setIsPlaying(false);
                sound.unloadAsync();
                soundRef.current = null;
                onFinished?.();
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
      console.error('VoicePlayer error:', error);
      setIsLoading(false);
      setIsPlaying(false);
      onFinished?.();
    }
  }

  async function stopAudio() {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
      setIsPlaying(false);
    }
  }

  function handlePress() {
    if (isPlaying) {
      stopAudio();
    } else {
      playAudio();
    }
  }

  return (
    <TouchableOpacity
      style={[styles.container, isPlaying && styles.containerPlaying]}
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={isLoading}>
      <View style={styles.iconWrap}>
        {isLoading ? (
          <ActivityIndicator size="small" color="#2D6A4F" />
        ) : (
          <Animated.View style={{ opacity: isPlaying ? pulseAnim : 1 }}>
            <FontAwesome
              name={isPlaying ? 'stop-circle' : 'play-circle'}
              size={28}
              color="#2D6A4F"
            />
          </Animated.View>
        )}
      </View>
      <Text style={styles.label} numberOfLines={1}>
        {isLoading ? 'Loading...' : isPlaying ? 'Speaking...' : label || 'Listen'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D8F3DC',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 10,
  },
  containerPlaying: {
    backgroundColor: '#B7E4C7',
  },
  iconWrap: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#2D6A4F',
  },
});
