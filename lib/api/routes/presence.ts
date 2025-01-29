import { FastifyInstance, FastifyReply } from "fastify";
import { store } from "#/store/presence.store";
import { Logger } from "#/utils/logger";

interface KVRequestBody {
  key: string;
  value: string;
}

interface UserIdParams {
  userId: string;
}

// Helper function for handling errors
async function handleError(
  fastify: FastifyInstance,
  reply: FastifyReply,
  error: Error,
  statusCode: number,
  customErrorMessage: string
) {
  Logger.error(`
    ${error.name}: ${error.message}
    ${statusCode}: ${customErrorMessage}
  `);
  return reply.code(statusCode).send({
    error: customErrorMessage,
    code: statusCode === 404 ? "NOT_FOUND" : "INTERNAL_SERVER_ERROR",
  });
}

// Helper function to check if a user exists
async function getPresenceByUserId(
  fastify: FastifyInstance,
  userId: string,
  reply: FastifyReply
) {
  try {
    const presence = await store.get(userId);
    if (!presence) {
      return handleError(
        fastify,
        reply,
        new Error("Presence not found"),
        404,
        "User not found"
      );
    }
    return presence;
  } catch (error) {
    return handleError(fastify, reply, error, 500, "Internal server error");
  }
}

// Refactored presenceRoutes function
export async function presenceRoutes(fastify: FastifyInstance) {
  // Get presence endpoint
  fastify.get<{
    Params: UserIdParams;
  }>("/api/v1/users/:userId", async (request, reply) => {
    const { userId } = request.params;
    const presence = await getPresenceByUserId(fastify, userId, reply);
    if (!presence) return;

    return { success: true, data: presence };
  });

  // Set KV endpoint
  fastify.post<{
    Params: UserIdParams;
    Body: KVRequestBody;
  }>("/api/v1/users/:userId/kv", async (request, reply) => {
    const { userId } = request.params;
    const { key, value } = request.body;

    // Validate input
    if (!key || typeof key !== "string") {
      return reply
        .code(400)
        .send({ error: "Invalid key provided", code: "INVALID_KEY" });
    }

    if (!value || typeof value !== "string") {
      return reply
        .code(400)
        .send({ error: "Invalid value provided", code: "INVALID_VALUE" });
    }

    const presence = await getPresenceByUserId(fastify, userId, reply);
    if (!presence) return;

    await store.setKV(userId, key, value);

    return { success: true, data: { userId, key, value } };
  });

  // Get KV endpoint
  fastify.get<{
    Params: UserIdParams;
    Querystring: { key: string };
  }>("/api/v1/users/:userId/kv", async (request, reply) => {
    const { userId } = request.params;
    const { key } = request.query as { key?: string };

    const presence = await getPresenceByUserId(fastify, userId, reply);
    if (!presence) return;

    const kv = presence.kv || {};

    if (key) {
      return { success: true, data: { [key]: kv[key] ?? null } };
    }

    return { success: true, data: kv };
  });

  // Delete KV endpoint
  fastify.delete<{
    Params: UserIdParams;
    Querystring: { key: string };
  }>("/api/v1/users/:userId/kv", async (request, reply) => {
    const { userId } = request.params;
    const { key } = request.query as { key: string };

    if (!key) {
      return reply
        .code(400)
        .send({ error: "Key is required", code: "KEY_REQUIRED" });
    }

    const presence = await getPresenceByUserId(fastify, userId, reply);
    if (!presence) return;

    if (!presence.kv?.[key]) {
      return reply
        .code(404)
        .send({ error: "Key not found", code: "KEY_NOT_FOUND" });
    }

    delete presence.kv[key];
    await store.set(userId, presence);

    return { success: true, data: { userId, key } };
  });
}
