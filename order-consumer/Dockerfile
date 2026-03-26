# Use official Node image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy app files
COPY . .

# Expose port 8080 for Cloud Run
EXPOSE 8080

# Start the app directly
CMD ["node", "server.js"]
