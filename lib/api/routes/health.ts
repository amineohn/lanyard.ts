import { FastifyInstance } from "fastify";

export function healthRoutes(fastify: FastifyInstance) {
  fastify.get("/api/health", async () => {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
    };
  });
}
