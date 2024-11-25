var express = require('express');
var router = express.Router();
const mongoose = require('mongoose');

const userModel = require('./users');//This is for database

const petModel = require('./pets');

const shelterModel = require('./shelters')

const adminModel = require('./admin')

const arModel = require('./adoptionRequests')

const apModel = require('./adoptedPets')

const multer = require('multer')

const passport = require('passport');

const localStrategy = require('passport-local').Strategy;

const jwt = require('jsonwebtoken');

var cookieParser = require('cookie-parser');

const auth = require('../middleware/auth')

const authAdmin = require('../middleware/authAdmin')


const { findDistancesAndCenters, quickSort } = require('./geo');



// const { sortedCenters } = require('../public/javascripts/getLocationIndex');


passport.use('local-user', new localStrategy(
  async function(username, password, done) {
    try {
      const user = await userModel.findOne({ username: username });
      if (!user || user.password !== password) {
        return done(null, false, { message: 'Invalid username or password.' });
      }
      user.role = 'user';
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));


// passport.use('local-user', new localStrategy(userModel.authenticate()));
passport.serializeUser(userModel.serializeUser());
passport.deserializeUser(userModel.deserializeUser());


mongoose.connect("mongodb://127.0.0.1:27017/PetDatabase");

//storage and file name setting
let storage = multer.diskStorage({
  destination: 'public/backend/images/',
  filename: (req, file, cb)=>{
    cb(null, file.originalname)
    // cb(null, Date.now(+file+originalname))
  }
})

let upload = multer({
  storage: storage
})



//cookie using passport.js

router.get('/cookie', function(req, res){
  res.cookie("cookiee", 25)
  res.send("this is cookie page")
})

router.get('/read', function(req, res){
  console.log(req.cookies);
  res.send("check cookie")
})

router.get('/delete-cookie', function(req, res){
  res.clearCookie('cookiee');
  res.send("cookie clear hogayi")
})







// // // yaha dekhi ho change

// let cachedSortedCenters = [];                                     //yo changed

// router.post('/api/saveSortedCenters', async (req, res) => {
//   try {
//     const { sortedCenters } = req.body;
//     cachedSortedCenters = sortedCenters;
//     console.log('POST: Received sortedCenters on the server:', cachedSortedCenters);
//     res.json({ message: 'Sorted centers received successfully!' });
//   } catch (error) {
//     console.error('Error in POST handler:', error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// });


// router.get('/', async (req, res, next) => {
//   try {
//     console.log('GET: Cached Sorted Centers at the beginning:', cachedSortedCenters);

//     if (cachedSortedCenters.length > 0) {
//       const sortedPets = await Promise.all(cachedSortedCenters.map(center => center.center.pet));
//       res.render('index', { pets: sortedPets, loggedIn: req.isAuthenticated() });
//     } else {
//       let allpets = await petModel.find({});
//       res.render('index', { pets: allpets, loggedIn: req.isAuthenticated() });
//     }
//   } catch (error) {
//     res.status(500).send(error.message);
//   }
// });

// List of pet adoption centers in the database
// let adoptionCenters = [
//   { name: "Center B", latitude: 40.741086, longitude: -74.027344 },
//   { name: "Center A", latitude: 40.730610, longitude: -73.935242 },
//   // Add more centers to the list
// ];

// async function isAuthenticated(req, res, next) {
//   if (req.isAuthenticated()) {
//     return next();
//   }
//   res.redirect('/login');
// }



router.get('/', async (req, res, next) => {
  try {
    if (req.isAuthenticated()) {
      const adoptionCenters = await petModel.find().exec();

      const userLatitude = req.user.latitude;
      const userLongitude = req.user.longitude;

      const distancesAndCenters = findDistancesAndCenters(userLatitude, userLongitude, adoptionCenters);

      const sortedCenters = quickSort(distancesAndCenters);
      console.log("Sorted Adoption Centers:", sortedCenters);
      res.render('index', { geo: sortedCenters, loggedIn: req.isAuthenticated() });

    }else{
      let allpets = await petModel.find({});
      res.render('index', { pets: allpets, loggedIn: req.isAuthenticated() });
    }
    
  } catch (error) {
    res.status(500).send(error.message);
  }
});





router.get('/search', async (req, res) => {
  const query = req.query.query.trim().toLowerCase();

  if (!query) {
    return res.redirect('/');
  }

  // Split the query into individual words
  const queryWords = query.split(/\s+/);

  // Check if both location and category are present in the query
  const hasLocation = queryWords.includes('location');
  const hasCategory = queryWords.includes('category');

  // Separate location and category from the query
  const locationQuery = queryWords.filter(word => word !== 'location').join(' ');
  const categoryQuery = queryWords.filter(word => word !== 'category').join(' ');

  // Create an array to store individual regular expressions for each word
  const regexArray = queryWords.map(word => new RegExp(word, 'i'));

  // Use case-insensitive regular expressions for each word to find matching pets
  let matchingPets;
  
  if (hasLocation && hasCategory) {
    // If both location and category are present, search with logical AND
    matchingPets = await petModel.find({
      location: new RegExp(locationQuery, 'i'),
      category: new RegExp(categoryQuery, 'i')
    });
  } else {
    // Perform a standard search using $or for other cases
    matchingPets = await petModel.find({
      $or: [
        { petname: { $in: regexArray } },
        { location: { $in: regexArray } },
        { breed: { $in: queryWords.map(word => new RegExp(word.replace(/s$/, ''), 'i')) } },
        { category: { $in: queryWords.map(word => new RegExp(word.replace(/s$/, ''), 'i')) } }
      ]
    });
  }

  if (req.isAuthenticated()) {
    const userLatitude = req.user.latitude;
    const userLongitude = req.user.longitude;

    const distancesAndPets = findDistancesAndCenters(userLatitude, userLongitude, matchingPets);

    // Sort the matching pets by nearest location
    const sortedPets = quickSort(distancesAndPets);

    await res.render('search-results', { query, abcd: sortedPets });
  } else {
    // If user is not authenticated, render the search results without sorting
    await res.render('search-results', { query, abc: matchingPets });
  }

  // await res.render('search-results', { query, abc: matchingPets });
});


router.get('/sdb', async function(req, res){
  const breed = req.query.breed; // Convert the query to lowercase

  try {
      // Use a regular expression for case-insensitive search
      const dogs = await petModel.find({ breed: { $regex: new RegExp(breed, 'i') } }).exec();
      res.render('search-results', { doggy: dogs });
  } catch (err) {
      res.status(500).send('Error searching for dogs');
  }
});

router.get('/scb', async function(req, res){
  const breed = req.query.breed; // Convert the query to lowercase

  try {
      // Use a regular expression for case-insensitive search
      const cats = await petModel.find({ breed: { $regex: new RegExp(breed, 'i') } }).exec();
      res.render('search-results', { catty: cats });
  } catch (err) {
      res.status(500).send('Error searching for dogs');
  }
});





// router.get('search-results', function(req, res){
//   res.render('search-results')
// })









// // Backend route handler for API requests
// router.get('/api/pets', async (req, res, next) => {
//   try {
//     // Fetch all pets from the database
//     let allPets = await petModel.find({});
    
//     // Respond with JSON data for API consumption
//     res.json(allPets);
//   } catch (error) {
//     // Handle errors and send an HTTP 500 status with the error message
//     res.status(500).send(error.message);
//   }
// });


// Route to render the user profile when authenticated
router.get('/profile', async function(req, res) {
  try {
    // Ensure the user is authenticated
    if (req.isAuthenticated()) {
      // Retrieve the logged-in user's ID or any unique identifier
      const userId = req.user.id; // Adjust this based on your user model

      // Fetch the user's information from the database using the userId
      const loggedInUser = await userModel.findById(userId);

      // Render the user-profile page with the logged-in user's data
      res.render('user-profile', { user: loggedInUser, loggedIn: true });
    } else {
      // If the user is not authenticated, redirect them to the login page or handle the case appropriately
      res.redirect('/login');
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
});


router.get('/pet-details/:petId', async (req, res) => {
  try{
    const petId = req.params.petId;
    let allpet = await petModel.findById(petId);
    // console.log(allpet);
    const requested = req.query.requested === 'true'; // Ensure it's a boolean
    res.render('pet-details', {peti: allpet, requested, loggedIn: req.isAuthenticated() });
  } catch (error){
    res.status(500).send(error.message);
  }
});

router.get('/logmeout', function(req, res){
  req.logout(function(err){
    if(err) {
      console.log('error logging out', err)
    }
    res.redirect('/login');
  });
});

router.get('/logout', auth, async (req, res) => {
  try {
    console.log(req.user, "req.user");

    // //for single logout
    // req.user.tokens = req.user.tokens.filter((currElem) => {
    //   return currElem.token != req.token;
    // })

    //logout from all devices
    req.user.tokens = [];

    res.clearCookie("jwt");

    console.log("logged out succesfully");

    await req.user.save();
    res.redirect('/login')
  } catch (error) {
    // res.status(500).send(error);
    res.redirect('/login');

  }
})

router.get('/logoutAdmin', authAdmin, async (req, res) => {
  try {
    console.log(req.user, "req.user");

    req.user.tokens = [];

    res.clearCookie("jwt");

    console.log("logged out succesfully");

    await req.user.save();
    res.redirect('/login')
  } catch (error) {
    // res.status(500).send(error);
    res.redirect('/login');
  }
})

function isLoggedIn(req, res, next){
  if(req.isAuthenticated()){
    return next();
  }
  res.redirect('/');
};


// router.get('/dog', function(req, res){
//   res.render('dog', { loggedIn: req.isAuthenticated() })
// })

router.get('/dog', async (req, res) => {
  try{
    if(req.isAuthenticated()){
      const adoptionCenters = await petModel.find( { category: { $regex: /^dog$/i } } ).exec();

      const userLatitude = req.user.latitude;
      const userLongitude = req.user.longitude;

      const distancesAndCenters = findDistancesAndCenters(userLatitude, userLongitude, adoptionCenters);

      const sortedCenters = quickSort(distancesAndCenters);
      console.log("Sorted Adoption Centers:", sortedCenters);
      res.render('dog', { geoDog: sortedCenters, loggedIn: req.isAuthenticated() });
    }else{
      let alldog = await petModel.find({ category: { $regex: /^dog$/i } });
    // console.log(allpet);
    res.render('dog', {dog: alldog, loggedIn: req.isAuthenticated() });
    }
    
  } catch (error){
    res.status(500).send(error.message);
  }
});

// router.get('/cat', function(req, res){
//   res.render('cat', { loggedIn: req.isAuthenticated() })
// })

router.get('/cat', async (req, res) => {
  try{
    if(req.isAuthenticated()) {
      const adoptionCenters = await petModel.find( { category: { $regex: /^cat$/i } } ).exec();

      const userLatitude = req.user.latitude;
      const userLongitude = req.user.longitude;

      const distancesAndCenters = findDistancesAndCenters(userLatitude, userLongitude, adoptionCenters);

      const sortedCenters = quickSort(distancesAndCenters);
      console.log("Sorted Adoption Centers:", sortedCenters);
      res.render('cat', { geoCat: sortedCenters, loggedIn: req.isAuthenticated() });
    }else{
      let allcat = await petModel.find({ category: { $regex: /^cat$/i } });
      console.log(allcat);
      res.render('cat', {cat: allcat, loggedIn: req.isAuthenticated() });
    }
  } catch (error){
    res.status(500).send(error.message);
  }
});

// router.get('/others', function(req, res){
//   res.render('others', { loggedIn: req.isAuthenticated() })
// })

router.get('/others', async (req, res) => {
  try{
    if (req.isAuthenticated()) {
      const adoptionCenters = await petModel.find({ 
        category: { 
          $nin: [/^dog$/i, /^cat$/i], // Exclude 'dog' and 'cat' categories
          $regex: '', // No additional regex needed to include all other categories
          $options: 'i' // 'i' option for case insensitivity
        } 
    });    
      
      const userLatitude = req.user.latitude;
      const userLongitude = req.user.longitude;

      const distancesAndCenters = findDistancesAndCenters(userLatitude, userLongitude, adoptionCenters);

      const sortedCenters = quickSort(distancesAndCenters);
      console.log("Sorted Adoption Centers:", sortedCenters);
      res.render('others', { geoOthers: sortedCenters, loggedIn: req.isAuthenticated() });

    }else{
      let allothers = await petModel.find({ 
        category: { 
          $nin: [/^dog$/i, /^cat$/i], // Exclude 'dog' and 'cat' categories
          $regex: '', // No additional regex needed to include all other categories
          $options: 'i' // 'i' option for case insensitivity
        } 
    });    
    // console.log(allothers);
    res.render('others', {others: allothers, loggedIn: req.isAuthenticated() });
    }
  } catch (error){
    res.status(500).send(error.message);
  }
});

router.get('/breed/dog', function(req, res){
  res.render('sdb', { loggedIn: req.isAuthenticated() })
})

router.get('/breed/cat', function(req, res){
  res.render('scb', { loggedIn: req.isAuthenticated() })
})

// router.get('/requested', function(req, res){
//   res.render('requested', { loggedIn: req.isAuthenticated() })
// })

// router.get('/adopted', function(req, res){
//   res.render('adopted', { loggedIn: req.isAuthenticated() })
// })

router.get('/aboutus', function(req, res){
  res.render('aboutus', { loggedIn: req.isAuthenticated() })
})

router.get('/signup', function(req, res){
  res.render('signUp')
})

router.get('/signup-shelter', function(req, res){
  res.render('signUp-shelter')
})

router.get('/login', function(req, res){
  res.render('logIn')
})



// shelter ko page haru 

// // Middleware function to check if the user is a shelter owner
// function ensureShelterOwner(req, res, next) {
//   if (req.isAuthenticated() && req.shelter && req.shelter.role === 'shelter') {
//     return next(); // User is a shelter owner, proceed to the next middleware/route handler
//   } else {
//     console.log("Authentication status:", req.isAuthenticated());
//     console.log("User object:", req.shelter);
//     res.redirect('/shelter-le-kam-garena'); // Redirect unauthorized users to the unauthorized page
//   }
// }

// router.get('/shelter-dashboard', auth, async function(req, res) {
//   try {
//     const pets = await petModel.find({});
//     // console.log(pets); // Log the fetched pets to check if data is retrieved

//     // console.log(`this is cookie aweasome ${req.cookies.jwt}`)
//     res.render('shelter-dashboard', { petss: pets });
//   } catch (error) {
//     console.log(error);
//     res.status(500).send('Internal Server Error');
//   }
// });

router.get('/shelter-dashboard', auth, async function(req, res) {
  try {
    const shelterId = req.user._id; // Get shelter ID from the JWT token or session
    const pets = await petModel.find({ addedBy: shelterId });
    // console.log("pets added by shelterid :", pets);

    console.log(`this is cookie aweasome ${req.cookies.jwt}`)

    res.render('shelter-dashboard', { petss: pets });
  } catch (error) {
    res.status(500).send('Internal Server Error');
  }
});



router.get('/addpet',auth, async function(req, res){
  res.render('addpet')
})

// router.get('/edit-pet/:petId', function(req, res){
//   const petId = req.params.petId;
//   let sabpet =  petModel.findById(petId);
//   res.render('edit-pets', { petId: petId })
// })

router.get('/edit-pet/:petId', async (req, res) => {
  try{
    const petId = req.params.petId;
    let sabpet = await petModel.findById(petId);
    // console.log(sabpet);
    res.render('edit-pets', {petii: sabpet});
  } catch (error){
    res.status(500).send(error.message);
  }
});

// router.get('/dog-shelter', function(req, res){
//   res.render('dog-shelter')
// })

// router.get('/dog-shelter', async function(req, res) {
//   try {
//     const pets = await petModel.find({category: 'dog'});
//     // console.log(pets); // Log the fetched pets to check if data is retrieved
//     res.render('dog-shelter', { kukur: pets });
//   } catch (error) {
//     console.log(error);
//     res.status(500).send('Internal Server Error');
//   }
// });

router.get('/dog-shelter', auth, async function(req, res) {
  try {
    const shelterId = req.user._id; // Get shelter ID from the JWT token or session
    const pets = await petModel.find({ addedBy: shelterId, category: { $regex: /^dog$/i } });
    // console.log("pets added by shelterid :", pets);

    // console.log(`this is cookie aweasome ${req.cookies.jwt}`)

    res.render('dog-shelter', { kukur: pets });
  } catch (error) {
    res.status(500).send('Internal Server Error');
  }
});

// router.get('/cat-shelter', function(req, res){
//   res.render('cat-shelter')
// })

// router.get('/cat-shelter', async function(req, res) {
//   try {
//     const pets = await petModel.find({category: 'cat'});
//     // console.log(pets); // Log the fetched pets to check if data is retrieved
//     res.render('cat-shelter', { biralo: pets });
//   } catch (error) {
//     console.log(error);
//     res.status(500).send('Internal Server Error');
//   }
// });

router.get('/cat-shelter', auth, async function(req, res) {
  try {
    const shelterId = req.user._id; // Get shelter ID from the JWT token or session
    const pets = await petModel.find({ addedBy: shelterId, category: { $regex: /^cat$/i }});
    // console.log("pets added by shelterid :", pets);

    // console.log(`this is cookie aweasome ${req.cookies.jwt}`)

    res.render('cat-shelter', { biralo: pets });
  } catch (error) {
    res.status(500).send('Internal Server Error');
  }
});

// router.get('/others-shelter', function(req, res){
//   res.render('others-shelter')
// })

// router.get('/others-shelter', async function(req, res) {
//   try {
//     const pets = await petModel.find({ category: { $nin: ['dog', 'cat'] } });
//     // console.log(pets); // Log the fetched pets to check if data is retrieved
//     res.render('others-shelter', { aru: pets });
//   } catch (error) {
//     console.log(error);
//     res.status(500).send('Internal Server Error');
//   }
// });

router.get('/others-shelter', auth, async function(req, res) {
  try {
    const shelterId = req.user._id; // Get shelter ID from the JWT token or session
    const pets = await petModel.find({ 
      addedBy: shelterId, 
      category: { 
          $nin: ['dog', 'cat'],
          $regex: 'yourCategoryRegex', 
          $options: 'i' // 'i' option for case insensitivity
      }
  });  
    // console.log("pets added by shelterid :", pets);

    // console.log(`this is cookie aweasome ${req.cookies.jwt}`)

    res.render('others-shelter', { aru: pets });
  } catch (error) {
    res.status(500).send('Internal Server Error');
  }
});

router.get('/shelter-profile', auth, async function(req, res) {
  try {
    if (req.isAuthenticated() && req.user.role === 'shelter') {
      const shelterId = req.user._id; // Adjust this based on your user model

      // Fetch the shelter's information from the database using the shelterId
      const shelter = await shelterModel.findById(shelterId);

      // Render the shelter-profile page with the shelter's data
      res.render('shelter-profile', { shelter: shelter, loggedIn: true });
    } else {
      // If the user is not a shelter or not authenticated, handle the case appropriately
      res.redirect('/login');
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
});


router.get('/aboutus-shelter', function(req, res){
  res.render('aboutus-shelter')
})


//admin ko page haru

router.get('/admin/pets', authAdmin, async function(req, res){
  try {
    const pets = await petModel.find({ });

    res.render('admin-pets', { kukurharu: pets });
  } catch (error) {
    res.status(500).send('Internal Server Error');
  }
})

router.get('/admin/dogs', authAdmin, async function(req, res){
  try {
    const pets = await petModel.find({ category: { $regex: /^dog$/i } });
    // console.log("oeeeeeee ", pets);
    res.render('admin-dogs', { admindog: pets });
  } catch (error) {
    res.status(500).send('Internal Server Error');
  }
})

router.get('/admin/cats', authAdmin, async function(req, res){
  try {
    const pets = await petModel.find({ category: { $regex: /^cat$/i } });
    // console.log("oeeeeeee ", pets);
    res.render('admin-cats', { admincat: pets });
  } catch (error) {
    res.status(500).send('Internal Server Error');
  }
})

router.get('/admin/others', authAdmin, async function(req, res){
  try {
    const pets = await petModel.find({ category: { 
      $nin: [/^dog$/i, /^cat$/i], // Exclude 'dog' and 'cat' categories
      $regex: '', // No additional regex needed to include all other categories
      $options: 'i' // 'i' option for case insensitivity
    } });
    res.render('admin-others', { adminother: pets });
  } catch (error) {
    res.status(500).send('Internal Server Error');
  }
})

router.get('/admin/users', authAdmin, async function(req, res){
  try {
    const users = await userModel.find({ });
    res.render('admin-users', { adminuser: users });
  } catch (error) {
    res.status(500).send('Internal Server Error');
  }
})

router.get('/admin/shelters', authAdmin, async function(req, res){
  try {
    const users = await shelterModel.find({ });
    res.render('admin-shelters', { adminshelter: users });
  } catch (error) {
    res.status(500).send('Internal Server Error');
  }
})


router.post('/signup', function(req, res){
  console.log(req.body);
  var userdata = new userModel({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    username: req.body.username,
    mobileNo: req.body.mobileNo,
    email: req.body.email,
    password: req.body.password,
    latitude: parseFloat(req.body.latitude),
    longitude: parseFloat(req.body.longitude),
  })

  userModel.register(userdata, req.body.password)
  .then(function(registeredUser){  
    res.redirect('/login');
    // passport.authenticate("local")(req, res, function(){
    //   res.redirect('/login');
    // })
  })
  .catch(function(err){
    console.error(err)
    // res.redirect('/signup')
  })
})

// router.post('/signup-shelter', async function(req, res){
//   console.log(req.body);
//   var shelterdata = new shelterModel({
//     firstName: req.body.firstName,
//     lastName: req.body.lastName,
//     username: req.body.username,
//     mobileNo: req.body.mobileNo,
//     email: req.body.email,
//     password: req.body.password,
//   })

//   // const token = await shelterdata.generateAuthToken();//jwt ko part

//   shelterModel.register(shelterdata, req.body.password)
//   .then(function(registeredShelter){
//     res.redirect('/login');
//     // passport.authenticate("local")(req, res, function(){
//     //   res.redirect('/login');
//     // })
//   })
//   .catch(function(err){
//     console.error(err)
//     res.redirect('/signup-shelter')
//   })
// })

router.post('/signup-shelter', async function(req, res){
  try {
    console.log("req.body ko :", req.body);
    var shelterdata = new shelterModel({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      username: req.body.username,
      mobileNo: req.body.mobileNo,
      email: req.body.email,
      password: req.body.password,
      latitude: parseFloat(req.body.latitude),
      longitude: parseFloat(req.body.longitude),
    })
    console.log("the success part:", shelterdata);

    const token = await shelterdata.generateAuthToken();//jwt ko part
    console.log("the token part:", token);

    res.cookie("jwt", token, {
      expires: new Date(Date.now() + 600000),
      httpOnly: true 
    });
    // console.log("this is cookie:", cookie);

    const registered = await shelterdata.save();
    console.log("register vayo:", registered);
    res.status(201).redirect('/login');

    
  } catch (error) {
    // res.status(400).send(error);
    console.log("the error part page");
  }
  
})







// router.post('/addpet', upload.single('upload'), function(req, res){
//   console.log(req.body);

//   // Convert 'on' or 'off' strings to Booleans
//   const vaccinated = req.body.vaccinated === 'true';
//   const trained = req.body.trained === 'true';

//   // const shelterId = req.shelter.id;


//   var petdata = new petModel({
//     petname: req.body.petname,
//   category: req.body.category,
//   birthdate: req.body.birthdate,
//   breed: req.body.breed,
//   vaccinated: vaccinated,
//   trained: trained,
//   color: req.body.color,
//   location: req.body.location,
//   description: req.body.description,
//   imageName: req.file.filename,
//   image: req.file.path,
//   addedBy: shelterId,
//   })

//   // petModel.register(petdata)
//   petdata.save()
//   .then(function(savedPet){
//     res.redirect('/shelter-dashboard');
//   })
//   .catch(function(err){
//     console.error(err)
//     res.redirect('/addpet')
//   })
// })



// Assuming the JWT token is sent in the request headers or cookies
router.post('/addpet', upload.single('upload'), async (req, res) => {
  try {
    const token = req.cookies.jwt; // Get the JWT token from request headers or cookies

    if (!token) {
      // Handle case when token is not provided
      return res.status(401).send('Unauthorized: No token provided');
    }

    console.log("token payo:", token)

    // Verify the token
    const decodedToken = jwt.verify(token, "abcdefghijklmnopqrstuvwzyzabcdefghijkl");
    console.log('Decoded token:', decodedToken);


    const vaccinated = req.body.vaccinated === 'true';
    const trained = req.body.trained === 'true';
    
    // Extract shelter ID from the decoded token payload
    const shelterId = decodedToken._id;
    
    console.log("shelterId:", shelterId)

    // Use shelterId to associate the pet with the shelter
    const petdata = new petModel({
      // Other pet details...
      petname: req.body.petname,
      category: req.body.category,
      birthdate: req.body.birthdate,
      breed: req.body.breed,
      vaccinated: vaccinated,
      trained: trained,
      color: req.body.color,
      location: req.body.location,
      description: req.body.description,
      imageName: req.file.filename,
      image: req.file.path,
      addedBy: shelterId,
    });

    const shelter = await shelterModel.findById(shelterId);

    if (!shelter) {
      return res.status(404).send('Shelter not found');
    }
    
    petdata.latitude = shelter.latitude;
    petdata.longitude = shelter.longitude;

    // Save the pet or perform other actions as needed
    await petdata.save();

    // res.status(201).send('Pet added successfully');
    res.redirect('/shelter-dashboard');
  } catch (error) {
    console.error('Error:', error);
    // res.status(401).send('Unauthorized: Invalid token');
    res.status(401).redirect('/addpet');
  }
});





// Adoption ko code haru 
//////////////////////////


router.post('/adopt/:pet_id', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.redirect('/login');
    }

    const petId = req.params.pet_id;

    // Assuming you've already fetched pet details from the database
    const pet = await petModel.findById(petId);
    console.log("pet vetiyo", pet)

    if (!pet) {
      return res.status(404).send("Pet not found");
    }

    let userId = ""; // Initialize userId variable

    // Check if the user is authenticated and get their ID
    if (req.isAuthenticated()) {
      userId = req.user.id; // Retrieve the logged-in user's ID
      firstName = req.user.firstName;
      lastName = req.user.lastName;
      email = req.user.email;
      mobileNo = req.user.mobileNo;
    }

    // Store adoption request details in the adoptionRequests collection
    const adoptionRequest = new arModel({
      petId: pet._id,
      petName: pet.petname,
      category: pet.category,
      birthdate: pet.birthdate,
      breed: pet.breed,
      vaccinated: pet.vaccinated,
      trained: pet.trained,
      color: pet.color,
      location: pet.location,
      description: pet.description,
      imageName: pet.imageName, 
      addedBy: pet.addedBy,

      userId, // Use the userId obtained from the authenticated user or an empty string if not authenticated
      firstName,
      lastName,
      email,
      mobileNo,
    });

    await adoptionRequest.save();

    // Redirect the user or send a success response
    // res.send('i think adoption req gayo'); // Redirect to the home page or any other page
    res.redirect(`/pet-details/${petId}?requested=true`);    // res.status(200).send("Adoption request saved successfully");
  } catch (error) {
    res.status(500).send(error.message);
  }
});



router.get('/requests-shelter', auth, async (req, res) => {
  try {
    
    const shelterId = req.user._id; 
    // console.log("shelterko id :", shelterId);

    const adoptionRequests = await arModel.find({ addedBy: shelterId });
    console.log("ar  :", adoptionRequests);

    res.render('requests-shelter', { adoptionRequests });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// router.get('/requests-shelter', function(req, res){
//   res.render('requests-shelter')
// })

// const AdoptionRequest = require('path_to_your_AdoptionRequest_model'); // Replace with the actual path

router.post('/delete-request/:requestId', async (req, res) => {
  try {
    const requestId = req.params.requestId;
    await arModel.findByIdAndDelete(requestId);
    res.redirect('/requests-shelter');

  } catch (error) {
    res.status(500).send(error.message);
  }
})
// Route to handle accepting adoption requests
router.post('/accept-request/:requestId', async (req, res) => {
  try {
    const requestId = req.params.requestId;
    // console.log("request id:", requestId);

    // Find the adoption request by ID
    const adoptionRequest = await arModel.findById(requestId);
    // console.log("adoption request aayo:", adoptionRequest)

    if (!adoptionRequest) {
      return res.status(404).send("Adoption request not found");
    }

    // Assuming you have an AdoptedPet model for the "adoptedPets" collection
    // const AdoptedPet = require('path_to_your_AdoptedPet_model'); // Replace with the actual path

    // Create a new adopted pet entry with data from the adoption request
    const adoptedPet = new apModel({
      petId: adoptionRequest.petId,
      petName: adoptionRequest.petName,
      category: adoptionRequest.category,
      birthdate: adoptionRequest.birthdate,
      breed: adoptionRequest.breed,
      vaccinated: adoptionRequest.vaccinated,
      trained: adoptionRequest.trained,
      color: adoptionRequest.color,
      location: adoptionRequest.location,
      description: adoptionRequest.description,
      imageName: adoptionRequest.imageName, 
      addedBy: adoptionRequest.addedBy,

      userId: adoptionRequest.userId,
      firstName: adoptionRequest.firstName,
      lastName: adoptionRequest.lastName,
      email: adoptionRequest.email,
      mobileNo: adoptionRequest.mobileNo
    });

    await adoptedPet.save();

    // Remove the adoption request from the "adoptionRequests" collection
    await arModel.findByIdAndDelete(requestId);

    await petModel.deleteOne({ _id: adoptionRequest.petId });

    // Notify the user that their adoption request has been accepted
    // Modify this based on your notification mechanism (e.g., sending an email, using a notification library, etc.)
    const userNotification = `Your adoption request for ${adoptionRequest.petName} has been accepted. Congratulations!`;

    // Send the response to the user
    // res.status(200).send(userNotification);
    res.redirect(`/requests-shelter?notification=${encodeURIComponent(userNotification)}`)
  } catch (error) {
    res.status(500).send(error.message);
  }
});


router.get('/adopted-shelter', auth, async function(req, res) {
  try {
    const shelterId = req.user._id; // Get shelter ID from the JWT token or session
    const acceptedPet = await apModel.find({ addedBy: shelterId });
    // console.log("adopted pets :", acceptedPet);
    // console.log("shelter ko id yahi haina ra", shelterId);

    // console.log(`this is cookie aweasome ${req.cookies.jwt}`)

    res.render('adopted-shelter', { adopted: acceptedPet });
    // res.send(acceptedPet)
  } catch (error) {
    res.status(500).send('Internal Server Error');
  }
});


router.get('/requested', async function(req, res) {
  try {
    if (req.isAuthenticated()) {
      const userId = req.user.id;
      const requestedPet = await arModel.find({ userId: userId });
      // console.log("req gareko pet haru:", requestedPet)

      // res.render('user-profile', { user: loggedInUser, loggedIn: true });
      res.render('requested', { reqpet: requestedPet, loggedIn: true });

    } else {
      res.redirect('/login');
    }
  } catch (error) {
    res.status(500).send('Internal Server Error');
  }
});

router.get('/adopted', async function(req, res) {
  try {
    if (req.isAuthenticated()) {
      const userId = req.user.id;
      // console.log(userId);
      const adoptedPet = await apModel.find({ userId: userId });
      // console.log("adopt gareko pet haru:", adoptedPet)

      res.render('adopted', { hyaa: adoptedPet, loggedIn: true });

    } else {
      res.redirect('/login');
    }
  } catch (error) {
    res.status(500).send('Internal Server Error');
  }
});






//user account login using passport
// router.post('/login', passport.authenticate("local-user", {
//   successRedirect: '/',
//   failureRedirect: "/login",
//   failureFlash: true
// }), function(req, res){
//   console.log("Yo login le balla kam garyo");
//   const username = req.body.username;
//   const password = req.body.password;
// });


//shelter account login using jwt
// router.post('/login', async(req, res) => {
//   try {
//     const username = req.body.username;
//     const password = req.body.password;
  
//     const sUsername = await shelterModel.findOne({username:username});
//     // console.log(password, sUsername.password);
//     // const isMatch = await compare(password, sUsername.password);

//     const token = await sUsername.generateAuthToken();//jwt ko part
//     console.log("the token part", token);

//     if(password == sUsername.password){
//       res.cookie("jwt", token, {
//         expires: new Date(Date.now() + 300000),
//         httpOnly: true 
//       });
//       res.status(201).redirect('/shelter-dashboard');
//     }
//     else{
//       res.send("invalid password details");
//     }
//   } catch (error) {
//     res.status(400).send("invalid login details");
    
//   }
// })







// router.post('/login', async (req, res, next) => {
//   try {
//     const username = req.body.username;
//     const password = req.body.password;

//     const user = await userModel.findOne({ username: username });
//     const shelter = await shelterModel.findOne({ username: username });

//     if (user) {
//       passport.authenticate("local-user", {
//         successRedirect: '/', 
//         failureRedirect: "/login",
//         failureFlash: true
//       }) (req, res, () => {
//         res.locals.isAuthenticated = true;
//         res.end();
//       });

//     } else if (shelter) {
//       // Perform shelter login using JWT token
//       if (password == shelter.password) {
//         const token = await shelter.generateAuthToken();
//         res.cookie("jwt", token, {
//           expires: new Date(Date.now() + 600000),
//           httpOnly: true 
//         });
//         res.status(201).redirect('/shelter-dashboard');
//       } else {
//         res.send("Invalid shelter password");
//       }
//     } else {
//       res.send("User or shelter not found");
//     }
//   } catch (error) {
//     res.status(400).send("Invalid login details");
//   }
// });


// yo tala ko  ho original
router.post('/login', async (req, res, next) => {
  try {
    const username = req.body.username;
    const password = req.body.password;

    // Check if the user is an admin
    const admin = await adminModel.findOne({ username: username });
    if (admin) {
      // Validate admin password
      if (password === admin.password) {
        const token = await admin.generateAuthToken();
        res.cookie("jwt", token, {
          expires: new Date(Date.now() + 600000),
          httpOnly: true 
        });
        // Redirect admin to admin dashboard
        res.redirect('/admin');
        return;
      } else {
        // Invalid admin password
        res.send("Invalid admin password");
        return;
      }
    }

    const user = await userModel.findOne({ username: username });
    const shelter = await shelterModel.findOne({ username: username });

    if (user) {
      passport.authenticate("local-user", {
        successRedirect: '/', 
        failureRedirect: "/login",
        failureFlash: true
      }) (req, res, next);

    } else if (shelter) {
      // Perform shelter login using JWT token
      if (password == shelter.password) {
        const token = await shelter.generateAuthToken();
        res.cookie("jwt", token, {
          expires: new Date(Date.now() + 600000),
          httpOnly: true 
        });
        res.status(201).redirect('/shelter-dashboard');
      } else {
        res.send("Invalid shelter password");
      }
    } else {
      // res.send("User or shelter not found");
      res.redirect('/login')
    }
  } catch (error) {
    res.status(400).send("Invalid login details");
    // res.redirect('/login');
  }
});




// Route for the admin dashboard page
router.get('/admin', authAdmin, async (req, res) => {
  const countPet = await petModel.countDocuments();
  const countUser = await userModel.countDocuments();
  const countShelter = await shelterModel.countDocuments();
  res.render('admin_dashboard', { countPet, countUser, countShelter });
});



// router.post('/login', async (req, res, next) => {
//   try {
//     const username = req.body.username;
//     const password = req.body.password;

//     const user = await userModel.findOne({ username: username });
//     const shelter = await shelterModel.findOne({ username: username });

//     if (user) {
//       passport.authenticate("local-user", (err, user, info) => {
//         if (err || !user) {
//           return res.status(400).send("Invalid login details");
//         }
//         req.logIn(user, async (err) => {
//           if (err) {
//             return res.status(400).send("Invalid login details");
//           }
//           const token = await user.generateAuthToken();
//           res.cookie("jwt-user", token, {
//             expires: new Date(Date.now() + 300000),
//             httpOnly: true 
//           });
//           return res.status(201).redirect('/');
//         });
//       })(req, res, next);
//     } else if (shelter) {
//       // Your existing shelter login code remains unchanged
//       if (password == shelter.password) {
//         const token = await shelter.generateAuthToken();
//         res.cookie("jwt", token, {
//           expires: new Date(Date.now() + 300000),
//           httpOnly: true 
//         });
//         return res.status(201).redirect('/shelter-dashboard');
//       } else {
//         return res.send("Invalid shelter password");
//       }
//     } else {
//       return res.send("User or shelter not found");
//     }
//   } catch (error) {
//     return res.status(400).send("Invalid login details");
//   }
// });






router.post('/edit-pet/:petId', upload.single('upload'), async (req, res) => {
  const petId = req.params.petId;
  const vaccinated = req.body.vaccinated === 'true';
  const trained = req.body.trained === 'true';
  try {
      // Retrieve the updated form data
      const updatedPetData = {
          petname: req.body.petname,
          birthdate: req.body.birthdate,
          category: req.body.category,
          vaccinated: vaccinated,
          trained: trained,
          color: req.body.color,
          breed: req.body.breed,
          location: req.body.location,
          description: req.body.description,
          // imageName: req.file.filename,
          // image: req.file.path
      };

      // Update the pet data in the database
      const updatedPet = await petModel.findByIdAndUpdate(petId, updatedPetData, { new: true });

      // Redirect to a page showing the updated details or some other appropriate action
      // res.redirect(`/pet/${updatedPet._id}`);
      res.redirect('/shelter-dashboard');
  } catch (error) {
      res.status(500).send(error.message);
  }
});

// router.delete('/delete/:petId', async (req, res) => {
//   // console.log(req.params.petId)
//   try {
//     const petId = req.params.petId;
//     // Perform deletion of the pet using the petId
//     await petModel.findByIdAndDelete(petId);
//     res.redirect('/shelter-dashboard'); // Redirect to an appropriate page after deletion
//   } catch (error) {
//     res.status(500).send(error.message);
//   }
// });

router.post('/delete/:petId', async (req, res) => {
  // console.log(req.params.petId)
  try {
    const petId = req.params.petId;
    // Perform deletion of the pet using the petId
    await petModel.findByIdAndDelete(petId);
    res.redirect('/shelter-dashboard'); // Redirect to an appropriate page after deletion
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.post('/deletegar/:petId', async (req, res) => {
  // console.log(req.params.petId)
  try {
    const petId = req.params.petId;
    // Perform deletion of the pet using the petId
    await petModel.findByIdAndDelete(petId);
    res.redirect('/admin'); // Redirect to an appropriate page after deletion
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.post('/deletegarnus/:userId', async (req, res) => {
  // console.log(req.params.petId)
  try {
    const userId = req.params.userId;
    // Perform deletion of the pet using the petId
    await userModel.findByIdAndDelete(userId);
    res.redirect('/admin/users'); // Redirect to an appropriate page after deletion
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.post('/deletegarnuss/:shelterId', async (req, res) => {
  // console.log(req.params.petId)
  try {
    const shelterId = req.params.shelterId;
    // Perform deletion of the pet using the petId
    await shelterModel.findByIdAndDelete(shelterId);
    res.redirect('/admin/shelters'); // Redirect to an appropriate page after deletion
  } catch (error) {
    res.status(500).send(error.message);
  }
});




// router.get('/createe', async function(req, res){
//   const createdUser = await arModel.create({
//   petId: "1232",
//   petName: "puppy",
  
//   userId: "abc",
//   firstName: "lal",
//   lastName: "red",
//   email: "email@gmail.com",
//   phoneNo: "1234"
//   });
//   res.send(createdUser);
// });



// This is how we create a database-user
// router.get('/create', async function(req, res){
//   const createdUser = await userModel.create({
//     firstName: "Sanjay",
//     lastName: "Saru",
//     mobileNo: "9867546354",
//     email: "sarusanjay049@gmail.com",
//     password: "sa123456",
//     username: "sanjay"
//   });
//   res.send(createdUser);
// });

// This is how we create a database-shelter
// router.get('/create', async function(req, res){
//   const createdShelter = await shelterModel.create({
//     firstName: "Lal",
//     lastName: "Bahadur",
//     mobileNo: "9847052801",
//     email: "lalbahadur@gmail.com",
//     password: "lalbahadur",
//     username: "lal"
//   });
//   res.send(createdShelter);
// });

// // This is how we create a database-admin
// router.get('/createa', async function(req, res){
//   const createdadmin = await adminModel.create({
//     username: "adminnn",
//     password: "admin1222",
//     role : "admin",
//     token: token,
//   });

//     const token = await createdadmin.generateAuthToken();//jwt ko part
//     console.log("the token part:", token);

//     res.cookie("jwt", token, {
//       expires: new Date(Date.now() + 600000),
//       httpOnly: true 
//     });
//     console.log("this is cookie:", cookie);

//   res.send(createdadmin);
// });


// This is how we create a database-collection-pets
// router.get('/create', async function(req, res){
//   const createdPet = await petModel.create({
//     petname: "puppy",
//     category: "dog",
//     birthdate: new Date("2020-02-20"), // Using the proper date format
//     breed: "akjka",
//     vaccinated: true,
//     trained: false,
//     color: "red",
//     location: "hady",
//     description: "String",
//     imageName: "koda.jpg", // Name of the image file
//     addedBy: '659da4d4c5268aea3d81a6b4'
//   });
//   res.send(createdPet);
  
// });


// router.get('/allusers', async function(req, res){
//   let allUsers = await userModel.findOne({username: "sanjay"});
//   console.log(allUsers)
//   res.send(allUsers);
// });

// router.get('/deleteduser', async function(req, res){
//   let deletedUser = await userModel.findOneAndDelete({username: "sanjay"});
//   res.send(deletedUser);
// })

router.get('*', function(req, res){
  res.render('404',  {
    errorcomment: "This page couldn't be found"
  })
})


// const jwt = require('jsonwebtoken');

// const createToken = async () => {
//   const token = await jwt.sign({_id: "6594204797d1a709ce5806b8"}, "abcdefghijklmnopqrstuvwxyzabcdefghijkl", {
//     expiresIn: "5 minutes"
//   });
//   console.log(token);

//   const userVer = await jwt.verify(token, "abcdefghijklmnopqrstuvwxyzabcdefghijkl");
//   console.log(userVer)
// }

// createToken();



module.exports = router;
