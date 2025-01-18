import Fastify, { FastifyInstance } from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import { presenceStore } from '@/store/presence.store';
import { LanyardData } from '@/types';
import { presenceRoutes } from '@/api/routes/presence';

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
      maxPayload: 1048576
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
    fastify.get('/socket', { websocket: true }, (connection, req) => {
      const socket = connection;

      const subscriber = (userId: string, presence: LanyardData) => {
        socket.send(JSON.stringify({
          op: 0,
          d: { userId, ...presence }
        }));
      };

      presenceStore.subscribe(subscriber);

      socket.on('message', async (message) => {
        try {
          const { op, d } = JSON.parse(message.toString());

          switch (op) {
            case 1:
              if (Array.isArray(d)) {
                d.forEach(() => {
                  presenceStore.subscribe((userId, presence) => {
                    socket.send(JSON.stringify({
                      op: 0,
                      d: { userId: userId, ...presence }
                    }));
                  });
                });
              } else {
                socket.send(JSON.stringify({
                  op: -1,
                  d: {error: 'Invalid op code'}
                }));
              }
              break;
            case 2:
              if (Array.isArray(d)) {
                const presences = await Promise.all(
                    d.map(async (userId) => {
                      const presence = await presenceStore.getPresence(userId);
                      return { userId, presence };
                    })
                );

                presences.forEach(({ userId, presence }) => {
                  if (presence) {
                    socket.send(JSON.stringify({
                      op: 0,
                      d: { userId, ...presence }
                    }));
                  }
                });
              }
              break;

            case 3:
              socket.send(JSON.stringify({ op: 3, d: { status: 'ok' } }));
              break;

            default:
              socket.send(JSON.stringify({
                op: -1,
                d: { error: 'Invalid opcode' }
              }));
          }
        } catch (err) {
          socket.send(JSON.stringify({
            op: -1,
            d: { error: 'Invalid message format' }
          }));
        }
      });

      socket.on('close', () => {
        presenceStore.unsubscribe(subscriber);
      });
    });
  });

  return fastify;
}

export const server = createServer();