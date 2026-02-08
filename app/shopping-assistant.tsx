import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Audio } from 'expo-av';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { API_URL } from '@/lib/constants';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

type ConvoState = 'idle' | 'recording' | 'processing' | 'speaking' | 'wakeListening';

const WELCOME_MESSAGE: ChatMessage = {
  role: 'assistant',
  content: "Hey! I'm Chris, your shopping assistant. Tap the mic to talk, or turn on hands-free mode and just say \"Hey Chris\" — I'll listen for you!",
};

// Metering thresholds (dB). Expo-av metering: -160 (silence) to 0 (max).
const SPEECH_THRESHOLD = -35;
const SILENCE_THRESHOLD = -45;
const SILENCE_DURATION_MS = 1500;
const MAX_LISTEN_DURATION_MS = 15000; // Restart listening after 15s of no speech

export default function ShoppingAssistantScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [state, setState] = useState<ConvoState>('idle');
  const [textInput, setTextInput] = useState('');
  const [handsFree, setHandsFree] = useState(false);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const handsFreeRef = useRef(handsFree);
  const stateRef = useRef(state);
  const meteringInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const speechDetected = useRef(false);
  const lastSpeechTime = useRef(0);
  const recordingStartTime = useRef(0);
  const mountedRef = useRef(true);

  // Keep refs in sync
  useEffect(() => { handsFreeRef.current = handsFree; }, [handsFree]);
  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, state]);

  // Pulse animation while recording or wake-listening
  useEffect(() => {
    if (state === 'recording' || state === 'wakeListening') {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: state === 'wakeListening' ? 1.15 : 1.4,
            duration: state === 'wakeListening' ? 1200 : 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: state === 'wakeListening' ? 1200 : 600,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
    pulseAnim.setValue(1);
  }, [state]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMetering();
      recordingRef.current?.stopAndUnloadAsync().catch(() => {});
      soundRef.current?.unloadAsync().catch(() => {});
    };
  }, []);

  // Start/stop hands-free mode
  useEffect(() => {
    if (handsFree && state === 'idle') {
      startWakeListening();
    } else if (!handsFree && state === 'wakeListening') {
      stopWakeListening();
    }
  }, [handsFree]);

  // After AI finishes speaking or returning to idle, restart wake listening
  useEffect(() => {
    if (handsFree && state === 'idle') {
      const timer = setTimeout(startWakeListening, 800);
      return () => clearTimeout(timer);
    }
  }, [state, handsFree]);

  function stopMetering() {
    if (meteringInterval.current) {
      clearInterval(meteringInterval.current);
      meteringInterval.current = null;
    }
  }

  // ─── Hands-free: continuous listening with metering ───

  async function startWakeListening() {
    if (stateRef.current === 'wakeListening' || stateRef.current === 'processing' || stateRef.current === 'speaking') return;
    if (!mountedRef.current || !handsFreeRef.current) return;

    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
        isMeteringEnabled: true,
      });
      await recording.startAsync();
      recordingRef.current = recording;
      speechDetected.current = false;
      lastSpeechTime.current = 0;
      recordingStartTime.current = Date.now();
      setState('wakeListening');

      // Poll metering to detect speech segments
      meteringInterval.current = setInterval(async () => {
        if (!recordingRef.current || !mountedRef.current) {
          stopMetering();
          return;
        }

        try {
          const status = await recordingRef.current.getStatusAsync();
          if (!status.isRecording) return;

          const db = status.metering ?? -160;
          const now = Date.now();
          const elapsed = now - recordingStartTime.current;

          if (db > SPEECH_THRESHOLD) {
            // Speech detected
            speechDetected.current = true;
            lastSpeechTime.current = now;
          } else if (speechDetected.current && now - lastSpeechTime.current > SILENCE_DURATION_MS) {
            // Silence after speech → send the clip
            stopMetering();
            await finishWakeRecordingAndSend();
            return;
          }

          // Restart recording if no speech for too long (prevents huge files)
          if (!speechDetected.current && elapsed > MAX_LISTEN_DURATION_MS) {
            stopMetering();
            await restartWakeListening();
          }
        } catch {
          // Recording may have been stopped
        }
      }, 250);
    } catch (err) {
      console.error('Wake listening error:', err);
      if (mountedRef.current) setState('idle');
    }
  }

  async function restartWakeListening() {
    try {
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        recordingRef.current = null;
      }
    } catch {}
    if (mountedRef.current && handsFreeRef.current) {
      startWakeListening();
    }
  }

  async function stopWakeListening() {
    stopMetering();
    try {
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        recordingRef.current = null;
      }
    } catch {}
    if (mountedRef.current) setState('idle');
  }

  async function finishWakeRecordingAndSend() {
    if (!recordingRef.current) return;

    setState('processing');
    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      if (!uri) throw new Error('No recording URI');

      const base64Audio = await readRecordingAsBase64(uri);
      await sendToServer({ audio: base64Audio, mimeType: 'audio/mp4' }, true);
    } catch (err) {
      console.error('Wake recording error:', err);
      if (mountedRef.current) setState('idle');
    }
  }

  // ─── Manual recording ───

  async function startRecording() {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      recordingRef.current = recording;
      setState('recording');
    } catch (err) {
      console.error('Failed to start recording:', err);
      setState('idle');
    }
  }

  async function stopRecordingAndSend() {
    if (!recordingRef.current) return;

    setState('processing');
    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      if (!uri) throw new Error('No recording URI');

      const base64Audio = await readRecordingAsBase64(uri);
      await sendToServer({ audio: base64Audio, mimeType: 'audio/mp4' }, false);
    } catch (err) {
      console.error('Recording error:', err);
      setState('idle');
    }
  }

  // ─── Shared helpers ───

  async function readRecordingAsBase64(uri: string): Promise<string> {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async function sendTextMessage() {
    const text = textInput.trim();
    if (!text || state !== 'idle') return;

    setTextInput('');
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setState('processing');

    await sendToServer({ text }, false);
  }

  async function sendToServer(
    input: { audio?: string; mimeType?: string; text?: string },
    isWakeWord: boolean
  ) {
    try {
      const res = await fetch(`${API_URL}/api/assistant/voice-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...input,
          history: messages.slice(-10),
          ...(isWakeWord ? { wakeWord: 'hey chris' } : {}),
        }),
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();

      // Wake word not detected — silently go back to listening
      if (isWakeWord && data.wakeWordDetected === false) {
        if (mountedRef.current) setState('idle'); // Will auto-restart wake listening
        return;
      }

      // Add user transcript for audio input
      if (input.audio && data.transcript) {
        setMessages(prev => [...prev, { role: 'user', content: data.transcript }]);
      }

      // Add AI response
      if (data.response) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      }

      // Play TTS audio
      if (data.audio) {
        await playResponseAudio(data.audio);
      } else {
        if (mountedRef.current) setState('idle');
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: "Sorry, I couldn't catch that. Try again?" },
      ]);
      if (mountedRef.current) setState('idle');
    }
  }

  async function playResponseAudio(base64Audio: string) {
    setState('speaking');
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: `data:audio/mpeg;base64,${base64Audio}` },
        { shouldPlay: true }
      );
      soundRef.current = sound;

      sound.setOnPlaybackStatusUpdate(status => {
        if ('didJustFinish' in status && status.didJustFinish) {
          sound.unloadAsync();
          soundRef.current = null;
          if (mountedRef.current) setState('idle');
          // Hands-free will auto-restart via the effect
        }
      });
    } catch (err) {
      console.error('Audio playback error:', err);
      if (mountedRef.current) setState('idle');
    }
  }

  // ─── Button handlers ───

  function handleMicPress() {
    if (state === 'recording') {
      stopRecordingAndSend();
    } else if (state === 'idle') {
      startRecording();
    } else if (state === 'speaking') {
      soundRef.current?.stopAsync();
      soundRef.current?.unloadAsync();
      soundRef.current = null;
      setState('idle');
    } else if (state === 'wakeListening') {
      // In hands-free mode, pressing mic stops wake listening and starts manual recording
      stopWakeListening().then(() => startRecording());
    }
  }

  const toggleHandsFree = useCallback(() => {
    setHandsFree(prev => {
      if (prev) {
        // Turning off — stop wake listening
        stopWakeListening();
      }
      return !prev;
    });
  }, []);

  // ─── Render ───

  const isWakeMode = state === 'wakeListening';
  const micIcon = state === 'recording' ? 'stop'
    : state === 'speaking' ? 'volume-up'
    : isWakeMode ? 'microphone' : 'microphone';
  const micColor = state === 'recording' ? '#DC2626' : '#FFFFFF';
  const micBg = state === 'recording' ? '#FEE2E2'
    : isWakeMode ? '#40916C' : theme.primary;

  const statusMessage =
    state === 'wakeListening' ? 'Say "Hey Chris" to start...' :
    state === 'idle' ? (handsFree ? 'Starting...' : 'Tap mic or type a message') :
    state === 'recording' ? 'Listening... tap to send' :
    state === 'processing' ? 'Thinking...' :
    'Speaking... tap to stop';

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}>
      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.messagesArea}
        contentContainerStyle={styles.messagesContent}>
        {messages.map((msg, i) => (
          <View
            key={i}
            style={[
              styles.bubble,
              msg.role === 'user'
                ? [styles.userBubble, { backgroundColor: theme.primary }]
                : [styles.aiBubble, { backgroundColor: theme.surface }],
            ]}>
            {msg.role === 'assistant' && (
              <View style={[styles.aiAvatar, { backgroundColor: theme.accent }]}>
                <FontAwesome name="leaf" size={12} color={theme.primary} />
              </View>
            )}
            <Text
              style={[
                styles.bubbleText,
                { color: msg.role === 'user' ? '#FFFFFF' : theme.text },
              ]}>
              {msg.content}
            </Text>
          </View>
        ))}

        {/* Processing indicator */}
        {state === 'processing' && (
          <View style={[styles.bubble, styles.aiBubble, { backgroundColor: theme.surface }]}>
            <View style={[styles.aiAvatar, { backgroundColor: theme.accent }]}>
              <FontAwesome name="leaf" size={12} color={theme.primary} />
            </View>
            <View style={styles.typingDots}>
              <ActivityIndicator size="small" color={theme.primary} />
              <Text style={[styles.typingText, { color: theme.textSecondary }]}>Thinking...</Text>
            </View>
          </View>
        )}

        {/* Recording indicator */}
        {state === 'recording' && (
          <View style={[styles.bubble, styles.userBubble, { backgroundColor: '#FEE2E2' }]}>
            <View style={styles.typingDots}>
              <FontAwesome name="microphone" size={14} color="#DC2626" />
              <Text style={[styles.typingText, { color: '#DC2626' }]}>Listening...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Status bar with hands-free toggle */}
      <View style={[styles.statusBar, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
        <TouchableOpacity
          style={[
            styles.handsFreeBtn,
            handsFree && styles.handsFreeActive,
            handsFree && { backgroundColor: theme.accent },
          ]}
          onPress={toggleHandsFree}
          activeOpacity={0.7}>
          <FontAwesome
            name="rss"
            size={12}
            color={handsFree ? theme.primary : theme.textSecondary}
          />
          <Text style={[
            styles.handsFreeText,
            { color: handsFree ? theme.primary : theme.textSecondary },
          ]}>
            {handsFree ? '"Hey Chris"' : 'Hands-free'}
          </Text>
        </TouchableOpacity>
        <Text style={[styles.statusText, { color: theme.textSecondary }]}>
          {statusMessage}
        </Text>
      </View>

      {/* Input bar */}
      <View style={[styles.inputBar, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
        <TextInput
          style={[styles.textInput, { color: theme.text, backgroundColor: theme.background }]}
          placeholder="Type instead..."
          placeholderTextColor={theme.textSecondary}
          value={textInput}
          onChangeText={setTextInput}
          onSubmitEditing={sendTextMessage}
          returnKeyType="send"
          editable={state === 'idle'}
        />

        {textInput.trim() ? (
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: theme.primary }]}
            onPress={sendTextMessage}
            disabled={state !== 'idle'}>
            <FontAwesome name="send" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <Animated.View style={{ transform: [{ scale: (state === 'recording' || isWakeMode) ? pulseAnim : 1 }] }}>
            <TouchableOpacity
              style={[styles.micBtn, { backgroundColor: micBg }]}
              onPress={handleMicPress}
              disabled={state === 'processing'}
              activeOpacity={0.7}>
              <FontAwesome name={micIcon} size={22} color={micColor} />
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  messagesArea: { flex: 1 },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
    gap: 10,
  },
  bubble: {
    maxWidth: '82%',
    padding: 14,
    borderRadius: 18,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  userBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  aiAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typingText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    gap: 10,
  },
  handsFreeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  handsFreeActive: {
    borderWidth: 1,
    borderColor: '#2D6A4F33',
  },
  handsFreeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusText: {
    fontSize: 12,
    flex: 1,
    textAlign: 'right',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    paddingBottom: Platform.OS === 'ios' ? 26 : 10,
    gap: 10,
    borderTopWidth: 1,
  },
  textInput: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  micBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
