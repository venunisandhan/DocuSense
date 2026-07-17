# DocuSense

An AI-powered document repository for HR teams. HR uploads files, shares them with employees or groups, and employees can read and ask an AI assistant questions — answered strictly from the document itself.

---

## What it does

**HR** uploads PDF, DOCX, or TXT files, writes a usage note for each, and shares them — with one person or a whole group, permanently or with an expiry date. Access can be revoked at any time.

**Employees** see only what's been shared with them. They can read usage notes, download files, and ask the AI assistant questions about the document content. The assistant refuses to answer anything not grounded in the document.

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 19 (Vite), React Router v7, Axios, Tailwind CSS v4 |
| UI | Glassmorphism design, react-pdf, mammoth (DOCX), react-markdown, framer-motion |
| Backend | Node.js, Express |
| Database | MongoDB (`mongodb-atlas-local` — includes Vector Search) |
| AI | Google Gemini — `gemini-embedding-2` for embeddings, `gemini-3.1-flash-lite` for answers |
| Queue | BullMQ + Redis (background RAG processing) |
| File storage | AWS S3 (MinIO locally, same API) |
| Auth | JWT (15 min access token + httpOnly refresh cookie) + Google OAuth |
| Validation | Zod — env vars and request bodies |
| Logging | Winston |
| Infra | Docker Compose + Terraform (EC2, S3, IAM, Elastic IP) |

---

## Roles

| Action | HR | Employee |
|---|---|---|
| Upload documents | ✓ | |
| Write usage notes | ✓ | |
| Share / revoke access, set expiry | ✓ | |
| Search employee directory | ✓ | |
| Create and manage groups | ✓ | |
| See documents shared with them | | ✓ |
| Read usage notes | ✓ | ✓ |
| Download files | own uploads | if access is active |
| Ask the AI assistant | own uploads | anything they can access |

All permissions are enforced server-side on every request.

---

## Auth

- **Local:** email + bcrypt-hashed password
- **Google OAuth:** Sign in with Google — first-time users pick a role (HR or Employee) once
- Access token lives 15 minutes; a silent refresh using the httpOnly cookie keeps the session alive

---

## RAG pipeline

**On upload:**
```
File → Extract text → Split into chunks → Embed each chunk (Gemini) → Store in MongoDB with vector index
```

**On question:**
```
Question → Embed (Gemini) → Vector search in this document's chunks → If similar enough → Ask Gemini (document only) → Return answer + source chunks
```

If nothing in the document is similar to the question, the model is never called — the app returns "I don't know" directly.

---

## Document viewer

The built-in viewer handles all supported file types without downloading:

| Type | Renderer |
|---|---|
| PDF | `react-pdf` with zoom and page navigation |
| DOCX | `mammoth` — rendered as HTML |
| TXT | Plain text with monospace font |

Each viewer has an inline **DocuBot** chat panel. A floating **DocuSense AI** button on the dashboard opens a global chat across all accessible documents.

---

## API

Base path: `/api/v1`. All responses: `{ success, data }` or `{ success: false, error }`.

**Auth** — `/auth`

| Method | Path | Description |
|---|---|---|
| POST | `/register` | Register as HR or Employee |
| POST | `/login` | Returns access token, sets refresh cookie |
| POST | `/refresh` | Silent token refresh via cookie |
| POST | `/logout` | Clears refresh cookie |
| GET | `/me` | Current user profile |
| GET | `/google` | Start Google OAuth flow |
| GET | `/google/callback` | Google OAuth redirect handler |
| POST | `/google/complete` | Set role for first-time Google user |

**HR** — `/hr`

| Method | Path | Description |
|---|---|---|
| GET | `/directory/search?q=` | Search employees by name or email |
| POST | `/groups` | Create a group |
| GET | `/groups` | List your groups |
| GET | `/groups/:id` | Get one group with members |
| PATCH | `/groups/:id` | Rename or change members |
| DELETE | `/groups/:id` | Delete group and revoke its access |

**Documents** — `/documents`

| Method | Path | Who | Description |
|---|---|---|---|
| POST | `/` | HR | Upload a file (triggers background RAG processing) |
| GET | `/` | HR / Employee | List uploads (HR) or shared documents (Employee) |
| GET | `/:id` | Owner or granted | Document metadata and usage notes |
| GET | `/:id/download` | Owner or granted | Presigned S3 download URL |
| PATCH | `/:id/guidelines` | HR (owner) | Edit usage notes |
| DELETE | `/:id` | HR (owner) | Soft delete, revokes all access |
| POST | `/:id/access` | HR (owner) | Grant access to a user or group |
| GET | `/:id/access` | HR (owner) | List active access grants |
| DELETE | `/:id/access/:accessId` | HR (owner) | Revoke one grant |
| GET | `/:id/rag-status` | Owner or granted | Check if AI processing is ready |
| POST | `/:id/chat` | Owner or granted | Ask the AI a question |
| GET | `/:id/chat/history` | Owner or granted | Past questions and answers |

---

## Running locally

**Start dependencies:**
```bash
docker compose -f infra/docker-compose.dev.yml up -d
```
This starts MongoDB (with Vector Search), MinIO (S3-compatible), and Redis.

**Start the server:**
```bash
cd server
cp .env.example .env   # fill in values (see below)
npm install
npm run dev            # http://localhost:5000
```

**Start the client:**
```bash
cd client
npm install
npm run dev            # http://localhost:5173
```

**Required environment variables (`server/.env`):**

| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB connection string |
| `JWT_ACCESS_SECRET` | Secret for access tokens (min 16 chars) |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens (different from above) |
| `CLIENT_ORIGIN` | Frontend URL for CORS (e.g. `http://localhost:5173`) |
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
| `PENDING_ROLE_TOKEN_SECRET` | Secret for pending Google OAuth role token |

---

## Deploying to AWS

One-time setup on your machine:

```bash
# AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip && sudo ./aws/install

# Terraform
sudo apt install -y terraform

# SSH key
ssh-keygen -t ed25519 -f ~/.ssh/docusense_key
```

**Steps:**

1. Create an IAM user in the AWS Console with `AdministratorAccess`, generate an access key, and run `aws configure`.

2. Create `infra/terraform/terraform.tfvars` (never commit this file):
```hcl
aws_region            = "ap-south-1"
my_ip_cidr            = "YOUR_IP/32"          # curl https://checkip.amazonaws.com
ssh_public_key        = "ssh-ed25519 AAAA..."  # cat ~/.ssh/docusense_key.pub
repo_url              = "https://github.com/venunisandhan/DocuSense.git"
s3_bucket_name        = "docusense-documents-venunisandhan-2024"
mongo_password        = "StrongPassword123!"
jwt_access_secret     = "..."                  # openssl rand -hex 32
jwt_refresh_secret    = "..."                  # openssl rand -hex 32
pending_role_token_secret = "..."              # openssl rand -hex 32
gemini_api_key        = "YOUR_GEMINI_KEY"
google_client_id      = "....apps.googleusercontent.com"
google_client_secret  = "GOCSPX-..."
```

3. Deploy:
```bash
cd infra/terraform
terraform init
terraform plan
terraform apply
```

4. Terraform outputs the EC2 IP. Add this to your Google OAuth client's **Authorized redirect URIs**:
```
http://<EC2_IP>/api/v1/auth/google/callback
```

5. Wait ~7 minutes for the EC2 startup script to finish installing Docker and starting all containers:
```bash
ssh -i ~/.ssh/docusense_key ec2-user@<EC2_IP>
sudo docker ps   # should show 4 containers
```

6. Open `http://<EC2_IP>` — done.

**What Terraform creates:**

| Resource | Purpose |
|---|---|
| EC2 t3.medium | Runs all 4 Docker containers |
| Elastic IP | Fixed public IP that survives restarts |
| S3 bucket (private) | Document file storage |
| IAM role | Lets EC2 access S3 — no keys stored in code |
| Security group | Port 80 open, SSH locked to your IP only |

**Managing the server:**
```bash
ssh -i ~/.ssh/docusense_key ec2-user@<EC2_IP>
cd /opt/docusense/infra

# Logs
sudo docker compose -f docker-compose.prod.yml logs -f

# Redeploy after a code push
cd /opt/docusense && git pull && cd infra
sudo docker compose -f docker-compose.prod.yml up -d --build

# Tear down everything
cd infra/terraform && terraform destroy
```

---

## Security

- Passwords hashed with bcrypt (cost 12)
- Short-lived access tokens (15 min) with httpOnly cookie refresh
- Every request checks: authenticated → correct role → owns or has been granted access to this resource
- Resource existence is never revealed to unauthorized users (404, not 403)
- Zod validation on all inputs
- File type checked by MIME type, not just extension
- No AWS credentials stored anywhere in code — EC2 IAM role provides them
- Presigned download URLs expire in 5 minutes
- Errors logged in full server-side, never exposed to the client
