import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { initDB, getAllSessions, updateSession } from "./utils/db";
import { ChatSession, Message } from "./types";
import "./App.css";

function App() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize database and load sessions
  useEffect(() => {
    const initializeDB = async () => {
      try {
        await initDB();
        const loadedSessions = await getAllSessions();
        if (loadedSessions.length === 0) {
          // Add default sessions if none exist
          const defaultSessions: ChatSession[] = [
            {
              id: 1,
              title: "Project Discussion",
              preview: "Let's review the latest updates",
              messages: [
                { id: 1, content: "Hi, how's the project going?", sent: false, timestamp: "10:00 AM" },
                { id: 2, content: "Going well! I've completed the first phase.", sent: true, timestamp: "10:02 AM" },
                { id: 3, content: "That's great! Can you share the details?", sent: false, timestamp: "10:05 AM" },
              ]
            },
            {
              id: 2,
              title: "Team Meeting",
              preview: "Meeting scheduled for tomorrow",
              messages: [
                { id: 1, content: "Team meeting tomorrow at 2 PM", sent: false, timestamp: "09:00 AM" },
                { id: 2, content: "I'll be there", sent: true, timestamp: "09:15 AM" },
              ]
            },
            {
              id: 3,
              title: "Bug Reports",
              preview: "New bug found in production",
              messages: [
                { id: 1, content: "We found a critical bug in production", sent: false, timestamp: "Yesterday" },
                { id: 2, content: "I'll look into it right away", sent: true, timestamp: "Yesterday" },
              ]
            },
          ];

          // Store default sessions
          await Promise.all(defaultSessions.map(session => updateSession(session)));
          setSessions(defaultSessions);
          setActiveSession(defaultSessions[0]);
        } else {
          setSessions(loadedSessions);
          setActiveSession(loadedSessions[0]);
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
        id: Date.now(), // Use timestamp as unique ID
        title: `New Chat ${sessions.length + 1}`,
        preview: "Start a new conversation",
        messages: []
      };

      // Store in IndexedDB
      await updateSession(newSession);

      // Update state
      setSessions(prev => [...prev, newSession]);
      setActiveSession(newSession);
    } catch (error) {
      console.error('Failed to create new chat:', error);
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
    if (!activeSession || newMessage.trim() === "") return;
    
    try {
      // Create new message
      const newMessageObj: Message = {
        id: activeSession.messages.length + 1,
        content: newMessage.trim(),
        sent: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      // Create updated session
      const updatedSession = {
        ...activeSession,
        messages: [...activeSession.messages, newMessageObj],
        preview: newMessage.trim()
      };

      // Update sessions array
      const updatedSessions = sessions.map(session =>
        session.id === activeSession.id ? updatedSession : session
      );

      // Update IndexedDB
      await updateSession(updatedSession);

      // Update state
      setSessions(updatedSessions);
      setActiveSession(updatedSession);
      setNewMessage("");
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Shift+Enter pressed - send message
        e.preventDefault();
        handleSendMessage();
      }
      // Regular Enter - do nothing (default behavior will create new line)
    }
  };

  // Adjust textarea height automatically
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [newMessage]);

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  if (!activeSession) {
    return <div className="error">No chat sessions available</div>;
  }

  return (
    <div className="container">
      <div className="sidebar">
        <div className="chat-sessions">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`chat-session ${activeSession.id === session.id ? 'active' : ''}`}
              onClick={() => setActiveSession(session)}
            >
              <div className="chat-session-title">{session.title}</div>
              <div className="chat-session-preview">{session.preview}</div>
            </div>
          ))}
        </div>
        <button className="new-chat-button" onClick={createNewChat}>
          New Chat
        </button>
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
          />
          <button type="submit">Send</button>
        </form>
      </div>
    </div>
  );
}

export default App;
