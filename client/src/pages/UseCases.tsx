import { useArchitectureStore } from "@/hooks/use-architecture";
import { Redirect } from "wouter";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Target, Users, Zap, TrendingUp, AlertTriangle } from "lucide-react";
import ReactFlow, { Background, Controls, useNodesState, useEdgesState } from '@xyflow/react';
import { useMemo } from "react";
import { nodeTypes } from "@/components/NodeTypes";

// Simple helper to visualize linear journey
function JourneyVisualizer({ journey }: { journey: any }) {
  // Create linear nodes from steps
  const nodes = useMemo(() => {
    return journey.steps.map((step: any, index: number) => ({
      id: step.id,
      type: 'decisionNode', // Reuse our styled node
      position: { x: index * 250, y: 50 },
      data: { label: step.label, type: step.type === 'decision' ? 'decisionNode' : 'actionNode', channel: step.channel }
    }));
  }, [journey]);

  const edges = useMemo(() => {
    return journey.steps.slice(0, -1).map((step: any, index: number) => ({
      id: `e-${index}`,
      source: step.id,
      target: journey.steps[index + 1].id,
      animated: true,
      style: { stroke: '#6F2DBD' }
    }));
  }, [journey]);

  const [flowNodes] = useNodesState(nodes);
  const [flowEdges] = useEdgesState(edges);

  return (
    <div className="h-[200px] w-full bg-slate-50 rounded-lg border border-border mt-4">
      <ReactFlow 
        nodes={flowNodes} 
        edges={flowEdges} 
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-right"
      >
        <Background color="#ccc" gap={20} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

export default function UseCases() {
  const { generatedOutput } = useArchitectureStore();

  if (!generatedOutput) {
    return <Redirect to="/input" />;
  }

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 md:px-8 bg-slate-50/50">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Strategic Use Cases</h1>
          <p className="text-muted-foreground mt-1">High-impact journeys tailored to your business model.</p>
        </div>

        <div className="grid gap-6">
          {generatedOutput.useCases.map((useCase, idx) => (
            <motion.div
              key={useCase.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="overflow-hidden hover:shadow-lg transition-shadow border-l-4 border-l-secondary">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl text-primary">{useCase.name}</CardTitle>
                      <CardDescription className="mt-2 text-base">{useCase.description}</CardDescription>
                    </div>
                    <Badge variant="secondary" className="text-xs uppercase tracking-wider">
                      Priority {idx + 1}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  
                  {/* Metadata Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        <Target className="w-4 h-4" /> Goals
                      </div>
                      <ul className="text-sm list-disc list-inside space-y-1">
                        {useCase.goals.slice(0, 2).map((g, i) => <li key={i}>{g}</li>)}
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        <Users className="w-4 h-4" /> Audience
                      </div>
                      <p className="text-sm">{useCase.audience}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        <TrendingUp className="w-4 h-4" /> KPIs
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {useCase.kpis.map((k, i) => (
                          <Badge key={i} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            {k}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        <AlertTriangle className="w-4 h-4" /> Challenges
                      </div>
                      <p className="text-sm text-slate-600 italic">
                        "{useCase.challenges[0]}"
                      </p>
                    </div>
                  </div>

                  {/* Journey Accordion */}
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="journey" className="border-none bg-slate-50/50 rounded-lg px-4">
                      <AccordionTrigger className="hover:no-underline py-3">
                        <div className="flex items-center gap-2 font-semibold text-primary">
                          <Zap className="w-4 h-4" /> View Customer Journey Map
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pt-2 pb-4">
                          <div className="flex gap-4 text-xs text-muted-foreground border-b pb-2">
                            <span><strong>Entry:</strong> {useCase.journey.entryCriteria}</span>
                            <span><strong>Exit:</strong> {useCase.journey.exitCriteria}</span>
                          </div>
                          <JourneyVisualizer journey={useCase.journey} />
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>

                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
