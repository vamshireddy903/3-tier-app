# Use official Node image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy app files
COPY . .

# Expose default port for Cloud Run health check
EXPOSE 8080

# Start the app directly
CMD ["node", "server.js"]
