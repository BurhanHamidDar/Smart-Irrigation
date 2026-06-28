import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, Plus, History, Trash2, X, MessageSquare, AlertCircle } from 'lucide-react';
import { AppTheme } from '../App';

const SYSTEM_PROMPT = `You are AgroBot, an expert agricultural and horticultural AI advisor specialized in temperate zone farming, particularly in the Kashmir valley. 

System & Developer Context:
- Developer/Creator: Burhan Hamid. He is the sole developer and creator of this system, working completely independently as a solo developer (not as part of a team).
- System Name: AgroFlow (Smart Irrigation & Weather Forecasting system).
- Hardware/Firmware: Runs on ESP8266 (NodeMCU) using a capacitive soil moisture sensor and a water pump relay. Communicates with Firebase Realtime Database.
- Core Features: Manual Irrigation, Auto Mode, Kashmir Seasonal Auto-Adjust, Weather Forecasting, Pump Motor Protection, Real-Time Logging.

Rules for Simplicity & Readability:
- Write in simple, friendly language. Avoid complex jargon.
- If you use a technical word, explain it simply.
- Use familiar local terms when helpful (Harud, Wand, Dawa, Khat).
- Use short sentences and brief paragraphs. No complex markdown tables.

Allowed Topics:
1. ONLY answer agriculture, horticulture, soil management, plant pathology, crop diseases, pest control, irrigation, fertilizers, pruning, weather, local farming, OR questions about the developer/AgroFlow system.
2. Decline non-agricultural queries politely.
3. Keep advice brief, practical, and tailored to Jammu and Kashmir.`;

interface Message { id: string; role: 'user' | 'assistant'; content: string; }
interface ChatSession { id: string; title: string; messages: Message[]; timestamp: number; }

const DEFAULT_WELCOME: Message = {
  id: 'welcome', role: 'assistant',
  content: 'Hello! I am AgroBot, your Kashmir farming and horticulture advisor. How can I help you manage your orchard today?',
};

interface AdvisorPageProps { theme: AppTheme; isDark: boolean; }

export default function AdvisorPage({ theme, isDark }: AdvisorPageProps) {
  const [apiKey, setApiKey] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([DEFAULT_WELCOME]);
  const [loading, setLoading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedKey = localStorage.getItem('openRouterApiKey');
    if (savedKey) setApiKey(savedKey);
    const raw = localStorage.getItem('chatbot_sessions_web');
    if (raw) setSessions(JSON.parse(raw));
  }, []);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const saveSessions = (s: ChatSession[]) => { setSessions(s); localStorage.setItem('chatbot_sessions_web', JSON.stringify(s)); };
  const handleNewChat = () => { setCurrentSessionId(null); setMessages([DEFAULT_WELCOME]); setHistoryOpen(false); };
  const handleSelectSession = (id: string) => { const s = sessions.find(x => x.id === id); if (s) { setCurrentSessionId(s.id); setMessages(s.messages); } setHistoryOpen(false); };
  const handleDeleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Delete this conversation?')) return;
    const f = sessions.filter(s => s.id !== id);
    saveSessions(f);
    if (currentSessionId === id) { f.length > 0 ? (setCurrentSessionId(f[0].id), setMessages(f[0].messages)) : handleNewChat(); }
  };
  const handleClearAll = () => { if (!window.confirm('Delete all chat history?')) return; saveSessions([]); handleNewChat(); };

  const handleSend = async () => {
    if (!inputMessage.trim() || loading) return;
    const userText = inputMessage.trim();
    setInputMessage('');
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: userText };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setLoading(true);
    let sid = currentSessionId; let isNew = false;
    if (!sid) { sid = Date.now().toString(); setCurrentSessionId(sid); isNew = true; }
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}`, 'HTTP-Referer': 'https://github.com/BurhanHamidDar/Smart-Irrigation', 'X-Title': 'AgroFlow' },
        body: JSON.stringify({ model: 'openrouter/free', messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...updated.map(m => ({ role: m.role, content: m.content }))] }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      const aiText = json.choices?.[0]?.message?.content || 'No response received.';
      const newMsgs: Message[] = [...updated, { id: Date.now().toString(), role: 'assistant', content: aiText }];
      setMessages(newMsgs);
      let ss = [...sessions];
      if (isNew) { ss.unshift({ id: sid!, title: userText.length > 30 ? userText.slice(0, 27) + '...' : userText, messages: newMsgs, timestamp: Date.now() }); }
      else { ss = ss.map(s => s.id === sid ? { ...s, messages: newMsgs, timestamp: Date.now() } : s); const i = ss.findIndex(s => s.id === sid); if (i > 0) { const [a] = ss.splice(i, 1); ss.unshift(a); } }
      saveSessions(ss);
    } catch (err: any) {
      setMessages([...updated, { id: Date.now().toString(), role: 'assistant', content: `Unable to get a response: ${err.message}. Check your internet connection and API key.` }]);
    } finally { setLoading(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  return (
    <div className="flex gap-5" style={{ minHeight: '70vh' }}>

      {/* History sidebar */}
      <div
        className={`shrink-0 rounded-xl border flex flex-col overflow-hidden transition-all duration-200 ${historyOpen ? 'w-64' : 'w-0 border-0'}`}
        style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder, boxShadow: theme.cardShadow }}
      >
        {historyOpen && (
          <>
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: theme.cardBorder }}>
              <span className="text-xs font-semibold" style={{ color: theme.text }}>Chat History</span>
              <button onClick={() => setHistoryOpen(false)}><X className="w-4 h-4" style={{ color: theme.subText }} /></button>
            </div>
            <button onClick={handleNewChat} className="mx-3 mt-3 flex items-center justify-center gap-2 py-2 rounded-lg border text-xs font-medium" style={{ borderColor: theme.primary, color: theme.primary, borderStyle: 'dashed' }}>
              <Plus className="w-3.5 h-3.5" /> New Chat
            </button>
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
              {sessions.length === 0 ? (
                <p className="text-xs text-center py-10" style={{ color: theme.subText }}>No conversations yet.</p>
              ) : sessions.map(s => (
                <button key={s.id} onClick={() => handleSelectSession(s.id)}
                  className="w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-colors"
                  style={{ backgroundColor: s.id === currentSessionId ? theme.primaryLight : 'transparent', borderColor: s.id === currentSessionId ? theme.primary : theme.cardBorder }}>
                  <MessageSquare className="w-3.5 h-3.5 shrink-0" style={{ color: theme.subText }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate" style={{ color: theme.text }}>{s.title}</p>
                    <p className="text-[9px]" style={{ color: theme.subText }}>{new Date(s.timestamp).toLocaleDateString()}</p>
                  </div>
                  <button onClick={e => handleDeleteSession(e, s.id)} className="shrink-0"><Trash2 className="w-3 h-3 text-red-400" /></button>
                </button>
              ))}
            </div>
            {sessions.length > 0 && (
              <button onClick={handleClearAll} className="m-3 py-2 rounded-lg text-white text-xs font-medium flex items-center justify-center gap-1.5" style={{ backgroundColor: theme.danger }}>
                <Trash2 className="w-3.5 h-3.5" /> Clear All
              </button>
            )}
          </>
        )}
      </div>

      {/* Chat panel */}
      <div className="flex-1 rounded-xl border flex flex-col overflow-hidden" style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder, boxShadow: theme.cardShadow }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b shrink-0" style={{ borderColor: theme.cardBorder }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: theme.primaryLight }}>
              <Bot className="w-4 h-4" style={{ color: theme.primary }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: theme.text }}>AgroBot Advisor</p>
              <p className="text-[10px]" style={{ color: theme.subText }}>Kashmir Agriculture AI</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleNewChat} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium" style={{ borderColor: theme.cardBorder, color: theme.text }}>
              <Plus className="w-3.5 h-3.5" /> New
            </button>
            <button onClick={() => setHistoryOpen(p => !p)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium"
              style={{ borderColor: historyOpen ? theme.primary : theme.cardBorder, color: historyOpen ? theme.primary : theme.text, backgroundColor: historyOpen ? theme.primaryLight : 'transparent' }}>
              <History className="w-3.5 h-3.5" /> History
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {messages.map(m => (
            <div key={m.id} className={`flex items-end gap-2.5 ${m.role === 'user' ? 'justify-end' : ''}`}>
              {m.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: theme.primaryLight }}>
                  <Bot className="w-3.5 h-3.5" style={{ color: theme.primary }} />
                </div>
              )}
              <div
                className="max-w-[70%] px-4 py-2.5 rounded-xl text-sm leading-relaxed whitespace-pre-wrap"
                style={{
                  backgroundColor: m.role === 'user' ? theme.primary : theme.inputBg,
                  color: m.role === 'user' ? '#ffffff' : theme.text,
                  border: m.role === 'assistant' ? `1px solid ${theme.cardBorder}` : 'none',
                  borderBottomRightRadius: m.role === 'user' ? '4px' : undefined,
                  borderBottomLeftRadius: m.role === 'assistant' ? '4px' : undefined,
                }}
              >{m.content}</div>
            </div>
          ))}
          {loading && (
            <div className="flex items-end gap-2.5">
              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: theme.primaryLight }}>
                <Bot className="w-3.5 h-3.5" style={{ color: theme.primary }} />
              </div>
              <div className="px-4 py-3 rounded-xl border flex gap-1.5" style={{ backgroundColor: theme.inputBg, borderColor: theme.cardBorder }}>
                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: theme.primary, animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: theme.primary, animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: theme.primary, animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-5 py-3.5 border-t shrink-0" style={{ borderColor: theme.cardBorder }}>
          <div className="flex items-end gap-3">
            <textarea
              className="flex-1 resize-none rounded-lg px-3.5 py-2.5 text-sm border focus:outline-none"
              style={{ backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text, minHeight: '42px', maxHeight: '100px' }}
              placeholder="Ask about farming, irrigation, pests..."
              value={inputMessage} onChange={e => setInputMessage(e.target.value)} onKeyDown={handleKeyDown} rows={1}
            />
            <button onClick={handleSend} disabled={!inputMessage.trim() || loading}
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 disabled:opacity-40"
              style={{ backgroundColor: theme.primary }}>
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
          <p className="text-[9px] mt-1.5 text-center" style={{ color: theme.subText }}>
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
