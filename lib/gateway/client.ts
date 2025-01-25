import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { config } from '@/utils/config';
import { Logger } from "@/utils/logger";
import { GatewayPayload } from "@/types";

export class GatewayClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private sessionId: string | null = null;
  private sequence: number | null = null;
  private heartbeatIntervalData = config.discord.gateway.heartbeatInterval || 41250;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private resumeGatewayUrl: string | null = null;
  private reconnectAttempts = 0;
  private discordGatewayUrl = 'wss://gateway.discord.gg/?v=10&encoding=json';
  private readonly maxReconnectAttempts = config.discord.gateway.maxReconnectAttempts || 5;
  private rateLimitRetryDelay = config.discord.gateway.rateLimitRetryDelay || 5000;
  private rateLimited = false;

  constructor() {
    super();
    process.on('SIGINT', () => this.gracefulShutdown());
    this.connect();
  }

  private connect() {
    if (this.rateLimited) {
      Logger.warn(`Rate limited, retrying in ${this.rateLimitRetryDelay}ms...`);
      setTimeout(() => this.connect(), this.rateLimitRetryDelay);
      return;
    }

    try {
      this.ws = new WebSocket(this.resumeGatewayUrl || this.discordGatewayUrl);
      this.setupWebSocketHandlers();
    } catch (error) {
      Logger.error(`Failed to connect to gateway: ${error}`);
      this.handleReconnect();
    }
  }

  private setupWebSocketHandlers() {
    if (!this.ws) return;

    this.ws.on('open', () => {
      Logger.success('Connected to Discord Gateway');
      if (this.sessionId && this.sequence && this.resumeGatewayUrl) {
        this.resume();
      } else {
        this.identify();
      }
    });

    this.ws.on('message', (data: WebSocket.Data) => {
      try {
        const payload: GatewayPayload = JSON.parse(data.toString());
        this.handlePayload(payload);
      } catch (error) {
        Logger.error(`Failed to parse gateway message: ${error}`);
      }
    });

    this.ws.on('close', (code: number) => {
      Logger.error(`Gateway connection closed with code ${code}`);
      this.cleanup();
      this.handleReconnect();
    });

    this.ws.on('error', (error: Error) => {
      Logger.error(`Gateway WebSocket error: ${error}`);
      this.cleanup();
      this.handleReconnect();
    });
  }

  private handlePayload(payload: GatewayPayload) {
    if (payload.s) {
      this.sequence = payload.s;
    }

    switch (payload.op) {
      case 10: // Hello
        this.startHeartbeat(payload.d.heartbeat_interval);
        break;

      case 11: // Heartbeat ACK
        Logger.debug('Heartbeat acknowledged');
        break;

      case 0: // Dispatch
        this.handleDispatch(payload);
        break;

      case 7: // Reconnect
        Logger.warn('Gateway requested reconnect');
        this.reconnect();
        break;

      case 9: // Invalid Session
        Logger.warn('Invalid session, re-identifying...');
        this.sessionId = null;
        this.identify();
        break;

      case 4: // Rate Limit
        Logger.warn('Rate limited by Discord, retrying in ' + payload.d.retry_after + 'ms');
        this.rateLimited = true;
        setTimeout(() => {
          this.rateLimited = false;
          this.connect();
        }, payload.d.retry_after);
        break;

      default:
        Logger.debug(`Unhandled gateway op code: ${payload.op}`);
    }
  }

  private handleDispatch(payload: GatewayPayload) {
    switch (payload.t) {
      case 'READY':
        this.sessionId = payload.d.session_id;
        this.resumeGatewayUrl = payload.d.resume_gateway_url;
        this.emit('ready', payload.d);
        break;

      case 'RESUMED':
        Logger.success('Session resumed successfully');
        break;

      case 'PRESENCE_UPDATE':
        this.emit('presenceUpdate', payload.d);
        break;

      default:
        Logger.debug(`Unhandled dispatch event: ${payload.t}`);
    }
  }

  private startHeartbeat(interval: number) {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, interval);
  }

  private sendHeartbeat() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        op: 1,
        d: this.sequence
      }));
    }
  }

  private identify() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    this.ws.send(JSON.stringify({
      op: 2,
      d: {
        token: config.discord.token,
        intents: 1 << 8, // GUILD_PRESENCES
        properties: {
          os: 'linux',
          browser: 'lanyard-ts',
          device: 'lanyard-ts'
        },
        presence: {
          status: 'online',
          activities: [{
            name: 'Hello',
            type: 2
          }]
        }
      }
    }));
  }

  private resume() {
    if (!this.ws || !this.sessionId || !this.sequence) return;

    this.ws.send(JSON.stringify({
      op: 6,
      d: {
        token: config.discord.token,
        session_id: this.sessionId,
        seq: this.sequence
      }
    }));
  }

  private cleanup() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.ws) {
      this.ws.removeAllListeners();
      this.ws = null;
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), this.heartbeatIntervalData);
      Logger.warn(`Reconnecting in ${delay}ms... Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      Logger.error('Max reconnection attempts reached');
      process.exit(1);
    }
  }

  private reconnect() {
    this.cleanup();
    this.connect();
  }

  private gracefulShutdown() {
    Logger.warn('Shutting down gracefully...');
    this.destroy();
    process.exit(0);
  }

  public destroy() {
    this.cleanup();
    this.removeAllListeners();
  }
}
