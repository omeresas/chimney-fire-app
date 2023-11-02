library(raster)
library(sf)

# Function to determine area type and return appropriate polygon
get_area_polygon <- function(code) {
  prefix <- substr(code, 1, 2)
  
  if (prefix == "GM") {
    return(buurten[buurten$gemeenteco == code, ])
  } else if (prefix == "WK") {
    return(buurten[buurten$wijkcode == code, ])
  } else if (prefix == "BU") {
    return(buurten[buurten$buurtcode == code, ])
  } else if (grepl("^\\d{5}$", code)) { # Check if code is exactly 5 digits
    return(boxes[boxes$objectid == code, ])
  } else {
    stop("Invalid area code")
  }
}

# Set working directory
setwd(Sys.getenv("MY_APP_PATH"))

# Load the Twente municipal boundaries
buurten <- st_read("r/r-data/shapefiles/buurten/buurten.shp", quiet = TRUE)
boxes <- st_read("r/r-data/shapefiles/boxes/boxes.shp", quiet = TRUE)

# Load the House Type ppp objects
load("r/r-data/house_1_density_ppp.RData")
load("r/r-data/house_2_density_ppp.RData")
load("r/r-data/house_3_density_ppp.RData")
load("r/r-data/house_4_density_ppp.RData")

# Take area code from command arguments
args <- commandArgs(trailingOnly = TRUE)
area_code <- args[1]

# Retrieve the appropriate polygon
area_polygon <- get_area_polygon(area_code)

# Convert the spatstat object to a raster object
house_1_density_raster <- raster(house_1_density_ppp)
house_2_density_raster <- raster(house_2_density_ppp)
house_3_density_raster <- raster(house_3_density_ppp)
house_4_density_raster <- raster(house_4_density_ppp)

# Perform spatial intersection/overlay
house_1_intersected_raster <- mask(house_1_density_raster, area_polygon)
house_2_intersected_raster <- mask(house_2_density_raster, area_polygon)
house_3_intersected_raster <- mask(house_3_density_raster, area_polygon)
house_4_intersected_raster <- mask(house_4_density_raster, area_polygon)

# Get the resolution of the raster (assuming square pixels)
res_x <- res(house_1_intersected_raster)[1]
res_y <- res(house_1_intersected_raster)[2]

# Calculate the area represented by each pixel
area_per_pixel <- res_x * res_y

# Get the sum of density values from the intersected raster
house_1_density_values_sum <- sum(getValues(house_1_intersected_raster), na.rm = TRUE)
house_2_density_values_sum <- sum(getValues(house_2_intersected_raster), na.rm = TRUE)
house_3_density_values_sum <- sum(getValues(house_3_intersected_raster), na.rm = TRUE)
house_4_density_values_sum <- sum(getValues(house_4_intersected_raster), na.rm = TRUE)

# Calculate the total number of houses in the intersected region
house_1_total = house_1_density_values_sum * area_per_pixel
house_2_total = house_2_density_values_sum * area_per_pixel
house_3_total = house_3_density_values_sum * area_per_pixel
house_4_total = house_4_density_values_sum * area_per_pixel

# Print or write the output so it can be read by Node.js
cat(house_1_total, house_2_total, house_3_total, house_4_total, sep = ",")

