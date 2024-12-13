import React from 'react';
import { Assistant } from '../types';

interface AssistantDetailProps {
  assistant: Assistant | null;
}

export const AssistantDetail: React.FC<AssistantDetailProps> = ({
  assistant
}) => {
  if (!assistant) {
    return (
      <div className="assistant-detail empty">
        <p>Select an assistant or create a new one</p>
      </div>
    );
  }

  return (
    <div className="assistant-detail">
      <div className="assistant-detail-header">
        <h2>{assistant.name}</h2>
      </div>
      <div className="assistant-detail-content">
        <p>Placeholder for Assistant detail</p>
      </div>
    </div>
  );
};
