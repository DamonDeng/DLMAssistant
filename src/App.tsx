import { useState, useEffect } from "react";
import { initDB, getAllSessions, getAllAssistants } from "./utils/db";
import { ChatSession, Assistant } from "./types";
import { ConfigPage } from "./components/ConfigPage";
import { LanguageProvider, useTranslation } from "./i18n/LanguageContext";
import { ChatPage } from "./pages/ChatPage";
import { AssistantPage } from "./pages/AssistantPage";

// Import icons
import chatIcon from "./assets/icons/chat.svg";
import settingsIcon from "./assets/icons/settings.svg";

import "./App.css";

function AppContent() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"chat" | "assistant">("chat");
  const [isLoading, setIsLoading] = useState(true);
  const [showConfig, setShowConfig] = useState(false);

  // Initialize database
  useEffect(() => {
    const initializeDB = async () => {
      try {
        await initDB();
        const loadedSessions = await getAllSessions();
        const loadedAssistants = await getAllAssistants();
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize database:', error);
        setIsLoading(false);
      }
    };

    initializeDB();
  }, []);

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="app">
      <div className="sidebar">
        <button
          className={`tab-button ${activeTab === "chat" ? "active" : ""}`}
          onClick={() => setActiveTab("chat")}
        >
          <img src={chatIcon} alt="Chat" />
        </button>
        <button
          className={`tab-button ${activeTab === "assistant" ? "active" : ""}`}
          onClick={() => setActiveTab("assistant")}
        >
          <img src={settingsIcon} alt="Assistant" />
        </button>
      </div>
      
      <div className="content">
        {activeTab === "chat" ? (
          <ChatPage onShowConfig={() => setShowConfig(true)} />
        ) : (
          <AssistantPage />
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
