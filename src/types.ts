import { AxiosRequestConfig } from "axios";

export interface AutodiscoverIncomingServer {
  hostname: string;
  port: number;
  socketType: "SSL" | "STARTTLS";
  username: string;
  authentication: string | string[];
  type: string;
}

export interface AutodiscoverProtocol {
  Server: string;
  Port: number;
  SSL: "on" | "off";
  Type: string;
}

export type AutodiscoverIMAPSettings = AutodiscoverIncomingServer &
  AutodiscoverProtocol;

export interface WwwAuthOptions extends AxiosRequestConfig {
  username?: string;
  password?: string;
  timeout?: number;
}

export interface IMAPConnectionSettings {
  host: string;
  port: number;
  secure: boolean;
}
