import {
  users,
  bots,
  knowledgeFiles,
  messageLogs,
  type User,
  type UpsertUser,
  type Bot,
  type InsertBot,
  type KnowledgeFile,
  type InsertKnowledgeFile,
  type MessageLog,
  type InsertMessageLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Bot operations
  getUserBots(userId: string): Promise<Bot[]>;
  createBot(bot: InsertBot): Promise<Bot>;
  updateBot(id: number, updates: Partial<InsertBot>): Promise<Bot>;
  deleteBot(id: number): Promise<void>;
  getBotById(id: number): Promise<Bot | undefined>;
  
  // Knowledge base operations
  getUserKnowledgeFiles(userId: string): Promise<KnowledgeFile[]>;
  createKnowledgeFile(file: InsertKnowledgeFile): Promise<KnowledgeFile>;
  deleteKnowledgeFile(id: number): Promise<void>;
  
  // Message log operations
  createMessageLog(log: InsertMessageLog): Promise<MessageLog>;
  getBotMessageLogs(botId: number, limit?: number): Promise<MessageLog[]>;
  getUserMessageStats(userId: string): Promise<{
    totalMessages: number;
    activeBots: number;
    avgResponseTime: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Bot operations
  async getUserBots(userId: string): Promise<Bot[]> {
    return await db.select().from(bots).where(eq(bots.userId, userId));
  }

  async createBot(bot: InsertBot): Promise<Bot> {
    const [newBot] = await db.insert(bots).values(bot).returning();
    return newBot;
  }

  async updateBot(id: number, updates: Partial<InsertBot>): Promise<Bot> {
    const [updatedBot] = await db
      .update(bots)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(bots.id, id))
      .returning();
    return updatedBot;
  }

  async deleteBot(id: number): Promise<void> {
    await db.delete(bots).where(eq(bots.id, id));
  }

  async getBotById(id: number): Promise<Bot | undefined> {
    const [bot] = await db.select().from(bots).where(eq(bots.id, id));
    return bot;
  }

  // Knowledge base operations
  async getUserKnowledgeFiles(userId: string): Promise<KnowledgeFile[]> {
    return await db
      .select()
      .from(knowledgeFiles)
      .where(eq(knowledgeFiles.userId, userId))
      .orderBy(desc(knowledgeFiles.createdAt));
  }

  async createKnowledgeFile(file: InsertKnowledgeFile): Promise<KnowledgeFile> {
    const [newFile] = await db.insert(knowledgeFiles).values(file).returning();
    return newFile;
  }

  async deleteKnowledgeFile(id: number): Promise<void> {
    await db.delete(knowledgeFiles).where(eq(knowledgeFiles.id, id));
  }

  // Message log operations
  async createMessageLog(log: InsertMessageLog): Promise<MessageLog> {
    const [newLog] = await db.insert(messageLogs).values(log).returning();
    return newLog;
  }

  async getBotMessageLogs(botId: number, limit = 50): Promise<MessageLog[]> {
    return await db
      .select()
      .from(messageLogs)
      .where(eq(messageLogs.botId, botId))
      .orderBy(desc(messageLogs.createdAt))
      .limit(limit);
  }

  async getUserMessageStats(userId: string): Promise<{
    totalMessages: number;
    activeBots: number;
    avgResponseTime: number;
  }> {
    // Get user's bots
    const userBots = await this.getUserBots(userId);
    const botIds = userBots.map(bot => bot.id);
    
    if (botIds.length === 0) {
      return { totalMessages: 0, activeBots: 0, avgResponseTime: 0 };
    }

    // Count total messages
    const totalMessages = await db
      .select()
      .from(messageLogs)
      .where(and(...botIds.map(id => eq(messageLogs.botId, id))));

    // Count active bots
    const activeBots = userBots.filter(bot => bot.isActive).length;

    // Calculate average response time
    const responseTimes = totalMessages
      .filter(log => log.responseTime !== null)
      .map(log => log.responseTime!);
    
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;

    return {
      totalMessages: totalMessages.length,
      activeBots,
      avgResponseTime: Math.round(avgResponseTime),
    };
  }
}

export const storage = new DatabaseStorage();
