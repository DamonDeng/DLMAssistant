import React from 'react';
import { Workflow } from '../types';
import { IconButton } from './button';
import closeIcon from '../assets/icons/close.svg';

interface WorkflowListProps {
  workflows: Workflow[];
  activeWorkflow: Workflow | null;
  onWorkflowClick: (workflow: Workflow) => void;
  onDeleteWorkflow: (id: number, e: React.MouseEvent) => void;
  onNewWorkflow: () => void;
}

export const WorkflowList: React.FC<WorkflowListProps> = ({
  workflows,
  activeWorkflow,
  onWorkflowClick,
  onDeleteWorkflow,
  onNewWorkflow,
}) => {
  const visibleWorkflows = [...workflows].filter(w => !w.deleted).reverse();

  return (
    <div className="workflow-list">
      <div className="list-header">
        <h2>Workflows</h2>
      </div>
      <div className="list-content">
        {visibleWorkflows.map((workflow) => (
          <div
            key={workflow.id}
            className={`workflow-item ${activeWorkflow?.id === workflow.id ? 'active' : ''}`}
            onClick={() => onWorkflowClick(workflow)}
          >
            <div className="workflow-item-content">
              <div className="workflow-item-name">{workflow.name}</div>
              <div className="workflow-item-date">
                {new Date(workflow.createdTime).toLocaleDateString()}
              </div>
            </div>
            <IconButton
              icon={<img src={closeIcon} alt="Delete" className="icon" />}
              onClick={(e) => onDeleteWorkflow(workflow.id, e)}
              title="Delete workflow"
              useDefaultStyles={false}
              className="delete-button"
            />
          </div>
        ))}
        {visibleWorkflows.length === 0 && (
          <div className="empty-state">
            <p>No workflows yet. Create one to get started.</p>
          </div>
        )}
      </div>
      <div className="new-workflow-button-container">
        <button className="new-workflow-button" onClick={onNewWorkflow}>New Workflow</button>
      </div>
    </div>
  );
};
