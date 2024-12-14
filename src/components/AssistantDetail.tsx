import React, { useState } from 'react';
import { Assistant } from '../types';
import { WorkflowDesigner } from './WorkflowDesigner';
import { updateAssistant } from '../utils/db';
import '../styles/WorkflowDesigner.css';

interface AssistantDetailProps {
  assistant: Assistant | null;
  onAssistantUpdate: (updatedAssistant: Assistant) => void;
}

const DEFAULT_WORKFLOW = {
  nodes: [
    {
      id: '1',
      type: 'input',
      position: { x: 100, y: 100 },
      title: 'User Input'
    },
    {
      id: '2',
      type: 'process',
      position: { x: 400, y: 100 },
      title: 'Process Data'
    },
    {
      id: '3',
      type: 'output',
      position: { x: 700, y: 100 },
      title: 'Generate Response'
    }
  ],
  connections: [
    { from: '1', to: '2' },
    { from: '2', to: '3' }
  ]
};

export const AssistantDetail: React.FC<AssistantDetailProps> = ({
  assistant,
  onAssistantUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');

  if (!assistant) {
    return (
      <div className="assistant-detail empty">
        <p>Select an assistant or create a new one</p>
      </div>
    );
  }

  // Use assistant's workflow data if it exists, otherwise use default
  const workflow = assistant.workflow || DEFAULT_WORKFLOW;

  const handleNodesChange = async (updatedNodes: any[]) => {
    const updatedAssistant = {
      ...assistant,
      workflow: {
        ...workflow,
        nodes: updatedNodes
      }
    };
    try {
      await updateAssistant(updatedAssistant);
      onAssistantUpdate(updatedAssistant);
    } catch (error) {
      console.error('Failed to update assistant nodes:', error);
    }
  };

  const handleConnectionsChange = async (updatedConnections: any[]) => {
    const updatedAssistant = {
      ...assistant,
      workflow: {
        ...workflow,
        connections: updatedConnections
      }
    };
    try {
      await updateAssistant(updatedAssistant);
      onAssistantUpdate(updatedAssistant);
    } catch (error) {
      console.error('Failed to update assistant connections:', error);
    }
  };

  const handleNameEdit = () => {
    setEditName(assistant.name);
    setIsEditing(true);
  };

  const handleNameSave = async () => {
    if (editName.trim() !== assistant.name) {
      const updatedAssistant = {
        ...assistant,
        name: editName.trim()
      };
      try {
        await updateAssistant(updatedAssistant);
        onAssistantUpdate(updatedAssistant);
      } catch (error) {
        console.error('Failed to update assistant name:', error);
      }
    }
    setIsEditing(false);
  };

  return (
    <div className="assistant-detail">
      <div className="assistant-detail-header">
        {isEditing ? (
          <div className="name-edit">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleNameSave}
              onKeyPress={(e) => e.key === 'Enter' && handleNameSave()}
              autoFocus
            />
          </div>
        ) : (
          <h2 onClick={handleNameEdit}>{assistant.name}</h2>
        )}
      </div>
      <div className="assistant-detail-content">
        <div style={{ width: '100%', height: 'calc(100vh - 200px)' }}>
          <WorkflowDesigner
            nodes={workflow.nodes}
            connections={workflow.connections}
            onNodesChange={handleNodesChange}
            onConnectionsChange={handleConnectionsChange}
          />
        </div>
      </div>
    </div>
  );
};
