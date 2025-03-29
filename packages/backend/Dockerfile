# Use the official Node.js image with version 22.14.0 as the base image
FROM node:22.14.0

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Build the TypeScript code
RUN npm run build

# Expose the port your app runs on (e.g., 3000)
EXPOSE 3000

# Set the environment variable for production - disabled (read from .env in startup script)
# ENV NODE_ENV=production

# Start the application using the production script
CMD ["npm", "run", "start:prod"]