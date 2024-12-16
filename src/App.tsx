import { useState, useEffect } from "react";
import { initDB, getAllSessions, getAllAssistants } from "./utils/db";
import { ChatSession, Assistant } from "./types";
import { LanguageProvider, useTranslation } from "./i18n/LanguageContext";
import { ChatPage } from "./pages/ChatPage";
import { AssistantPage } from "./pages/AssistantPage";
import { ConfigPage } from "./pages/ConfigPage";

// Import icons
import chatIcon from "./assets/icons/chat.svg";
import robotIcon from "./assets/icons/robot.svg";
import settingsIcon from "./assets/icons/settings.svg";

import "./App.css";

function AppContent() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"chat" | "assistant" | "config">("chat");
  const [isLoading, setIsLoading] = useState(true);

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
          <img src={robotIcon} alt="Assistant" />
        </button>
        <button
          className={`tab-button ${activeTab === "config" ? "active" : ""}`}
          onClick={() => setActiveTab("config")}
        >
          <img src={settingsIcon} alt="Config" />
        </button>
      </div>
      
      <div className="content">
        {activeTab === "chat" ? (
          <ChatPage />
        ) : activeTab === "assistant" ? (
          <AssistantPage />
        ) : (
          <ConfigPage />
        )}
      </div>
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
