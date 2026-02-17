import { useCallback, useMemo } from 'react';
import { ReactFlow, Controls, Background, useNodesState, useEdgesState, MiniMap, Node, Edge, ConnectionLineType } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { nodeTypes } from './NodeTypes';
import dagre from 'dagre';
import { motion } from 'framer-motion';

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 200;
const nodeHeight = 80;

// Helper to layout nodes automatically
const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'LR') => {
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    // Simple lane logic: override X based on lane if available
    // Collect (x:0-300), Process (x:400-700), Engage (x:800-1100)
    let finalX = nodeWithPosition.x - nodeWidth / 2;
    
    if (node.data.lane === 'collect') finalX = 100;
    if (node.data.lane === 'process') finalX = 500;
    if (node.data.lane === 'engage') finalX = 900;
    if (node.data.lane === 'data') {
       // Data layer usually sits below
       finalX = nodeWithPosition.x; 
    }

    return {
      ...node,
      targetPosition: isHorizontal ? 'left' : 'top',
      sourcePosition: isHorizontal ? 'right' : 'bottom',
      position: {
        x: finalX,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
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
  const flowNodes = useMemo(() => initialNodes.map(n => ({
    id: n.id,
    type: n.type,
    data: { label: n.label, tech: n.tech, lane: n.lane, ...n },
    position: { x: 0, y: 0 } // Layout will fix this
  })), [initialNodes]);

  const flowEdges = useMemo(() => initialEdges.map(e => ({
    id: e.id,
    source: e.source,
    target: e.target,
    type: 'smoothstep',
    animated: e.type === 'dotted' || e.type === 'dashed',
    style: { 
      strokeDasharray: e.type === 'dotted' ? '5,5' : (e.type === 'dashed' ? '10,5' : undefined),
      stroke: '#94a3b8',
      strokeWidth: 2
    },
    label: e.label
  })), [initialEdges]);

  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(
    () => getLayoutedElements(flowNodes, flowEdges),
    [flowNodes, flowEdges]
  );

  const [nodes, , onNodesChange] = useNodesState(layoutedNodes);
  const [edges, , onEdgesChange] = useEdgesState(layoutedEdges);

  return (
    <div className="w-full h-[600px] bg-slate-50 rounded-2xl border border-border overflow-hidden relative group">
      {/* Lane Background Indicators */}
      <div className="absolute inset-0 pointer-events-none flex opacity-5">
        <div className="flex-1 border-r border-slate-900 bg-blue-100" />
        <div className="flex-1 border-r border-slate-900 bg-purple-100" />
        <div className="flex-1 bg-green-100" />
      </div>
      
      {/* Lane Labels */}
      <div className="absolute top-4 inset-x-0 flex justify-between px-20 pointer-events-none z-10 font-display font-bold text-slate-400 uppercase tracking-widest text-sm">
        <div className="w-[300px] text-center">Collect & Ingest</div>
        <div className="w-[300px] text-center">Process & Unify</div>
        <div className="w-[300px] text-center">Engage & Activate</div>
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
