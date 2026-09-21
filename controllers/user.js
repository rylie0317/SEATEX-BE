/*S43 ACTIVITY SOLUTION START*/
const User = require('../models/User');

const auth = require('../auth');

// Import the errorHandler
const { errorHandler } = require('../auth');

// Import the auth module
// This allows us to use createAccessToken() to generate JWT for a user after login
// const auth = require('../auth');

// Import bcryptjs library
// bcryptjs is used for hashing passwords to make them secure before storing in the database
// It converts plain text passwords into hashed strings that cannot be easily reversed
// This helps protect user credentials in case the database is compromised
const bcrypt = require('bcryptjs');

/*S45 ACTIVITY SOLUTION START*/

// Check if the email already exists
module.exports.checkEmailExists = (req, res) => {

    // includes() is built-in JS method
    // It checks if the email contains '@' symbol
    if(req.body.email.includes("@")) {

        // The result is sent back to the client via the "then" method found in the route file
        return User.find({ email : req.body.email })
        .then(result => {

            // The "find" method returns a record if a match is found
            if (result.length > 0) {

                // If a duplicate email is detected
                // status(409) indicates a conflict (data already exists)
                // Always use object in real-world apps
                return res.status(409).send({ message: "Duplicate email found" });

            // No duplicate email found
            // The user is not yet registered in the database
            } else {
                return res.status(200).send({ message: "No duplicate email found" });
            };
        })
        // .catch(err => err)
        /*S46 ACTIVITY SOLUTION START*/
        .catch(error => errorHandler(error, req, res));
        /*S46 ACTIVITY SOLUTION END*/
    // If @ is not included
    } else {
        // Send a response with status 400 (Bad Request)
        res.status(400).send({ message: "Invalid email format" });
    }
};

// User Registration
module.exports.registerUser = (req, res) => {

    /*S48 ACTIVITY SOLUTION START*/

    // Checks if the email is in the right format
    if (!req.body.email.includes("@")){
        /*S49 ACTIVITY SOLUTION START*/
        return res.status(400).send({ message: 'Invalid email format' });
        /*S49 ACTIVITY SOLUTION END*/
    }
    // Checks if the mobile number has the correct number of characters
    else if (req.body.mobileNo.length !== 11){
        /*S49 ACTIVITY SOLUTION START*/
        return res.status(400).send({ message: 'Mobile number is invalid' });
        /*S49 ACTIVITY SOLUTION END*/
    }
    // Checks if the password has atleast 8 characters
    else if (req.body.password.length < 8) {
        /*S49 ACTIVITY SOLUTION START*/
        return res.status(400).send({ message: 'Password must be atleast 8 characters long' });
        /*S49 ACTIVITY SOLUTION END*/
    // If all needed requirements are achieved
    } else {

        /*S48 ACTIVITY SOLUTION END*/

        let newUser = new User({
            firstName : req.body.firstName,
            lastName : req.body.lastName,
            email : req.body.email,
            mobileNo : req.body.mobileNo,
            // 10 is the value provided as the number of "salt" rounds that the bcrypt algorithm will run in order to encrypt the password
            password : bcrypt.hashSync(req.body.password, 10)
        })

        return newUser.save()
        /*S47 ACTIVITY SOLUTION START*/
        /*S49 ACTIVITY SOLUTION START*/
        .then((result) => res.status(201).send({
            message: 'User registered successfully',
            user: result
        }))
        /*S49 ACTIVITY SOLUTION END*/
        /*S47 ACTIVITY SOLUTION END*/
        // .catch(err => err)
        /*S46 ACTIVITY SOLUTION START*/
        .catch(error => errorHandler(error, req, res));
        /*S46 ACTIVITY SOLUTION END*/
    }
};

// User Login
module.exports.loginUser = (req, res) => {

    // It checks if the email contains the '@' symbol
    if(req.body.email.includes("@")) {

        // The "findOne" method returns the first record in the collection that matches the search criteria
        // We use the "findOne" method instead of the "find" method which returns all records that match the search criteria
        return User.findOne({ email : req.body.email })
        .then(result => {

            // User does not exist
            if(result == null){

                /*S47 ACTIVITY SOLUTION START*/
                /*S49 ACTIVITY SOLUTION START*/
                return res.status(404).send({ message: 'No email found' });
                /*S49 ACTIVITY SOLUTION END*/
                /*S47 ACTIVITY SOLUTION END*/

            // User exists
            } else {

                // Creates the variable "isPasswordCorrect" to return the result of comparing the login form password and the database password
                // The "compareSync" method is used to compare a non encrypted password from the login form to the encrypted password retrieved from the database and returns "true" or "false" value depending on the result
                // A good coding practice for boolean variable/constants is to use the word "is" or "are" at the beginning in the form of is+Noun
                    //example. isSingle, isDone, isAdmin, areDone, etc..
                const isPasswordCorrect = bcrypt.compareSync(req.body.password, result.password);

                // If the passwords match/result of the above code is true
                if (isPasswordCorrect) {

                    // Generate an access token
                    // Uses the "createAccessToken" method defined in the "auth.js" file
                    // Returning an object back to the client application is common practice to ensure information is properly labeled and real world examples normally return more complex information represented by objects
                    /*S49 ACTIVITY SOLUTION START*/
                    return res.status(200).send({ 
                        message: 'User logged in successfully',
                        access : auth.createAccessToken(result)
                    });
                    /*S49 ACTIVITY SOLUTION END*/
                // Passwords do not match
                } else {

                    /*S47 ACTIVITY SOLUTION START*/
                    /*S49 ACTIVITY SOLUTION START*/
                    return res.status(401).send({ message: 'Incorrect email or password' });
                    /*S49 ACTIVITY SOLUTION END*/
                    /*S47 ACTIVITY SOLUTION END*/
                }
            }
        })
        // .catch(err => err)
        /*S46 ACTIVITY SOLUTION START*/
        .catch(error => errorHandler(error, req, res));
        /*S46 ACTIVITY SOLUTION END*/
    // If '@' symbol is not included
    } else {
        // Send a response with status 400 (Bad Request)
        /*S49 ACTIVITY SOLUTION START*/
        res.status(400).send({ message: 'Invalid email format' });
        /*S49 ACTIVITY SOLUTION END*/
    }
}

// User Details
module.exports.getProfile = (userId) => {
    return User.findById(userId)
    .then(user => {

        if (!user) {
            return {
                message: 'User not found'
            };
        }

        user.password = "";

        return user;
    })
    .catch(error => error);
};
/*S45 ACTIVITY SOLUTION END*/

/*S44 ACTIVITY SOLUTION START*/
// Check if the email already exists
// module.exports.checkEmailExists = (reqBody) => {

//     // The result is sent back to the client via the "then" method found in the route file
//     return User.find({ email : reqBody.email })
//     .then(result => {

//         // The "find" method returns a record if a match is found
//         if (result.length > 0) {

//             return true;

//         // No duplicate email found
//         // The user is not yet registered in the database
//         } else {

//             return false;
//         };
//     })
//     .catch(err => err)
// };
/*S44 ACTIVITY SOLUTION END*/

// User Registration
// module.exports.registerUser = (reqBody) => {
//     let newUser = new User({
//         firstName : reqBody.firstName,
//         lastName : reqBody.lastName,
//         email : reqBody.email,
//         mobileNo : reqBody.mobileNo,
//         // password : reqBody.password
//         // Hash the user's password before saving it to the database
//         // bcrypt.hashSync() is a method that converts plain text password into a secure hashed version
//         // 10 = salt rounds (bcrypt will hash the password balancing security and performance.)
//         password : bcrypt.hashSync(reqBody.password, 10)
//     })

//     return newUser.save()
//     .then((result) => result)
//     .catch(err => err)
// };


// User Login
// module.exports.loginUser = (reqBody) => {
//     return User.findOne({ email: reqBody.email })
//     // .then(result => result)
//     .then(result => {
//         // If no user is found with the given email
//         if (result === null) {
//             // Login failed (User does not exist)
//             return false;
//         // If a user is found
//         } else {
//             // Compare the plain text password from the request with the hashed password in the database
//             // bcrypt.compareSync() returns true if passwords match, otherwise false
//             const isPasswordCorrect = bcrypt.compareSync(reqBody.password, result.password)

//             // If the password is correct
//             if (isPasswordCorrect) {
//                 // Generate a JWT access token using user's data
//                 // This token will be used for authentication in future requests
//                 return { access: auth.createAccessToken(result) }
//             } else {
//                 return false;
//             }
//         }
//     })
//     .catch(err => err);
// }

// User Details
// module.exports.getProfile = (userId) => {
//     return User.findById(userId)
//     // .then(result => result)
//     /*S44 ACTIVITY SOLUTION START*/
//     .then(result => {
//         result.password = "";
//         return result;
//     })
//     /*S44 ACTIVITY SOLUTION END*/
//     .catch(err => err)
// };
/*S43 ACTIVITY SOLUTION END*/
