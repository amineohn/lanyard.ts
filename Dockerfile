FROM node:20-alpine

# Install pnpm and tsx globally
RUN npm install -g pnpm tsx

# Set the working directory
WORKDIR /app

# Copy package.json and pnpm-lock.yaml files first
COPY package.json pnpm-lock.yaml ./

# Install dependencies using pnpm
RUN pnpm install --frozen-lockfile

# Copy the rest of your app's source code
COPY . .

# Copy .env file into the container (ensure .env is present in your local project root)
COPY .env .env

RUN pnpm run build

ENV NODE_ENV=production

CMD ["pnpm", "start"]