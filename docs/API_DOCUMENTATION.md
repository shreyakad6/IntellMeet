# IntellMeet API Documentation (v1.0.0)

Welcome to the **IntellMeet Enterprise API Reference**. IntellMeet provides a RESTful HTTP API paired with a real-time Socket.io signaling engine to power enterprise video meetings, AI summaries, automated Whisper speech-to-text transcription, and traceable team action items.

---

## 🌐 Base URL & Protocol

- **Local Development**: `http://localhost:5000/api`
- **Docker Production**: `http://localhost/api` (via Nginx reverse proxy)
- **Protocol**: HTTP/1.1 or HTTP/2 over TLS/HTTPS in production
- **Format**: All payloads and responses are `application/json; charset=utf-8` unless uploading multipart audio files (`multipart/form-data`).

---

## 🔐 Authentication & Headers

Protected routes require a valid JSON Web Token (JWT) passed in the `Authorization` header:

```http
Authorization: Bearer <JWT_ACCESS_TOKEN>
```

### Standard Response Structure

All endpoints return a standardized JSON envelope:

**Success Response (2xx)**:
```json
{
  "success": true,
  "message": "Operation completed successfully.",
  "data": { ... }
}
```

**Error Response (4xx / 5xx)**:
```json
{
  "success": false,
  "message": "Descriptive human-readable error explanation.",
  "errors": [ ... ]
}
```

---

## 📑 API Endpoints Summary

| Module | Method | Endpoint | Description | Auth Required |
|---|---|---|---|---|
| **Health** | `GET` | `/health` | System health check (MongoDB, Redis, Memory) | ❌ No |
| **Metrics** | `GET` | `/metrics` | Prometheus telemetry & runtime metrics | ❌ No |
| **Auth** | `POST` | `/api/auth/register` | Register new team user | ❌ No (Rate-limited) |
| **Auth** | `POST` | `/api/auth/login` | Authenticate user & issue JWT | ❌ No (Rate-limited) |
| **Auth** | `POST` | `/api/auth/refresh` | Rotate access token via refresh token | ❌ No |
| **Auth** | `GET` | `/api/auth/me` | Fetch authenticated user profile | ✅ Yes |
| **Auth** | `PUT` | `/api/auth/profile` | Update profile attributes (name, avatar) | ✅ Yes |
| **Meetings** | `GET` | `/api/meetings` | List meetings with filters (`status`, `isFavorite`, `tag`) | ✅ Yes |
| **Meetings** | `POST` | `/api/meetings` | Create or schedule a new meeting | ✅ Yes |
| **Meetings** | `GET` | `/api/meetings/:id` | Retrieve meeting details by ID | ✅ Yes |
| **Meetings** | `GET` | `/api/meetings/code/:code` | Retrieve meeting details by 9-digit code (`INT-XXX-XXX`) | ✅ Yes |
| **Meetings** | `PUT` | `/api/meetings/:id` | Update meeting title, timing, or agenda | ✅ Yes |
| **Meetings** | `PATCH` | `/api/meetings/:id/favorite`| Toggle favorite ⭐ bookmark status | ✅ Yes |
| **Meetings** | `DELETE`| `/api/meetings/:id` | Delete meeting (Host or Admin only) | ✅ Yes |
| **Meetings** | `POST` | `/api/meetings/:id/join` | Join a meeting session | ✅ Yes |
| **Meetings** | `POST` | `/api/meetings/:id/leave`| Leave a meeting session | ✅ Yes |
| **AI** | `POST` | `/api/ai/meetings/:id/transcribe` | Transcribe audio via Groq Whisper | ✅ Yes (Rate-limited) |
| **AI** | `GET` | `/api/ai/meetings/:id/transcript` | Fetch timestamped speech transcript | ✅ Yes |
| **AI** | `POST` | `/api/ai/meetings/:id/summary` | Generate executive summary via Google Gemini | ✅ Yes (Rate-limited) |
| **AI** | `GET` | `/api/ai/meetings/:id/summary` | Fetch generated summary & decisions | ✅ Yes |
| **AI** | `POST` | `/api/ai/meetings/:id/action-items`| Extract traceable action items from transcript | ✅ Yes (Rate-limited) |
| **Action Items**| `GET` | `/api/action-items` | List action items (`meetingId`, `status`, `assignee`) | ✅ Yes |
| **Action Items**| `POST` | `/api/action-items` | Manually record an action item | ✅ Yes |
| **Action Items**| `PATCH`| `/api/action-items/:id` | Update status, priority, or due date | ✅ Yes |
| **Action Items**| `POST` | `/api/action-items/:id/convert-to-task` | Push action item to team Kanban board | ✅ Yes |
| **Action Items**| `DELETE`| `/api/action-items/:id`| Remove action item | ✅ Yes |
| **Workspaces** | `GET` | `/api/workspaces` | List accessible team workspaces | ✅ Yes |
| **Workspaces** | `POST` | `/api/workspaces` | Create a new team workspace | ✅ Yes |
| **Workspaces** | `POST` | `/api/workspaces/:id/members` | Invite member to workspace (Owner/Admin) | ✅ Yes |
| **Tasks** | `GET` | `/api/tasks` | List Kanban tasks (`workspaceId`, `status`) | ✅ Yes |
| **Tasks** | `POST` | `/api/tasks` | Create new Kanban task | ✅ Yes |
| **Tasks** | `PATCH`| `/api/tasks/:id` | Update task status (`todo`, `in_progress`, `done`) | ✅ Yes |
| **Tasks** | `DELETE`| `/api/tasks/:id` | Delete Kanban task | ✅ Yes |
| **Chat** | `GET` | `/api/chat/:meetingId` | Fetch historical chat messages for a meeting | ✅ Yes |
| **Analytics** | `GET` | `/api/analytics/dashboard` | Retrieve workspace KPIs and activity history | ✅ Yes |

---

## 🔍 Detailed Endpoint Specifications

### 1. Authentication

#### `POST /api/auth/register`
Creates a new user profile and returns access + refresh tokens.

**Request Body**:
```json
{
  "name": "Sarah Connor",
  "email": "sarah.connor@intellmeet.io",
  "password": "SecurePassword123!",
  "department": "Platform Engineering"
}
```

**Response (201 Created)**:
```json
{
  "success": true,
  "message": "User registered successfully.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "671420b98721c81234567890",
    "name": "Sarah Connor",
    "email": "sarah.connor@intellmeet.io",
    "role": "member",
    "department": "Platform Engineering"
  }
}
```

---

#### `POST /api/auth/login`
Authenticates user credentials with bcrypt password validation.

**Request Body**:
```json
{
  "email": "alex.admin@intellmeet.io",
  "password": "Password123!"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Login successful.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "671420b98721c81234567891",
    "name": "Alex Rivera",
    "email": "alex.admin@intellmeet.io",
    "role": "admin"
  }
}
```

---

### 2. Meetings & Scheduling

#### `POST /api/meetings`
Creates an instant or scheduled meeting. Automatically generates a human-friendly meeting code (`INT-XXX-XXX`).

**Request Body**:
```json
{
  "title": "Sprint 44 Architecture & Canary Review",
  "type": "scheduled",
  "scheduledAt": "2026-10-21T14:00:00.000Z",
  "tags": ["Architecture", "Canary", "v1.2"],
  "settings": {
    "allowScreenShare": true,
    "requireHostApproval": false,
    "aiSummaryEnabled": true
  }
}
```

**Response (201 Created)**:
```json
{
  "success": true,
  "message": "Meeting scheduled successfully.",
  "meeting": {
    "_id": "671420b98721c81234567895",
    "title": "Sprint 44 Architecture & Canary Review",
    "meetingCode": "INT-482-901",
    "status": "scheduled",
    "scheduledAt": "2026-10-21T14:00:00.000Z",
    "isFavorite": false,
    "tags": ["Architecture", "Canary", "v1.2"],
    "host": "671420b98721c81234567891"
  }
}
```

---

#### `PATCH /api/meetings/:id/favorite`
Toggles the favorite ⭐ bookmark state for quick access in the library.

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Meeting added to favorites.",
  "isFavorite": true
}
```

---

### 3. AI Meeting Intelligence & Traceability

#### `POST /api/ai/meetings/:id/summary`
Executes summarization of the meeting transcript using Google Gemini (`gemini-1.5-flash`).

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Meeting summary generated successfully.",
  "summary": {
    "meetingId": "671420b98721c81234567895",
    "summary": "The engineering sync reviewed significant performance gains in WebRTC signaling latency, successful completion of database migration with validated indexing, and key upcoming release milestones.",
    "keyPoints": [
      "WebRTC signaling optimization resulted in a 35% latency reduction.",
      "MongoDB database indexing confirmed stable with sub-15ms queries."
    ],
    "decisions": [
      "Approved deployment of the staging canary build tomorrow morning at 10:00 AM.",
      "Finalized release v1.2 code freeze date for next Tuesday at 5:00 PM."
    ],
    "topicsCovered": ["Real-time WebRTC Performance", "Database Verification", "Security Compliance"],
    "sentiment": "constructive",
    "modelUsed": "Google Gemini (gemini-1.5-flash)"
  }
}
```

---

#### `POST /api/ai/meetings/:id/action-items`
Extracts action items from the meeting transcript with **source quote attribution** and **timestamp references**.

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Action items extracted successfully.",
  "isDemoMode": false,
  "actionItems": [
    {
      "_id": "671420b98721c81234567899",
      "task": "Update Helm charts and trigger canary deployment to staging",
      "description": "Deploy the latest container images to staging cluster and monitor error rates.",
      "assigneeName": "Marcus Vance",
      "priority": "high",
      "dueDate": "2026-10-22T10:00:00.000Z",
      "sourceQuote": "I will update the Helm charts and deploy the canary build to staging tomorrow morning at 10 AM.",
      "timestamp": "12:45",
      "speaker": "Marcus Vance",
      "status": "pending",
      "extractedByAi": true
    }
  ]
}
```

---

#### `POST /api/action-items/:id/convert-to-task`
Converts an action item into an interactive Kanban task. Automatically attaches the source quote to the task description for end-to-end accountability.

**Request Body**:
```json
{
  "workspaceId": "671420b98721c81234567888"
}
```

**Response (201 Created)**:
```json
{
  "success": true,
  "message": "Action item converted to Workspace Task.",
  "task": {
    "_id": "671420b98721c81234567999",
    "title": "Update Helm charts and trigger canary deployment to staging",
    "description": "Deploy the latest container images to staging cluster and monitor error rates.\n\n> \"I will update the Helm charts and deploy the canary build to staging tomorrow morning at 10 AM.\" — Marcus Vance [12:45]",
    "status": "todo",
    "priority": "high",
    "tags": ["Action Item", "Meeting Follow-up"],
    "sourceQuote": "I will update the Helm charts and deploy the canary build to staging tomorrow morning at 10 AM.",
    "timestamp": "12:45",
    "speaker": "Marcus Vance"
  }
}
```

---

## ⚡ Socket.io Real-Time Protocol

IntellMeet connects to Socket.io over `/socket.io/` with the following event schema:

### WebRTC Multi-Peer Signaling

| Event Name | Direction | Payload | Description |
|---|---|---|---|
| `join-room` | Client ➔ Server | `{ meetingId, user: { id, name, avatar } }` | Join meeting signaling room |
| `all-users` | Server ➔ Client | `[ { socketId, userId, name, avatar } ]` | Broadcast existing peers to new joiner |
| `sending-signal` | Client ➔ Server | `{ userToSignal, callerId, signal }` | Send WebRTC SDP Offer / ICE Candidate |
| `user-joined` | Server ➔ Client | `{ signal, callerId, user }` | Deliver SDP Offer to recipient peer |
| `returning-signal` | Client ➔ Server | `{ callerId, signal }` | Return WebRTC SDP Answer to caller |
| `receiving-returned-signal` | Server ➔ Client | `{ signal, id }` | Deliver SDP Answer to initiating peer |
| `user-left` | Server ➔ Client | `{ id }` | Notify when participant disconnects |

### Collaboration & Media Events

| Event Name | Direction | Payload | Description |
|---|---|---|---|
| `send-message` | Client ➔ Server | `{ meetingId, message, sender: { id, name, avatar } }` | Broadcast in-call text chat |
| `receive-message` | Server ➔ Client | `{ _id, meetingId, message, sender, createdAt }` | Relay message to all participants |
| `send-reaction` | Client ➔ Server | `{ meetingId, emoji, senderName }` | Send floating emoji reaction |
| `receive-reaction`| Server ➔ Client | `{ emoji, senderName }` | Display animated floating emoji |
| `task-updated` | Server ➔ Client | `{ task }` | Live Kanban board synchronization |

---

## 🛡️ Error Handling & Status Codes

| HTTP Status | Meaning | Typical Trigger |
|---|---|---|
| `200 OK` | Success | Successful read or update |
| `201 Created` | Resource Created | Registration, meeting or task creation |
| `400 Bad Request` | Invalid Input | Missing required fields or invalid Mongo ObjectId (`CastError`) |
| `401 Unauthorized` | Unauthenticated | Missing or expired JWT bearer token |
| `403 Forbidden` | Access Denied | Non-admin attempting to delete meeting or modify workspace |
| `404 Not Found` | Not Found | Meeting code or ID does not exist |
| `429 Too Many Requests`| Rate Limited | Exceeded 20 auth attempts / 15m or 30 AI requests / 60s |
| `500 Internal Error` | Server Exception | Unhandled backend exception (logged with stack trace) |
