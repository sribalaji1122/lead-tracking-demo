import { pgTable, text, serial, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Architecture Data Models
// We will store generated architectures to allow retrieval/history, 
// even though the prompt focuses on "Input -> Process -> JSON".
// It's better to have persistence for an "Enterprise" tool.

export const architectures = pgTable("architectures", {
  id: serial("id").primaryKey(),
  companyName: text("company_name").notNull(),
  context: jsonb("context").notNull(), // Stores the input context
  output: jsonb("output").notNull(),   // Stores the AI generated JSON
  createdAt: text("created_at").notNull().default("NOW()"),
});

export const insertArchitectureSchema = createInsertSchema(architectures).omit({ 
  id: true, 
  createdAt: true 
});

export type Architecture = typeof architectures.$inferSelect;
export type InsertArchitecture = z.infer<typeof insertArchitectureSchema>;

// Input Schema for the AI Generation
export const companyContextSchema = z.object({
  companyName: z.string(),
  industry: z.string(),
  businessModel: z.enum(["B2B", "B2C", "Both"]),
  region: z.string().optional(),
  dataSources: z.array(z.string()),
  toolsUsed: z.object({
    crm: z.string().optional(),
    marketingAutomation: z.string().optional(),
    cms: z.string().optional(),
    cdp: z.string().optional(),
    analytics: z.string().optional(),
    dataWarehouse: z.string().optional(),
    personalization: z.string().optional(),
  }),
  activationChannels: z.array(z.string()),
});

export type CompanyContext = z.infer<typeof companyContextSchema>;

// Output Schema from AI (Strict JSON structure)
export const nodeSchema = z.object({
  id: z.string(),
  type: z.enum(["sourceNode", "systemNode", "channelNode", "dataNode", "decisionNode", "entryNode", "actionNode", "exitNode"]),
  label: z.string(),
  lane: z.enum(["collect", "process", "engage", "data"]).optional(),
  description: z.string().optional(),
  tech: z.string().optional(), // Specific tool name e.g. "Salesforce"
});

export const edgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  type: z.enum(["solid", "dashed", "dotted"]), // solid: Data Flow, dashed: Segment Sync, dotted: Real-Time
  label: z.string().optional(),
});

export const maturityStageSchema = z.object({
  stage: z.enum(["Current", "Crawl", "Walk", "Run"]),
  nodes: z.array(nodeSchema),
  edges: z.array(edgeSchema),
  keyChanges: z.array(z.string()),
  description: z.string(),
});

export const journeyStepSchema = z.object({
  id: z.string(),
  type: z.enum(["entry", "action", "decision", "exit"]),
  label: z.string(),
  channel: z.string().optional(), // e.g. "Email", "WhatsApp"
});

export const journeySchema = z.object({
  id: z.string(),
  name: z.string(),
  trigger: z.string(),
  steps: z.array(journeyStepSchema),
  outcome: z.string(),
});

export const useCaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  goals: z.array(z.string()),
  audience: z.string(),
  benefits: z.array(z.string()),
  channels: z.array(z.string()),
  dataRequired: z.array(z.string()),
  kpis: z.array(z.string()),
  challenges: z.array(z.string()),
  architectureComponentsUsed: z.array(z.string()).optional(),
  businessImpact: z.string().optional(),
  journeys: z.array(journeySchema).optional(),
  journey: z.object({
    entryCriteria: z.string(),
    steps: z.array(journeyStepSchema),
    exitCriteria: z.string(),
    reEntryRules: z.string().optional(),
    frequencyCap: z.string().optional(),
  }),
});

export const aiOutputSchema = z.object({
  maturity: z.array(maturityStageSchema),
  useCases: z.array(useCaseSchema),
});

export type AiOutput = z.infer<typeof aiOutputSchema>;
