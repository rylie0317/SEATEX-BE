// IMPORTS

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const userRoutes = require("./routes/user");
const tripRoutes = require("./routes/trip");
const bookingRoutes = require("./routes/booking");

const app = express();

app.get("/", (req, res) => {
    res.status(200).send("SEATEX API is running.");
});


// DATABASE CONNECTION

mongoose.connect(process.env.MONGODB_STRING);

const db = mongoose.connection;


// Display database connection errors.
db.on(
    "error",
    console.error.bind(console, "connection error")
);


// Display a message once MongoDB is successfully connected.
mongoose.connection.once("open", () => {
    console.log("Now connected to MongoDB Atlas.");
});


// MIDDLEWARE

// Allows the server to read JSON request bodies.
app.use(express.json());

// Allows the server to read form data.
app.use(express.urlencoded({
    extended: true
}));


// CORS CONFIGURATION

const corsOptions = {

    // Allow requests from the frontend.
    origin: [
        "http://localhost:5173"
    ],

    // Allow authorization headers and credentials.
    credentials: true,

    optionsSuccessStatus: 200
};


// Apply the CORS configuration.
app.use(cors(corsOptions));


// STATIC FILES

// Serve uploaded payment proofs so administrators can review them.
const path = require("path");
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


// ROUTES

app.use("/users", userRoutes);

app.use("/trips", tripRoutes);

app.use("/bookings", bookingRoutes);


// SERVER START

if (require.main === module) {

    app.listen(
        process.env.PORT || 3000,
        () => {
            console.log(
                `API is now online on port ${process.env.PORT || 3000}`
            );
        }
    );
}


// EXPORTS
module.exports = app;

// module.exports = {
//     app,
//     mongoose
// };