import { architectures, type InsertArchitecture, type Architecture } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  createArchitecture(arch: InsertArchitecture): Promise<Architecture>;
  getArchitecture(id: number): Promise<Architecture | undefined>;
  listArchitectures(): Promise<Architecture[]>;
}

export class DatabaseStorage implements IStorage {
  async createArchitecture(insertArchitecture: InsertArchitecture): Promise<Architecture> {
    const [architecture] = await db
      .insert(architectures)
      .values(insertArchitecture)
      .returning();
    return architecture;
  }

  async getArchitecture(id: number): Promise<Architecture | undefined> {
    const [architecture] = await db
      .select()
      .from(architectures)
      .where(eq(architectures.id, id));
    return architecture;
  }

  async listArchitectures(): Promise<Architecture[]> {
    return await db
      .select()
      .from(architectures)
      .orderBy(desc(architectures.createdAt));
  }
}

export const storage = new DatabaseStorage();
