import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import OpenAI from "openai";
import { companyContextSchema } from "@shared/schema";

// Initialize OpenAI client with Replit AI Integrations
const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

    app.post(api.architecture.generate.path, async (req, res) => {
    try {
      console.log("Backend: Received generate request with body:", JSON.stringify(req.body, null, 2));
      const input = companyContextSchema.parse(req.body);
      console.log("Backend: Input validation successful");

      const systemPrompt = `
You are a Senior Full-Stack React + TypeScript Architecture Visualization Engineer building InnooRyze ARC+.
Your goal is to generate a comprehensive enterprise architecture visualization and maturity model based on the user's input.

You must return a STRICT JSON object that matches the following structure:

{
  "maturity": [
    {
      "stage": "Current" | "Crawl" | "Walk" | "Run",
      "description": "Description of this stage",
      "keyChanges": ["Bullet 1", "Bullet 2"],
      "nodes": [
        {
          "id": "string",
          "type": "sourceNode" | "systemNode" | "channelNode" | "dataNode" | "decisionNode",
          "label": "string",
          "lane": "collect" | "process" | "engage" | "data",
          "tech": "Specific Tool Name (e.g. Salesforce)"
        }
      ],
      "edges": [
        {
          "id": "string",
          "source": "nodeId",
          "target": "nodeId",
          "type": "solid" | "dashed" | "dotted",
          "label": "optional label"
        }
      ]
    }
    // ... repeat for all 4 stages
  ],
  "useCases": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "goals": ["string"],
      "audience": "string",
      "benefits": ["string"],
      "channels": ["string"],
      "dataRequired": ["string"],
      "kpis": ["string"],
      "challenges": ["string"],
      "journey": {
        "entryCriteria": "string",
        "exitCriteria": "string",
        "steps": [
          {
            "id": "string",
            "type": "entry" | "action" | "decision" | "exit",
            "label": "string",
            "channel": "string (optional)"
          }
        ]
      }
    }
    // ... max 6 use cases
  ]
}

RULES:
- Lanes: Collect (x:100), Process (x:500), Engage (x:900), Data (bottom).
- Node Types: 
  - sourceNode (Data Sources)
  - systemNode (CRM, CDP, etc)
  - channelNode (Email, SMS)
  - dataNode (Warehouse)
- Edges: solid (Data Flow), dashed (Segment Sync), dotted (Real-Time).
- Use specific tool names from the input where applicable.
- Generate valid, logical architectures that evolve from Current -> Crawl -> Walk -> Run.
- "Current" should reflect the input state.
- "Crawl/Walk/Run" should add advanced capabilities (CDP, Personalization, Real-time) incrementally.
`;

      console.log("Backend: Calling OpenAI...");
      const completion = await openai.chat.completions.create({
        model: "gpt-5.2", // Using the best model for complex reasoning
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: JSON.stringify(input) }
        ],
        response_format: { type: "json_object" },
      });

      const responseContent = completion.choices[0].message.content;
      console.log("Backend: OpenAI response content received:", responseContent);
      
      if (!responseContent) {
        throw new Error("Failed to generate architecture");
      }

      const aiOutput = JSON.parse(responseContent);
      console.log("Backend: Parsed AI output successfully");

      // Validate against our schema? 
      // It's safer to just return it, but for persistence we should check.
      // We'll trust the AI followed the schema for now, or use safe parsing.

      // Persist the result
      console.log("Backend: Persisting result to database...");
      const savedArch = await storage.createArchitecture({
        companyName: input.companyName,
        context: input,
        output: aiOutput,
      });
      console.log("Backend: Result persisted with ID:", savedArch.id);

      res.json(aiOutput);

    } catch (err) {
      console.error("Backend Error generating architecture:", err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: err.errors });
      }
      res.status(500).json({ message: "Failed to generate architecture" });
    }
  });

  app.get(api.architecture.list.path, async (req, res) => {
    const list = await storage.listArchitectures();
    res.json(list);
  });

  app.get(api.architecture.get.path, async (req, res) => {
    const id = parseInt(req.params.id);
    const arch = await storage.getArchitecture(id);
    if (!arch) {
      return res.status(404).json({ message: "Architecture not found" });
    }
    res.json(arch);
  });

  return httpServer;
}
