import { Handle, Position, NodeProps } from '@xyflow/react';
import { 
  Database, 
  Server, 
  Globe, 
  Share2, 
  User, 
  Box, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Layout
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ==========================================
// SHARED STYLES
// ==========================================

const baseNodeStyle = "px-4 py-3 rounded-xl border-2 shadow-sm min-w-[150px] transition-all duration-300 hover:shadow-md bg-white";
const handleStyle = "w-2 h-2 !bg-muted-foreground border-2 border-white transition-colors hover:!bg-primary";

// ==========================================
// ICON MAPPER
// ==========================================

const getIcon = (type: string, tech?: string) => {
  if (tech?.toLowerCase().includes("database") || type === "dataNode") return Database;
  if (tech?.toLowerCase().includes("api") || type === "systemNode") return Server;
  if (type === "sourceNode") return Globe;
  if (type === "channelNode") return Share2;
  if (type === "entryNode") return User;
  if (type === "actionNode") return Zap;
  if (type === "decisionNode") return ShieldCheck;
  if (type === "exitNode") return ArrowRight;
  return Box;
};

// ==========================================
// NODE COMPONENTS
// ==========================================

export function SystemNode({ data }: NodeProps) {
  const Icon = getIcon("systemNode", data.tech as string);
  
  return (
    <div className={cn(baseNodeStyle, "border-primary/20 hover:border-primary")}>
      <Handle type="target" position={Position.Left} className={handleStyle} />
      
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs font-bold text-primary uppercase tracking-wider mb-0.5">System</div>
          <div className="font-semibold text-sm text-foreground">{data.label}</div>
          {data.tech && <div className="text-[10px] text-muted-foreground mt-0.5">{data.tech}</div>}
        </div>
      </div>

      <Handle type="source" position={Position.Right} className={handleStyle} />
    </div>
  );
}

export function DataNode({ data }: NodeProps) {
  return (
    <div className={cn(baseNodeStyle, "border-blue-200 hover:border-blue-500 rounded-full")}>
      <Handle type="target" position={Position.Left} className={handleStyle} />
      <div className="flex items-center gap-3 justify-center">
        <div className="p-1.5 rounded-full bg-blue-100 text-blue-600">
          <Database className="w-4 h-4" />
        </div>
        <div className="font-medium text-sm text-foreground text-center">{data.label}</div>
      </div>
      <Handle type="source" position={Position.Right} className={handleStyle} />
    </div>
  );
}

export function ChannelNode({ data }: NodeProps) {
  return (
    <div className={cn(baseNodeStyle, "border-orange-200 hover:border-orange-500 bg-orange-50/50")}>
      <Handle type="target" position={Position.Left} className={handleStyle} />
      <div className="flex flex-col items-center gap-2">
        <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
          <Share2 className="w-5 h-5" />
        </div>
        <div className="font-semibold text-sm text-center">{data.label}</div>
      </div>
      <Handle type="source" position={Position.Right} className={handleStyle} />
    </div>
  );
}

// ==========================================
// JOURNEY NODES
// ==========================================

export function JourneyStepNode({ data }: NodeProps) {
  const isDecision = data.type === 'decisionNode';
  
  return (
    <div className={cn(
      baseNodeStyle, 
      isDecision ? "border-yellow-400 bg-yellow-50 rotate-0" : "border-border",
      "min-w-[180px] text-center"
    )}>
      <Handle type="target" position={Position.Top} className={handleStyle} />
      
      <div className="flex flex-col items-center gap-2">
        {data.channel && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground uppercase">
            {data.channel}
          </span>
        )}
        <span className="font-medium text-sm">{data.label}</span>
      </div>

      <Handle type="source" position={Position.Bottom} className={handleStyle} />
    </div>
  );
}

// Export mapping for ReactFlow
export const nodeTypes = {
  systemNode: SystemNode,
  dataNode: DataNode,
  channelNode: ChannelNode,
  sourceNode: SystemNode, // Reusing SystemNode style for simplicity but could be unique
  decisionNode: JourneyStepNode,
  actionNode: JourneyStepNode,
  entryNode: JourneyStepNode,
  exitNode: JourneyStepNode
};
