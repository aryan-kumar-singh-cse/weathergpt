import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Voice } from 'react-native-voice';

// Types
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  intent?: string;
}

interface Location {
  lat: number;
  lng: number;
  name: string;
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#1a73e8',
    paddingVertical: 16,
    paddingHorizontal: 12,
    paddingTop: 60,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
  },
  locationPicker: {
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    color: '#333',
    fontSize: 14,
  },
  chatContainer: {
    flex: 1,
    padding: 12,
  },
  message: {
    maxWidth: '80%',
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
  },
  userMessage: {
    backgroundColor: '#1a73e8',
    alignSelf: 'flex-end',
    marginRight: 12,
  },
  assistantMessage: {
    backgroundColor: 'white',
    alignSelf: 'flex-start',
    marginLeft: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  timestamp: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
  inputContainer: {
    backgroundColor: 'white',
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sendButton: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendIcon: {
    color: '#1a73e8',
  },
  voiceButton: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1a73e8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceButtonActive: {
    backgroundColor: '#ff5252',
  },
  micIcon: {
    fontSize: 28,
    color: 'white',
  },
  suggestedQueries: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingHorizontal: 12,
  },
  suggestionChip: {
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    fontSize: 12,
    color: '#1a73e8',
    borderWidth: 1,
    borderColor: '#1a73e8',
    marginRight: 8,
    marginBottom: 8,
  }
});

const ChatScreen: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m WeatherGPT. Ask me anything about the weather, like "Will it rain tomorrow?" or "What\'s the forecast in Mumbai?"',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [location, setLocation] = useState<Location>({
    lat: 19.0760,
    lng: 72.8777,
    name: 'Mumbai'
  });
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  const suggestedQueries = [
    'What\'s the weather?',
    'Will it rain?',
    'Temperature forecast',
    'Weather alerts'
  ];

  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    inputRef.current?.focus();

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateResponse(inputText),
        timestamp: new Date(),
        intent: 'weather_query'
      };
      setMessages(prev => [...prev, assistantMessage]);
    }, 1500);
  };

  const generateResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('rain') || lowerQuery.includes('storm')) {
      return 'Based on the forecast, there is a 60% chance of rain tomorrow. Maximum rainfall expected: 25mm. Stay protected! 🌧️';
    } else if (lowerQuery.includes('temperature') || lowerQuery.includes('hot') || lowerQuery.includes('cold')) {
      return `Current temperature in ${location.name}: 32°C. High: 35°C, Low: 26°C. It feels like 38°C due to humidity.`;
    } else if (lowerQuery.includes('forecast') || lowerQuery.includes('tomorrow')) {
      return '7-day forecast for Mumbai:\n• Tomorrow: Partly cloudy, 33-26°C\n• Day after: Sunny, 34-27°C\n• Weekend: Light rain expected, 30-25°C';
    } else if (lowerQuery.includes('alert') || lowerQuery.includes('warning')) {
      return '⚠️ No active weather alerts for your area at this time. Stay informed and check back later.';
    } else {
      return `I\'m ready to help with weather information for ${location.name}. Try asking about:\n• Rain forecasts\n• Temperature predictions\n• Weather alerts\n• Climate trends`;
    }
  };

  const handleVoiceStart = async () => {
    try {
      await Voice.start('en-IN');
      setIsRecording(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to start voice recording');
    }
  };

  const handleVoiceEnd = async () => {
    try {
      await Voice.stop();
      setIsRecording(false);
      // In production, send audio to STT service
      Alert.alert('Demo', 'Voice recording captured (demo mode)');
    } catch (error) {
      Alert.alert('Error', 'Failed to stop voice recording');
    }
  };

  const handleSuggestion = (text: string) => {
    setInputText(text);
    inputRef.current?.focus();
  };

  const handleVoiceInput = (text: string) => {
    setInputText(text);
    inputRef.current?.focus();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <MapView
        style={{ height: 150, width: '100%' }}
        initialRegion={{
          latitude: location.lat,
          longitude: location.lng,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1
        }}
        showsUserLocation
      >
        <Marker
          coordinate={{ latitude: location.lat, longitude: location.lng }}
          title={location.name}
        />
      </MapView>

      <View style={styles.header}>
        <Text style={styles.headerTitle}>WeatherGPT</Text>
      </View>

      <View style={styles.locationPicker}>
        <Text style={styles.locationText}>📍 {location.name}</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={{ flexDirection: 'row' }}>
            <View style={[
              styles.message,
              item.role === 'user' ? styles.userMessage : styles.assistantMessage
            ]}>
              <Text style={{ color: item.role === 'user' ? 'white' : '#333' }}>
                {item.content}
              </Text>
              <Text style={styles.timestamp}>
                {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>
        )}
      />

      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          style={{ flex: 1, fontSize: 16, color: '#333' }}
          placeholder="Ask about the weather..."
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={sendMessage}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={sendMessage}
        >
          <Text style={styles.sendIcon}>➤</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.suggestedQueries}>
        {suggestedQueries.map((query, index) => (
          <TouchableOpacity
            key={index}
            style={styles.suggestionChip}
            onPress={() => handleSuggestion(query)}
          >
            <Text>{query}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.voiceButton, isRecording ? styles.voiceButtonActive : {}]}
        onPress={isRecording ? handleVoiceEnd : handleVoiceStart}
      >
        <Text style={styles.micIcon}>
          {isRecording ? '🎤' : '🎙️'}
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
};

export default ChatScreen;
