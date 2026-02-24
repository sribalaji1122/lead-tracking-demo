import { useCallback, useMemo } from 'react';
import { ReactFlow, Controls, Background, ConnectionLineType, Node, Edge, Position, MarkerType } from '@xyflow/react';
import { useNodesState, useEdgesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { nodeTypes } from './NodeTypes';
import { motion } from 'framer-motion';

const LANE_WIDTH = 300;
const NODE_HEIGHT = 80;
const NODE_WIDTH = 200;
const VERTICAL_SPACING = 100;
const TOP_OFFSET = 100;

// Helper to layout nodes in structured vertical stacks inside lanes
const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  const lanes = ['collect', 'process', 'engage', 'data'];
  const laneMap: Record<string, Node[]> = {
    collect: [],
    process: [],
    engage: [],
    data: []
  };

  // Group nodes into lanes
  nodes.forEach(node => {
    let lane = (node.data?.lane as string)?.toLowerCase();
    const type = node.type as string;
    const label = (node.data?.label as string)?.toLowerCase() || "";

    // Normalize lane names
    if (lane === 'activate') lane = 'engage';
    if (lane === 'service') lane = 'data';
    if (lane === 'data & bi') lane = 'data';

    // Inference if lane is missing
    if (!lane || !lanes.includes(lane)) {
      if (type === 'sourceNode' || ["website", "mobile app", "social", "pos", "transactions", "iot"].some(s => label.includes(s))) lane = 'collect';
      else if (type === 'channelNode' || ["email", "sms", "push", "whatsapp", "ads", "call center"].some(s => label.includes(s))) lane = 'engage';
      else if (type === 'dataNode' || ["lake", "warehouse", "bi", "reporting", "data services", "ai", "ml"].some(s => label.includes(s))) lane = 'data';
      else lane = 'process';
    }

    if (laneMap[lane]) {
      laneMap[lane].push(node);
    } else {
      laneMap['process'].push(node);
    }
  });

  const layoutedNodes = lanes.flatMap((lane, laneIdx) => {
    const laneNodes = laneMap[lane];
    return laneNodes.map((node, nodeIdx) => {
      const x = laneIdx * LANE_WIDTH + (LANE_WIDTH - NODE_WIDTH) / 2;
      const y = TOP_OFFSET + nodeIdx * VERTICAL_SPACING;

      return {
        ...node,
        targetPosition: Position.Left,
        sourcePosition: Position.Right,
        position: { x, y },
      };
    });
  });

  return { nodes: layoutedNodes, edges };
};

interface ArchitectureDiagramProps {
  nodes: any[];
  edges: any[];
}

export function ArchitectureDiagram({ nodes: initialNodes, edges: initialEdges }: ArchitectureDiagramProps) {
  // Transform API nodes to ReactFlow nodes
  const flowNodes = useMemo(() => (initialNodes ?? []).map((n: any) => ({
    id: n.id,
    type: n.type,
    data: { ...n },
    position: { x: 0, y: 0 }
  })), [initialNodes]);

  const flowEdges = useMemo(() => {
    const edges = [...(initialEdges ?? [])];
    return edges.map((e: any) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: 'smoothstep',
      animated: e.type === 'dotted' || e.animated === true,
      style: { 
        strokeDasharray: e.type === 'dashed' ? '5,5' : e.type === 'dotted' ? '2,2' : undefined,
        stroke: '#94a3b8',
        strokeWidth: 2
      },
      label: e.label,
      markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' }
    }));
  }, [initialEdges]);

  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(
    () => getLayoutedElements(flowNodes as Node[], flowEdges as Edge[]),
    [flowNodes, flowEdges]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  // Sync state when props change
  useMemo(() => {
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [layoutedNodes, layoutedEdges, setNodes, setEdges]);

  return (
    <div className="w-full h-[600px] bg-slate-50 rounded-2xl border border-border overflow-hidden relative group">
      {/* Hardcoded Lane Containers */}
      <div className="absolute inset-0 pointer-events-none flex">
        <div className="w-1/4 border-r border-slate-200 bg-slate-50/50 flex flex-col">
          <div className="h-10 flex items-center justify-center font-display font-bold text-slate-400 uppercase tracking-widest text-[10px] bg-slate-100/50 border-b border-slate-200">COLLECT</div>
          <div className="flex-1" />
        </div>
        <div className="w-1/4 border-r border-slate-200 bg-white flex flex-col">
          <div className="h-10 flex items-center justify-center font-display font-bold text-slate-400 uppercase tracking-widest text-[10px] bg-slate-50 border-b border-slate-200">PROCESS</div>
          <div className="flex-1" />
        </div>
        <div className="w-1/4 border-r border-slate-200 bg-slate-50/50 flex flex-col">
          <div className="h-10 flex items-center justify-center font-display font-bold text-slate-400 uppercase tracking-widest text-[10px] bg-slate-100/50 border-b border-slate-200">ENGAGE</div>
          <div className="flex-1" />
        </div>
        <div className="w-1/4 bg-white flex flex-col">
          <div className="h-10 flex items-center justify-center font-display font-bold text-slate-400 uppercase tracking-widest text-[10px] bg-slate-50 border-b border-slate-200">DATA & BI</div>
          <div className="flex-1" />
        </div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
        className="bg-transparent"
      >
        <Background color="#cbd5e1" gap={20} size={1} className="opacity-20" />
        <Controls className="!bg-white !border-border !shadow-sm !rounded-lg" />
      </ReactFlow>

      {/* Enterprise Legend - Always Visible */}
      <div className="absolute bottom-4 left-4 p-3 bg-white/90 backdrop-blur border border-border rounded-lg shadow-sm text-[10px] space-y-1.5 z-10 min-w-[140px]">
        <div className="font-bold text-slate-500 uppercase tracking-wider mb-1">Architecture Legend</div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-slate-400" /> 
          <span className="text-slate-600">Data Flow (Solid)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 border-t-2 border-dashed border-slate-400" /> 
          <span className="text-slate-600">Sync / Audience (Dashed)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 border-t-2 border-dotted border-slate-400" /> 
          <span className="text-slate-600">Real-time Event (Dotted)</span>
        </div>
      </div>
    </div>
  );
}
