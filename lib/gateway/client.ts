import WebSocket, { Data } from "ws";
import { EventEmitter } from "events";
import { config } from "@/utils/config";
import { Logger } from "@/utils/logger";
import { GatewayPayload } from "@/types/lanyard";

const DISCORD_GATEWAY_URL = "wss://gateway.discord.gg/?v=10&encoding=json"; 

export class GatewayClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private sessionId: string | null = null;
  private sequence: number | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private rateLimited = false;

  private readonly heartbeatIntervalMs =
    config.discord.gateway.heartbeatInterval || 41250;
  private readonly maxReconnectAttempts =
    config.discord.gateway.maxReconnectAttempts || 5;
  private readonly rateLimitRetryDelay =
    config.discord.gateway.rateLimitRetryDelay || 5000;

  constructor() {
    super();
    process.on("SIGINT", () => this.gracefulShutdown());
    this.connect();
  }

  // Entry point for connecting to the WebSocket
  private connect() {
    if (this.rateLimited) {
      Logger.warn(`Rate limited, retrying in ${this.rateLimitRetryDelay}ms...`);
      return;
    }

    try {
      this.ws = new WebSocket(DISCORD_GATEWAY_URL);
      this.setupWebSocketHandlers();
    } catch (error) {
      Logger.error(`Failed to connect: ${error}`);
      this.handleReconnect();
    }
  }

  // WebSocket Handlers
  private setupWebSocketHandlers() {
    if (!this.ws) return;

    this.ws.on("open", () => {
      Logger.success("Connected to Discord Gateway");
      this.sessionId ? this.resume() : this.identify();
    });

    this.ws.on("message", (data: Data) => this.handleMessage(data));

    this.ws.on("close", (code: number) => {
      Logger.error(`Connection closed with code ${code}`);
      this.cleanup();
      this.handleReconnect();
    });

    this.ws.on("error", (error: Error) => {
      Logger.error(`WebSocket error: ${error}`);
      this.cleanup();
      this.handleReconnect();
    });
  }

  // Handle WebSocket messages
  private handleMessage(data: Data) {
    try {
      const payload: GatewayPayload = JSON.parse(data.toString());
      this.handlePayload(payload);
    } catch (error) {
      Logger.error(`Failed to parse message: ${error}`);
    }
  }

  // Payload handler
  private handlePayload(payload: GatewayPayload) {
    if (payload.s) this.sequence = payload.s;

    switch (payload.op) {
      case 10: // Hello
        this.startHeartbeat(payload.d.heartbeat_interval);
        break;

      case 11: // Heartbeat ACK
        Logger.debug("Heartbeat acknowledged");
        break;

      case 0: // Dispatch
        this.handleDispatch(payload);
        break;

      case 7: // Reconnect
        Logger.warn("Gateway requested reconnect");
        this.reconnect();
        break;

      case 9: // Invalid Session
        Logger.warn("Invalid session, re-identifying...");
        this.sessionId = null;
        this.identify();
        break;

      case 4: // Rate Limit
        const retryAfter = payload.d.retry_after || this.rateLimitRetryDelay;
        this.setRateLimit(retryAfter);
        break;

      default:
        Logger.debug(`Unhandled opcode: ${payload.op}`);
    }
  }

  // Dispatch event handler
  private handleDispatch(payload: GatewayPayload) {
    switch (payload.t) {
      case "READY":
        this.sessionId = payload.d.session_id;
        this.emit("ready", payload.d);
        break;

      case "RESUMED":
        Logger.success("Session resumed successfully");
        break;

      case "PRESENCE_UPDATE":
        this.emit("presenceUpdate", payload.d);
        break;

      default:
        Logger.debug(`Unhandled event: ${payload.t}`);
    }
  }

  // Set rate limit
  private setRateLimit(duration: number) {
    Logger.warn(`Rate limited. Retrying in ${duration}ms...`);
    this.rateLimited = true;

    setTimeout(() => {
      this.rateLimited = false;
      this.connect();
    }, duration);
  }

  // Start heartbeat
  private startHeartbeat(interval: number) {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);

    this.heartbeatInterval = setInterval(() => {
      this.sendPayload({ op: 1, d: this.sequence });
    }, interval);
  }

  // Send payloads
  private sendPayload(payload: object) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  // Identify as a client
  private identify() {
    this.sendPayload({
      op: 2,
      d: {
        token: config.discord.token,
        intents: 1 << 8, // GUILD_PRESENCES
        properties: {
          os: "linux",
          browser: "lanyard-ts",
          device: "lanyard-ts",
        },
        presence: {
          status: "online",
          activities: [{ name: "Hello", type: 2 }],
        },
      },
    });
  }

  // Resume session
  private resume() {
    if (this.sessionId && this.sequence) {
      this.sendPayload({
        op: 6,
        d: {
          token: config.discord.token,
          session_id: this.sessionId,
          seq: this.sequence,
        },
      });
    }
  }

  // Clean up resources
  private cleanup() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    this.heartbeatInterval = null;

    if (this.ws) {
      this.ws.removeAllListeners();
      this.ws = null;
    }
  }

  // Handle reconnection attempts
  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(
        1000 * 2 ** (this.reconnectAttempts - 1),
        this.heartbeatIntervalMs
      );

      Logger.warn(
        `Reconnecting in ${delay}ms... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
      );
      setTimeout(() => this.connect(), delay);
    } else {
      Logger.error("Max reconnection attempts reached");
      process.exit(1);
    }
  }

  // Reconnect logic
  private reconnect() {
    this.cleanup();
    this.connect();
  }

  // Graceful shutdown
  private gracefulShutdown() {
    Logger.warn("Shutting down gracefully...");
    this.destroy();
    process.exit(0);
  }

  // Destroy client
  public destroy() {
    this.cleanup();
    this.removeAllListeners();
  }
}
