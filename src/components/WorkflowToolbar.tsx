import React from 'react';

interface WorkflowToolbarProps {
  onAddNode: () => void;
}

export const WorkflowToolbar: React.FC<WorkflowToolbarProps> = ({ onAddNode }) => {
  return (
    <div className="workflow-toolbar">
      <button className="workflow-toolbar-button" onClick={onAddNode}>
        <svg 
          width="16" 
          height="16" 
          viewBox="0 0 16 16" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M8 1V15M1 8H15" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round"
          />
        </svg>
        <span>Add</span>
      </button>
    </div>
  );
};
