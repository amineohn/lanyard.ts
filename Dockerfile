# Use the official Node 20 image based on Alpine Linux
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /app

# Install pnpm, tsx, and tsconfig-replace-paths globally
RUN npm install -g pnpm tsx tsconfig-replace-paths

# Copy package.json and pnpm-lock.yaml first (to leverage Docker caching)
COPY package.json pnpm-lock.yaml ./

# Install the dependencies using pnpm
RUN pnpm install --no-frozen-lockfile

# Copy all source files
COPY . .

# Replace paths using tsconfig-replace-paths
RUN tsconfig-replace-paths ./tsconfig.json ./src

# Run build command (assuming you have a "build" script in your package.json)
RUN pnpm run build

# Set the environment variable for production
ENV NODE_ENV=production

# Start the application in production mode
CMD ["pnpm", "start"]
