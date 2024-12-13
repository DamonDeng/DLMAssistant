import React from 'react';
import { Assistant } from '../types';
import { IconButton } from './button';
import closeIcon from '../assets/icons/close.svg';

interface AssistantListProps {
  assistants: Assistant[];
  activeAssistant: Assistant | null;
  onAssistantClick: (assistant: Assistant) => void;
  onDeleteAssistant: (id: number, e: React.MouseEvent) => void;
  onNewAssistant: () => void;
}

export const AssistantList: React.FC<AssistantListProps> = ({
  assistants,
  activeAssistant,
  onAssistantClick,
  onDeleteAssistant,
  onNewAssistant,
}) => {
  const visibleAssistants = [...assistants].filter(a => !a.deleted).reverse();

  return (
    <div className="sidebar">
      <div className="assistant-list">
        {visibleAssistants.map((assistant) => (
          <div
            key={assistant.id}
            className={`assistant-item ${activeAssistant?.id === assistant.id ? 'active' : ''}`}
            onClick={() => onAssistantClick(assistant)}
          >
            <div className="assistant-item-content">
              <div className="assistant-item-name">{assistant.name}</div>
              <div className="assistant-item-date">
                {new Date(assistant.createdTime).toLocaleDateString()}
              </div>
            </div>
            <IconButton
              icon={<img src={closeIcon} alt="Delete" className="icon" />}
              onClick={(e) => onDeleteAssistant(assistant.id, e)}
              title="Delete assistant"
              useDefaultStyles={false}
              className="delete-button"
            />
          </div>
        ))}
      </div>
      <div className="button-container">
        <button className="new-assistant-button" onClick={onNewAssistant}>
          New Assistant
        </button>
      </div>
    </div>
  );
};
