# Use the official Node.js image as a base image
FROM node:18 AS base

# Set working directory in the container
WORKDIR /app

# Install R and necessary system libraries
RUN apt-get update && apt-get install -y \
    r-base \
    libgdal-dev \
    libproj-dev \
    libudunits2-dev \
    libgeos-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install necessary R packages
RUN R -e "install.packages(c('sf', 'raster'), repos='http://cran.rstudio.com/')"

# Copy the dependencies file to the working directory
COPY package*.json ./

# Install the dependencies
RUN npm install --only=production

# Copy the content of the local src and bin directories to the working directory
COPY src/ src/
COPY bin/ bin/

# Set the environment variable
ENV MY_APP_PATH=/app/src
ENV SPATIAL_SCRIPT_PATH=r/r-script/spatial_overlapping.R

# Inform Docker that the container listens on 3000
EXPOSE 3000

# Development Stage
FROM base AS development

# Install both prod and dev dependencies
RUN npm install

# Specify the command to run on container start
CMD [ "npm", "run", "dev" ]

# Production stage
FROM base AS production

# Specify the command to run on container start
CMD [ "npm", "run", "start" ]