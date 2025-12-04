# Real-Time Chat & Notifications Implementation Summary

## Overview

Implemented real-time chat between members and coaches, and a notification system using SignalR.

## ✅ What Was Implemented

### 1. SignalR Connection Service

**File**: `codeflex-ai/src/lib/signalr/hubConnection.ts`

- Custom WebSocket-based SignalR connection
- Automatic reconnection with exponential backoff
- Connection state management (Connecting, Connected, Disconnected, Reconnecting)
- Support for both `invoke` (request-response) and `send` (fire-and-forget) patterns
- Event handler registration system

**Note**: This is a custom implementation. For production, consider using `@microsoft/signalr` package for full SignalR protocol support.

### 2. SignalR Context Provider

**File**: `codeflex-ai/src/contexts/SignalRContext.tsx`

Provides:

- `chatConnection` - Connection to ChatHub
- `notificationConnection` - Connection to NotificationHub
- `chatConnectionState` - Current chat connection status
- `notificationConnectionState` - Current notification connection status
- `sendMessageToCoach(coachId, message)` - Send message from member to coach
- `sendMessageToMember(memberId, message)` - Send message from coach to member
- `onChatMessage(callback)` - Listen for incoming chat messages
- `onNotification(callback)` - Listen for incoming notifications

**Features**:

- Auto-connects when user logs in
- Auto-disconnects on logout
- Uses JWT token from localStorage for authentication
- Manages two separate SignalR connections (chat and notifications)

### 3. Chat Dialog Component

**File**: `codeflex-ai/src/components/Chat/ChatDialog.tsx`

Reusable chat interface with:

- Message history display
- Real-time message updates
- Send message functionality
- Connection status indicator
- Responsive design
- Auto-scroll to latest message
- Differentiated styling for own vs. received messages

**Props**:

- `recipientId: number` - ID of the person to chat with
- `recipientName: string` - Display name of recipient
- `recipientRole: 'coach' | 'member'` - Type of recipient
- `onClose: () => void` - Close callback

### 4. Notification Listener Component

**File**: `codeflex-ai/src/components/Notifications/NotificationListener.tsx`

Real-time notification toasts:

- Listens for notifications from SignalR
- Displays toast notifications in top-right corner
- Auto-dismisses after 5 seconds
- Manual dismiss option
- Color-coded by type (success, error, warning, info)
- Animated slide-in entrance
- Shows icon based on notification type

### 5. Member Dashboard Integration

**File**: `codeflex-ai/src/app/dashboard/page.tsx`

**Changes**:

- Added "Message" button in "My Coach" card
- Opens `ChatDialog` when clicked
- Passes coach ID and name to chat dialog
- Only shows when coach is assigned

**Usage**:

1. Member views their assigned coach in dashboard
2. Clicks "Message" button
3. Chat dialog opens for real-time messaging with coach

### 6. Coach Dashboard Integration

**File**: `codeflex-ai/src/app/coach-dashboard/page.tsx`

**Changes**:

- Added message icon button next to each booking
- Extracts member ID and name from booking
- Opens `ChatDialog` when clicked
- Allows coach to message any member they have sessions with

**Usage**:

1. Coach views upcoming sessions
2. Clicks message icon next to member's booking
3. Chat dialog opens for real-time messaging with that member

### 7. Layout Updates

**File**: `codeflex-ai/src/app/layout.tsx`

**Changes**:

- Wrapped app with `SignalRProvider`
- Added `NotificationListener` component
- Ensures SignalR is available throughout the app

## 🔌 Backend Integration

### ChatHub Endpoints

**URL**: `http://localhost:5178/hubs/chat`

**Methods**:

- `SendMessageToCoach(int coachId, string message)` - Member sends to coach
- `SendMessageToMember(int memberId, string message)` - Coach sends to member
- `SendAIMessage(string message)` - User sends to AI coach

**Events**:

- `ReceiveMessage` - Client receives messages

**Message Format**:

```json
{
  "senderId": "123",
  "senderName": "John Doe",
  "message": "Hello!",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### NotificationHub Endpoints

**URL**: `http://localhost:5178/hubs/notifications`

**Events**:

- `ReceiveNotification` - Client receives notifications

**Notification Format**:

```json
{
  "title": "New Session Booked",
  "message": "You have a new session scheduled for tomorrow",
  "type": "info",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Authentication

- SignalR connections use JWT tokens
- Token is passed via query string: `?access_token={token}`
- Backend validates token and adds user to `user_{userId}` group
- All hub methods require `[Authorize]` attribute

## 📋 Testing Guide

### Prerequisites

1. Backend running on `http://localhost:5178`
2. Frontend running on `http://localhost:3000`
3. At least 2 users: 1 member and 1 coach
4. Member must have booked a session with the coach

### Test Member-to-Coach Chat

1. Login as **Member**
2. Navigate to Dashboard
3. Verify coach appears in "My Coach" section
4. Click "Message" button
5. Type a message and send
6. Verify message appears on right side (own message)

### Test Coach-to-Member Chat

1. Login as **Coach**
2. Navigate to Coach Dashboard
3. Find a booking with a member
4. Click message icon (speech bubble) next to booking
5. Type a message and send
6. Verify message appears on right side (own message)

### Test Bi-directional Chat

1. Open two browser windows/tabs
2. Login as Member in one, Coach in other
3. Member opens chat with coach
4. Coach opens chat with that member
5. Send messages from both sides
6. Verify messages appear in both windows in real-time

### Test Notifications

Notifications will appear when:

- Backend sends system notifications
- Booking status changes
- New sessions are scheduled

## 🔧 Configuration

### Environment Variables

Create/update `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:5178
```

### Connection States

Monitor connection in browser console:

- "Connected" - Ready to send/receive
- "Connecting" - Initial connection attempt
- "Reconnecting" - Lost connection, attempting to reconnect
- "Disconnected" - Not connected

## 🚀 Production Recommendations

### 1. Use Official SignalR Client

Install the official package:

```bash
npm install @microsoft/signalr
```

Update `hubConnection.ts`:

```typescript
import * as signalR from "@microsoft/signalr";

export function createHubConnection(hubUrl: string) {
  return new signalR.HubConnectionBuilder()
    .withUrl(hubUrl, {
      accessTokenFactory: () => getAuthToken() || "",
    })
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Information)
    .build();
}
```

### 2. Message Persistence

Current implementation only shows messages in real-time. Add:

- Database table for chat messages
- API endpoint to fetch message history
- Load history when chat opens
- Save messages to database when sent

### 3. Enhanced Features

Consider adding:

- **Typing Indicators**: Show when other person is typing
- **Read Receipts**: Mark messages as read
- **File Sharing**: Allow image/file uploads in chat
- **Push Notifications**: Notify users when chat is closed
- **Message Search**: Search through chat history
- **Emoji Support**: Add emoji picker
- **Message Reactions**: Allow reactions to messages

### 4. Error Handling

Add better error handling for:

- Connection failures
- Message send failures
- Token expiration
- Network issues

### 5. Performance

Optimize for production:

- Implement message pagination
- Lazy load old messages
- Compress large messages
- Cache recent conversations

## 📝 File Structure

```
codeflex-ai/
├── src/
│   ├── lib/
│   │   └── signalr/
│   │       └── hubConnection.ts          # SignalR connection service
│   ├── contexts/
│   │   └── SignalRContext.tsx            # SignalR context provider
│   ├── components/
│   │   ├── Chat/
│   │   │   └── ChatDialog.tsx            # Chat dialog component
│   │   └── Notifications/
│   │       └── NotificationListener.tsx   # Notification toast listener
│   └── app/
│       ├── layout.tsx                    # Added SignalR provider
│       ├── dashboard/
│       │   └── page.tsx                  # Member chat integration
│       └── coach-dashboard/
│           └── page.tsx                  # Coach chat integration
```

## 🐛 Known Limitations

1. **Custom WebSocket Implementation**: The current SignalR connection uses a custom WebSocket implementation that may not fully support all SignalR protocol features. Use `@microsoft/signalr` for production.

2. **No Message Persistence**: Messages are only stored in component state. They disappear on page refresh.

3. **No Chat History**: Previous conversations are not loaded when opening chat.

4. **No Offline Support**: Messages cannot be sent when disconnected.

5. **Single Chat Window**: Can only chat with one person at a time.

## 💡 Future Enhancements

- [ ] Message persistence to database
- [ ] Chat history API
- [ ] Multiple concurrent chat windows
- [ ] Notification sound effects
- [ ] Desktop notifications API
- [ ] Mobile push notifications
- [ ] Group chat support
- [ ] Video/voice call integration
- [ ] Scheduled messages
- [ ] Auto-responses for coaches

## 📚 Additional Documentation

See `SIGNALR_CHAT_IMPLEMENTATION.md` for detailed technical documentation and SignalR setup instructions.
