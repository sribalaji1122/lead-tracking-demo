import { ReactFlow, Background, Controls, MiniMap, BackgroundVariant } from '@xyflow/react';
import { useMemo } from "react";
import { nodeTypes } from "@/components/NodeTypes";
import { useNodesState, useEdgesState } from '@xyflow/react';
import { Mail, Phone, Bell, MessageSquare, Facebook } from "lucide-react";

// Helper to get channel icon
const getChannelIcon = (channel?: string) => {
  const c = channel?.toLowerCase() || "";
  if (c.includes("email")) return <Mail className="w-4 h-4" />;
  if (c.includes("whatsapp")) return <MessageSquare className="w-4 h-4" />;
  if (c.includes("facebook")) return <Facebook className="w-4 h-4" />;
  if (c.includes("push") || c.includes("notification")) return <Bell className="w-4 h-4" />;
  if (c.includes("call") || c.includes("phone")) return <Phone className="w-4 h-4" />;
  return null;
};

interface JourneyDiagramProps {
  journey: any;
}

export function JourneyDiagram({ journey }: JourneyDiagramProps) {
  const { initialNodes, initialEdges } = useMemo(() => {
    const steps = journey?.steps ?? [];
    if (steps.length === 0) return { initialNodes: [], initialEdges: [] };

    const flowNodes: any[] = [];
    const flowEdges: any[] = [];

    // Entry Node
    flowNodes.push({
      id: 'start-node',
      type: 'decisionNode',
      position: { x: 250, y: -120 },
      data: { 
        label: 'ENTRY: ' + (journey.entryCriteria ?? 'Start'), 
        type: 'entryNode' 
      },
      style: { backgroundColor: '#dcfce7', borderColor: '#22c55e' }
    });

    // Step Nodes
    steps.forEach((step: any, index: number) => {
      flowNodes.push({
        id: step.id,
        type: 'decisionNode',
        position: { x: 250, y: index * 120 },
        data: { 
          label: step.label, 
          type: step.type === 'decision' ? 'decisionNode' : 'actionNode', 
          channel: step.channel,
          icon: getChannelIcon(step.channel)
        }
      });

      // Connections
      if (index === 0) {
        flowEdges.push({
          id: 'start-to-first',
          source: 'start-node',
          target: step.id,
          type: 'smoothstep',
          animated: true
        });
      } else {
        flowEdges.push({
          id: `e-${index}`,
          source: steps[index - 1].id,
          target: step.id,
          type: 'smoothstep',
          animated: true
        });
      }
    });

    // Exit Node
    const lastY = steps.length * 120;
    flowNodes.push({
      id: 'end-node',
      type: 'decisionNode',
      position: { x: 250, y: lastY },
      data: { 
        label: 'EXIT: ' + (journey.exitCriteria ?? 'End'), 
        type: 'exitNode' 
      },
      style: { backgroundColor: '#fee2e2', borderColor: '#ef4444' }
    });

    flowEdges.push({
      id: 'last-to-end',
      source: steps[steps.length - 1].id,
      target: 'end-node',
      type: 'smoothstep',
      animated: true
    });

    return { initialNodes: flowNodes, initialEdges: flowEdges };
  }, [journey]);

  const [nodes] = useNodesState(initialNodes);
  const [edges] = useEdgesState(initialEdges);

  if (!journey || (journey.steps ?? []).length === 0) {
    return (
      <div className="h-[400px] w-full bg-slate-50 rounded-lg border border-border mt-4 flex items-center justify-center text-muted-foreground">
        Journey not available
      </div>
    );
  }

  return (
    <div className="h-[400px] w-full bg-slate-50 rounded-lg border border-border mt-4">
      <ReactFlow 
        nodes={nodes} 
        edges={edges} 
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-right"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
