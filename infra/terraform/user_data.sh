#!/bin/bash
set -e

yum update -y
yum install -y git docker
systemctl enable docker
systemctl start docker

mkdir -p /usr/local/lib/docker/cli-plugins
curl -SL https://github.com/docker/compose/releases/download/v2.27.0/docker-compose-linux-x86_64 \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

cd /opt
git clone ${REPO_URL} docusense
cd docusense

cat > infra/.env <<EOF
MONGO_USER=${MONGO_USER}
MONGO_PASSWORD=${MONGO_PASSWORD}

JWT_ACCESS_SECRET=${JWT_ACCESS_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
PENDING_ROLE_TOKEN_SECRET=${PENDING_ROLE_TOKEN_SECRET}

CLIENT_ORIGIN=${CLIENT_ORIGIN}

S3_REGION=${S3_REGION}
S3_BUCKET=${S3_BUCKET}
S3_ACCESS_KEY_ID=${S3_ACCESS_KEY_ID}
S3_SECRET_ACCESS_KEY=${S3_SECRET_ACCESS_KEY}
GEMINI_API_KEY=${GEMINI_API_KEY}

MAX_UPLOAD_SIZE_MB=20

GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
GOOGLE_REDIRECT_URI=${CLIENT_ORIGIN}/api/v1/auth/google/callback

EOF

cd infra
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
