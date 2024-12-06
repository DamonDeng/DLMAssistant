import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { initDB, getAllSessions, updateSession, getConfig } from "./utils/db";
import { ChatSession, ChatMessage, Config, ContentBlock, TextContentBlock, ImageContentBlock } from "./types";
import { ConfigPage } from "./components/ConfigPage";
import { LanguageProvider, useTranslation } from "./i18n/LanguageContext";
import { BedrockClient } from "./services/bedrock";
import "./App.css";

// Import icons
import settingsIcon from "./assets/icons/settings.svg";
import closeIcon from "./assets/icons/close.svg";
import imageIcon from "./assets/icons/image.svg";

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bedrockClientRef = useRef<BedrockClient | null>(null);
  const [messageBlocks, setMessageBlocks] = useState<ContentBlock[]>([]);

  useEffect(() => {
    const initializeDB = async () => {
      try {
        await initDB();
        const loadedSessions = await getAllSessions();
        if (loadedSessions.length === 0) {
          //do nothing if no sessions
        } else {
          // Convert legacy messages if needed
          const convertedSessions = loadedSessions.map(session => ({
            ...session,
            messages: session.messages.map((msg: any): ChatMessage => {
              // Handle legacy message format
              if (typeof msg.content === 'string' || msg.legacy_content) {
                const textContent = typeof msg.content === 'string' ? msg.content : msg.legacy_content || '';
                return {
                  id: msg.id,
                  role: msg.role === 'user' ? 'user' : 'assistant',
                  dlm_message_type: 'chat',
                  content: [{
                    type: 'text' as const,
                    text: textContent
                  }],
                  timestamp: typeof msg.timestamp === 'string' ? Date.now() : msg.timestamp,
                  legacy_content: textContent,
                  legacy_content_type: msg.legacy_content_type
                };
              }
              // Message is already in new format
              return msg as ChatMessage;
            })
          }));
          
          const activeSessions = convertedSessions.filter(s => !s.deleted);
          setSessions(convertedSessions);
          setActiveSession(activeSessions.length > 0 ? activeSessions[0] : null);
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const uint8Array = new Uint8Array(arrayBuffer);

        const imageBlock: ImageContentBlock = {
          type: 'image',
          image: {
            format: file.type.split('/')[1] as 'png' | 'jpeg' | 'gif' | 'webp',
            source: {
              bytes: uint8Array
            }
          }
        };

        // Store image data in sessionStorage
        const imageKey = `image_${Date.now()}`;
        sessionStorage.setItem(imageKey, JSON.stringify({
          format: imageBlock.image.format,
          data: Array.from(uint8Array)
        }));

        setMessageBlocks(prev => [...prev, imageBlock]);
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Failed to process image:', error);
      alert('Failed to process image');
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!activeSession || (!newMessage.trim() && messageBlocks.length === 0) || isSending) return;
    
    try {
      setIsSending(true);
      
      const content: ContentBlock[] = [
        ...messageBlocks,
        ...(newMessage.trim() ? [{
          type: 'text' as const,
          text: newMessage.trim()
        }] : [])
      ];

      const userMessage: ChatMessage = {
        id: activeSession.messages.length + 1,
        role: 'user',
        dlm_message_type: 'chat',
        content,
        timestamp: Date.now()
      };

      const updatedMessages = [...activeSession.messages, userMessage];
      
      const config = await getConfig();
      if (!config) {
        throw new Error('Please configure AWS settings first');
      }

      if (!bedrockClientRef.current) {
        bedrockClientRef.current = new BedrockClient(config);
      }

      // Create a placeholder message for streaming response
      const assistantMessage: ChatMessage = {
        id: updatedMessages.length + 1,
        role: 'assistant',
        dlm_message_type: 'chat',
        content: [{
          type: 'text' as const,
          text: ''
        }],
        timestamp: Date.now(),
        isStreaming: true
      };

      updatedMessages.push(assistantMessage);

      // Update session with user message and empty assistant message
      const updatedSession: ChatSession = {
        ...activeSession,
        messages: updatedMessages,
        preview: newMessage.trim() || '[Image Message]'
      };
      setActiveSession(updatedSession);
      setNewMessage("");
      setMessageBlocks([]);

      try {
        // Start streaming response
        const finalResponse = await bedrockClientRef.current.sendMessage(
          config, 
          updatedMessages.slice(0, -1), // Exclude the empty assistant message
          (chunk: string, done: boolean) => {
            setActiveSession(prev => {
              if (!prev) return prev;
              const messages = [...prev.messages];
              const lastMessage = messages[messages.length - 1];
              if (lastMessage.role === 'assistant') {
                const currentText = (lastMessage.content[0] as TextContentBlock).text;
                const updatedMessage: ChatMessage = {
                  ...lastMessage,
                  content: [{
                    type: 'text' as const,
                    text: currentText + chunk
                  }],
                  isStreaming: !done
                };
                messages[messages.length - 1] = updatedMessage;
              }
              return {
                ...prev,
                messages
              };
            });
          }
        );

        // Update session with final response
        const finalMessages = updatedMessages.map(msg => 
          msg.role === 'assistant' ? {
            ...msg,
            content: [{
              type: 'text' as const,
              text: finalResponse
            }],
            isStreaming: false
          } : msg
        );

        const finalSession: ChatSession = {
          ...activeSession,
          messages: finalMessages,
          preview: newMessage.trim() || '[Image Message]'
        };

        await updateSession(finalSession);
        setSessions(prev => 
          prev.map(session =>
            session.id === activeSession.id ? finalSession : session
          )
        );
        setActiveSession(finalSession);

      } catch (error) {
        // Handle error in streaming
        const errorMessage: ChatMessage = {
          id: updatedMessages.length + 1,
          role: 'assistant',
          dlm_message_type: 'error',
          content: [{
            type: 'text' as const,
            text: error instanceof Error ? error.message : 'An unexpected error occurred'
          }],
          timestamp: Date.now()
        };

        const errorSession: ChatSession = {
          ...activeSession,
          messages: [...updatedMessages.slice(0, -1), errorMessage]
        };

        await updateSession(errorSession);
        setSessions(prev =>
          prev.map(session =>
            session.id === activeSession.id ? errorSession : session
          )
        );
        setActiveSession(errorSession);
      }

    } catch (error) {
      console.error('Failed to send message:', error);
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

  const renderMessage = (message: ChatMessage) => {
    const isError = message.dlm_message_type === 'error';
    
    if (isError && message.content[0]?.type === 'text') {
      return (
        <div key={message.id} className="message received error">
          <div className="error-content">{message.content[0].text}</div>
        </div>
      );
    }

    return (
      <div
        key={message.id}
        className={`message ${message.role === 'user' ? 'sent' : 'received'} ${message.isStreaming ? 'streaming' : ''}`}
      >
        {message.content.map((block, index) => (
          <div key={index}>{renderContentBlock(block)}</div>
        ))}
        {message.isStreaming && <span className="cursor"></span>}
      </div>
    );
  };

  const renderContentBlock = (block: ContentBlock) => {
    switch (block.type) {
      case 'text':
        return block.text;
      case 'image':
        const imageData = block.image.source.bytes;
        const format = block.image.format;
        const blob = new Blob([imageData], { type: `image/${format}` });
        const imageUrl = URL.createObjectURL(blob);
        return <img src={imageUrl} alt="User uploaded" className="message-image" />;
      case 'document':
        return `[Document: ${block.document.name}]`;
      case 'video':
        return '[Video]';
      case 'toolUse':
        return `[Tool Use: ${block.toolUse.name}]`;
      case 'toolResult':
        return `[Tool Result: ${block.toolResult.status}]`;
      case 'guardContent':
        return block.guardContent.text.text;
      default:
        return '[Unsupported Content]';
    }
  };

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  const visibleSessions = sessions.filter(session => !session.deleted);

  return (
    <div className="container">
      <div className="sidebar">
        <div className="chat-sessions">
          {visibleSessions.map((session) => (
            <div
              key={session.id}
              className={`chat-session ${activeSession?.id === session.id ? 'active' : ''}`}
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
                <img src={closeIcon} alt="Delete" className="icon" />
              </button>
            </div>
          ))}
        </div>
        <div className="button-container">
          <button className="new-chat-button" onClick={createNewChat}>
            {t('newChat')}
          </button>
          <button className="config-button" onClick={() => setShowConfig(true)}>
            <img src={settingsIcon} alt="Settings" className="icon" />
          </button>
        </div>
      </div>

      <div className="main-chat">
        {activeSession ? (
          <>
            <div className="chat-header">
              <h2>{activeSession.title}</h2>
            </div>

            <div className="chat-messages">
              {activeSession.messages.map(renderMessage)}
              {isSending && !activeSession.messages.some(m => m.isStreaming) && (
                <div className="message received">
                  Thinking...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form className="chat-input" onSubmit={handleSendMessage}>
              <div className="toolbar">
                <button 
                  type="button" 
                  className="image-upload-button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload image"
                >
                  <img src={imageIcon} alt="Upload image" className="icon" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
              </div>
              <div className="message-preview">
                {messageBlocks.map((block, index) => (
                  <div key={index} className="preview-block">
                    {renderContentBlock(block)}
                  </div>
                ))}
              </div>
              <div className="input-container">
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
              </div>
            </form>
          </>
        ) : (
          <div className="empty-chat">
            <p>{t('newChat')}</p>
          </div>
        )}
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
