import React, { useEffect, useRef, useState } from 'react';
import { WorkflowToolbar } from './WorkflowToolbar';
import { generateId } from '../utils/id';

interface Node {
  id: string;
  type: string;
  position: { x: number; y: number };
  title: string;
}

interface Connection {
  from: string;
  to: string;
}

interface WorkflowDesignerProps {
  nodes: Node[];
  connections: Connection[];
  onNodesChange?: (nodes: Node[]) => void;
  onConnectionsChange?: (connections: Connection[]) => void;
}

export const WorkflowDesigner: React.FC<WorkflowDesignerProps> = ({
  nodes: initialNodes = [],
  connections: initialConnections = [],
  onNodesChange,
  onConnectionsChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [connections, setConnections] = useState<Connection[]>(initialConnections);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [lastAddedPosition, setLastAddedPosition] = useState<{ x: number; y: number } | null>(null);
  const [lastAction, setLastAction] = useState<'add' | 'other'>('other');

  const NODE_WIDTH = 200;
  const NODE_HEIGHT = 60;
  const CONNECTOR_RADIUS = 6;
  const NODE_OFFSET = { x: 30, y: 30 }; // Offset for consecutive adds

  const getNewNodePosition = () => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    if (lastAction === 'add' && lastAddedPosition) {
      // Calculate new position based on last added node
      const newX = lastAddedPosition.x + NODE_OFFSET.x;
      const newY = lastAddedPosition.y + NODE_OFFSET.y;

      // Check if we're too close to the edge
      const maxX = canvas.width - NODE_WIDTH - 20;
      const maxY = canvas.height - NODE_HEIGHT - 20;

      // If too close to edge, reset to left side with increased Y
      if (newX > maxX) {
        return {
          x: 50,
          y: Math.min(lastAddedPosition.y + NODE_HEIGHT + 20, maxY)
        };
      }

      return { x: newX, y: newY };
    }

    // Default center position
    return {
      x: (canvas.width - NODE_WIDTH) / 2,
      y: (canvas.height - NODE_HEIGHT) / 2
    };
  };

  const handleAddNode = () => {
    const position = getNewNodePosition();
    
    const newNode = {
      id: generateId(),
      type: 'process',
      position,
      title: 'New Node'
    };

    const updatedNodes = [...nodes, newNode];
    setNodes(updatedNodes);
    setLastAddedPosition(position);
    setLastAction('add');
    
    if (onNodesChange) {
      onNodesChange(updatedNodes);
    }
  };

  const drawConnector = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    isConnected: boolean
  ) => {
    ctx.beginPath();
    ctx.arc(x, y, CONNECTOR_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = isConnected ? '#4CAF50' : '#666';
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const drawCurvedConnection = (
    ctx: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    endX: number,
    endY: number
  ) => {
    const controlPointOffset = Math.min(150, Math.abs(endX - startX) / 2);
    
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.bezierCurveTo(
      startX + controlPointOffset,
      startY,
      endX - controlPointOffset,
      endY,
      endX,
      endY
    );
    
    // Create gradient for the connection line
    const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
    gradient.addColorStop(0, '#4CAF50');
    gradient.addColorStop(1, '#4CAF50');
    
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw connections
    connections.forEach(connection => {
      const fromNode = nodes.find(n => n.id === connection.from);
      const toNode = nodes.find(n => n.id === connection.to);
      if (fromNode && toNode) {
        const startX = fromNode.position.x + NODE_WIDTH;
        const startY = fromNode.position.y + NODE_HEIGHT / 2;
        const endX = toNode.position.x;
        const endY = toNode.position.y + NODE_HEIGHT / 2;
        
        drawCurvedConnection(ctx, startX, startY, endX, endY);
      }
    });

    // Draw nodes
    nodes.forEach(node => {
      // Node background with gradient
      const gradient = ctx.createLinearGradient(
        node.position.x,
        node.position.y,
        node.position.x,
        node.position.y + NODE_HEIGHT
      );
      gradient.addColorStop(0, '#3a3a3a');
      gradient.addColorStop(1, '#2e2e2e');
      
      ctx.fillStyle = gradient;
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(node.position.x, node.position.y, NODE_WIDTH, NODE_HEIGHT, 5);
      ctx.fill();
      ctx.stroke();

      // Node title
      ctx.fillStyle = '#fff';
      ctx.font = '14px Arial';
      ctx.fillText(node.title, node.position.x + 10, node.position.y + 25);

      // Node type
      ctx.fillStyle = '#999';
      ctx.font = '12px Arial';
      ctx.fillText(node.type, node.position.x + 10, node.position.y + 45);

      // Input connector (left side)
      const hasInputConnection = connections.some(conn => conn.to === node.id);
      drawConnector(
        ctx,
        node.position.x,
        node.position.y + NODE_HEIGHT / 2,
        hasInputConnection
      );

      // Output connector (right side)
      const hasOutputConnection = connections.some(conn => conn.from === node.id);
      drawConnector(
        ctx,
        node.position.x + NODE_WIDTH,
        node.position.y + NODE_HEIGHT / 2,
        hasOutputConnection
      );
    });
  }, [nodes, connections]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicked on a node
    const clickedNode = nodes.find(node => 
      x >= node.position.x && 
      x <= node.position.x + NODE_WIDTH &&
      y >= node.position.y && 
      y <= node.position.y + NODE_HEIGHT
    );

    if (clickedNode) {
      setIsDragging(true);
      setDraggedNode(clickedNode.id);
      setOffset({
        x: x - clickedNode.position.x,
        y: y - clickedNode.position.y
      });
      setLastAction('other'); // Reset last action when dragging
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !draggedNode) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - offset.x;
    const y = e.clientY - rect.top - offset.y;

    setNodes(nodes.map(node => 
      node.id === draggedNode 
        ? { ...node, position: { x, y } }
        : node
    ));
  };

  const handleMouseUp = () => {
    if (isDragging && onNodesChange) {
      onNodesChange(nodes);
    }
    setIsDragging(false);
    setDraggedNode(null);
  };

  return (
    <div className="workflow-designer">
      <WorkflowToolbar onAddNode={handleAddNode} />
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ width: '100%', height: 'calc(100% - 40px)' }}
      />
    </div>
  );
};
