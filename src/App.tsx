import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { initDB, getAllSessions, updateSession, getConfig } from "./utils/db";
import { ChatSession, ChatMessage, Config, ContentBlock, TextContentBlock, ImageContentBlock } from "./types";
import { ConfigPage } from "./components/ConfigPage";
import { LanguageProvider, useTranslation } from "./i18n/LanguageContext";
import { BedrockClient } from "./services/bedrock";
import { Markdown } from "./components/markdown";
import { Avatar } from "./components/avatar";
import { IconButton } from "./components/button";
import { generateId } from "./utils/id";
import "./App.css";

// Import icons
import settingsIcon from "./assets/icons/settings.svg";
import closeIcon from "./assets/icons/close.svg";
import imageIcon from "./assets/icons/image.svg";

function createTextBlock(text: string): TextContentBlock {
  return {
    type: 'text',
    text
  };
}

function AppContent() {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [pendingImages, setPendingImages] = useState<ImageContentBlock[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bedrockClientRef = useRef<BedrockClient | null>(null);
  const currentAssistantMessageId = useRef<string | null>(null);

  useEffect(() => {
    const initializeDB = async () => {
      try {
        await initDB();
        const loadedSessions = await getAllSessions();
        if (loadedSessions.length === 0) {
          //do nothing if no sessions
        } else {
          const activeSessions = loadedSessions.filter(s => !s.deleted);
          setSessions(loadedSessions);
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

  const handleImageButtonClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent any form submission
    fileInputRef.current?.click();
  };

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

        // Add image to pending images
        setPendingImages(prev => [...prev, imageBlock]);
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Failed to process image:', error);
      alert('Failed to process image');
    }
  };

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

  const deleteSession = async (sessionId: number, e: React.MouseEvent<HTMLButtonElement>) => {
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

  const focusTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!activeSession || (!newMessage.trim() && pendingImages.length === 0) || isSending) return;
    
    try {
      setIsSending(true);
      
      // Combine text and images into content blocks
      const contentBlocks: ContentBlock[] = [
        ...pendingImages,
        ...(newMessage.trim() ? [createTextBlock(newMessage.trim())] : [])
      ];

      const userMessage: ChatMessage = {
        id: generateId(),
        role: 'user',
        dlm_message_type: 'chat',
        content: contentBlocks,
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
      const assistantMessageId = generateId();
      currentAssistantMessageId.current = assistantMessageId;
      
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: 'assistant',
        dlm_message_type: 'chat',
        content: [createTextBlock('')],
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
      setPendingImages([]); // Clear pending images after sending

      try {
        // Start streaming response
        const finalResponse = await bedrockClientRef.current.sendMessage(
          config, 
          updatedMessages.slice(0, -1),
          (chunk: string, done: boolean) => {
            setActiveSession(prev => {
              if (!prev) return prev;
              const messages = [...prev.messages];
              const messageIndex = messages.findIndex(m => m.id === currentAssistantMessageId.current);
              if (messageIndex !== -1) {
                const message = messages[messageIndex];
                messages[messageIndex] = {
                  ...message,
                  content: [createTextBlock((message.content[0] as TextContentBlock).text + chunk)],
                  isStreaming: !done
                };
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
          msg.id === assistantMessageId ? {
            ...msg,
            content: [createTextBlock(finalResponse)],
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

        // Focus the textarea after successful response
        setTimeout(focusTextarea, 100);

      } catch (error) {
        // Handle error in streaming
        const errorMessage: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          dlm_message_type: 'error',
          content: [createTextBlock(error instanceof Error ? error.message : 'An unexpected error occurred')],
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
      currentAssistantMessageId.current = null;
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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

  // Focus textarea when component mounts or when a new chat is created
  useEffect(() => {
    if (activeSession && textareaRef.current) {
      focusTextarea();
    }
  }, [activeSession]);

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
              <IconButton
                icon={<img src={closeIcon} alt="Delete" className="icon" />}
                onClick={(e) => deleteSession(session.id, e)}
                title="Delete session"
                useDefaultStyles={false}
                className="delete-button"
              />
            </div>
          ))}
        </div>
        <div className="button-container">
          <button className="new-chat-button" onClick={createNewChat}>
            {t('newChat')}
          </button>
          <IconButton
            icon={<img src={settingsIcon} alt="Settings" className="icon" />}
            onClick={() => setShowConfig(true)}
            title="Settings"
          />
        </div>
      </div>

      <div className="main-chat">
        {activeSession ? (
          <>
            <div className="chat-header">
              <h2>{activeSession.title}</h2>
            </div>

            <div className="chat-messages">
              {activeSession.messages.map((message) => (
                <div
                  key={message.id}
                  className={`message ${message.role === 'user' ? 'sent' : 'received'} ${
                    message.isStreaming ? 'streaming' : ''
                  } ${message.dlm_message_type === 'error' ? 'error' : ''}`}
                >
                  <Avatar isBot={message.role === 'assistant'} />
                  <div className="message-content">
                    {message.content.map((block, index) => (
                      <div key={index}>
                        {block.type === 'text' ? (
                          <Markdown content={(block as TextContentBlock).text} />
                        ) : block.type === 'image' ? (
                          <img 
                            src={URL.createObjectURL(new Blob([(block as ImageContentBlock).image.source.bytes], 
                            { type: `image/${(block as ImageContentBlock).image.format}` }))} 
                            alt="Uploaded" 
                            className="message-image" 
                          />
                        ) : null}
                      </div>
                    ))}
                    {message.isStreaming && <span className="cursor" />}
                  </div>
                </div>
              ))}
              {isSending && !activeSession.messages.some(m => m.isStreaming) && (
                <div className="message received">
                  <Avatar isBot />
                  <div className="message-content">Thinking...</div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-wrapper">
              <div className="toolbar">
                <IconButton
                  icon={<img src={imageIcon} alt="Upload" className="icon" />}
                  onClick={handleImageButtonClick}
                  title="Upload image"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
              </div>
              
              {pendingImages.length > 0 && (
                <div className="message-preview">
                  {pendingImages.map((image, index) => (
                    <div key={index} className="preview-block">
                      <img 
                        src={URL.createObjectURL(new Blob([image.image.source.bytes], 
                        { type: `image/${image.image.format}` }))} 
                        alt="Preview" 
                        className="message-image" 
                      />
                      <button 
                        type="button"
                        className="remove-image" 
                        onClick={() => setPendingImages(prev => prev.filter((_, i) => i !== index))}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <form className="chat-input" onSubmit={handleSendMessage}>
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
                  <button 
                    type="submit" 
                    disabled={isSending || (!newMessage.trim() && pendingImages.length === 0)}
                  >
                    Send
                  </button>
                </div>
              </form>
            </div>
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
