import React, { useState, useEffect } from 'react';
import { Assistant, Workflow } from '../types';
import { getAllAssistants, updateAssistant, getAllWorkflows } from '../utils/db';
import '../styles/WorkflowPage.css';

const AssistantList: React.FC<{
  assistants: Assistant[];
  selectedAssistant: Assistant | null;
  onSelectAssistant: (assistant: Assistant) => void;
  onNewAssistant: () => void;
}> = ({ assistants, selectedAssistant, onSelectAssistant, onNewAssistant }) => {
  return (
    <div className="workflow-list">
      <div className="list-header">
        <h2>Assistants</h2>
      </div>
      <div className="list-content">
        {assistants.map((assistant) => (
          <div
            key={assistant.id}
            className={`workflow-item ${selectedAssistant?.id === assistant.id ? 'active' : ''}`}
            onClick={() => onSelectAssistant(assistant)}
          >
            <div className="workflow-item-content">
              <div className="workflow-item-name">{assistant.name}</div>
              <div className="workflow-item-date">
                {new Date(assistant.createdTime).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="new-workflow-button-container">
        <button className="new-workflow-button" onClick={onNewAssistant}>
          New Assistant
        </button>
      </div>
    </div>
  );
};

const AssistantDetail: React.FC<{
  assistant: Assistant | null;
  workflows: Workflow[];
  onSave: (assistant: Omit<Assistant, 'id'> & { id?: number }) => void;
}> = ({ assistant, workflows, onSave }) => {
  const [name, setName] = useState(assistant?.name || '');
  const [mainWorkflow, setMainWorkflow] = useState<number>(assistant?.mainWorkflow || 0);

  useEffect(() => {
    if (assistant) {
      setName(assistant.name);
      setMainWorkflow(assistant.mainWorkflow);
    } else {
      setName('');
      setMainWorkflow(0);
    }
  }, [assistant]);

  if (!assistant) {
    return <div className="workflow-detail empty-state">Select an assistant to view details</div>;
  }

  const handleSave = () => {
    const now = Date.now();
    const assistantData = {
      ...(assistant.id ? { id: assistant.id } : {}),
      name,
      mainWorkflow,
      createdTime: assistant.createdTime || now,
      updatedAt: now,
    };
    onSave(assistantData);
  };

  return (
    <div className="workflow-detail">
      <div className="list-header">
        <h2>Assistant Details</h2>
      </div>
      <div style={{ padding: '16px', flex: 1, overflowY: 'auto' }}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px' }}>Name:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Assistant Name"
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #e0e0e0'
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px' }}>Main Workflow:</label>
          <select
            value={mainWorkflow}
            onChange={(e) => setMainWorkflow(Number(e.target.value))}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #e0e0e0'
            }}
          >
            <option value={0}>Select a workflow</option>
            {workflows.map((workflow) => (
              <option key={workflow.id} value={workflow.id}>
                {workflow.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="new-workflow-button-container">
        <button 
          className="new-workflow-button" 
          onClick={handleSave} 
          disabled={!name || !mainWorkflow}
          style={{ opacity: (!name || !mainWorkflow) ? 0.5 : 1 }}
        >
          Save
        </button>
      </div>
    </div>
  );
};

export const AssistantPage: React.FC = () => {
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedAssistant, setSelectedAssistant] = useState<Assistant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [loadedAssistants, loadedWorkflows] = await Promise.all([
        getAllAssistants(),
        getAllWorkflows(),
      ]);
      setAssistants(loadedAssistants);
      setWorkflows(loadedWorkflows);
      
      // Update selected assistant if it exists in the loaded data
      if (selectedAssistant) {
        const updatedAssistant = loadedAssistants.find((a: Assistant) => a.id === selectedAssistant.id);
        setSelectedAssistant(updatedAssistant || null);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewAssistant = () => {
    const now = Date.now();
    const newAssistant: Omit<Assistant, 'id'> = {
      name: 'New Assistant',
      mainWorkflow: 0,
      createdTime: now,
      updatedAt: now,
    };
    setSelectedAssistant(newAssistant as Assistant);
  };

  const handleSaveAssistant = async (assistantData: Omit<Assistant, 'id'> & { id?: number }) => {
    try {
      await updateAssistant(assistantData);
      await loadData(); // Reload all data to get the new/updated assistant
    } catch (error) {
      console.error('Error saving assistant:', error);
    }
  };

  if (isLoading) {
    return <div className="workflow-page loading">Loading...</div>;
  }

  return (
    <div className="workflow-page">
      <div className="container">
        <AssistantList
          assistants={assistants}
          selectedAssistant={selectedAssistant}
          onSelectAssistant={setSelectedAssistant}
          onNewAssistant={handleNewAssistant}
        />
        <AssistantDetail
          assistant={selectedAssistant}
          workflows={workflows}
          onSave={handleSaveAssistant}
        />
      </div>
    </div>
  );
};
