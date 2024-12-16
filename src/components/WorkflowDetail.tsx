import React, { useState } from 'react';
import { Workflow } from '../types';
import { WorkflowDesigner } from './WorkflowDesigner';
import { updateWorkflow } from '../utils/db';
import '../styles/WorkflowDesigner.css';

interface WorkflowDetailProps {
  workflow: Workflow | null;
  onWorkflowUpdate: (updatedWorkflow: Workflow) => void;
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

export const WorkflowDetail: React.FC<WorkflowDetailProps> = ({
  workflow,
  onWorkflowUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');

  if (!workflow) {
    return (
      <div className="workflow-detail empty">
        <p>Select a workflow or create a new one</p>
      </div>
    );
  }

  // Use workflow's nodes and connections if they exist, otherwise use default
  const nodes = workflow.nodes || DEFAULT_WORKFLOW.nodes;
  const connections = workflow.connections || DEFAULT_WORKFLOW.connections;

  const handleNodesChange = async (updatedNodes: any[]) => {
    const updatedWorkflow = {
      ...workflow,
      nodes: updatedNodes
    };
    try {
      await updateWorkflow(updatedWorkflow);
      onWorkflowUpdate(updatedWorkflow);
    } catch (error) {
      console.error('Failed to update workflow nodes:', error);
    }
  };

  const handleConnectionsChange = async (updatedConnections: any[]) => {
    const updatedWorkflow = {
      ...workflow,
      connections: updatedConnections
    };
    try {
      await updateWorkflow(updatedWorkflow);
      onWorkflowUpdate(updatedWorkflow);
    } catch (error) {
      console.error('Failed to update workflow connections:', error);
    }
  };

  const handleNameEdit = () => {
    setEditName(workflow.name);
    setIsEditing(true);
  };

  const handleNameSave = async () => {
    if (editName.trim() !== workflow.name) {
      const updatedWorkflow = {
        ...workflow,
        name: editName.trim()
      };
      try {
        await updateWorkflow(updatedWorkflow);
        onWorkflowUpdate(updatedWorkflow);
      } catch (error) {
        console.error('Failed to update workflow name:', error);
      }
    }
    setIsEditing(false);
  };

  return (
    <div className="workflow-detail">
      <div className="workflow-detail-header">
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
          <h2 onClick={handleNameEdit}>{workflow.name}</h2>
        )}
      </div>
      <div className="workflow-detail-content">
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
