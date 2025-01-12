# Use the official Node 20 image based on Alpine Linux
FROM node:20-alpine

# Install pnpm, tsx, and ts-node globally
RUN npm install -g pnpm tsx ts-node

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and pnpm-lock.yaml files first
COPY package.json pnpm-lock.yaml ./

# Install dependencies using pnpm (with frozen lockfile to ensure exact versions)
RUN pnpm install --frozen-lockfile

# Copy the rest of your app's source code
COPY . .

# Copy the .env file to the container
COPY .env .env

# Run the build command (assuming you have a "build" script in your package.json)
RUN pnpm run build

# Execute the refresh-slash-commands.ts script (to refresh slash commands)
RUN ts-node src/api/refresh-slash-commands.ts

# Set the environment variable to "production"
ENV NODE_ENV=production

# Default command to run the application
CMD ["pnpm", "start"]
