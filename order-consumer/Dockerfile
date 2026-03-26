# Use official Node image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy app files
COPY . .

# Expose port 8080
EXPOSE 8080

# Set default PORT (Cloud Run overrides this)
ENV PORT 8080

# Start the app directly (skip npm start for reliability)
CMD ["node", "server.js"]
