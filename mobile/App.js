import React, { useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { StatusBar } from 'expo-status-bar';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export default function App() {
  const [status, setStatus] = useState('idle');
  const [recording, setRecording] = useState(null);
  const [userText, setUserText] = useState('');
  const [assistantText, setAssistantText] = useState('');
  const [isMouthOpen, setIsMouthOpen] = useState(false);
  const mouthTimer = useRef(null);

  const avatarSource = useMemo(() => {
    if (status === 'speaking' && isMouthOpen) {
      return require('./assets/avatar_open.png');
    }
    return require('./assets/avatar_closed.png');
  }, [status, isMouthOpen]);

  async function startRecording() {
    try {
      setAssistantText('');
      setUserText('');
      setStatus('listening');

      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        setStatus('idle');
        Alert.alert('Permiso necesario', 'Necesito permiso de micrófono para grabar tu voz.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
    } catch (error) {
      console.error(error);
      setStatus('idle');
      Alert.alert('Error', 'No se pudo iniciar la grabación.');
    }
  }

  async function stopRecording() {
    if (!recording) return;

    try {
      setStatus('thinking');
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (!uri) {
        setStatus('idle');
        Alert.alert('Error', 'No se encontró el audio grabado.');
        return;
      }

      await sendAudio(uri);
    } catch (error) {
      console.error(error);
      setStatus('idle');
      Alert.alert('Error', 'No se pudo detener la grabación.');
    }
  }

  async function sendAudio(uri) {
    try {
      const formData = new FormData();
      formData.append('audio', {
        uri,
        name: 'voice.m4a',
        type: 'audio/m4a'
      });

      const response = await fetch(`${BACKEND_URL}/api/voice-chat`, {
        method: 'POST',
        body: formData,
        headers: {
          Accept: 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.detail || data?.error || 'Error del servidor');
      }

      setUserText(data.userText || '');
      setAssistantText(data.assistantText || '');

      if (data.audioBase64) {
        await playBase64Audio(data.audioBase64);
      } else {
        setStatus('idle');
      }
    } catch (error) {
      console.error(error);
      setStatus('idle');
      Alert.alert(
        'Error de conexión',
        `No he podido hablar con el backend. Revisa que el servidor esté encendido y que la IP sea correcta.\n\n${error.message}`
      );
    }
  }

  async function playBase64Audio(audioBase64) {
    try {
      setStatus('speaking');
      startMouthAnimation();

      const fileUri = `${FileSystem.cacheDirectory}project-a-response.mp3`;
      await FileSystem.writeAsStringAsync(fileUri, audioBase64, {
        encoding: FileSystem.EncodingType.Base64
      });

      const { sound } = await Audio.Sound.createAsync({ uri: fileUri });

      sound.setOnPlaybackStatusUpdate(async (playbackStatus) => {
        if (playbackStatus.isLoaded && playbackStatus.didJustFinish) {
          stopMouthAnimation();
          setStatus('idle');
          await sound.unloadAsync();
        }
      });

      await sound.playAsync();
    } catch (error) {
      console.error(error);
      stopMouthAnimation();
      setStatus('idle');
      Alert.alert('Error', 'No se pudo reproducir la voz.');
    }
  }

  function startMouthAnimation() {
    stopMouthAnimation();
    mouthTimer.current = setInterval(() => {
      setIsMouthOpen((value) => !value);
    }, 180);
  }

  function stopMouthAnimation() {
    if (mouthTimer.current) {
      clearInterval(mouthTimer.current);
      mouthTimer.current = null;
    }
    setIsMouthOpen(false);
  }

  const buttonText = recording ? 'Parar y enviar' : 'Mantener conversación';
  const statusText = {
    idle: 'Lista para hablar',
    listening: 'Escuchando...',
    thinking: 'Pensando...',
    speaking: 'Hablando...'
  }[status];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Project A</Text>
        <Text style={styles.subtitle}>Anime Voice Assistant</Text>

        <View style={styles.avatarCard}>
          <Image source={avatarSource} style={styles.avatar} resizeMode="contain" />
          <View style={styles.statusPill}>
            <Text style={styles.statusText}>{statusText}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, recording && styles.buttonRecording]}
          onPress={recording ? stopRecording : startRecording}
          disabled={status === 'thinking' || status === 'speaking'}
        >
          <Text style={styles.buttonText}>{buttonText}</Text>
        </TouchableOpacity>

        <View style={styles.textBox}>
          <Text style={styles.label}>Tú</Text>
          <Text style={styles.message}>{userText || 'Aquí aparecerá lo que digas.'}</Text>
        </View>

        <View style={styles.textBox}>
          <Text style={styles.label}>Aiko</Text>
          <Text style={styles.message}>{assistantText || 'Aquí aparecerá la respuesta.'}</Text>
        </View>

        <Text style={styles.footer}>Backend: {BACKEND_URL}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8edff'
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    padding: 24
  },
  title: {
    fontSize: 38,
    fontWeight: '800',
    color: '#56336c',
    marginTop: 16
  },
  subtitle: {
    fontSize: 16,
    color: '#7a5b8c',
    marginBottom: 24
  },
  avatarCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 4,
    marginBottom: 24
  },
  avatar: {
    width: 260,
    height: 330
  },
  statusPill: {
    marginTop: 12,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1dcff'
  },
  statusText: {
    color: '#56336c',
    fontWeight: '700'
  },
  button: {
    width: '100%',
    backgroundColor: '#8652a8',
    paddingVertical: 18,
    borderRadius: 22,
    alignItems: 'center',
    marginBottom: 20
  },
  buttonRecording: {
    backgroundColor: '#cf4f7e'
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800'
  },
  textBox: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12
  },
  label: {
    color: '#8652a8',
    fontWeight: '800',
    marginBottom: 6
  },
  message: {
    color: '#3d2f44',
    lineHeight: 22
  },
  footer: {
    marginTop: 12,
    color: '#8f7a9b',
    fontSize: 12,
    textAlign: 'center'
  }
});
