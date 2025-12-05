FROM debian:bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive \
    GLAMA_VERSION="1.0.0"

# Install Node.js 24, pnpm, and mcp-proxy
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    git && \
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    npm install -g mcp-proxy@5.5.4 pnpm@10.14.0 && \
    node --version && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the project
RUN pnpm run build

# Set default environment variables
ENV CACHE_ENABLED=true \
    CACHE_SIZE=104857600 \
    CACHE_TTL=300000 \
    CHUNK_SIZE=500 \
    MAX_FILE_SIZE=10737418240 \
    OVERLAP_LINES=10

# Start the server with mcp-proxy
CMD ["mcp-proxy", "node", "dist/index.js"]
