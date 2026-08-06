# Use stable Node 22 (LTS) image
FROM node:22-alpine

# Install OpenSSL and glibc compatibility library required by Prisma Engine
RUN apk add --no-cache openssl libc6-compat

WORKDIR /usr/src/app

# Copy package.json and package-lock.json
# COPY . .  
COPY package.json ./

# Install pnpm v9 globally (doesn't have pnpm 10's strict script blocking)
RUN npm install -g pnpm@9

# Copy lockfile and package first to utilize Docker layer caching
# COPY package.json pnpm-lock.yaml* ./

# Install dependencies 
RUN pnpm install    

# Copy application files
COPY . .

# Generate Prisma Client (uncomment if you need it during image build)
RUN pnpm run generate

# Build TypeScript code
RUN pnpm run build  

EXPOSE 3002

CMD ["pnpm", "run", "dev"]