import React, { useState } from 'react';
import { Assistant } from '../types';
import { WorkflowDesigner } from './WorkflowDesigner';
import '../styles/WorkflowDesigner.css';

interface AssistantDetailProps {
  assistant: Assistant | null;
}

export const AssistantDetail: React.FC<AssistantDetailProps> = ({
  assistant
}) => {
  const [nodes, setNodes] = useState([
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
  ]);

  const [connections, setConnections] = useState([
    { from: '1', to: '2' },
    { from: '2', to: '3' }
  ]);

  if (!assistant) {
    return (
      <div className="assistant-detail empty">
        <p>Select an assistant or create a new one</p>
      </div>
    );
  }

  const handleNodesChange = (updatedNodes: any[]) => {
    setNodes(updatedNodes);
  };

  const handleConnectionsChange = (updatedConnections: any[]) => {
    setConnections(updatedConnections);
  };

  return (
    <div className="assistant-detail">
      <div className="assistant-detail-header">
        <h2>{assistant.name}</h2>
      </div>
      <div className="assistant-detail-content">
        <div style={{ width: '100%', height: 'calc(100vh - 200px)' }}>
          <WorkflowDesigner
            nodes={nodes}
            connections={connections}
            onNodesChange={handleNodesChange}
            onConnectionsChange={handleConnectionsChange}
          />
        </div>
      </div>
    </div>
  );
};
