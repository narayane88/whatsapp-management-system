import { Router, Request, Response } from 'express';
import logger from '../utils/logger.js';
import { ApiResponse } from '../types.js';
import { getSessionManager } from '../managers/SessionManagerSingleton.js';

const router = Router();
const sessionManager = getSessionManager();

// Get server health status
router.get('/health', async (req: Request, res: Response) => {
  try {
    const accountCount = sessionManager.getAccountCount();
    
    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        accounts: {
          total: accountCount
        },
        memory: process.memoryUsage(),
        version: process.version,
        platform: process.platform
      },
      message: 'Server is running'
    } as ApiResponse);
    
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    } as ApiResponse);
  }
});

// Get detailed server stats
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const accounts = sessionManager.getAllAccounts();
    const accountsByStatus = accounts.reduce((acc, account) => {
      acc[account.status] = (acc[account.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      success: true,
      data: {
        accounts: {
          total: accounts.length,
          byStatus: accountsByStatus,
          list: accounts.map(account => ({
            id: account.id,
            status: account.status,
            phoneNumber: account.phoneNumber,
            lastSeen: account.lastSeen
          }))
        },
        server: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          version: process.version,
          platform: process.platform,
          nodeVersion: process.version
        }
      }
    } as ApiResponse);
    
  } catch (error) {
    logger.error('Failed to get stats:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    } as ApiResponse);
  }
});

export default router;