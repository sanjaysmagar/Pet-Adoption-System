

// // Haversine Algorithm implementation

function toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  function haversine(lat1, lon1, lat2, lon2) {
    // Convert latitude and longitude from degrees to radians
    lat1 = toRadians(lat1);
    lon1 = toRadians(lon1);
    lat2 = toRadians(lat2);
    lon2 = toRadians(lon2);
  
    // Radius of the Earth in kilometers (mean value)
    const R = 6371;
  
    // Differences in latitude and longitude
    const dlat = lat2 - lat1;
    const dlon = lon2 - lon1;
  
    // Haversine formula
    const a = Math.sin(dlat / 2) * Math.sin(dlat / 2) +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlon / 2) * Math.sin(dlon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
    // Calculate the distance
    const distance = R * c;
    return distance;
  }

  function findDistancesAndCenters(userLat, userLon, adoptionCenters) {
    // let closestCenter = null;
    // let minDistance = Infinity;
    const distancesAndCenters = [];
  
  
    for (let i = 0; i < adoptionCenters.length; i++) {
        const center = adoptionCenters[i];
        const centerLat = center.latitude;
        const centerLon = center.longitude;
  
        // Calculate the distance using Haversine formula
        const distance = haversine(userLat, userLon, centerLat, centerLon);
  
        // if (distance < minDistance) {
        //     minDistance = distance;
        //     closestCenter = center;
        // }
  
        distancesAndCenters.push({ distance, center });
    }
  
    return distancesAndCenters;
  }

  function quickSort(arr) {
    if (arr.length <= 1) {
      return arr;
    }
  
    const pivot = arr[0];
    const left = [];
    const right = [];
  

    for (let i = 1; i < arr.length; i++) {
      if (!isNaN(arr[i].distance) && arr[i].distance < pivot.distance) {
        left.push(arr[i]);
      } else {
        right.push(arr[i]);
      }
    }
  
    return quickSort(left).concat(pivot, quickSort(right));
  }

  
  
module.exports = {
  toRadians,
  haversine,
  findDistancesAndCenters,
  quickSort,
};  