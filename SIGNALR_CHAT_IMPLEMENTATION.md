# SignalR Chat Implementation

## Overview

This implementation provides real-time chat between members and coaches using SignalR.

## Backend (Already Implemented)

The backend SignalR hubs are fully configured:

### ChatHub (`/hubs/chat`)

**Methods:**

- `SendMessageToCoach(int coachId, string message)` - Send message from member to coach
- `SendMessageToMember(int memberId, string message)` - Send message from coach to member
- `SendAIMessage(string message)` - Send message to AI coach

**Events:**

- `ReceiveMessage` - Receives messages with format: `{ senderId, senderName, message, timestamp }`

### NotificationHub (`/hubs/notifications`)

- Handles real-time notifications for the system

## Frontend Implementation

### Current Status

The frontend has been set up with:

1. **SignalR Connection Service** (`src/lib/signalr/hubConnection.ts`)

   - Custom WebSocket-based implementation
   - ⚠️ **Note**: ASP.NET Core SignalR uses a specific protocol. For production, you should install `@microsoft/signalr` package.

2. **SignalR Context** (`src/contexts/SignalRContext.tsx`)

   - Provides SignalR connection to all components
   - Auto-connects when user logs in
   - Auto-disconnects on logout

3. **Chat Dialog Component** (`src/components/Chat/ChatDialog.tsx`)

   - Reusable chat interface
   - Shows message history
   - Real-time message updates
   - Typing indicators ready

4. **Integration**
   - **Member Dashboard**: "Message" button in "My Coach" card opens chat with assigned coach
   - **Coach Dashboard**: Message icon next to each booking opens chat with that member

## Using Microsoft SignalR Client (Recommended)

### Installation

```powershell
cd codeflex-ai
npm install @microsoft/signalr
```

### Update hubConnection.ts

Replace the custom WebSocket implementation with:

```typescript
import * as signalR from "@microsoft/signalr";

export function createHubConnection(hubUrl: string): HubConnection {
  const connection = new signalR.HubConnectionBuilder()
    .withUrl(hubUrl, {
      accessTokenFactory: () => getAuthToken() || "",
    })
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Information)
    .build();

  return connection;
}
```

## Testing

### Member Side

1. Login as a member
2. Go to Dashboard
3. If you have a coach assigned, click "Message" button
4. Type and send messages

### Coach Side

1. Login as a coach
2. Go to Coach Dashboard
3. Click the message icon next to any booking
4. See messages from members and reply

### Backend Connection

- Ensure the backend is running on `http://localhost:5178`
- Update `NEXT_PUBLIC_API_URL` in `.env.local` if using a different URL

## Authentication

SignalR uses JWT tokens from `localStorage` for authentication:

- Token is automatically attached to connection via query string
- Backend validates token and assigns user to their group (`user_{userId}`)

## Message Format

All messages follow this structure:

```typescript
{
  senderId: number,
  senderName: string,
  message: string,
  timestamp: string (ISO 8601)
}
```

## Features Implemented

✅ Real-time bi-directional messaging
✅ Member-to-Coach chat
✅ Coach-to-Member chat  
✅ Auto-reconnection on disconnect
✅ Connection state indicators
✅ Message history in dialog
✅ Responsive chat UI

## Future Enhancements

- [ ] Message persistence to database
- [ ] Typing indicators
- [ ] Read receipts
- [ ] File/image sharing
- [ ] Push notifications when chat is closed
- [ ] Chat history from database
- [ ] Group chat for multiple members with one coach
