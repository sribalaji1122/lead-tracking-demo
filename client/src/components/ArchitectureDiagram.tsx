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

// Helper to layout nodes automatically based on enterprise lanes
const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  const layoutedNodes = nodes.map((node) => {
    let finalX = 500; // default process
    let finalY = 100;

    const lane = (node.data?.lane as string)?.toLowerCase();
    const type = node.type as string;
    const label = (node.data?.label as string)?.toLowerCase() || "";

    // 1. Force lane grouping strictly
    let effectiveLane = lane;
    if (!effectiveLane) {
      if (type === 'sourceNode' || ["website", "mobile app", "social", "pos", "transactions", "iot"].some(s => label.includes(s))) effectiveLane = 'collect';
      else if (type === 'channelNode' || ["email", "sms", "push", "whatsapp", "ads", "call center"].some(s => label.includes(s))) effectiveLane = 'activate';
      else if (type === 'dataNode' || ["lake", "warehouse", "bi", "reporting", "data services", "ai", "ml"].some(s => label.includes(s))) effectiveLane = 'data';
      else effectiveLane = 'process';
    }

    // 5. Layout positions according to enterprise structure
    if (effectiveLane === 'collect') {
      finalX = 150;
      const collectNodes = nodes.filter(n => {
        const nLane = (n.data?.lane as string)?.toLowerCase();
        const nType = n.type as string;
        const nLabel = (n.data?.label as string)?.toLowerCase() || "";
        return nLane === 'collect' || nType === 'sourceNode' || ["website", "mobile app", "social", "pos", "transactions", "iot"].some(s => nLabel.includes(s));
      });
      const idx = collectNodes.findIndex(n => n.id === node.id);
      finalY = 100 + (idx * 100);
    } else if (effectiveLane === 'process') {
      finalX = 500;
      // Analytics Stack: Analytics, Segmentation
      // Marketing Stack: CRM, CDP, CMS, Personalization, Decisioning, Orchestration
      const isAnalytics = ["analytics", "segmentation"].some(s => label.includes(s));
      const processGroup = nodes.filter(n => {
        const nLane = (n.data?.lane as string)?.toLowerCase();
        const nLabel = (n.data?.label as string)?.toLowerCase() || "";
        const nIsAnalytics = ["analytics", "segmentation"].some(s => nLabel.includes(s));
        return (nLane === 'process' || !nLane) && nIsAnalytics === isAnalytics;
      });
      const idx = processGroup.findIndex(n => n.id === node.id);
      finalY = isAnalytics ? 100 + (idx * 100) : 320 + (idx * 100);
    } else if (effectiveLane === 'activate' || effectiveLane === 'engage') {
      finalX = 850;
      const activateNodes = nodes.filter(n => {
        const nLane = (n.data?.lane as string)?.toLowerCase();
        const nType = n.type as string;
        const nLabel = (n.data?.label as string)?.toLowerCase() || "";
        return nLane === 'activate' || nLane === 'engage' || nType === 'channelNode' || ["email", "sms", "push", "whatsapp", "ads", "call center"].some(s => nLabel.includes(s));
      });
      const idx = activateNodes.findIndex(n => n.id === node.id);
      finalY = 100 + (idx * 100);
    } else if (effectiveLane === 'data' || effectiveLane === 'service') {
      const dataNodes = nodes.filter(n => {
        const nLane = (n.data?.lane as string)?.toLowerCase();
        const nType = n.type as string;
        const nLabel = (n.data?.label as string)?.toLowerCase() || "";
        return nLane === 'data' || nLane === 'service' || nType === 'dataNode' || ["lake", "warehouse", "bi", "reporting", "data services", "ai", "ml"].some(s => label.includes(s));
      });
      const idx = dataNodes.findIndex(n => n.id === node.id);
      finalX = 200 + (idx * 300);
      finalY = 530;
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
    data: { ...n },
    position: { x: 0, y: 0 }
  })), [initialNodes]);

  const flowEdges = useMemo(() => {
    const edges = [...(initialEdges ?? [])];
    
    // Automatically build flow if missing
    const collectNodes = (initialNodes ?? []).filter((n: any) => {
      const nLane = (n.lane as string)?.toLowerCase();
      const nType = n.type as string;
      const nLabel = (n.label as string)?.toLowerCase() || "";
      return nLane === 'collect' || nType === 'sourceNode' || ["website", "mobile app", "social", "pos", "transactions", "iot"].some(s => nLabel.includes(s));
    });
    
    const processNodes = (initialNodes ?? []).filter((n: any) => {
      const nLane = (n.lane as string)?.toLowerCase();
      const nLabel = (n.label as string)?.toLowerCase() || "";
      return (!nLane || nLane === 'process') && !["website", "mobile app", "social", "pos", "transactions", "iot", "email", "sms", "push", "whatsapp", "ads", "call center", "lake", "warehouse", "bi", "reporting", "data services", "ai", "ml"].some(s => nLabel.includes(s));
    });
    
    const engageNodes = (initialNodes ?? []).filter((n: any) => {
      const nLane = (n.lane as string)?.toLowerCase();
      const nType = n.type as string;
      const nLabel = (n.label as string)?.toLowerCase() || "";
      return nLane === 'activate' || nLane === 'engage' || nType === 'channelNode' || ["email", "sms", "push", "whatsapp", "ads", "call center"].some(s => nLabel.includes(s));
    });

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
    }

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
  }, [initialNodes, initialEdges]);

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
      {/* Enterprise Lane Backgrounds */}
      <div className="absolute inset-0 pointer-events-none flex">
        <div className="w-1/4 border-r border-slate-200 bg-slate-50/50" />
        <div className="w-1/2 border-r border-slate-200 bg-white" />
        <div className="w-1/4 bg-slate-50/50" />
      </div>
      <div className="absolute bottom-0 h-[100px] w-full border-t border-slate-200 bg-slate-100/30 pointer-events-none" />

      {/* Lane Labels */}
      <div className="absolute top-4 inset-x-0 flex justify-between px-10 pointer-events-none z-10 font-display font-bold text-slate-400 uppercase tracking-widest text-[10px]">
        <div className="w-1/4 text-center">COLLECT</div>
        <div className="w-1/2 text-center border-x border-slate-100">PROCESS & ORCHESTRATE</div>
        <div className="w-1/4 text-center">ACTIVATE</div>
      </div>
      
      <div className="absolute bottom-[75px] inset-x-0 text-center pointer-events-none z-10 font-display font-bold text-slate-400 uppercase tracking-widest text-[10px]">
        DATA FOUNDATION & BI
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

      {/* Enterprise Legend */}
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
