import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

interface AuditLogData {
  userId: string;
  action: string;
  resource: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditService {
  /**
   * Log an audit event
   */
  async log(data: AuditLogData): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: data.userId,
          action: data.action,
          resource: data.resource,
          details: data.details,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          timestamp: new Date(),
        },
      });

      logger.info(`Audit log created: ${data.action} on ${data.resource} by ${data.userId}`);
    } catch (error: any) {
      logger.error('Error creating audit log:', error);
      // Don't throw error to avoid breaking the main operation
    }
  }

  /**
   * Get audit logs for a user
   */
  async getUserLogs(userId: string, limit: number = 100): Promise<any[]> {
    try {
      return await prisma.auditLog.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        take: limit,
      });
    } catch (error: any) {
      logger.error('Error fetching user logs:', error);
      return [];
    }
  }

  /**
   * Get audit logs for an action
   */
  async getActionLogs(action: string, limit: number = 100): Promise<any[]> {
    try {
      return await prisma.auditLog.findMany({
        where: { action },
        orderBy: { timestamp: 'desc' },
        take: limit,
      });
    } catch (error: any) {
      logger.error('Error fetching action logs:', error);
      return [];
    }
  }

  /**
   * Get audit logs for a resource
   */
  async getResourceLogs(resource: string, limit: number = 100): Promise<any[]> {
    try {
      return await prisma.auditLog.findMany({
        where: { resource },
        orderBy: { timestamp: 'desc' },
        take: limit,
      });
    } catch (error: any) {
      logger.error('Error fetching resource logs:', error);
      return [];
    }
  }

  /**
   * Get recent audit logs
   */
  async getRecentLogs(limit: number = 100): Promise<any[]> {
    try {
      return await prisma.auditLog.findMany({
        orderBy: { timestamp: 'desc' },
        take: limit,
        include: {
          user: {
            select: {
              address: true,
              role: true,
            },
          },
        },
      });
    } catch (error: any) {
      logger.error('Error fetching recent logs:', error);
      return [];
    }
  }

  /**
   * Clean up old audit logs (for compliance)
   */
  async cleanupOldLogs(daysToKeep: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await prisma.auditLog.deleteMany({
        where: {
          timestamp: {
            lt: cutoffDate,
          },
        },
      });

      logger.info(`Cleaned up ${result.count} old audit logs`);
      return result.count;
    } catch (error: any) {
      logger.error('Error cleaning up logs:', error);
      return 0;
    }
  }
}


