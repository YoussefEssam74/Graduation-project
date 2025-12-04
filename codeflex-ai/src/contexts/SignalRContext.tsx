"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { HubConnectionState } from '@microsoft/signalr';
import { createHubConnection, HubConnection, ChatMessage, Notification } from '@/lib/signalr/hubConnection';
import { useAuth } from './AuthContext';

// Remove /api suffix for SignalR hub connections
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5025/api').replace('/api', '');

interface SignalRContextType {
  chatConnection: HubConnection | null;
  notificationConnection: HubConnection | null;
  chatConnectionState: HubConnectionState;
  notificationConnectionState: HubConnectionState;
  sendMessageToCoach: (coachId: number, message: string) => Promise<void>;
  sendMessageToMember: (memberId: number, message: string) => Promise<void>;
  onChatMessage: (callback: (message: ChatMessage) => void) => void;
  offChatMessage: (callback: (message: ChatMessage) => void) => void;
  onNotification: (callback: (notification: Notification) => void) => void;
  offNotification: (callback: (notification: Notification) => void) => void;
}

const SignalRContext = createContext<SignalRContextType | undefined>(undefined);

export const SignalRProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();
  const [chatConnection, setChatConnection] = useState<HubConnection | null>(null);
  const [notificationConnection, setNotificationConnection] = useState<HubConnection | null>(null);
  const [chatConnectionState, setChatConnectionState] = useState<HubConnectionState>(HubConnectionState.Disconnected);
  const [notificationConnectionState, setNotificationConnectionState] = useState<HubConnectionState>(HubConnectionState.Disconnected);
  
  const chatRef = useRef<HubConnection | null>(null);
  const notificationRef = useRef<HubConnection | null>(null);

  // Initialize connections when user logs in
  useEffect(() => {
    if (!user || !token) {
      // Cleanup connections on logout
      if (chatRef.current) {
        chatRef.current.stop().catch(console.error);
        chatRef.current = null;
        setChatConnection(null);
      }
      if (notificationRef.current) {
        notificationRef.current.stop().catch(console.error);
        notificationRef.current = null;
        setNotificationConnection(null);
      }
      return;
    }

    // Create chat connection
    const chat = createHubConnection(`${API_BASE}/hubs/chat`);
    chatRef.current = chat;
    setChatConnection(chat);

    // Create notification connection
    const notification = createHubConnection(`${API_BASE}/hubs/notifications`);
    notificationRef.current = notification;
    setNotificationConnection(notification);

    // Update state when connection state changes
    const updateChatState = () => {
      setChatConnectionState(chat.state);
    };
    
    const updateNotificationState = () => {
      setNotificationConnectionState(notification.state);
    };

    // Monitor state changes using SignalR events
    chat.onreconnecting(() => updateChatState());
    chat.onreconnected(() => updateChatState());
    chat.onclose(() => updateChatState());
    
    notification.onreconnecting(() => updateNotificationState());
    notification.onreconnected(() => updateNotificationState());
    notification.onclose(() => updateNotificationState());

    // Start connections
    chat.start()
      .then(() => {
        console.log('Connected to chat hub');
        updateChatState();
      })
      .catch(err => {
        console.error('Failed to connect to chat hub:', err);
        updateChatState();
      });

    notification.start()
      .then(() => {
        console.log('Connected to notification hub');
        updateNotificationState();
      })
      .catch(err => {
        console.error('Failed to connect to notification hub:', err);
        updateNotificationState();
      });

    return () => {
      chat.stop().catch(console.error);
      notification.stop().catch(console.error);
    };
  }, [user, token]);

  const sendMessageToCoach = useCallback(async (coachId: number, message: string) => {
    if (!chatConnection || chatConnection.state !== HubConnectionState.Connected) {
      throw new Error('Chat connection is not established');
    }
    await chatConnection.invoke('SendMessageToCoach', coachId, message);
  }, [chatConnection]);

  const sendMessageToMember = useCallback(async (memberId: number, message: string) => {
    if (!chatConnection || chatConnection.state !== HubConnectionState.Connected) {
      throw new Error('Chat connection is not established');
    }
    await chatConnection.invoke('SendMessageToMember', memberId, message);
  }, [chatConnection]);

  const onChatMessage = useCallback((callback: (message: ChatMessage) => void) => {
    if (chatConnection) {
      chatConnection.on('ReceiveMessage', callback);
    }
  }, [chatConnection]);

  const offChatMessage = useCallback((callback: (message: ChatMessage) => void) => {
    if (chatConnection) {
      chatConnection.off('ReceiveMessage', callback);
    }
  }, [chatConnection]);

  const onNotification = useCallback((callback: (notification: Notification) => void) => {
    if (notificationConnection) {
      notificationConnection.on('ReceiveNotification', callback);
    }
  }, [notificationConnection]);

  const offNotification = useCallback((callback: (notification: Notification) => void) => {
    if (notificationConnection) {
      notificationConnection.off('ReceiveNotification', callback);
    }
  }, [notificationConnection]);

  return (
    <SignalRContext.Provider
      value={{
        chatConnection,
        notificationConnection,
        chatConnectionState,
        notificationConnectionState,
        sendMessageToCoach,
        sendMessageToMember,
        onChatMessage,
        offChatMessage,
        onNotification,
        offNotification,
      }}
    >
      {children}
    </SignalRContext.Provider>
  );
};

export const useSignalR = () => {
  const context = useContext(SignalRContext);
  if (context === undefined) {
    throw new Error('useSignalR must be used within a SignalRProvider');
  }
  return context;
};
