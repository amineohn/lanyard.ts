import Fastify, { FastifyInstance } from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import { presenceStore } from '@/store/presence.store';
import { LanyardData } from '@/types';
import { presenceRoutes } from '@/api/routes/presence';

interface WebSocketMessage {
  op: number;
  d: string[] | any;
}

interface WebSocketResponse {
  op: number;
  d: {
    userId?: string;
    error?: string;
    status?: string;
    [key: string]: any;
  };
}

export function createServer(): FastifyInstance {
  const fastify = Fastify({
    logger: true,
    ajv: {
      customOptions: {
        removeAdditional: false,
        coerceTypes: false,
        allErrors: true,
      }
    }
  });

  // Register WebSocket plugin
  fastify.register(fastifyWebsocket, {
    options: {
      clientTracking: true,
      maxPayload: 1048576 // 1MB max payload
    }
  });

  // CORS setup
  fastify.addHook('onRequest', (request, reply, done) => {
    reply.header('Access-Control-Allow-Origin', '*');
    reply.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    reply.header('Access-Control-Allow-Headers', 'Content-Type');
    done();
  });

  // Register routes
  fastify.register(presenceRoutes);

  // Health check endpoint
  fastify.get('/api/health', async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString()
    };
  });

  // Root route
  fastify.get('/', (request, reply) => {
    return {
      message: "Hello! If you'd like to use my API, feel free to DM me on Discord at kanjo.app. This API is a TypeScript rewrite of Lanyard by KANJO, inspired by the original Lanyard created by Phineas.",
      version: '1.0.0',
      documentation: 'Coming soon'
    };
  });

  // WebSocket endpoint
  fastify.register(async (fastify) => {
    fastify.get('/socket', { websocket: true }, (connection) => {
      const socket = connection;
      let subscribedUsers: Set<string> = new Set();

      const subscriber = (userId: string, presence: LanyardData) => {
        if (subscribedUsers.has(userId)) {
          const response: WebSocketResponse = {
            op: 0,
            d: { userId, ...presence }
          };
          socket.send(JSON.stringify(response));
        }
      };

      presenceStore.subscribe(subscriber);

      socket.on('message', async (messageRaw) => {
        try {
          const message = JSON.parse(messageRaw.toString()) as WebSocketMessage;
          const { op, d } = message;

          switch (op) {
            case 1: // Subscribe to users
              if (!Array.isArray(d)) {
                throw new Error('Invalid subscription data');
              }
              d.forEach(userId => subscribedUsers.add(userId));
              break;

            case 2: // Initial presence state
              if (!Array.isArray(d)) {
                throw new Error('Invalid user list');
              }

              const presences = await Promise.all(
                  d.map(async (userId) => {
                    const presence = await presenceStore.getPresence(userId);
                    subscribedUsers.add(userId);
                    return { userId, presence };
                  })
              );

              presences.forEach(({ userId, presence }) => {
                if (presence) {
                  const response: WebSocketResponse = {
                    op: 0,
                    d: { userId, ...presence }
                  };
                  socket.send(JSON.stringify(response));
                }
              });
              break;

            case 3: // Heartbeat
              socket.send(JSON.stringify({
                op: 3,
                d: {
                  status: 'ok',
                  timestamp: new Date().toISOString()
                }
              }));
              break;

            default:
              throw new Error('Invalid opcode');
          }
        } catch (error) {
          const errorResponse: WebSocketResponse = {
            op: -1,
            d: {
              error: error instanceof Error ? error.message : 'Invalid message format',
              timestamp: new Date().toISOString()
            }
          };
          socket.send(JSON.stringify(errorResponse));
        }
      });

      socket.on('close', () => {
        presenceStore.unsubscribe(subscriber);
        subscribedUsers.clear();
      });

      socket.send(JSON.stringify({
        op: 0,
        d: {
          status: 'connected',
          timestamp: new Date().toISOString()
        }
      }));
    });
  });

  return fastify;
}

export const server = createServer();