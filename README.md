# DocuSense

> An AI-powered document repository for HR teams. HR uploads files, shares them with employees or groups, and employees can read and ask an AI assistant questions — answered strictly from the document itself.

---

## System Architecture

```mermaid
graph TB
    subgraph Client["🖥️ Client (React + Vite)"]
        UI["Pages & Components"]
        AUTH_CTX["Auth Context"]
        AXIOS["Axios (interceptors)"]
    end

    subgraph Server["⚙️ Server (Node.js / Express)"]
        ROUTES["Routes /api/v1"]
        MW["Middlewares\n(auth, role, ownership)"]
        CTRL["Controllers"]
        SVC["Services"]
        QUEUE["BullMQ Queue"]
        WORKER["RAG Worker"]
    end

    subgraph Storage["💾 Storage"]
        MONGO[("MongoDB\n+ Vector Index")]
        REDIS[("Redis\n(job queue)")]
        S3["AWS S3\n(file blobs)"]
    end

    subgraph AI["🤖 Google Gemini"]
        EMBED["gemini-embedding-2\n(768-dim vectors)"]
        GEN["gemini-3.1-flash-lite\n(answer generation)"]
    end

    UI --> AXIOS --> ROUTES
    ROUTES --> MW --> CTRL --> SVC
    SVC --> MONGO
    SVC --> S3
    CTRL --> QUEUE --> REDIS
    REDIS --> WORKER
    WORKER --> EMBED --> MONGO
    SVC --> EMBED
    SVC --> GEN
```

---

## Technology Stack

| Layer | Tech |
|---|---|
| Frontend | React 19 (Vite), React Router v7, Axios |
| UI | Glassmorphism, react-pdf, mammoth (DOCX), react-markdown, framer-motion |
| Backend | Node.js, Express |
| Database | MongoDB (`mongodb-atlas-local` — includes Vector Search) |
| AI | Google Gemini — `gemini-embedding-2` embeddings, `gemini-3.1-flash-lite` generation |
| Queue | BullMQ + Redis (background RAG processing) |
| File Storage | AWS S3 (MinIO locally — same API) |
| Auth | JWT (15 min access token + httpOnly refresh cookie) + Google OAuth 2.0 |
| Validation | Zod — env vars and all request bodies |
| Logging | Winston |
| Infra | Docker Compose + Terraform (EC2, S3, IAM, Elastic IP) |

---

## Role Permissions

```mermaid
graph LR
    subgraph HR["👔 HR Role"]
        H1["Upload documents"]
        H2["Write usage notes"]
        H3["Share with users / groups"]
        H4["Set access expiry"]
        H5["Revoke access"]
        H6["Search employee directory"]
        H7["Create & manage groups"]
        H8["Download own uploads"]
        H9["Chat with own documents"]
    end

    subgraph EMP["👤 Employee Role"]
        E1["See documents shared with them"]
        E2["Read usage notes"]
        E3["Download shared files"]
        E4["Chat with accessible documents"]
    end

    subgraph BOTH["✅ Both Roles"]
        B1["Login with email/password"]
        B2["Login with Google OAuth"]
        B3["Silent session refresh"]
    end
```

> **All permissions are enforced server-side on every request. The client cannot bypass them.**

---

## Authentication Flow

### Local Auth (Email + Password)

```mermaid
sequenceDiagram
    participant U as User
    participant C as Client
    participant S as Server
    participant DB as MongoDB

    U->>C: Enter email + password
    C->>S: POST /auth/login
    S->>DB: Find user, compare bcrypt hash
    DB-->>S: User record
    S-->>C: { accessToken } + Set-Cookie: refreshToken (httpOnly)
    C->>C: Store accessToken in memory (Auth Context)

    Note over C,S: Every API call includes accessToken in Authorization header

    Note over C,S: When accessToken expires (15 min)...
    C->>S: POST /auth/refresh (sends cookie automatically)
    S->>S: Verify refresh token
    S-->>C: New accessToken
```

### Google OAuth Flow

```mermaid
sequenceDiagram
    participant U as User
    participant C as Client
    participant S as Server
    participant G as Google

    U->>C: Click "Sign in with Google"
    C->>S: GET /auth/google
    S->>G: Redirect to Google consent screen
    G->>U: Show consent screen
    U->>G: Approve
    G->>S: GET /auth/google/callback?code=...
    S->>G: Exchange code for profile
    G-->>S: { email, name, picture }

    alt First-time user (no account)
        S-->>C: Redirect with pending token
        C->>U: Show "Pick your role" screen
        U->>C: Choose HR or Employee
        C->>S: POST /auth/google/complete { role, pendingToken }
        S->>DB: Create user account
        S-->>C: { accessToken } + Set-Cookie: refreshToken
    else Returning user
        S-->>C: Redirect with accessToken in URL param
        C->>C: Extract token, store in context
    end
```

---

## RAG Pipeline

### Upload & Indexing (Background Job)

```mermaid
flowchart TD
    A["HR uploads file\nPOST /documents"] --> B["Server validates MIME type"]
    B --> C["Upload original file to S3"]
    C --> D["Create Document record in MongoDB\nstatus: pending"]
    D --> E["Enqueue RAG job → BullMQ / Redis"]
    E --> F["Return 201 to client immediately"]

    E -.->|"background"| G["RAG Worker picks up job"]
    G --> H{"File type?"}
    H -->|"PDF"| I["pdf-parse → raw text"]
    H -->|"DOCX"| J["mammoth → plain text"]
    H -->|"TXT"| K["read directly"]

    I & J & K --> L["Split text into chunks\n2000 chars, 200 overlap"]
    L --> M["For each chunk:\nGemini gemini-embedding-2\n→ 768-dim vector"]
    M --> N["Store chunks + vectors\nin MongoDB DocumentChunk collection"]
    N --> O["Update Document status: ready"]
    O --> P["Client polls /rag-status\n→ Chat tab unlocks"]

    style G fill:#1e3a5f,color:#fff
    style E fill:#0f4c81,color:#fff
```

### Chat / Question Answering

```mermaid
flowchart TD
    A["User asks a question\nPOST /documents/:id/chat"] --> B["Embed question\ngemini-embedding-2 → vector"]
    B --> C["MongoDB Vector Search\nagainst this document's chunks"]
    C --> D{"Any chunk\nsimilarity ≥ 0.5?"}

    D -->|"No"| E["Return:\n'I don't know'\nGemini NOT called"]
    D -->|"Yes"| F["Collect top-k matching chunks"]
    F --> G["Build prompt:\n'Using ONLY these passages, answer the question'"]
    G --> H["Call gemini-3.1-flash-lite\nwith document-only context"]
    H --> I["Return answer + source chunk references"]
    I --> J["Save to ChatHistory in MongoDB"]

    style E fill:#7b1c1c,color:#fff
    style H fill:#1a4731,color:#fff
```

---

## Document Access Control

```mermaid
flowchart TD
    A["Request: GET /documents/:id"] --> B{"Is user\nauthenticated?"}
    B -->|"No"| ERR1["401 Unauthorized"]
    B -->|"Yes"| C{"Is user the\ndocument owner?"}
    C -->|"Yes (HR)"| DOC["Return document"]
    C -->|"No"| D{"Does user have\nan active access grant?"}
    D -->|"No"| ERR2["404 Not Found\n(existence not revealed)"]
    D -->|"Yes"| E{"Is grant expired?"}
    E -->|"Yes"| ERR3["403 Access Expired"]
    E -->|"No"| DOC

    subgraph Access Grant
        AG1["Granted to: user OR group"]
        AG2["Optional: expiresAt date"]
        AG3["Can be revoked anytime by HR"]
    end
```

---

## Document Viewer

```mermaid
graph LR
    subgraph Viewer["Built-in Document Viewer"]
        direction TB
        PDF["📄 PDF\nreact-pdf\nzoom + page nav"]
        DOCX["📝 DOCX\nmammoth → HTML\nin-browser render"]
        TXT["📃 TXT\nmonospace\nplain text"]
    end

    subgraph Chat["AI Chat Panel"]
        INLINE["📎 Inline DocuBot\n(per-document viewer)"]
        GLOBAL["🌐 DocuSense AI\n(dashboard — all docs)"]
    end

    PDF & DOCX & TXT --> INLINE
    INLINE -.->|"float button"| GLOBAL
```

---

## API Reference

### Auth — `/api/v1/auth`

```mermaid
graph LR
    R["/register\nPOST"] --> A["Create HR or Employee account"]
    L["/login\nPOST"] --> B["Returns accessToken + sets cookie"]
    RF["/refresh\nPOST"] --> C["Silent refresh via httpOnly cookie"]
    LO["/logout\nPOST"] --> D["Clears refresh cookie"]
    ME["/me\nGET"] --> E["Current user profile"]
    GO["/google\nGET"] --> F["Start OAuth flow"]
    GC["/google/callback\nGET"] --> G["Handle Google redirect"]
    GK["/google/complete\nPOST"] --> H["Set role for first-time Google user"]
```

### Documents — `/api/v1/documents`

```mermaid
graph LR
    subgraph HR_Only["🔒 HR Only"]
        UP["POST /\nUpload file"]
        GU["PATCH /:id/guidelines\nEdit usage notes"]
        DEL["DELETE /:id\nSoft delete"]
        GA["POST /:id/access\nGrant access"]
        LA["GET /:id/access\nList grants"]
        RA["DELETE /:id/access/:accessId\nRevoke grant"]
    end

    subgraph Shared["🔓 Owner or Granted"]
        GD["GET /:id\nDocument metadata"]
        DL["GET /:id/download\nPresigned S3 URL (5 min)"]
        RS["GET /:id/rag-status\nIs AI ready?"]
        CH["POST /:id/chat\nAsk AI a question"]
        HI["GET /:id/chat/history\nPast conversations"]
    end

    subgraph List["📋 Role-based list"]
        LS["GET /\nHR → own uploads\nEmployee → shared docs"]
    end
```

### HR — `/api/v1/hr`

```mermaid
graph LR
    DS["/directory/search?q=\nGET"] --> A["Search employees by name or email"]
    CG["/groups\nPOST"] --> B["Create a group"]
    LG["/groups\nGET"] --> C["List your groups"]
    GG["/groups/:id\nGET"] --> D["Get one group with members"]
    UG["/groups/:id\nPATCH"] --> E["Rename or update members"]
    DG["/groups/:id\nDELETE"] --> F["Delete group + revoke its access"]
```

---

## AWS Infrastructure (Terraform)

```mermaid
graph TB
    subgraph AWS["☁️ AWS (ap-south-1)"]
        subgraph VPC["Default VPC"]
            subgraph EC2_BOX["EC2 t3.medium (Amazon Linux 2023)"]
                NG["nginx :80\n(reverse proxy)"]
                FE["frontend container\nReact static files"]
                BE["backend container\nNode.js :5000"]
                MG["mongo container\n(Atlas Local + Vector Search)"]
                RD["redis container"]
            end
            EIP["Elastic IP\n(fixed public IP)"]
            SG["Security Group\nPort 80: open\nPort 22: your IP only"]
        end
        S3B["S3 Bucket\n(private, AES-256 encrypted)\ndocument file storage"]
        IAM["IAM Role + Instance Profile\nEC2 → S3 access\n(no credentials in code)"]
    end

    USER["👤 User Browser"] -->|"HTTP :80"| EIP
    EIP --> SG --> NG
    NG -->|"/* static"| FE
    NG -->|"/api/* proxy"| BE
    BE --> MG
    BE --> RD
    BE -->|"IAM role"| S3B
    IAM -.->|"attached to"| EC2_BOX
```

### What Terraform Creates

| Resource | Purpose |
|---|---|
| EC2 t3.medium | Runs all 4 Docker containers |
| Elastic IP | Fixed public IP that survives restarts |
| S3 bucket (private) | Document file storage, AES-256 encrypted |
| IAM role + instance profile | Lets EC2 access S3 — no credentials in code |
| Security group | Port 80 open, SSH locked to your IP only |

---

## Deployment Flow

```mermaid
flowchart TD
    A["Developer: terraform apply"] --> B["AWS creates EC2 + S3 + IAM + EIP"]
    B --> C["EC2 boots → user_data.sh runs"]
    C --> D["Install Docker + Docker Compose"]
    D --> E["git clone repo from GitHub"]
    E --> F["Write /opt/docusense/infra/.env\nwith all secrets from Terraform vars"]
    F --> G["docker compose -f docker-compose.prod.yml up --build"]
    G --> H{"All 4 containers up?"}
    H -->|"No"| I["Check: docker compose logs"]
    H -->|"Yes"| J["App live at http://ELASTIC_IP"]

    subgraph Update["♻️ Updating After Code Push"]
        U1["ssh into EC2"]
        U2["git pull"]
        U3["docker compose up -d --build"]
        U1 --> U2 --> U3
    end
```

---

## Running Locally

```mermaid
flowchart LR
    A["docker compose -f infra/docker-compose.dev.yml up -d"]
    A --> MG2["MongoDB :27017\n+ Vector Search"]
    A --> MINIO["MinIO :9000\n(S3-compatible)"]
    A --> RD2["Redis :6379"]

    B["cd server && npm run dev"] --> SRV["Express :5000"]
    C["cd client && npm run dev"] --> CLT["React :5173"]

    SRV --> MG2 & MINIO & RD2
    CLT -->|"API calls"| SRV
```

**Required `server/.env` variables:**

| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB connection string |
| `JWT_ACCESS_SECRET` | Secret for access tokens (min 32 chars) |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens (different from above) |
| `PENDING_ROLE_TOKEN_SECRET` | Secret for Google OAuth pending-role tokens |
| `CLIENT_ORIGIN` | Frontend URL for CORS (`http://localhost:5173`) |
| `S3_ENDPOINT` | MinIO URL locally (`http://localhost:9000`) |
| `S3_REGION` | S3 region |
| `S3_BUCKET` | Bucket name |
| `S3_ACCESS_KEY_ID` | S3 / MinIO access key |
| `S3_SECRET_ACCESS_KEY` | S3 / MinIO secret key |
| `GEMINI_API_KEY` | Google Gemini API key |
| `REDIS_URL` | Redis URL (`redis://localhost:6379`) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_REDIRECT_URI` | OAuth callback URL |

---

## Security Model

```mermaid
flowchart TD
    subgraph Every_Request["Every API Request"]
        R["Incoming request"] --> AT{"Valid\naccessToken?"}
        AT -->|"No / Expired"| U1["401 — client auto-refreshes via cookie"]
        AT -->|"Yes"| RL{"Correct\nrole?"}
        RL -->|"No"| U2["403 Forbidden"]
        RL -->|"Yes"| OWN{"Owns resource\nor has grant?"}
        OWN -->|"No"| U3["404 Not Found\n(no 403 — existence hidden)"]
        OWN -->|"Yes"| OK["Process request ✅"]
    end

    subgraph Protections["Additional Protections"]
        P1["Passwords: bcrypt cost 12"]
        P2["Access token TTL: 15 minutes"]
        P3["Refresh token: httpOnly cookie\n(JS cannot read it)"]
        P4["File type: checked by MIME, not extension"]
        P5["Download URLs: presigned S3, expire in 5 min"]
        P6["S3 credentials: EC2 IAM role (zero stored keys)"]
        P7["Zod validation on all inputs"]
        P8["Errors: full detail logged server-side only\nnever exposed to client"]
    end
```

---

## Server Folder Structure

```
server/src/
├── app.js               # Express app setup, middleware, routes
├── server.js            # HTTP server + graceful shutdown
├── config/              # env validation (Zod), DB connect, S3 client
├── controllers/         # auth, documents, hr
├── middlewares/         # authenticate, requireRole, requireOwnership
├── models/              # User, Document, DocumentChunk, AccessGrant,
│                        # Group, ChatHistory
├── queues/              # BullMQ queue definition
├── routes/              # /auth, /documents, /hr
├── services/            # auth, document, hr, rag (embed + search + generate)
├── utils/               # logger (Winston), errors, asyncHandler
├── validators/          # Zod schemas for request bodies
└── workers/             # rag.worker.js — background embedding job
```

## Client Folder Structure

```
client/src/
├── App.jsx              # Router + protected route wrappers
├── context/             # AuthContext (token storage + refresh)
├── hooks/               # useAuth, useDocuments, usePolling
├── layouts/             # AppLayout (sidebar + header)
├── pages/               # Login, Dashboard, DocumentView, Admin
├── components/          # ChatBot, DocumentViewer, GroupManager, …
├── services/            # Axios instance + API call functions
└── utils/               # token helpers, date formatting
```
