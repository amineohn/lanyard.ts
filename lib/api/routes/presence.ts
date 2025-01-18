import { FastifyInstance } from 'fastify';
import { presenceStore } from '@/store/presence.store';

interface KVRequestBody {
    key: string;
    value: string;
}

interface UserIdParams {
    userId: string;
}

export async function presenceRoutes(fastify: FastifyInstance) {
    // Get presence endpoint
    fastify.get<{
        Params: UserIdParams;
    }>('/api/v1/users/:userId', async (request, reply) => {
        try {
            const { userId } = request.params;
            const presence = await presenceStore.getPresence(userId);

            if (!presence) {
                return reply.code(404).send({
                    error: 'Presence not found',
                    code: 'PRESENCE_NOT_FOUND'
                });
            }

            return {
                success: true,
                data: presence
            };
        } catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({
                error: 'Internal server error',
                code: 'INTERNAL_SERVER_ERROR'
            });
        }
    });

    // Set KV endpoint
    fastify.post<{
        Params: UserIdParams;
        Body: KVRequestBody;
    }>('/api/v1/users/:userId/kv', async (request, reply) => {
        try {
            const { userId } = request.params;
            const { key, value } = request.body;

            // Validate input
            if (!key || typeof key !== 'string') {
                return reply.code(400).send({
                    error: 'Invalid key provided',
                    code: 'INVALID_KEY'
                });
            }

            if (!value || typeof value !== 'string') {
                return reply.code(400).send({
                    error: 'Invalid value provided',
                    code: 'INVALID_VALUE'
                });
            }

            // Check if user exists
            const presence = await presenceStore.getPresence(userId);
            if (!presence) {
                return reply.code(404).send({
                    error: 'User not found',
                    code: 'USER_NOT_FOUND'
                });
            }

            await presenceStore.setKV(userId, key, value);

            return {
                success: true,
                data: {
                    userId,
                    key,
                    value
                }
            };
        } catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({
                error: 'Internal server error',
                code: 'INTERNAL_SERVER_ERROR'
            });
        }
    });

    // Get KV endpoint
    fastify.get<{
        Params: UserIdParams;
        Querystring: { key: string };
    }>('/api/v1/users/:userId/kv', async (request, reply) => {
        try {
            const { userId } = request.params;
            const { key } = request.query as { key?: string };

            const presence = await presenceStore.getPresence(userId);
            if (!presence) {
                return reply.code(404).send({
                    error: 'User not found',
                    code: 'USER_NOT_FOUND'
                });
            }

            const kv = presence.kv || {};

            if (key) {
                // Return specific key if provided
                return {
                    success: true,
                    data: {
                        [key]: kv[key] ?? null
                    }
                };
            }

            // Return all KV pairs if no key specified
            return {
                success: true,
                data: kv
            };
        } catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({
                error: 'Internal server error',
                code: 'INTERNAL_SERVER_ERROR'
            });
        }
    });

    // Delete KV endpoint
    fastify.delete<{
        Params: UserIdParams;
        Querystring: { key: string };
    }>('/api/v1/users/:userId/kv', async (request, reply) => {
        try {
            const { userId } = request.params;
            const { key } = request.query as { key: string };

            if (!key) {
                return reply.code(400).send({
                    error: 'Key is required',
                    code: 'KEY_REQUIRED'
                });
            }

            const presence = await presenceStore.getPresence(userId);
            if (!presence) {
                return reply.code(404).send({
                    error: 'User not found',
                    code: 'USER_NOT_FOUND'
                });
            }

            if (!presence.kv?.[key]) {
                return reply.code(404).send({
                    error: 'Key not found',
                    code: 'KEY_NOT_FOUND'
                });
            }

            delete presence.kv[key];
            await presenceStore.setPresence(userId, presence);

            return {
                success: true,
                data: {
                    userId,
                    key
                }
            };
        } catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({
                error: 'Internal server error',
                code: 'INTERNAL_SERVER_ERROR'
            });
        }
    });
}