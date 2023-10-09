# Use the official Node.js image from the DockerHub
FROM node:14

# Set the working directory in docker
WORKDIR /usr/src/app

# Copy the dependencies file to the working directory
COPY package*.json ./

# Install any dependencies
RUN npm install

# Copy the content of the local src directory to the working directory
COPY . .

# Specify the command to run on container start
CMD [ "node", "app.js" ]

# Expose the port the app runs on
EXPOSE 3000
