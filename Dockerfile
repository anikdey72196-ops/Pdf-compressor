FROM node:18-bullseye-slim

# Install ghostscript
RUN apt-get update && apt-get install -y ghostscript && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Ensure upload and compressed directories exist and have correct permissions
RUN mkdir -p uploads compressed && chmod 777 uploads compressed

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
