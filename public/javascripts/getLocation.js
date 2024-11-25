// getLocation.js

// Function to request location permission when called
const requestLocationPermission = () => {
  if ('geolocation' in navigator) {
    // Request location permission
    navigator.geolocation.getCurrentPosition(handleLocationSuccess, handleLocationError);
  } else {
    console.error('Geolocation is not supported by this browser.');
  }
};

// Function to handle successful location retrieval
const handleLocationSuccess = (position) => {
  const latitude = position.coords.latitude;
  const longitude = position.coords.longitude;

  // Check if latitude and longitude are valid numbers
  if (!isNaN(latitude) && !isNaN(longitude)) {
    // Set latitude and longitude values in hidden input fields
    document.getElementById('latitude').value = latitude;
    document.getElementById('longitude').value = longitude;

    // // Trigger the form submission
    // document.getElementById('signupForm').submit();

    // Do something with the obtained latitude and longitude
    console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);
  } else {
    console.error('Invalid latitude or longitude values');
    // Handle the case where latitude or longitude is not a valid number
  }
};

// Function to handle errors during location retrieval
const handleLocationError = (error) => {
  console.error(`Error getting location: ${error.message}`);
};

// Call requestLocationPermission on page load
document.addEventListener('DOMContentLoaded', requestLocationPermission);

// Add an event listener to the button
document.getElementById('signupButton').addEventListener('click', function() {
  // Trigger the form submission
  document.getElementById('signupForm').submit();
});

