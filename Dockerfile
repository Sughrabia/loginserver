# Sample Dockerfile for NodeJS Apps
FROM node:20

ENV NODE_ENV=production

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY ["package.json", "package-lock.json", "./"]

# Install dependencies
RUN npm install --production

# Copy the rest of the application code
COPY . .

# Expose the port your app runs on
EXPOSE 5000

# Start the application
CMD ["node", "server.js"]
