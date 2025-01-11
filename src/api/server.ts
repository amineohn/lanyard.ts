import Fastify from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import { config } from '../config';
import { presenceStore } from '../store/presence';

const fastify = Fastify({
  logger: true
});

fastify.register(fastifyWebsocket);

// CORS headers
fastify.addHook('onRequest', (request, reply, done) => {
  reply.header('Access-Control-Allow-Origin', '*');
  reply.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  reply.header('Access-Control-Allow-Headers', 'Content-Type');
  done();
});

// Health check endpoint
fastify.get('/api/health', async () => {
  return { status: 'ok' };
});

// REST endpoint for getting presence
fastify.get('/api/v1/users/:userId', async (request, reply) => {
  const { userId } = request.params as { userId: string };
  const presence = await presenceStore.getPresence(userId);
  
  if (!presence) {
    reply.code(404).send({ error: 'User not found' });
    return;
  }

  return presence;
});

// KV store endpoints
fastify.post('/api/v1/users/:userId/kv', async (request, reply) => {
  const { userId } = request.params as { userId: string };
  const { key, value } = request.body as { key: string; value: string };

  if (!key || !value) {
    reply.code(400).send({ error: 'Missing key or value' });
    return;
  }

  await presenceStore.setKV(userId, key, value);
  return { success: true };
});

// WebSocket endpoint for real-time updates
fastify.register(async function (fastify) {
  fastify.get('/api/v1/socket', { websocket: true }, (connection, req) => {
    const { socket } = connection;

    const subscriber = (userId: string, presence: any) => {
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
          case 1: // Subscribe to specific users
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

export const server = fastify;