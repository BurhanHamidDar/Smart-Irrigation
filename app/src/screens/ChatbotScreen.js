import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
  StatusBar,
  Modal,
  Alert,
} from 'react-native';
import { Send, Bot, MessageSquare, AlertCircle, Settings as SettingsIcon, History, Plus, Trash2, X, ChevronLeft } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';

const SYSTEM_PROMPT = `You are AgroBot, an expert agricultural and horticultural AI advisor specialized in temperate zone farming, particularly in the Kashmir valley. 

System & Developer Context:
- Developer/Creator: Burhan Hamid. He is the sole developer and creator of this system, working completely independently as a solo developer (not as part of a team). You must credit him as the sole developer and creator of this system if asked.
- System Name: AgroFlow (Smart Irrigation & Weather Forecasting system).
- Hardware/Firmware: Runs on ESP8266 (NodeMCU) using a capacitive soil moisture sensor (analog pin A0) and a water pump relay (digital pin D1/GPIO5). It communicates in real-time with Firebase Realtime Database.
- Core Features: Manual Irrigation, Auto Mode, Kashmir Seasonal Auto-Adjust, Weather Forecasting, Pump Motor Protection, Real-Time Logging.

Rules for Simplicity & Readability (CRITICAL):
- Write in extremely simple, friendly, and easy-to-read language. Do not use complex scientific jargon or academic terms.
- If you use a technical word (like "pesticide" or "NPK"), explain it simply (e.g. "Dawa/spray" or "Khat/fertilizer").
- Use familiar local terms when helpful (like 'Harud' for autumn/harvest, 'Wand' for winter rest, 'Dawa' for sprays).
- Format responses cleanly. Do NOT use complex markdown tables or heavy nested lists.
- Use short sentences (under 15 words) and brief paragraphs (2-3 sentences max).
- Use simple bullet points with clear spacing so it looks clean on mobile screens.

Allowed Topics:
1. ONLY answer queries directly related to agriculture, horticulture, soil management (like Karewa soils), plant pathology, crop diseases, pest control, irrigation scheduling, fertilizers, pruning, weather impacts, local farming practices, OR questions regarding the developer (Burhan Hamid), the AgroFlow system, the app, the ESP8266 firmware, and its capabilities/features.
2. If a query is NOT about agriculture, horticulture, or the AgroFlow system/developer, politely but firmly decline to answer. State: "I am AgroBot, your dedicated agricultural advisor. I can only assist you with farming, crop management, horticultural queries, or the AgroFlow system."
3. Keep your advice brief, practical, highly actionable, and tailored to the temperate climate of Jammu and Kashmir. Do not write long blocks of text.`;

const DEFAULT_WELCOME = {
  id: 'welcome',
  role: 'assistant',
  content: 'Hello! I am AgroBot, your Kashmir farming and horticulture advisor. How can I help you manage your orchard today?',
};

export default function ChatbotScreen({ navigation }) {
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? darkTheme : lightTheme;
  const isFocused = useIsFocused();

  const [apiKey, setApiKey] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([DEFAULT_WELCOME]);
  
  const [loading, setLoading] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);
  const scrollViewRef = useRef(null);

  // Load API Key and Chat Sessions
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedKey = await AsyncStorage.getItem('openRouterApiKey');
        if (savedKey) {
          setApiKey(savedKey);
        } else {
          // No saved key — leave empty, user should enter via Settings
          setApiKey('');
        }

        const savedSessionsRaw = await AsyncStorage.getItem('chatbot_sessions');
        if (savedSessionsRaw) {
          const loadedSessions = JSON.parse(savedSessionsRaw);
          setSessions(loadedSessions);
          
          if (loadedSessions.length > 0 && !currentSessionId) {
            const mostRecent = loadedSessions[0];
            setCurrentSessionId(mostRecent.id);
            setMessages(mostRecent.messages);
          }
        }
      } catch (err) {
        console.error('Failed to load initial data:', err);
      }
    };
    if (isFocused) {
      loadData();
    }
  }, [isFocused]);

  const saveSessionsToStorage = async (updatedSessions) => {
    try {
      setSessions(updatedSessions);
      await AsyncStorage.setItem('chatbot_sessions', JSON.stringify(updatedSessions));
    } catch (err) {
      console.error('Failed to save sessions:', err);
    }
  };

  const handleNewChat = () => {
    setCurrentSessionId(null);
    setMessages([DEFAULT_WELCOME]);
    setHistoryVisible(false);
  };

  const handleSelectSession = (sessionId) => {
    const selected = sessions.find((s) => s.id === sessionId);
    if (selected) {
      setCurrentSessionId(selected.id);
      setMessages(selected.messages);
    }
    setHistoryVisible(false);
  };

  const handleDeleteSession = (sessionId, e) => {
    e.stopPropagation();
    Alert.alert(
      'Delete Conversation',
      'Are you sure you want to permanently delete this chat history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const filtered = sessions.filter((s) => s.id !== sessionId);
            await saveSessionsToStorage(filtered);
            
            if (currentSessionId === sessionId) {
              if (filtered.length > 0) {
                const nextSession = filtered[0];
                setCurrentSessionId(nextSession.id);
                setMessages(nextSession.messages);
              } else {
                handleNewChat();
              }
            }
          },
        },
      ]
    );
  };

  const handleClearAllHistory = () => {
    Alert.alert(
      'Clear All Conversations',
      'This will delete all your past conversations. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await saveSessionsToStorage([]);
            handleNewChat();
          },
        },
      ]
    );
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userText = inputMessage.trim();
    setInputMessage('');

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userText,
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setLoading(true);

    let activeSessionId = currentSessionId;
    let isNewSession = false;

    if (!activeSessionId) {
      activeSessionId = Date.now().toString();
      setCurrentSessionId(activeSessionId);
      isNewSession = true;
    }

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://github.com/BurhanHamidDar/Smart-Irrigation',
          'X-Title': 'AgroFlow Mobile app',
        },
        body: JSON.stringify({
          model: 'openrouter/free',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...updatedMessages.map((msg) => ({
              role: msg.role,
              content: msg.content,
            })),
          ],
        }),
      });

      const json = await response.json();
      
      if (json.error) {
        throw new Error(json.error.message || 'API error occurred');
      }

      const botText = json.choices?.[0]?.message?.content || 'Sorry, I could not generate a response. Please try again.';

      const botMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: botText,
      };

      const finalMessages = [...updatedMessages, botMessage];
      setMessages(finalMessages);

      let updatedSessions = [...sessions];
      if (isNewSession) {
        const title = userText.length > 30 ? `${userText.slice(0, 27)}...` : userText;
        const newSession = {
          id: activeSessionId,
          title,
          messages: finalMessages,
          timestamp: Date.now(),
        };
        updatedSessions.unshift(newSession);
      } else {
        updatedSessions = updatedSessions.map((s) => {
          if (s.id === activeSessionId) {
            return {
              ...s,
              messages: finalMessages,
              timestamp: Date.now(),
            };
          }
          return s;
        });

        const activeIndex = updatedSessions.findIndex((s) => s.id === activeSessionId);
        if (activeIndex > 0) {
          const [activeSession] = updatedSessions.splice(activeIndex, 1);
          updatedSessions.unshift(activeSession);
        }
      }

      await saveSessionsToStorage(updatedSessions);
    } catch (error) {
      console.error('Chatbot API request failed:', error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error.message || 'Unable to connect to OpenRouter'}. Please ensure your API key under system settings is configured properly and that you have an active internet connection.`,
      };
      setMessages([...updatedMessages, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const getFormatTime = (timestamp) => {
    const d = new Date(timestamp);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.cardBg} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <TouchableOpacity 
          style={styles.headerIconBtn} 
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft color={theme.text} size={22} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>AgroBot Advisor</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerIconBtn} 
            onPress={handleNewChat}
            title="New Chat"
          >
            <Plus color={theme.text} size={20} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerIconBtn} 
            onPress={() => setHistoryVisible(true)}
            title="Chat History"
          >
            <History color={theme.text} size={20} />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.chatScroll}
          contentContainerStyle={{ paddingBottom: 20 }}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          automaticallyAdjustKeyboardInsets={true}
        >
          {messages.map((item) => {
            const isUser = item.role === 'user';
            return (
              <View 
                key={item.id} 
                style={[
                  styles.messageRow, 
                  isUser ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' }
                ]}
              >
                {!isUser && (
                  <View style={[styles.avatar, { backgroundColor: theme.primaryLight }]}>
                    <Bot color={theme.primary} size={15} />
                  </View>
                )}
                <View 
                  style={[
                    styles.bubble, 
                    { backgroundColor: isUser ? theme.primary : theme.cardBg, borderColor: isUser ? theme.primary : theme.border },
                    isUser ? { borderBottomRightRadius: 4 } : { borderBottomLeftRadius: 4 }
                  ]}
                >
                  <Text style={[styles.bubbleText, { color: isUser ? '#ffffff' : theme.text }]}>
                    {item.content}
                  </Text>
                </View>
              </View>
            );
          })}

          {loading && (
            <View style={[styles.messageRow, { alignSelf: 'flex-start' }]}>
              <View style={[styles.avatar, { backgroundColor: theme.primaryLight }]}>
                <Bot color={theme.primary} size={15} />
              </View>
              <View style={[styles.bubble, { backgroundColor: theme.cardBg, borderColor: theme.border, borderBottomLeftRadius: 4, paddingVertical: 12 }]}>
                <ActivityIndicator color={theme.primary} size="small" />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input Bar */}
        <View style={[styles.inputBar, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border, borderWidth: 1 }]}
            placeholder="Ask AgroBot a farming question..."
            placeholderTextColor={theme.subText}
            value={inputMessage}
            onChangeText={setInputMessage}
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            style={[styles.sendBtn, { backgroundColor: theme.primary }]} 
            onPress={handleSendMessage}
            disabled={!inputMessage.trim() || loading}
          >
            <Send color="#ffffff" size={16} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* History Modal Drawer */}
      <Modal
        visible={historyVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setHistoryVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBg }]}>
            <View style={[styles.modalHeader, { borderColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Conversations</Text>
              <TouchableOpacity 
                style={styles.closeBtn} 
                onPress={() => setHistoryVisible(false)}
              >
                <X color={theme.text} size={22} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalList}>
              <TouchableOpacity 
                style={[styles.newChatRow, { borderColor: theme.primary }]} 
                onPress={handleNewChat}
              >
                <Plus color={theme.primary} size={16} style={{ marginRight: 6 }} />
                <Text style={[styles.newChatRowText, { color: theme.primary }]}>New Conversation</Text>
              </TouchableOpacity>

              {sessions.length === 0 ? (
                <View style={styles.emptyHistory}>
                  <MessageSquare color={theme.subText} size={32} style={{ marginBottom: 8, opacity: 0.5 }} />
                  <Text style={[styles.emptyHistoryText, { color: theme.subText }]}>No past chat sessions found.</Text>
                </View>
              ) : (
                sessions.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={[
                      styles.historyItem,
                      {
                        backgroundColor: s.id === currentSessionId ? theme.primaryLight : 'transparent',
                        borderColor: s.id === currentSessionId ? theme.primary : theme.border,
                      }
                    ]}
                    onPress={() => handleSelectSession(s.id)}
                  >
                    <MessageSquare 
                      color={s.id === currentSessionId ? theme.primary : theme.subText} 
                      size={18} 
                      style={{ marginRight: 12 }} 
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.historyItemText, { color: theme.text }]} numberOfLines={1}>
                        {s.title}
                      </Text>
                      <Text style={[styles.historyItemTime, { color: theme.subText }]}>
                        {getFormatTime(s.timestamp)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteIconBtn}
                      onPress={(e) => handleDeleteSession(s.id, e)}
                    >
                      <Trash2 color={theme.danger || '#ef4444'} size={16} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            {sessions.length > 0 && (
              <TouchableOpacity
                style={[styles.clearAllBtn, { backgroundColor: theme.danger || '#ef4444' }]}
                onPress={handleClearAllHistory}
              >
                <Trash2 color="#ffffff" size={16} style={{ marginRight: 6 }} />
                <Text style={styles.clearAllBtnText}>Clear All History</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}


const lightTheme = {
  bg: '#f4f6f0',
  cardBg: '#ffffff',
  text: '#1a2e1c',
  subText: '#6b7b6e',
  border: '#e8eceb',
  inputBg: '#f4f6f0',
  primary: '#4a7c59',
  primaryLight: '#eaf2ec',
  danger: '#c0392b'
};

const darkTheme = {
  bg: '#141a15',
  cardBg: '#1e2720',
  text: '#e8ede9',
  subText: '#8a9e8d',
  border: '#2a3a2d',
  inputBg: '#162019',
  primary: '#5a9469',
  primaryLight: '#1a2e1c',
  danger: '#e74c3c'
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconBtn: {
    padding: 6,
  },
  chatScroll: {
    padding: 16,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 4,
    maxWidth: '85%',
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
    marginBottom: 2,
  },
  bubble: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 18,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 14,
    maxHeight: 80,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: '70%',
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  closeBtn: {
    padding: 4,
  },
  modalList: {
    flex: 1,
  },
  newChatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  newChatRowText: {
    fontSize: 13,
    fontWeight: '600',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  historyItemText: {
    fontSize: 13,
    fontWeight: '600',
  },
  historyItemTime: {
    fontSize: 10,
    marginTop: 2,
  },
  deleteIconBtn: {
    padding: 6,
    marginLeft: 8,
  },
  emptyHistory: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyHistoryText: {
    fontSize: 12,
  },
  clearAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  clearAllBtnText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 13,
  },
});
