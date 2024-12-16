import { useState, useEffect } from "react";
import { WorkflowList } from "../components/WorkflowList";
import { WorkflowDetail } from "../components/WorkflowDetail";
import { Workflow } from "../types";
import { updateWorkflow, getAllWorkflows } from "../utils/db";
import "../styles/WorkflowPage.css";

const EMPTY_WORKFLOW = {
  nodes: [],
  connections: []
};

export function WorkflowPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [activeWorkflow, setActiveWorkflow] = useState<Workflow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load workflows when component mounts
  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const loadedWorkflows = await getAllWorkflows();
      const filteredWorkflows = loadedWorkflows.filter(w => !w.deleted);
      setWorkflows(filteredWorkflows);
      
      // Set active workflow to the first one if any exist and no active workflow is selected
      if (filteredWorkflows.length > 0 && !activeWorkflow) {
        setActiveWorkflow(filteredWorkflows[0]);
      }
    } catch (error) {
      console.error('Failed to load workflows:', error);
      setError('Failed to load workflows. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const createNewWorkflow = async () => {
    try {
      setError(null);
      const newWorkflow: Workflow = {
        id: Date.now(),
        name: 'New Workflow',
        createdTime: Date.now(),
        nodes: EMPTY_WORKFLOW.nodes,
        connections: EMPTY_WORKFLOW.connections
      };

      // Save to IndexedDB first
      await updateWorkflow(newWorkflow);

      // Then update state
      setWorkflows(prev => [...prev, newWorkflow]);
      setActiveWorkflow(newWorkflow);
    } catch (error) {
      console.error('Failed to create new workflow:', error);
      setError('Failed to create new workflow. Please try again.');
    }
  };

  const deleteWorkflow = async (workflowId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setError(null);
      const workflowToDelete = workflows.find(w => w.id === workflowId);
      if (workflowToDelete) {
        const updatedWorkflow = { ...workflowToDelete, deleted: true };
        
        // Save to IndexedDB first
        await updateWorkflow(updatedWorkflow);
        
        // Then update state
        const updatedWorkflows = workflows.filter(w => w.id !== workflowId);
        setWorkflows(updatedWorkflows);
        
        if (activeWorkflow?.id === workflowId) {
          setActiveWorkflow(updatedWorkflows.length > 0 ? updatedWorkflows[0] : null);
        }
      }
    } catch (error) {
      console.error('Failed to delete workflow:', error);
      setError('Failed to delete workflow. Please try again.');
    }
  };

  const handleWorkflowClick = async (workflow: Workflow) => {
    try {
      setError(null);
      // Fetch the latest version of the workflow from IndexedDB
      const loadedWorkflows = await getAllWorkflows();
      const selectedWorkflow = loadedWorkflows.find(w => w.id === workflow.id);
      
      if (selectedWorkflow && !selectedWorkflow.deleted) {
        setActiveWorkflow(selectedWorkflow);
      } else {
        console.error('Selected workflow not found or deleted');
        // Refresh the workflows list to ensure UI is in sync with DB
        loadWorkflows();
      }
    } catch (error) {
      console.error('Failed to load workflow details:', error);
      setError('Failed to load workflow details. Please try again.');
    }
  };

  const handleWorkflowUpdate = async (updatedWorkflow: Workflow) => {
    try {
      setError(null);
      // Save to IndexedDB first
      await updateWorkflow(updatedWorkflow);
      
      // Then update state
      setWorkflows(prev => 
        prev.map(w => w.id === updatedWorkflow.id ? updatedWorkflow : w)
      );
      setActiveWorkflow(updatedWorkflow);
    } catch (error) {
      console.error('Failed to update workflow:', error);
      setError('Failed to save changes. Please try again.');
    }
  };

  if (isLoading) {
    return <div className="workflow-page"><div className="loading">Loading...</div></div>;
  }

  return (
    <div className="workflow-page">
      {error && <div className="error-message">{error}</div>}
      <div className="container">
        <WorkflowList
          workflows={workflows}
          activeWorkflow={activeWorkflow}
          onWorkflowClick={handleWorkflowClick}
          onDeleteWorkflow={deleteWorkflow}
          onNewWorkflow={createNewWorkflow}
        />
        <WorkflowDetail 
          workflow={activeWorkflow} 
          onWorkflowUpdate={handleWorkflowUpdate}
        />
      </div>
    </div>
  );
}
