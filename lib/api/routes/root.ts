import { FastifyInstance } from "fastify";

export function rootRoutes(fastify: FastifyInstance) {
  fastify.get("/", (request, reply) => {
    return {
      message:
        "Hello! If you'd like to use my API, feel free to DM me on Discord at kanjo.app. This API is a TypeScript rewrite of Lanyard by KANJO, inspired by the original Lanyard created by Phineas.",
      version: "1.0.0",
      documentation: "Coming soon",
    };
  });
}
