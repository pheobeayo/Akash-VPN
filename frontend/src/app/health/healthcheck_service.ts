import express, { Request, Response } from 'express';
import net from 'net';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

interface VpnEndpoint {
  name: string;
  host: string;
  port: number;
}

interface CheckResult {
  success: boolean;
  error?: string;
}

interface ServiceStatus {
  service: string;
  endpoint: string;
  status: 'UP' | 'DOWN';
  error: string | null;
}

interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  responseTime: string;
  services: ServiceStatus[];
}

// VPN endpoints to check
const VPN_ENDPOINTS: VpnEndpoint[] = [
  { name: 'SoftEther', host: 'softether', port: 5555 },
  { name: 'V2Ray', host: 'v2ray', port: 1080 }
];

// TCP connectivity check with timeout
function checkTcpEndpoint(
  host: string,
  port: number,
  timeout: number = 5000
): Promise<CheckResult> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let isResolved = false;

    const cleanup = (): void => {
      if (!isResolved) {
        isResolved = true;
        socket.destroy();
      }
    };

    const timer = setTimeout(() => {
      cleanup();
      resolve({ success: false, error: 'Connection timeout' });
    }, timeout);

    socket.connect(port, host, () => {
      clearTimeout(timer);
      cleanup();
      resolve({ success: true });
    });

    socket.on('error', (err: Error) => {
      clearTimeout(timer);
      cleanup();
      resolve({ success: false, error: err.message });
    });
  });
}

// Main health check endpoint
app.get('/health', async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  const results: ServiceStatus[] = [];
  let allHealthy = true;

  // Check all VPN endpoints
  for (const endpoint of VPN_ENDPOINTS) {
    const result = await checkTcpEndpoint(endpoint.host, endpoint.port);
    results.push({
      service: endpoint.name,
      endpoint: `${endpoint.host}:${endpoint.port}`,
      status: result.success ? 'UP' : 'DOWN',
      error: result.error || null
    });

    if (!result.success) {
      allHealthy = false;
    }
  }

  const responseTime = Date.now() - startTime;

  // Prepare response
  const response: HealthResponse = {
    status: allHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    responseTime: `${responseTime}ms`,
    services: results
  };

  // Return 200 if all healthy, 503 if any service is down
  const statusCode = allHealthy ? 200 : 503;
  res.status(statusCode).json(response);
});

// Simple root endpoint
app.get('/', (req: Request, res: Response): void => {
  res.json({
    service: 'VPN Healthcheck Service',
    version: '1.0.0',
    endpoints: {
      health: '/health'
    }
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`VPN Healthcheck service listening on port ${PORT}`);
  console.log(`Monitoring endpoints:`, VPN_ENDPOINTS);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});