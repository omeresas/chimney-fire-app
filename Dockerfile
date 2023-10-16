# Use the official Node.js image as a base image
FROM node:18

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

# Set working directory in the container
WORKDIR /usr/src/app

# Copy the dependencies file to the working directory
COPY package*.json ./

# Install the dependencies
RUN npm install --only=production

# Copy the content of the local source directory to the working directory
COPY . .

# Set the environment variable
ENV MY_APP_PATH /usr/src/app

# Specify the command to run on container start
CMD [ "npm", "start" ]
