# Use the official Node 20 image based on Alpine Linux
FROM node:20-alpine

# Install pnpm and tsx globally
RUN npm install -g pnpm tsx

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and pnpm-lock.yaml files first
COPY package.json pnpm-lock.yaml ./

# Install dependencies using pnpm (with no frozen lockfile to ensure exact versions)
RUN pnpm install --no-frozen-lockfile

# Copy the rest of your app's source code
COPY . .

# Copy the .env file to the container
COPY .env .env

# Run the build command (assuming you have a "build" script in your package.json)
RUN pnpm run build

# Set the environment variable to "production"
ENV NODE_ENV=production

# Default command to run the application
CMD ["pnpm", "start"]
