/*S43 ACTIVITY SOLUTION START*/
const express = require('express');
const userController = require('../controllers/user');

// Import the auth module and extract the verify middleware function
// verify will be used to authenticate requests using JWT
const { verify } = require("../auth");

const router = express.Router();

/*S44 ACTIVITY SOLUTION START*/

// Check if the email already exists
// router.post("/check-email", (req, res) => {
//     userController.checkEmailExists(req.body).then(resultFromController => res.send(resultFromController));
// });

/*S45 ACTIVITY SOLUTION START*/
router.post("/check-email", userController.checkEmailExists);
/*S45 ACTIVITY SOLUTION END*/


/*S44 ACTIVITY SOLUTION END*/

// User Registration
// router.post("/register", (req, res) => {
//     userController.registerUser(req.body).then(resultFromController => res.send(resultFromController));
// })

/*S45 ACTIVITY SOLUTION START*/
router.post("/register", userController.registerUser);
/*S45 ACTIVITY SOLUTION END*/


// User Login
// router.post("/login", (req, res) => {
//     userController.loginUser(req.body).then(resultFromController => res.send(resultFromController));
// })

/*S45 ACTIVITY SOLUTION START*/
router.post("/login", userController.loginUser);
/*S45 ACTIVITY SOLUTION END*/


// User Details
// verify is a middleware that runs before the route handler
// It checks if a valid JWT is provided in the request headers
// If valid, it attaches decoded user data to req.user and allows access
// If invalid or missing, it blocks the request and sends an error response
// Change the method from POST to GET since the user ID is now retrieved from the JWT (req.user), eliminating the need to send it in the request body
router.get("/details", verify, (req, res) => {

    console.log("result from details route:")
    console.log(req.user);

    userController.getProfile(req.user.id).then(resultFromController => res.send(resultFromController));
})

module.exports = router;
/*S43 ACTIVITY SOLUTION END*/
