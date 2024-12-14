import { useState, useEffect } from "react";
import { AssistantList } from "../components/AssistantList";
import { AssistantDetail } from "../components/AssistantDetail";
import { Assistant } from "../types";
import { updateAssistant, getAllAssistants } from "../utils/db";

export function AssistantPage() {
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [activeAssistant, setActiveAssistant] = useState<Assistant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load assistants when component mounts
  useEffect(() => {
    const loadAssistants = async () => {
      try {
        const loadedAssistants = await getAllAssistants();
        const filteredAssistants = loadedAssistants.filter(a => !a.deleted);
        setAssistants(filteredAssistants);
        
        // Set active assistant to the first one if any exist
        if (filteredAssistants.length > 0) {
          setActiveAssistant(filteredAssistants[0]);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load assistants:', error);
        setIsLoading(false);
      }
    };

    loadAssistants();
  }, []);

  const createNewAssistant = async () => {
    const newAssistant: Assistant = {
      id: Date.now(),
      name: 'New Assistant',
      createdTime: Date.now()
    };

    try {
      await updateAssistant(newAssistant);
      setAssistants(prev => [...prev, newAssistant]);
      setActiveAssistant(newAssistant);
    } catch (error) {
      console.error('Failed to create new assistant:', error);
    }
  };

  const deleteAssistant = async (assistantId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const assistantToDelete = assistants.find(a => a.id === assistantId);
      if (assistantToDelete) {
        const updatedAssistant = { ...assistantToDelete, deleted: true };
        await updateAssistant(updatedAssistant);
        
        const updatedAssistants = assistants.filter(a => a.id !== assistantId);
        setAssistants(updatedAssistants);
        
        if (activeAssistant?.id === assistantId) {
          setActiveAssistant(updatedAssistants.length > 0 ? updatedAssistants[0] : null);
        }
      }
    } catch (error) {
      console.error('Failed to delete assistant:', error);
    }
  };

  const handleAssistantClick = (assistant: Assistant) => {
    setActiveAssistant(assistant);
  };

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="assistant-page">
      <div className="container">
        <AssistantList
          assistants={assistants}
          activeAssistant={activeAssistant}
          onAssistantClick={handleAssistantClick}
          onDeleteAssistant={deleteAssistant}
          onNewAssistant={createNewAssistant}
        />
        <AssistantDetail assistant={activeAssistant} />
      </div>
    </div>
  );
}
