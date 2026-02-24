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
  useCase: any;
}

export function JourneyDiagram({ useCase }: JourneyDiagramProps) {
  const journey = useCase?.journey;
  
  const { initialNodes, initialEdges } = useMemo(() => {
    const flowNodes: any[] = [];
    const flowEdges: any[] = [];

    // Part 3: Build contextual journey
    let steps = [...(journey?.steps ?? [])];
    
    if (steps.length === 0) {
      // Build dynamic journey from channels
      (useCase?.channels ?? []).forEach((channel: string, idx: number) => {
        steps.push({
          id: `dynamic-step-${idx}`,
          type: "action",
          label: channel + " Engagement",
          channel: channel
        });
      });

      // If CRM tool exists in context (we check the tech stack or use case details)
      if (useCase?.description?.toLowerCase().includes("crm") || useCase?.title?.toLowerCase().includes("crm")) {
        steps.push({
          id: "dynamic-crm-update",
          type: "action",
          label: "CRM Update"
        });
      }
    }

    // Part 5: Ensure Entry & Exit always exist
    const entryLabel = journey?.entryCriteria ?? "User enters funnel";
    const exitLabel = journey?.exitCriteria ?? "Goal achieved";

    flowNodes.push({
      id: 'start-node',
      type: 'decisionNode',
      position: { x: 250, y: -120 },
      data: { 
        label: 'ENTRY: ' + entryLabel, 
        type: 'entryNode' 
      },
      style: { backgroundColor: '#dcfce7', borderColor: '#22c55e' }
    });

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

    const lastY = steps.length * 120;
    flowNodes.push({
      id: 'end-node',
      type: 'decisionNode',
      position: { x: 250, y: lastY },
      data: { 
        label: 'EXIT: ' + exitLabel, 
        type: 'exitNode' 
      },
      style: { backgroundColor: '#fee2e2', borderColor: '#ef4444' }
    });

    if (steps.length > 0) {
      flowEdges.push({
        id: 'last-to-end',
        source: steps[steps.length - 1].id,
        target: 'end-node',
        type: 'smoothstep',
        animated: true
      });
    } else {
      flowEdges.push({
        id: 'start-to-end',
        source: 'start-node',
        target: 'end-node',
        type: 'smoothstep',
        animated: true
      });
    }

    return { initialNodes: flowNodes, initialEdges: flowEdges };
  }, [useCase, journey]);

  const [nodes] = useNodesState(initialNodes);
  const [edges] = useEdgesState(initialEdges);

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
