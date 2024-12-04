import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { initDB, getAllSessions, updateSession, getConfig } from "./utils/db";
import { ChatSession, Message, Config } from "./types";
import { ConfigPage } from "./components/ConfigPage";
import { LanguageProvider, useTranslation } from "./i18n/LanguageContext";
import { BedrockClient } from "./services/bedrock";
import "./App.css";

function AppContent() {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bedrockClientRef = useRef<BedrockClient | null>(null);

  useEffect(() => {
    const initializeDB = async () => {
      try {
        await initDB();
        const loadedSessions = await getAllSessions();
        if (loadedSessions.length === 0) {
          var current_time_stamp_string = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          const defaultSessions: ChatSession[] = [
            {
              id: 1,
              title: "New Conversation",
              preview: "new conversation",
              messages: [
                { id: 1, content: "Hello!", sent: false, timestamp: current_time_stamp_string },
              ],
              deleted: false
            }
          ];

          await Promise.all(defaultSessions.map(session => updateSession(session)));
          setSessions(defaultSessions);
          setActiveSession(defaultSessions[0]);
        } else {
          setSessions(loadedSessions);
          setActiveSession(loadedSessions.find(s => !s.deleted) || null);
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize database:', error);
        setIsLoading(false);
      }
    };

    initializeDB();
  }, []);

  const createNewChat = async () => {
    try {
      const newSession: ChatSession = {
        id: Date.now(),
        title: t('newChat'),
        preview: "Start a new conversation",
        messages: [],
        deleted: false
      };

      await updateSession(newSession);
      setSessions(prev => [...prev, newSession]);
      setActiveSession(newSession);
    } catch (error) {
      console.error('Failed to create new chat:', error);
    }
  };

  const deleteSession = async (sessionId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const sessionToDelete = sessions.find(s => s.id === sessionId);
      if (sessionToDelete) {
        const updatedSession = { ...sessionToDelete, deleted: true };
        await updateSession(updatedSession);
        
        const updatedSessions = sessions.map(s => 
          s.id === sessionId ? updatedSession : s
        );
        
        setSessions(updatedSessions);
        
        if (activeSession?.id === sessionId) {
          const nextActiveSession = updatedSessions.find(s => !s.deleted && s.id !== sessionId);
          setActiveSession(nextActiveSession || null);
        }
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeSession?.messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!activeSession || newMessage.trim() === "" || isSending) return;
    
    try {
      setIsSending(true);
      
      const userMessage: Message = {
        id: activeSession.messages.length + 1,
        content: newMessage.trim(),
        sent: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const updatedMessages = [...activeSession.messages, userMessage];
      
      const config = await getConfig();
      if (!config) {
        throw new Error('Please configure AWS settings first');
      }

      if (!bedrockClientRef.current) {
        bedrockClientRef.current = new BedrockClient(config);
      }

      const claudeResponse = await bedrockClientRef.current.sendMessage(config, updatedMessages);
      
      const assistantMessage: Message = {
        id: updatedMessages.length + 1,
        content: claudeResponse,
        sent: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const finalMessages = [...updatedMessages, assistantMessage];

      const updatedSession = {
        ...activeSession,
        messages: finalMessages,
        preview: newMessage.trim()
      };

      const updatedSessions = sessions.map(session =>
        session.id === activeSession.id ? updatedSession : session
      );

      await updateSession(updatedSession);
      setSessions(updatedSessions);
      setActiveSession(updatedSession);
      setNewMessage("");
    } catch (error) {
      console.error('Failed to send message:', error);
      alert(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [newMessage]);

  useEffect(() => {
    const updateBedrockClient = async () => {
      const config = await getConfig();
      if (config) {
        bedrockClientRef.current = new BedrockClient(config);
      }
    };
    updateBedrockClient();
  }, [showConfig]);

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  if (!activeSession) {
    return <div className="error">No chat sessions available</div>;
  }

  const visibleSessions = sessions.filter(session => !session.deleted);

  return (
    <div className="container">
      <div className="sidebar">
        <div className="chat-sessions">
          {visibleSessions.map((session) => (
            <div
              key={session.id}
              className={`chat-session ${activeSession.id === session.id ? 'active' : ''}`}
              onClick={() => setActiveSession(session)}
            >
              <div className="chat-session-content">
                <div className="chat-session-title">{session.title}</div>
                <div className="chat-session-preview">{session.preview}</div>
              </div>
              <button 
                className="delete-session-button"
                onClick={(e) => deleteSession(session.id, e)}
                title="Delete session"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <div className="button-container">
          <button className="new-chat-button" onClick={createNewChat}>
            {t('newChat')}
          </button>
          <button className="config-button" onClick={() => setShowConfig(true)}>
            ⚙️
          </button>
        </div>
      </div>

      <div className="main-chat">
        <div className="chat-header">
          <h2>{activeSession.title}</h2>
        </div>

        <div className="chat-messages">
          {activeSession.messages.map((message) => (
            <div
              key={message.id}
              className={`message ${message.sent ? 'sent' : 'received'}`}
            >
              {message.content}
            </div>
          ))}
          {isSending && (
            <div className="message received">
              Thinking...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="chat-input" onSubmit={handleSendMessage}>
          <textarea
            ref={textareaRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Shift+Enter to send)"
            rows={1}
            disabled={isSending}
          />
          <button type="submit" disabled={isSending}>Send</button>
        </form>
      </div>

      {showConfig && <ConfigPage onClose={() => setShowConfig(false)} />}
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

export default App;
