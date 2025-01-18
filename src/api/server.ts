import Fastify, {FastifyError, FastifyInstance, FastifyReply, FastifyRequest} from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import {setupRoutes} from "@/api/routes";
import {setupWebSocket} from "@/api/websocket";
export function errorHandler(error: FastifyError, request: FastifyRequest, reply: FastifyReply) {
  request.log.error(error);

  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal Server Error';

  if (process.env.NODE_ENV === 'production') {
    message = statusCode === 500 ? 'Internal Server Error' : message;
  }

  reply.status(statusCode).send({ error: message });
}


export async function createServer(): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: true
  });

  await fastify.register(fastifyWebsocket);

  // CORS headers
  fastify.addHook('onRequest', (request, reply, done) => {
    reply.header('Access-Control-Allow-Origin', '*');
    reply.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    reply.header('Access-Control-Allow-Headers', 'Content-Type');
    done();
  });

  // Error handling middleware
  fastify.setErrorHandler(errorHandler);

  // Setup routes
  setupRoutes(fastify);

  // Setup WebSocket
  setupWebSocket(fastify);

  return fastify;
}

export const server = createServer();