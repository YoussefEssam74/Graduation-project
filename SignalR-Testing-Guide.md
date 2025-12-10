# IntelliFit SignalR Testing Guide

## 🚀 Quick Start

### Method 1: HTML Test Page (Easiest)

1. **Run the PowerShell script:**

   ```powershell
   cd "d:\Youssef\Projects\_Graduation Project\Project Repo\Graduation-project"
   .\Test-SignalR.ps1
   ```

   This will open the HTML test page in your browser.

2. **Get JWT Token:**

   - Login via the API or register a new user
   - Copy the JWT token from the response

3. **Connect to SignalR:**
   - Paste token in the HTML page
   - Click "Connect to Notifications Hub"
   - Click "Connect to Chat Hub"
   - Start testing!

---

## 🧪 Testing Methods

### 1. Browser HTML Test Page

**Location:** `SignalR-Test.html`

**Features:**

- ✅ Connect to both hubs
- ✅ Send notifications
- ✅ AI chat testing
- ✅ Real-time message display
- ✅ Console logging
- ✅ Test scenarios

**Usage:**

1. Open `SignalR-Test.html` in browser
2. Enter JWT token
3. Connect to hubs
4. Use buttons to test features

---

### 2. Browser Console (Developer Tools)

**Open Console:** Press `F12` → Console tab

**JavaScript Code:**

```javascript
// Install SignalR library (already included in HTML page)

// Connect to Notification Hub
const notificationConnection = new signalR.HubConnectionBuilder()
  .withUrl("http://localhost:5025/hubs/notifications", {
    accessTokenFactory: () => "YOUR_JWT_TOKEN_HERE",
  })
  .withAutomaticReconnect()
  .build();

// Listen for notifications
notificationConnection.on("ReceiveNotification", (notification) => {
  console.log("Notification received:", notification);
});

// Start connection
await notificationConnection.start();
console.log("Connected to Notification Hub!");

// Send test notification
await notificationConnection.invoke(
  "SendNotificationToAll",
  "Test Title",
  "Test Message",
  "info"
);

// Connect to Chat Hub
const chatConnection = new signalR.HubConnectionBuilder()
  .withUrl("http://localhost:5025/hubs/chat", {
    accessTokenFactory: () => "YOUR_JWT_TOKEN_HERE",
  })
  .withAutomaticReconnect()
  .build();

// Listen for messages
chatConnection.on("ReceiveMessage", (message) => {
  console.log("Message received:", message);
});

// Start connection
await chatConnection.start();
console.log("Connected to Chat Hub!");

// Send AI message
await chatConnection.invoke("SendAIMessage", "Hello AI!");
```

---

### 3. Frontend Integration (React/Next.js)

**Install Package:**

```bash
npm install @microsoft/signalr
```

**React Hook Example:**

```typescript
// hooks/useSignalR.ts
import { useEffect, useState } from "react";
import * as signalR from "@microsoft/signalr";

export function useNotifications(token: string) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [connection, setConnection] = useState<signalR.HubConnection | null>(
    null
  );

  useEffect(() => {
    if (!token) return;

    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl("http://localhost:5025/hubs/notifications", {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .build();

    newConnection.on("ReceiveNotification", (notification) => {
      setNotifications((prev) => [...prev, notification]);
    });

    newConnection
      .start()
      .then(() => console.log("Connected to SignalR"))
      .catch((err) => console.error("SignalR Error:", err));

    setConnection(newConnection);

    return () => {
      newConnection.stop();
    };
  }, [token]);

  return { notifications, connection };
}

// Usage in component:
const { notifications, connection } = useNotifications(authToken);
```

---

### 4. Testing with Multiple Users

**Scenario: Coach sends message to Member**

**Terminal 1 - Coach:**

```javascript
// Get coach token
const coachToken = "COACH_JWT_TOKEN";

const coachChat = new signalR.HubConnectionBuilder()
  .withUrl("http://localhost:5025/hubs/chat", {
    accessTokenFactory: () => coachToken,
  })
  .build();

await coachChat.start();

// Send message to member (ID: 5)
await coachChat.invoke(
  "SendMessageToMember",
  5,
  "Hello! Ready for your workout?"
);
```

**Terminal 2 - Member:**

```javascript
// Get member token
const memberToken = "MEMBER_JWT_TOKEN";

const memberChat = new signalR.HubConnectionBuilder()
  .withUrl("http://localhost:5025/hubs/chat", {
    accessTokenFactory: () => memberToken,
  })
  .build();

memberChat.on("ReceiveMessage", (message) => {
  console.log("Message from coach:", message);
});

await memberChat.start();
```

---

## 📊 SignalR Hub Methods

### Notification Hub (`/hubs/notifications`)

| Method                  | Parameters           | Description               |
| ----------------------- | -------------------- | ------------------------- |
| `SendNotificationToAll` | title, message, type | Broadcast to all users    |
| `MarkAsRead`            | notificationId       | Mark notification as read |

**Events:**

- `ReceiveNotification` - Receive notifications
- `NotificationRead` - Notification marked as read

---

### Chat Hub (`/hubs/chat`)

| Method                | Parameters        | Description             |
| --------------------- | ----------------- | ----------------------- |
| `SendAIMessage`       | message           | Send message to AI      |
| `SendMessageToCoach`  | coachId, message  | Send to specific coach  |
| `SendMessageToMember` | memberId, message | Send to specific member |
| `UserTyping`          | recipientId       | Show typing indicator   |
| `UserStoppedTyping`   | recipientId       | Hide typing indicator   |

**Events:**

- `ReceiveMessage` - Receive chat messages
- `UserTyping` - User started typing
- `UserStoppedTyping` - User stopped typing

---

## 🔍 Troubleshooting

### Connection Fails

**Check:**

1. ✅ API is running at `http://localhost:5025`
2. ✅ JWT token is valid (not expired)
3. ✅ CORS is configured correctly
4. ✅ Token includes userId claim

**Test API:**

```powershell
Invoke-RestMethod -Uri "http://localhost:5025/swagger/index.html"
```

### Token Issues

**Get new token:**

```powershell
$body = @{
    email = "test99@intellifit.com"
    password = "password123"
    role = 0
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:5025/api/auth/login" `
    -Method Post -Body $body -ContentType "application/json"

$token = $response.data.token
Write-Host "Token: $token"
```

### WebSocket Connection Refused

**Possible causes:**

- API not running
- Firewall blocking WebSocket
- Browser blocking insecure WebSocket (use HTTPS in production)

**Check in browser:**

1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "WS" (WebSocket)
4. Look for connection to `/hubs/notifications` or `/hubs/chat`

### CORS Error

**Check Program.cs:**

```csharp
// Should have:
.WithOrigins("http://localhost:3000")
.AllowCredentials()
```

---

## 🎯 Test Scenarios

### 1. Booking Notification Flow

```javascript
// User creates booking
await notificationConnection.invoke(
  "SendNotificationToAll",
  "Booking Confirmed",
  "Your session at 3:00 PM has been confirmed",
  "success"
);
```

### 2. Workout Plan Assignment

```javascript
await notificationConnection.invoke(
  "SendNotificationToAll",
  "New Workout Plan",
  "Coach John assigned you: Full Body Strength Training",
  "info"
);
```

### 3. Real-time Chat

```javascript
// Coach → Member
await chatConnection.invoke(
  "SendMessageToMember",
  5,
  "Great progress today! Keep it up!"
);

// Member → Coach
await chatConnection.invoke(
  "SendMessageToCoach",
  2,
  "Thank you! Can we adjust next week's schedule?"
);
```

### 4. AI Chat

```javascript
await chatConnection.invoke(
  "SendAIMessage",
  "What exercises should I do for back pain?"
);
```

---

## 📱 Production Setup

### Frontend Environment Variables

```env
NEXT_PUBLIC_API_URL=https://your-api.com/api
NEXT_PUBLIC_SIGNALR_URL=https://your-api.com/hubs
```

### HTTPS Configuration

For production, update CORS in `Program.cs`:

```csharp
policy.WithOrigins("https://your-frontend.com")
      .AllowCredentials();
```

---

## 🐛 Debug Mode

Enable detailed logging:

```javascript
const connection = new signalR.HubConnectionBuilder()
  .withUrl("http://localhost:5025/hubs/notifications", {
    accessTokenFactory: () => token,
  })
  .configureLogging(signalR.LogLevel.Debug) // Add this
  .withAutomaticReconnect()
  .build();
```

---

## 📞 Support

If issues persist:

1. Check API logs in Visual Studio/Console
2. Verify database connection
3. Ensure all packages installed: `dotnet restore`
4. Rebuild solution: `dotnet build`

**Test API health:**

```powershell
Invoke-RestMethod -Uri "http://localhost:5025/swagger/index.html"
```
