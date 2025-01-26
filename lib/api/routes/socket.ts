import { LanyardData } from "@/types/lanyard";
import { store } from "@/store/presence.store";
import { FastifyInstance } from "fastify";

export function websocketRoutes(fastify: FastifyInstance) {
  fastify.get("/socket", { websocket: true }, async (connection, req) => {
    const socket = connection;

    const subscriber = (userId: string, presence: LanyardData) => {
      socket.send(
        JSON.stringify({
          op: 0,
          d: { userId, ...presence },
        }),
      );
    };

    await store.subscribe(subscriber);

    socket.on("message", async (message) => {
      try {
        const { op, d } = JSON.parse(message.toString());

        switch (op) {
          case 1:
            if (Array.isArray(d)) {
              d.forEach(() => {
                store.subscribe((userId, presence) => {
                  socket.send(
                    JSON.stringify({
                      op: 0,
                      d: { userId: userId, ...presence },
                    }),
                  );
                });
              });
            } else {
              socket.send(
                JSON.stringify({
                  op: -1,
                  d: { error: "Invalid op code" },
                }),
              );
            }
            break;
          case 2:
            if (Array.isArray(d)) {
              const presences = await Promise.all(
                d.map(async (userId) => {
                  const presence = await store.getPresence(userId);
                  return { userId, presence };
                }),
              );

              presences.forEach(({ userId, presence }) => {
                if (presence) {
                  socket.send(
                    JSON.stringify({
                      op: 0,
                      d: { userId, ...presence },
                    }),
                  );
                }
              });
            }
            break;

          case 3:
            socket.send(JSON.stringify({ op: 3, d: { status: "ok" } }));
            break;

          default:
            socket.send(
              JSON.stringify({
                op: -1,
                d: { error: "Invalid opcode" },
              }),
            );
        }
      } catch (err) {
        socket.send(
          JSON.stringify({
            op: -1,
            d: { error: "Invalid message format" },
          }),
        );
      }
    });

    socket.on("close", async () => {
      await store.unsubscribe(subscriber);
    });
  });
}
