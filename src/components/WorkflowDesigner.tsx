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

interface Point {
  x: number;
  y: number;
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
  
  // Connection dragging state
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState<{ nodeId: string, isInput: boolean } | null>(null);
  const [connectionEnd, setConnectionEnd] = useState<Point | null>(null);

  const NODE_WIDTH = 200;
  const NODE_HEIGHT = 60;
  const CONNECTOR_RADIUS = 6;
  const NODE_OFFSET = { x: 30, y: 30 };

  const getNewNodePosition = () => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    if (lastAction === 'add' && lastAddedPosition) {
      const newX = lastAddedPosition.x + NODE_OFFSET.x;
      const newY = lastAddedPosition.y + NODE_OFFSET.y;

      const maxX = canvas.width - NODE_WIDTH - 20;
      const maxY = canvas.height - NODE_HEIGHT - 20;

      if (newX > maxX) {
        return {
          x: 50,
          y: Math.min(lastAddedPosition.y + NODE_HEIGHT + 20, maxY)
        };
      }

      return { x: newX, y: newY };
    }

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

  const isPointNearConnector = (
    point: Point,
    nodePosition: Point,
    isInput: boolean
  ): boolean => {
    const connectorX = isInput ? nodePosition.x : nodePosition.x + NODE_WIDTH;
    const connectorY = nodePosition.y + NODE_HEIGHT / 2;
    const dx = point.x - connectorX;
    const dy = point.y - connectorY;
    return Math.sqrt(dx * dx + dy * dy) <= CONNECTOR_RADIUS * 2;
  };

  const findConnectorUnderPoint = (point: Point): { nodeId: string, isInput: boolean } | null => {
    for (const node of nodes) {
      // Check input connector
      if (isPointNearConnector(point, node.position, true)) {
        return { nodeId: node.id, isInput: true };
      }
      // Check output connector
      if (isPointNearConnector(point, node.position, false)) {
        return { nodeId: node.id, isInput: false };
      }
    }
    return null;
  };

  const drawConnector = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    isConnected: boolean,
    isHighlighted: boolean = false
  ) => {
    ctx.beginPath();
    ctx.arc(x, y, CONNECTOR_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = isHighlighted ? '#8AF' : (isConnected ? '#4CAF50' : '#666');
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
    endY: number,
    isTemp: boolean = false
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
    
    if (isTemp) {
      ctx.strokeStyle = '#8AF';
      ctx.setLineDash([5, 5]);
    } else {
      const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
      gradient.addColorStop(0, '#4CAF50');
      gradient.addColorStop(1, '#4CAF50');
      ctx.strokeStyle = gradient;
      ctx.setLineDash([]);
    }
    
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
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

    // Draw temporary connection if dragging
    if (isConnecting && connectionStart && connectionEnd) {
      const startNode = nodes.find(n => n.id === connectionStart.nodeId);
      if (startNode) {
        const startX = connectionStart.isInput ? 
          startNode.position.x : 
          startNode.position.x + NODE_WIDTH;
        const startY = startNode.position.y + NODE_HEIGHT / 2;
        
        drawCurvedConnection(
          ctx,
          startX,
          startY,
          connectionEnd.x,
          connectionEnd.y,
          true
        );
      }
    }

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

      // Input connector
      const hasInputConnection = connections.some(conn => conn.to === node.id);
      const isInputHighlighted = isConnecting && 
        connectionStart && 
        !connectionStart.isInput && 
        connectionEnd && 
        findConnectorUnderPoint(connectionEnd)?.nodeId === node.id;
      
      drawConnector(
        ctx,
        node.position.x,
        node.position.y + NODE_HEIGHT / 2,
        hasInputConnection,
        isInputHighlighted || false
      );

      // Output connector
      const hasOutputConnection = connections.some(conn => conn.from === node.id);
      const isOutputHighlighted = isConnecting && 
        connectionStart && 
        connectionStart.isInput && 
        connectionEnd && 
        findConnectorUnderPoint(connectionEnd)?.nodeId === node.id;
      
      drawConnector(
        ctx,
        node.position.x + NODE_WIDTH,
        node.position.y + NODE_HEIGHT / 2,
        hasOutputConnection,
        isOutputHighlighted || false
      );
    });
  }, [nodes, connections, isConnecting, connectionStart, connectionEnd]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const connector = findConnectorUnderPoint({ x, y });
    if (connector) {
      setIsConnecting(true);
      setConnectionStart(connector);
      setConnectionEnd({ x, y });
      return;
    }

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
      setLastAction('other');
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isConnecting) {
      setConnectionEnd({ x, y });
      return;
    }

    if (isDragging && draggedNode) {
      const newX = x - offset.x;
      const newY = y - offset.y;

      setNodes(nodes.map(node => 
        node.id === draggedNode 
          ? { ...node, position: { x: newX, y: newY } }
          : node
      ));
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isConnecting && connectionStart) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const connector = findConnectorUnderPoint({ x, y });
      
      if (connector && connector.nodeId !== connectionStart.nodeId) {
        // Ensure we're connecting from output to input
        const from = connectionStart.isInput ? connector.nodeId : connectionStart.nodeId;
        const to = connectionStart.isInput ? connectionStart.nodeId : connector.nodeId;

        // Check if connection already exists
        const connectionExists = connections.some(
          conn => conn.from === from && conn.to === to
        );

        if (!connectionExists) {
          const updatedConnections = [...connections, { from, to }];
          setConnections(updatedConnections);
          if (onConnectionsChange) {
            onConnectionsChange(updatedConnections);
          }
        }
      }
    }

    if (isDragging && onNodesChange) {
      onNodesChange(nodes);
    }

    setIsConnecting(false);
    setConnectionStart(null);
    setConnectionEnd(null);
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
