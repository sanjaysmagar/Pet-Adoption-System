
  
// let userLatitude = null;
// let userLongitude = null;
// let adoptionCenters;

// const requestLocationPermission = () => {
//   if ('geolocation' in navigator) {
//     navigator.geolocation.getCurrentPosition(
//       (position) => handleLocationSuccess(position, setUserLocation),
//       handleLocationError
//     );
//   } else {
//     console.error('Geolocation is not supported by this browser.');
//   }
// };

// const handleLocationSuccess = (position, callback) => {
//   const latitude = position.coords.latitude;
//   const longitude = position.coords.longitude;

//   if (!isNaN(latitude) && !isNaN(longitude)) {
//     console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);
//     callback(latitude, longitude);
//   } else {
//     console.error('Invalid latitude or longitude values');
//   }
// };

// const handleLocationError = (error) => {
//   console.error(`Error getting location: ${error.message}`);
// };

// const setUserLocation = async (lat1, lon1) => {
//   userLatitude = lat1;
//   userLongitude = lon1;
//   // console.log(`User Location set: Latitude: ${userLatitude}, Longitude: ${userLongitude}`);
//   await fetchData(); // Call fetchData after setting the user location
// };

// document.addEventListener('DOMContentLoaded', requestLocationPermission);   // yo part xaina ta







// // Haversine Algorithm implementation

// function toRadians(degrees) {
//   return degrees * (Math.PI / 180);
// }

// function haversine(lat1, lon1, lat2, lon2) {
//   // Convert latitude and longitude from degrees to radians
//   lat1 = toRadians(lat1);
//   lon1 = toRadians(lon1);
//   lat2 = toRadians(lat2);
//   lon2 = toRadians(lon2);

//   // Radius of the Earth in kilometers (mean value)
//   const R = 6371;

//   // Differences in latitude and longitude
//   const dlat = lat2 - lat1;
//   const dlon = lon2 - lon1;

//   // Haversine formula
//   const a = Math.sin(dlat / 2) * Math.sin(dlat / 2) +
//       Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlon / 2) * Math.sin(dlon / 2);
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

//   // Calculate the distance
//   const distance = R * c;
//   return distance;
// }




//yo chahi database bata latitude ra longitude ko value pauna ko lagi
// async function fetchPetDataAndLog() {
//   try {
//     // Fetch data from the server using the API endpoint
//     const response = await fetch('/api/pets');
//     const petData = await response.json();

//     // Log the entire pet data array to the console
//     console.log('All Pets Data:', petData);

//     // Log latitude and longitude for each pet
//     // petData.forEach((pet, index) => {
//     //   const { petname, latitude, longitude } = pet;
//     //   // console.log(`Pet ${index + 1}: Name: ${petname}, Latitude: ${latitude}, Longitude: ${longitude}`);
//     // });

//     // return petData;  // Return the data if needed for further processing
//     adoptionCenters = petData;
//   } catch (error) {
//     console.error('Error fetching pet data:', error);
//     // return [];
//     adoptionCenters = [];
//   }
// }

// document.addEventListener('DOMContentLoaded', async () => {
//   try {
//     // Fetch user location and initiate data fetching
//     await requestLocationPermission();

//     // Fetch sorted centers after setting the user location
//     const response = await fetch('/api/sortedCenters');
//     const sortedCenters = await response.json();

//     console.log("Sorted Adoption Centers:", sortedCenters);

//     // Now you can use sortedCenters for further processing or display
//   } catch (error) {
//     console.error('Error fetching sorted centers:', error);
//   }
// });



// function findDistancesAndCenters(userLat, userLon, adoptionCenters) {
//   // let closestCenter = null;
//   // let minDistance = Infinity;
//   const distancesAndCenters = [];


//   for (let i = 0; i < adoptionCenters.length; i++) {
//       const center = adoptionCenters[i];
//       const centerLat = center.latitude;
//       const centerLon = center.longitude;

//       // Calculate the distance using Haversine formula
//       const distance = haversine(userLat, userLon, centerLat, centerLon);

//       // if (distance < minDistance) {
//       //     minDistance = distance;
//       //     closestCenter = center;
//       // }

//       distancesAndCenters.push({ distance, center });
//   }

//   return distancesAndCenters;
// }


// function quickSort(arr) {
//   if (arr.length <= 1) {
//     return arr;
//   }

//   const pivot = arr[0];
//   const left = [];
//   const right = [];

//   for (let i = 1; i < arr.length; i++) {
//     if (arr[i].distance < pivot.distance) {
//       left.push(arr[i]);
//     } else {
//       right.push(arr[i]);
//     }
//   }

//   return quickSort(left).concat(pivot, quickSort(right));
// }


// const adoptionCenters = await fetchPetDataAndLog();
// async function fetchData() {
//   await fetchPetDataAndLog();
//   // console.log("Database bata data aayo:", adoptionCenters);

//   // Find distances and centers
//   const distancesAndCenters = findDistancesAndCenters(userLatitude, userLongitude, adoptionCenters);

//   // Sort the centers based on distances using quicksort
//   const sortedCenters = quickSort(distancesAndCenters);

//   console.log("Sorted Adoption Centers:", sortedCenters);


// // yaha dekhi change gareko


//   // // Send sortedCenters to the server
//   // await fetch('/api/saveSortedCenters', {
//   //   method: 'POST',
//   //   headers: {
//   //     'Content-Type': 'application/json',
//   //   },
//   //   body: JSON.stringify({ sortedCenters }),
//   // });
// }














let userLatitude = null;
let userLongitude = null;

const requestLocationPermission = () => {
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (position) => handleLocationSuccess(position),
      handleLocationError
    );
  } else {
    console.error('Geolocation is not supported by this browser.');
  }
};

const handleLocationSuccess = (position) => {
  const latitude = position.coords.latitude;
  const longitude = position.coords.longitude;

  if (!isNaN(latitude) && !isNaN(longitude)) {
    console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);
    setUserLocation(latitude, longitude);
    // sendLocationToBackend(latitude, longitude); // Add this line to send data to backend
  } else {
    console.error('Invalid latitude or longitude values');
  }
};

const handleLocationError = (error) => {
  console.error(`Error getting location: ${error.message}`);
};

const setUserLocation = (lat, lon) => {
  userLatitude = lat;
  userLongitude = lon;
  console.log(`User Location set: Latitude: ${userLatitude}, Longitude: ${userLongitude}`);
  // Call any additional functions or make API requests that depend on the user's location
};

// const sendLocationToBackend = (latitude, longitude) => {
//   const locationData = {
//     latitude: latitude,
//     longitude: longitude,
//   };

//   fetch('/api/userLocation', {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify(locationData),
//   })
//     .then(response => response.json())
//     .then(data => {
//       console.log('Location data sent to backend:', data);
//       // Handle the response from the backend if needed
//     })
//     .catch(error => {
//       console.error('Error sending location data to backend:', error);
//     });
// };

// // Trigger the location request when the DOM content is loaded
document.addEventListener('DOMContentLoaded', requestLocationPermission);
