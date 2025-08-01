FROM node:24.4-slim

WORKDIR /app

# Copy package files
COPY package*.json tsconfig.json ./

# Install dependencies
RUN npm i

# Copy source code
COPY public ./public
COPY src ./src

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "start"]
