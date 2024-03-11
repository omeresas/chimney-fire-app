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
boxes <- st_read("r/r-data/shapefiles/boxes/boxes.shp", quiet = TRUE)

# Read Excel files into R and store them as dataframes
BAG <- read_excel("r/r-data/excel/kro.xlsx", col_names = TRUE)
Areas <- read_excel("r/r-data/excel/areaid.xlsx", col_names = TRUE)
WindChill <- read_excel("r/r-data/excel/windchill.xlsx", col_names = TRUE)
WindSpeed <- read_excel("r/r-data/excel/windspeed.xlsx", col_names = TRUE)
Incidents <- read_excel("r/r-data/excel/incident.xlsx", col_names = TRUE)

# load win object of Twente borders
load("r/r-data/RData/win.RData")

# Convert win to 512px x 512px mask so that house counts can be calculated more accurately
# win <- as.mask(win, dimyx=512)

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

# Create DayID for each day from 2004 until and including 2020
Incidents$DayID <- 365*(as.numeric(Incidents$Year)-2004)+Incidents$Day

# Remove incidents from 2020
# Incidents <- Incidents[as.numeric(Incidents$Year)<2020,]

# Create incident subsets for each house type
Incidents1 = Incidents[(Incidents$bouwjaar >= 1920 & Incidents$bouwjaar < 1945 & !is.na(Incidents$bouwjaar)) &
                        (Incidents$gebrklasse %in% HouseClasses_Free2Under1 & !is.na(Incidents$gebrklasse)),]
Incidents2 = Incidents[!(Incidents$bouwjaar >= 1920 & Incidents$bouwjaar < 1945 & !is.na(Incidents$bouwjaar)) &
                        (Incidents$gebrklasse %in% HouseClasses_Free2Under1 & !is.na(Incidents$gebrklasse)),]
Incidents3 = Incidents[(Incidents$bouwjaar >= 1920 & Incidents$bouwjaar < 1945 & !is.na(Incidents$bouwjaar)) &
                        !(Incidents$gebrklasse %in% HouseClasses_Free2Under1 & !is.na(Incidents$gebrklasse)),]
Incidents4 = Incidents[!(Incidents$bouwjaar >= 1920 & Incidents$bouwjaar < 1945 & !is.na(Incidents$bouwjaar)) &
                        !(Incidents$gebrklasse %in% HouseClasses_Free2Under1 & !is.na(Incidents$gebrklasse)),]

# Calculate the density of Incidents
Incidents_pp <- ppp(Incidents$Xcoordinate, Incidents$Ycoordinate, window = win)
Incidents_pp <- density.ppp(Incidents_pp, sigma = 1000, at = "pixels", leaveoneout = FALSE, edge = TRUE, diggle = TRUE, positive = TRUE)

# Extract dimensions of the pixel-wise spatial window
x_range <- Incidents_pp$xrange
y_range <- Incidents_pp$yrange
x_step <- Incidents_pp$xstep
y_step<- Incidents_pp$ystep

##### Start model fitting process for house type 1 #####
DP_s_den_type1 = house_1_density_ppp$v * 60
DP_s_den_type1 = as.im(DP_s_den_type1)

Incidents1 <- Incidents1[,c("Xcoordinate","Ycoordinate","DayID")]
colnames(Incidents1) <- c("x","y","t")
points1 <- LR_pointprocess_3D(TP = Incidents1, win_s = win, tfrac = 5840, DP_s_den = DP_s_den_type1, t_tune=TRUE)
points1$x_index = 0
points1$y_index = 0
points1$BAG_2045_vrij2onder1 = 0
points1$WindChill = 0
points1$WindSpeed = 0

for (i in 1:dim(points1)[1]){
  points1$x_index[i] <- ceiling((points1$x[i]-x_range[1])/x_step)
  points1$y_index[i] <- ceiling((points1$y[i]-y_range[1])/y_step)
  points1$BAG_2045_vrij2onder1[i] <- house_1_density_ppp$v[points1$y_index[i],points1$x_index[i]]
  points1$WindChill[i] = WindChill[points1$t[i]-(floor((points1$t[i]-1)/365)*365),floor((points1$t[i]-1)/365)+1]
  points1$WindSpeed[i] = WindSpeed[points1$t[i]-(floor((points1$t[i]-1)/365)*365),floor((points1$t[i]-1)/365)+1]
}
points1$WindChill = as.numeric(points1$WindChill)
points1$WindSpeed = as.numeric(points1$WindSpeed)
IHPP_model1 <-glm(zz ~ cos(2*pi/365*t)+sin(2*pi/365*t)+cos(4*pi/365*t)+sin(4*pi/365*t)+cos(6*pi/365*t)+sin(6*pi/365*t)+cos(8*pi/365*t)+sin(8*pi/365*t)
                  +polynom(WindChill,2),
                  offset = log(BAG_2045_vrij2onder1)-log(rho), data = points1, family = binomial(link = "logit"))

##### Start model fitting process for house type 2 #####
DP_s_den_type2 = house_2_density_ppp$v*20
DP_s_den_type2 = as.im(DP_s_den_type2)

Incidents2 <- Incidents2[,c("Xcoordinate","Ycoordinate","DayID")]
colnames(Incidents2) <- c("x","y","t")
points2 <- LR_pointprocess_3D(TP = Incidents2, win_s = win, tfrac = 5840, DP_s_den = DP_s_den_type2, t_tune=TRUE)
points2$x_index = 0
points2$y_index = 0
points2$BAG_not2045_vrij2onder1 = 0
points2$WindChill = 0
points2$WindSpeed = 0
for (i in 1:dim(points2)[1]){
  points2$x_index[i] <- ceiling((points2$x[i]-x_range[1])/x_step)
  points2$y_index[i] <- ceiling((points2$y[i]-y_range[1])/y_step)
  points2$BAG_not2045_vrij2onder1[i] <- house_2_density_ppp$v[points2$y_index[i],points2$x_index[i]]
  points2$WindChill[i] = WindChill[points2$t[i]-(floor((points2$t[i]-1)/365)*365),floor((points2$t[i]-1)/365)+1]
  points2$WindSpeed[i] = WindSpeed[points2$t[i]-(floor((points2$t[i]-1)/365)*365),floor((points2$t[i]-1)/365)+1]
}
points2$WindChill = as.numeric(points2$WindChill)
points2$WindSpeed = as.numeric(points2$WindSpeed)
#delete the point not included in interesting pixels by density.ppp spatstat
points2 = points2[is.na(points2$rho) == FALSE,]
IHPP_model2 <-glm(zz ~ cos(2*pi/365*t)+sin(2*pi/365*t)+cos(4*pi/365*t)+sin(4*pi/365*t)+cos(6*pi/365*t)+sin(6*pi/365*t)
                  +polynom(WindChill,4),
                  offset = log(BAG_not2045_vrij2onder1)-log(rho), data = points2, family = binomial(link = "logit"))

##### Start model fitting process for house type 3 #####
DP_s_den_type3 = house_3_density_ppp$v*20
DP_s_den_type3 = as.im(DP_s_den_type3)

Incidents3 <- Incidents3[,c("Xcoordinate","Ycoordinate","DayID")]
colnames(Incidents3) <- c("x","y","t")
points3 <- LR_pointprocess_3D(TP = Incidents3, win_s = win, tfrac = 5840, DP_s_den = DP_s_den_type3, t_tune=TRUE)
points3$x_index = 0
points3$y_index = 0
points3$BAG_2045_notvrij2onder1 = 0
points3$WindChill = 0
points3$WindSpeed = 0
for (i in 1:dim(points3)[1]){
  points3$x_index[i] <- ceiling((points3$x[i]-x_range[1])/x_step)
  points3$y_index[i] <- ceiling((points3$y[i]-y_range[1])/y_step)
  points3$BAG_2045_notvrij2onder1[i] <- house_3_density_ppp$v[points3$y_index[i],points3$x_index[i]]
  points3$WindChill[i] = WindChill[points3$t[i]-(floor((points3$t[i]-1)/365)*365),floor((points3$t[i]-1)/365)+1]
  points3$WindSpeed[i] = WindSpeed[points3$t[i]-(floor((points3$t[i]-1)/365)*365),floor((points3$t[i]-1)/365)+1]
}
points3$WindChill = as.numeric(points3$WindChill)
points3$WindSpeed = as.numeric(points3$WindSpeed)
IHPP_model3 <-glm(zz ~ cos(2*pi/365*t)+sin(2*pi/365*t)+cos(4*pi/365*t)+sin(4*pi/365*t)+cos(6*pi/365*t)+sin(6*pi/365*t)
                  +polynom(WindChill,1),
                  offset = log(BAG_2045_notvrij2onder1)-log(rho), data = points3, family = binomial(link = "logit"))

##### Start model fitting process for house type 4 #####
DP_s_den_type4 = house_4_density_ppp$v*8
DP_s_den_type4 = as.im(DP_s_den_type4)

Incidents4 <- Incidents4[,c("Xcoordinate","Ycoordinate","DayID")]
colnames(Incidents4) <- c("x","y","t")
points4 <- LR_pointprocess_3D(TP = Incidents4, win_s = win, tfrac = 5840, DP_s_den = DP_s_den_type4, t_tune = TRUE)
points4$x_index = 0
points4$y_index = 0
points4$BAG_not2045_notvrij2onder1 = 0
points4$WindChill = 0
points4$WindSpeed = 0
for (i in 1:dim(points4)[1]){
  points4$x_index[i] <- ceiling((points4$x[i]-x_range[1])/x_step)
  points4$y_index[i] <- ceiling((points4$y[i]-y_range[1])/y_step)
  points4$BAG_not2045_notvrij2onder1[i] <- house_4_density_ppp$v[points4$y_index[i],points4$x_index[i]]
  points4$WindChill[i] = WindChill[points4$t[i]-(floor((points4$t[i]-1)/365)*365),floor((points4$t[i]-1)/365)+1]
  points4$WindSpeed[i] = WindSpeed[points4$t[i]-(floor((points4$t[i]-1)/365)*365),floor((points4$t[i]-1)/365)+1]
}
points4$WindChill = as.numeric(points4$WindChill)
points4$WindSpeed = as.numeric(points4$WindSpeed)
IHPP_model4 <-glm(zz ~  cos(2*pi/365*t)+sin(2*pi/365*t)+cos(4*pi/365*t)+sin(4*pi/365*t)+cos(6*pi/365*t)+sin(6*pi/365*t)+cos(8*pi/365*t)+sin(8*pi/365*t)
                  +polynom(WindChill,3)+polynom(WindChill*WindSpeed,1),
                  offset = log(BAG_not2045_notvrij2onder1)-log(rho), data = points4, family = binomial(link = "logit"))

# Write a write_json function that combines the two previous types of coefficients into one json file by their keys

write_json_combined <- function() {
  # Combine coefficients into one list
  coefficients_combined <- list(
    houseType1 = IHPP_model1$coefficients,
    houseType2 = IHPP_model2$coefficients,
    houseType3 = IHPP_model3$coefficients,
    houseType4 = IHPP_model4$coefficients
  )
  
  output_dir <- "r/r-data/output" # Define the output directory
  
  # Check if the directory exists; if not, create it
  if(!dir.exists(output_dir)) {
    dir.create(output_dir, recursive = TRUE)
  }
  
  # Construct the full file path
  file_path <- file.path(output_dir, "THETA.json")
  
  # Write the combined coefficients to a JSON file in the specified directory
  write_json(coefficients_combined, file_path)
}


# Call the write_json_combined function
write_json_combined()
