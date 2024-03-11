library(readxl)
library(spatstat)
library(raster)
library(sf)
library(jsonlite)

# Set working directory
setwd(Sys.getenv("MY_APP_PATH"))

# Import custom R utility functions
source("r/r-script/utils.R")

# Load the Twente municipal boundaries
buurten <- st_read("r/r-data/shapefiles/buurten/buurten.shp", quiet = TRUE)

# Read Excel files into R and store them as dataframes
BAG <- read_excel("r/r-data/excel/kro.xlsx", col_names = TRUE)

# load win object of Twente borders
load("r/r-data/RData/win.RData")

# Convert win to 512px x 512px mask so that house counts can be calculated more accurately
win <- as.mask(win, dimyx=512)

create_df_all_house_types <- function() {
  # Keep rows where "status = Building in use" or "status = Building in use (not measured)"
  BAG <- BAG[(BAG$status == 'Pand in gebruik') | (BAG$status == 'Pand in gebruik (niet ingemeten)'),]

  # Remove identical rows
  BAG <- unique(BAG)

  # These house types are all freely standing or semi-detached (2 under 1) houses
  HouseClasses_Free2Under1 <- c("2 onder 1 kap doelgroepwoning", "2 onder 1 kap recreatiewoning", 
                        "2 onder 1 kap woning", "Vrijstaande doelgroepwoning", 
                        "Vrijstaande recreatiewoning", "Vrijstaande woning")

  # Dividing the house dataset into 4 types houses
  # House_Type_1: 2045 - free standing
  House_Type_1 = BAG[(BAG$bouwjaar>=1920 & BAG$bouwjaar<1945 & !is.na(BAG$bouwjaar) ) & (BAG$gebrklasse %in% HouseClasses_Free2Under1 & !is.na(BAG$gebrklasse)),]

  # House_Type_2: not 2045 - free standing
  House_Type_2 = BAG[!(BAG$bouwjaar>=1920 & BAG$bouwjaar<1945 & !is.na(BAG$bouwjaar) ) & (BAG$gebrklasse %in% HouseClasses_Free2Under1 & !is.na(BAG$gebrklasse)),]

  # House_Type_3: 2045 - not free standing
  House_Type_3 = BAG[(BAG$bouwjaar>=1920 & BAG$bouwjaar<1945 & !is.na(BAG$bouwjaar) ) & !(BAG$gebrklasse %in% HouseClasses_Free2Under1 & !is.na(BAG$gebrklasse)),]

  # House_Type_4: not 2045 - not free standing
  House_Type_4 = BAG[!(BAG$bouwjaar>=1920 & BAG$bouwjaar<1945 & !is.na(BAG$bouwjaar) ) & !(BAG$gebrklasse %in% HouseClasses_Free2Under1 & !is.na(BAG$gebrklasse)),]

  return (list(houseType1 = House_Type_1, houseType2 = House_Type_2, houseType3 = House_Type_3, houseType4 = House_Type_4))
}

calculate_house_density <- function(df_all_house_types) {
 # Extract individual house type data
  House_Type_1 <- df_all_house_types$houseType1
  House_Type_2 <- df_all_house_types$houseType2
  House_Type_3 <- df_all_house_types$houseType3
  House_Type_4 <- df_all_house_types$houseType4
  
  # Create point patterns for each house type
  House_Type_1_ppp_pix <- ppp(House_Type_1$x, House_Type_1$y, window = win)
  House_Type_2_ppp_pix <- ppp(House_Type_2$x, House_Type_2$y, window = win)
  House_Type_3_ppp_pix <- ppp(House_Type_3$x, House_Type_3$y, window = win)
  House_Type_4_ppp_pix <- ppp(House_Type_4$x, House_Type_4$y, window = win)
  
  # Calculate density for each house type
  house_1_density_ppp <- density.ppp(House_Type_1_ppp_pix, sigma = 1000, at = "pixels", leaveoneout = FALSE, edge = TRUE, diggle = TRUE, positive = TRUE)
  house_2_density_ppp <- density.ppp(House_Type_2_ppp_pix, sigma = 1000, at = "pixels", leaveoneout = FALSE, edge = TRUE, diggle = TRUE, positive = TRUE)
  house_3_density_ppp <- density.ppp(House_Type_3_ppp_pix, sigma = 1000, at = "pixels", leaveoneout = FALSE, edge = TRUE, diggle = TRUE, positive = TRUE)
  house_4_density_ppp <- density.ppp(House_Type_4_ppp_pix, sigma = 1000, at = "pixels", leaveoneout = FALSE, edge = TRUE, diggle = TRUE, positive = TRUE)
  
  return(list(houseType1 = house_1_density_ppp, houseType2 = house_2_density_ppp, houseType3 = house_3_density_ppp, houseType4 = house_4_density_ppp))
}

create_raster_objects <- function(density_ppp_objects) {
  # Convert each spatstat density object to a raster object
  house_1_density_raster <- raster(density_ppp_objects$houseType1)
  house_2_density_raster <- raster(density_ppp_objects$houseType2)
  house_3_density_raster <- raster(density_ppp_objects$houseType3)
  house_4_density_raster <- raster(density_ppp_objects$houseType4)
  
  return(list(houseType1 = house_1_density_raster, houseType2 = house_2_density_raster, houseType3 = house_3_density_raster, houseType4 = house_4_density_raster))
}

calculate_house_count <- function(raster_objects) {
  # Initialize lists to store results
  all_results <- list()

  # Iterate over Gemeenten
  for (gemeente in unique(buurten$gemeenteco)) {
    area_polygon <- get_area_polygon(gemeente)
    houses <- calculate_houses_per_area(area_polygon, raster_objects)
    # Flatten the list to ensure numeric values are not in arrays
    all_results[[gemeente]] <- unlist(houses)
  }

  # Iterate over Wijken
  for (wijk in unique(buurten$wijkcode)) {
    area_polygon <- get_area_polygon(wijk)
    houses <- calculate_houses_per_area(area_polygon, raster_objects)
    all_results[[wijk]] <- unlist(houses)
  }

  # # Iterate over Buurten
  # for (buurt in unique(buurten$buurtcode)) {
  #   area_polygon <- get_area_polygon(buurt)
  #   houses <- calculate_houses_per_area(area_polygon, raster_objects)
  #   all_results[[buurt]] <- unlist(houses)
  # }

  # # Iterate over Boxes
  # for (box in unique(boxes$objectid)) {
  #   area_polygon <- get_area_polygon(box)
  #   houses <- calculate_houses_per_area(area_polygon, raster_objects)
  #   all_results[[as.character(box)]] <- unlist(houses)
  # }

  return (all_results)
}

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

calculate_houses_per_area <- function(area_polygon, raster_objects) {
  # Perform spatial intersection/overlay
  house_1_intersected_raster <- mask(raster_objects$houseType1, area_polygon)
  house_2_intersected_raster <- mask(raster_objects$houseType2, area_polygon)
  house_3_intersected_raster <- mask(raster_objects$houseType3, area_polygon)
  house_4_intersected_raster <- mask(raster_objects$houseType4, area_polygon)
  
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
  
  # Return the total houses as a list
  return(list(houseType1 = house_1_total, houseType2 = house_2_total, houseType3 = house_3_total, houseType4 = house_4_total))
}

store_house_count_as_json <- function(all_results) {
  output_dir <- "r/r-data/output" # Define the output directory
  
  # Check if the directory exists; if not, create it
  if(!dir.exists(output_dir)) {
    dir.create(output_dir, recursive = TRUE)
  }
  
  # Construct the full file path
  file_path <- file.path(output_dir, "houseCount.json")
  
  # Write the data to a JSON file in the specified directory
  write_json(all_results, file_path)
}

# Step 1: Separate house types
df_all_house_types <- create_df_all_house_types()

# Step 2: Calculate house density
density_ppp_objects <- calculate_house_density(df_all_house_types)

# Step 3: Create raster objects for each house type
raster_objects <- create_raster_objects(density_ppp_objects)

# Step 4: Calculate house counts
all_results <- calculate_house_count(raster_objects)

# Step 5: Store house count results as JSON
store_house_count_as_json(all_results)