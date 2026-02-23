import { useCallback, useMemo } from 'react';
import { ReactFlow, Controls, Background, MiniMap, ConnectionLineType, Node, Edge, Position, MarkerType } from '@xyflow/react';
import { useNodesState, useEdgesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { nodeTypes } from './NodeTypes';
import dagre from 'dagre';
import { motion } from 'framer-motion';

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 200;
const nodeHeight = 80;

// Helper to layout nodes automatically
const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  const isHorizontal = true;
  dagreGraph.setGraph({ rankdir: 'LR' });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    
    // 1. Force lane grouping strictly
    let lane = (node.data?.lane as string)?.toLowerCase();
    const type = node.type as string;

    // 2. Infer lane if undefined
    if (!lane) {
      if (type === 'sourceNode') lane = 'collect';
      else if (type === 'channelNode') lane = 'engage';
      else if (type === 'dataNode') lane = 'data';
      else if (type === 'systemNode') lane = 'process';
      else lane = 'process';
    }

    // 5. Layout positions
    let finalX = 500; // default process
    let finalY = nodeWithPosition.y - nodeHeight / 2;

    if (lane === 'collect') finalX = 100;
    else if (lane === 'process') finalX = 500;
    else if (lane === 'engage' || lane === 'activate') finalX = 900;
    else if (lane === 'data' || lane === 'service') {
      finalX = nodeWithPosition.x;
      finalY = 500 + (nodeWithPosition.y % 100);
    }

    return {
      ...node,
      targetPosition: Position.Left,
      sourcePosition: Position.Right,
      position: { x: finalX, y: finalY },
    };
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
    data: { label: n.label, tech: n.tech, lane: n.lane, ...n },
    position: { x: 0, y: 0 }
  })), [initialNodes]);

  const flowEdges = useMemo(() => {
    const edges = [...(initialEdges ?? [])];
    
    // 3. Automatically build flow
    const collectNodes = (initialNodes ?? []).filter((n: any) => n.lane === 'collect' || n.type === 'sourceNode');
    const processNodes = (initialNodes ?? []).filter((n: any) => !n.lane || n.lane === 'process' || n.type === 'systemNode');
    const engageNodes = (initialNodes ?? []).filter((n: any) => n.lane === 'engage' || n.lane === 'activate' || n.type === 'channelNode');
    const dataNodes = (initialNodes ?? []).filter((n: any) => n.lane === 'data' || n.lane === 'service' || n.type === 'dataNode');

    if (processNodes.length > 0) {
      collectNodes.forEach((c: any) => {
        if (!edges.some((e: any) => e.source === c.id)) {
          edges.push({ id: `auto-${c.id}-${processNodes[0].id}`, source: c.id, target: processNodes[0].id, type: 'smoothstep' });
        }
      });
      
      if (engageNodes.length > 0) {
        processNodes.forEach((p: any) => {
          if (!edges.some((e: any) => e.source === p.id)) {
            edges.push({ id: `auto-${p.id}-${engageNodes[0].id}`, source: p.id, target: engageNodes[0].id, type: 'smoothstep' });
          }
        });
      }

      if (dataNodes.length > 0) {
        processNodes.forEach((p: any) => {
          if (!edges.some((e: any) => e.source === p.id && dataNodes.some((d: any) => d.id === e.target))) {
            edges.push({ id: `auto-${p.id}-${dataNodes[0].id}`, source: p.id, target: dataNodes[0].id, type: 'smoothstep' });
          }
        });
      }
    }

    return edges.map((e: any) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: 'smoothstep',
      animated: e.type === 'dotted' || e.animated === true,
      style: { 
        strokeDasharray: e.type === 'dashed' ? '5,5' : undefined,
        stroke: '#94a3b8',
        strokeWidth: 2
      },
      label: e.label,
      markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' }
    }));
  }, [initialNodes, initialEdges]);

  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(
    () => getLayoutedElements(flowNodes, flowEdges as Edge[]),
    [flowNodes, flowEdges]
  );

  const [nodes, , onNodesChange] = useNodesState(layoutedNodes);
  const [edges, , onEdgesChange] = useEdgesState(layoutedEdges);

  return (
    <div className="w-full h-[600px] bg-slate-50 rounded-2xl border border-border overflow-hidden relative group">
      {/* 4. Always render lane headers visibly */}
      <div className="absolute top-4 inset-x-0 flex justify-between px-20 pointer-events-none z-10 font-display font-bold text-slate-400 uppercase tracking-widest text-sm">
        <div className="w-[300px] text-center">COLLECT</div>
        <div className="w-[300px] text-center">PROCESS</div>
        <div className="w-[300px] text-center">ACTIVATE</div>
      </div>
      
      <div className="absolute bottom-4 inset-x-0 text-center pointer-events-none z-10 font-display font-bold text-slate-400 uppercase tracking-widest text-sm opacity-50">
        DATA & SERVICE
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
        className="bg-slate-50/50"
      >
        <Background color="#64748b" gap={24} size={1} className="opacity-10" />
        <Controls className="!bg-white !border-border !shadow-md !rounded-lg" />
        <MiniMap 
          className="!bg-white !border-border !shadow-lg !rounded-lg"
          nodeColor={(n) => {
            if (n.type === 'dataNode') return '#bfdbfe';
            if (n.type === 'channelNode') return '#fed7aa';
            return '#e2e8f0';
          }}
        />
      </ReactFlow>

      {/* Legend */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute bottom-4 left-4 p-4 bg-white/90 backdrop-blur border border-border rounded-xl shadow-lg text-xs space-y-2 z-10"
      >
        <div className="font-bold text-muted-foreground mb-1 uppercase tracking-wider text-[10px]">Legend</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-white border-2 border-primary/20" /> System</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-50 border-2 border-blue-200" /> Data Store</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-50 border-2 border-orange-200" /> Channel</div>
        <div className="w-full h-px bg-border my-2" />
        <div className="flex items-center gap-2"><div className="w-8 h-0.5 bg-slate-400" /> Data Flow</div>
        <div className="flex items-center gap-2"><div className="w-8 h-0.5 border-t-2 border-dashed border-slate-400" /> Segment Sync</div>
        <div className="flex items-center gap-2"><div className="w-8 h-0.5 border-t-2 border-dotted border-slate-400" /> Real-time</div>
      </motion.div>
    </div>
  );
}
