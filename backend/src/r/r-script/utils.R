library(dplyr)
library(spatstat)
# library(maptools)

#generate the window of Twente
Twentegrens <- function(x){
  neighbour <- c(1:14)
  edge <- c(1,2,3,7,13,14,12,10,4)
  Total <- c(0,0)
  aantal <- 0
  
  X_range <- c(218000,271000)
  Y_range <- c(459000,502000)
  
  y <- as.owin(x)
  
  #browser()
  
  for (j in edge){
    DW <- 0
    for (i in neighbour[-which(neighbour == j)]){
      DW <- c(DW, which(y$bdry[[j]]$x %in% y$bdry[[i]]$x & y$bdry[[j]]$y %in% y$bdry[[i]]$y))
    }
    DW <- DW[2:length(DW)]
    Three <- data.frame(X = y$bdry[[j]]$x, Y = y$bdry[[j]]$y)
    Three <- Three[-DW,]
    Total <- rbind(Total, Three)
    aantal <- c(aantal, nrow(Three))
  }
  Total <- Total[2:nrow(Total),]
  
  # Omdat de volgorde van de punten lastig gegeven is, heb ik precies moeten uitrekenen welke punten eerst komen. 
  # De route is nu tegen de klok in gegeven.
  
  # Translation: Because the order of the points is difficult, I had to calculate exactly which points come first.
  # The route is now given counterclockwise.
  X <- c(Total$X[1:378], Total$X[2352:2549], Total$X[2333:2351], Total$X[2132:2332], Total$X[1702:2131], 
         Total$X[1197:1701], Total$X[1128:1196], Total$X[964:1127], Total$X[881:963], Total$X[786:880], Total$X[625:785], 
         Total$X[532:624], Total$X[425:531], Total$X[379:424])
  Y<- c(Total$Y[1:378],  Total$Y[2352:2549], Total$Y[2333:2351], Total$Y[2132:2332], Total$Y[1702:2131], Total$Y[1197:1701], 
        Total$Y[1128:1196], Total$Y[964:1127], Total$Y[881:963], Total$Y[786:880], Total$Y[625:785], Total$Y[532:624], 
        Total$Y[425:531], Total$Y[379:424])
  Total2 <- data.frame(X=X, Y=Y)
  Twente_rand <- owin(poly=list(x=Total2$X,y=Total2$Y))
  return (Twente_rand)
}


#TP:true points
#win_s:spatial window
#t_frac:temporal fractions(window)
#DP_den_s:spatial density of dummy point process (without \rho tuning in the temporal domain)
#t_tune:boolean variable to determine whether \rho tuning in the temporal domain is applied
#DP_s_den: an image based ob which the dummy point process is generated
# NOTE: the values here in DPP_den is the integrated intensity because we are using the spatstat to generate a point process from an image
LR_pointprocess_3D <- function( TP = NULL, win_s = NULL, tfrac = NULL, DP_s_den = NULL, t_tune = NULL ) {
  
  #record the details of pixel-wise spatial window
  TP_PP <- density.ppp(ppp(TP$x, TP$y, window = win_s), at="pixels", leaveoneout=False, edge=TRUE, diggle=TRUE, positive=TRUE)
  x_range <- TP_PP$xrange
  y_range <- TP_PP$yrange
  x_step <- TP_PP$xstep
  y_step <- TP_PP$ystep
  
  #generate the dummy points
  dummy_points <- data.frame()
  
  if (t_tune == TRUE){
    for (i in 1:tfrac){
      DP_s_t_den <- DP_s_den*(0.5+0.5*(sin(2*pi/365*i+pi/2)+1)/2)
      DP_gen <- rpoispp(lambda = DP_s_t_den, nsim=1, drop=TRUE)
      if (DP_gen$n > 0){
        for (j in 1:DP_gen$n){
          dummy_points <- rbind(dummy_points, c((DP_gen$x[j]-0.5)*x_step+x_range[1],(DP_gen$y[j]-0.5)*y_step+y_range[1],i,DP_s_t_den$v[ceiling(DP_gen$y[j]-0.5),ceiling(DP_gen$x[j]-0.5)]/(x_step*y_step)))
        }
      }
    }
  } else{
    for (i in 1:tfrac){
      DP_s_t_den <- DP_s_den
      DP_gen <- rpoispp(lambda = DP_s_t_den, nsim=1, drop=TRUE)
      if (DP_gen$n > 0){
        for (j in 1:DP_gen$n){
          dummy_points <- rbind(dummy_points, c((DP_gen$x[j]-0.5)*x_step+x_range[1],(DP_gen$y[j]-0.5)*y_step+y_range[1],i,DP_s_t_den$v[ceiling(DP_gen$y[j]-0.5),ceiling(DP_gen$x[j]-0.5)]/(x_step*y_step)))
        }
      }
    }
  }
  
  colnames(dummy_points) <- c("x","y","t","rho")
  
  plot(win_s)
  points(dummy_points$x, dummy_points$y,cex=0.4, pch=16)

  dummy_points$zz = 0
  
  
  
  #read the true points
  true_points <- data.frame()
  for (i in 1:dim(TP)[1]){
    true_points <-rbind(true_points, c(TP$x[i],TP$y[i],TP$t[i],DP_s_t_den$v[ceiling((TP$y[i]-y_range[1])/y_step),ceiling((TP$x[i]-x_range[1])/x_step)]/(x_step*y_step)))
  }
  colnames(true_points) <- c("x","y","t","rho")

  true_points$zz = 1
  
  points <- rbind(dummy_points,true_points)
  
  return( points )
}






AIC_LR <- function( LRModel=NULL )
{
  log_lambda = LRModel$linear.predictors + log(LRModel$data$rho)
  odds_ratio = exp(LRModel$linear.predictors)
  
  term1 <- -2 * sum( log_lambda * LRModel$data$zz )
  term2 <- 2 * sum( odds_ratio * ( 1-LRModel$data$zz ) )
  term3 <- 2 * length( LRModel$coefficients )
  
  res <- term1 + term2 + term3
  return( res )
}



CI_LR <- function( LRModel=NULL, variables=NULL )
{
  odds_ratio = exp(LRModel$linear.predictors[LRModel$data$zz == 0])
  
  term1 <- odds_ratio/(1+odds_ratio)
  
  dim= dim(variables)[2]
  sigma <-  matrix( 0, nrow = dim, ncol = dim)
  
  for ( i in 1:dim ){
    for (j in 1:dim){
      sigma[i,j] = sum(term1 * variables[,i] * variables[,j])
    }
  }
  variance <- solve(sigma)
  sqrt_diag <- sqrt(diag(variance))
  
  print(1.96*sqrt_diag)
  
  res <- data.frame(matrix(ncol = 3, nrow = dim))
  colnames(res) = c("fit","upper","lower")
  res$fit <- unname(LRModel$coefficients)
  res$upper <- unname(LRModel$coefficients)+1.96*sqrt_diag
  res$lower <- unname(LRModel$coefficients)-1.96*sqrt_diag
  
  return( list(res=res, variance=variance) )
}




#nPoints here include the time of points (t) and corresponding estimated intensities (lambda)
#maxT: the volume of the one dimensional window, used to calculate the edge correction factor
#epsilon: smooth parameter used for a Gaussian smooth kernel
pcf_temporal <- function( nLags=NULL, maxLag=NULL, nPoints=NULL, maxT=NULL, epsilon=NULL )
{
  stepSize <- maxLag/nLags
  res <- as.double(numeric(nLags+1))
  
  for( k in 0:nLags){
    r = k*stepSize
    for( i in 1:dim(nPoints)[1] ) {
      for( j in i:dim(nPoints)[1] ) {
        if( i != j ) { 
          dist = abs(nPoints$t[j] - nPoints$t[i])
          kappa =  exp( - ( (r-dist) / epsilon )^2 / 2 ) / ( sqrt(2*pi) * epsilon )
          edge = maxT - abs(dist)
          res[k+1] = res[k+1] + kappa / ( nPoints$lambda[i] * nPoints$lambda[j] * edge) 
        }
      }
    } 
  }
  
  return (res)
}
