# Use the official Node 20 image based on Alpine Linux
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /app

# Install bun, tsx, and tsconfig-replace-paths globally
RUN npm install -g bun tsx tsconfig-replace-paths

# Copy package.json and bun.lockb first to leverage Docker caching
COPY package.json bun.lockb ./

# Install the dependencies using bun
RUN bun install --frozen-lockfile

# Copy all source files into the container
COPY . .

# Set up tsconfig-paths for development
RUN tsconfig-replace-paths --project tsconfig.json --src lib --out dist

# Set the environment variable for development
ENV NODE_ENV=development

# Ensure permissions (important for Alpine)
RUN chmod -R 755 /app

# Verify that lib/app.ts exists
RUN ls -la /app/lib

# Start the application in development mode
CMD ["bun", "dev"]
