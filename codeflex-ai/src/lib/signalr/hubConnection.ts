import * as signalR from '@microsoft/signalr';
import { getAuthToken } from '../api/client';

// Re-export types from SignalR
export type HubConnection = signalR.HubConnection;
export { HubConnectionState as ConnectionState } from '@microsoft/signalr';

export interface ChatMessage {
  senderId: string | number;
  senderName: string;
  message: string;
  timestamp: string;
}

export interface Notification {
  title: string;
  message: string;
  type: string;
  timestamp: string;
}

/**
 * Create a SignalR hub connection using the official Microsoft SignalR client
 */
export function createHubConnection(hubUrl: string): HubConnection {
  const connection = new signalR.HubConnectionBuilder()
    .withUrl(hubUrl, {
      accessTokenFactory: () => {
        const token = getAuthToken();
        return token || '';
      },
    })
    .withAutomaticReconnect({
      nextRetryDelayInMilliseconds: (retryContext) => {
        // Exponential backoff: 0s, 2s, 10s, 30s
        if (retryContext.previousRetryCount === 0) {
          return 0;
        } else if (retryContext.previousRetryCount === 1) {
          return 2000;
        } else if (retryContext.previousRetryCount === 2) {
          return 10000;
        } else if (retryContext.previousRetryCount === 3) {
          return 30000;
        }
        // Stop retrying after 4 attempts
        return null;
      },
    })
    .configureLogging(signalR.LogLevel.Information)
    .build();

  // Log connection state changes
  connection.onreconnecting((error) => {
    console.log(`SignalR reconnecting to ${hubUrl}:`, error);
  });

  connection.onreconnected((connectionId) => {
    console.log(`SignalR reconnected to ${hubUrl}. Connection ID: ${connectionId}`);
  });

  connection.onclose((error) => {
    console.log(`SignalR connection to ${hubUrl} closed:`, error);
  });

  return connection;
}
