import { useState, useEffect } from "react";
import { AssistantList } from "../components/AssistantList";
import { AssistantDetail } from "../components/AssistantDetail";
import { Assistant } from "../types";
import { updateAssistant, getAllAssistants } from "../utils/db";

const EMPTY_WORKFLOW = {
  nodes: [],
  connections: []
};

export function AssistantPage() {
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [activeAssistant, setActiveAssistant] = useState<Assistant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load assistants when component mounts
  useEffect(() => {
    loadAssistants();
  }, []);

  const loadAssistants = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const loadedAssistants = await getAllAssistants();
      const filteredAssistants = loadedAssistants.filter(a => !a.deleted);
      setAssistants(filteredAssistants);
      
      // Set active assistant to the first one if any exist and no active assistant is selected
      if (filteredAssistants.length > 0 && !activeAssistant) {
        setActiveAssistant(filteredAssistants[0]);
      }
    } catch (error) {
      console.error('Failed to load assistants:', error);
      setError('Failed to load assistants. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const createNewAssistant = async () => {
    try {
      setError(null);
      const newAssistant: Assistant = {
        id: Date.now(),
        name: 'New Assistant',
        createdTime: Date.now(),
        workflow: EMPTY_WORKFLOW // Start with an empty workflow
      };

      // Save to IndexedDB first
      await updateAssistant(newAssistant);

      // Then update state
      setAssistants(prev => [...prev, newAssistant]);
      setActiveAssistant(newAssistant);
    } catch (error) {
      console.error('Failed to create new assistant:', error);
      setError('Failed to create new assistant. Please try again.');
    }
  };

  const deleteAssistant = async (assistantId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setError(null);
      const assistantToDelete = assistants.find(a => a.id === assistantId);
      if (assistantToDelete) {
        const updatedAssistant = { ...assistantToDelete, deleted: true };
        
        // Save to IndexedDB first
        await updateAssistant(updatedAssistant);
        
        // Then update state
        const updatedAssistants = assistants.filter(a => a.id !== assistantId);
        setAssistants(updatedAssistants);
        
        if (activeAssistant?.id === assistantId) {
          setActiveAssistant(updatedAssistants.length > 0 ? updatedAssistants[0] : null);
        }
      }
    } catch (error) {
      console.error('Failed to delete assistant:', error);
      setError('Failed to delete assistant. Please try again.');
    }
  };

  const handleAssistantClick = async (assistant: Assistant) => {
    try {
      setError(null);
      // Fetch the latest version of the assistant from IndexedDB
      const loadedAssistants = await getAllAssistants();
      const selectedAssistant = loadedAssistants.find(a => a.id === assistant.id);
      
      if (selectedAssistant && !selectedAssistant.deleted) {
        // Ensure the assistant has a workflow property
        if (!selectedAssistant.workflow) {
          selectedAssistant.workflow = EMPTY_WORKFLOW;
          await updateAssistant(selectedAssistant);
        }
        setActiveAssistant(selectedAssistant);
      } else {
        console.error('Selected assistant not found or deleted');
        // Refresh the assistants list to ensure UI is in sync with DB
        loadAssistants();
      }
    } catch (error) {
      console.error('Failed to load assistant details:', error);
      setError('Failed to load assistant details. Please try again.');
    }
  };

  const handleAssistantUpdate = async (updatedAssistant: Assistant) => {
    try {
      setError(null);
      // Save to IndexedDB first
      await updateAssistant(updatedAssistant);
      
      // Then update state
      setAssistants(prev => 
        prev.map(a => a.id === updatedAssistant.id ? updatedAssistant : a)
      );
      setActiveAssistant(updatedAssistant);
    } catch (error) {
      console.error('Failed to update assistant:', error);
      setError('Failed to save changes. Please try again.');
    }
  };

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="assistant-page">
      {error && <div className="error-message">{error}</div>}
      <div className="container">
        <AssistantList
          assistants={assistants}
          activeAssistant={activeAssistant}
          onAssistantClick={handleAssistantClick}
          onDeleteAssistant={deleteAssistant}
          onNewAssistant={createNewAssistant}
        />
        <AssistantDetail 
          assistant={activeAssistant} 
          onAssistantUpdate={handleAssistantUpdate}
        />
      </div>
    </div>
  );
}
