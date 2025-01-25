import Fastify, { FastifyInstance } from "fastify";
import fastifyWebsocket from "@fastify/websocket";
import { presenceRoutes } from "@/api/routes/presence";
import { healthRoutes } from "@/api/routes/health";
import { rootRoutes } from "@/api/routes/root";
import { websocketRoutes } from "@/api/routes/socket";

export function createServer(): FastifyInstance {
  const fastify = Fastify({
    logger: true,
    ajv: {
      customOptions: {
        removeAdditional: false,
        coerceTypes: false,
        allErrors: true,
      },
    },
  });

  // Register WebSocket plugin
  fastify.register(fastifyWebsocket, {
    options: {
      clientTracking: true,
      maxPayload: 1048576,
    },
  });

  // CORS setup
  fastify.addHook("onRequest", (request, reply, done) => {
    reply.header("Access-Control-Allow-Origin", "*");
    reply.header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
    reply.header("Access-Control-Allow-Headers", "Content-Type");
    done();
  });

  // Register routes
  fastify.register(rootRoutes);
  fastify.register(presenceRoutes);
  fastify.register(healthRoutes);
  fastify.register(websocketRoutes);

  return fastify;
}

export const server = createServer();
