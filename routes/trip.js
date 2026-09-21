const express = require("express");

// Import the Trip controller.
const tripController = require("../controllers/trip");

// Import authentication middleware.
const { verify, verifyAdmin } = require("../auth");

const router = express.Router();


// CREATE TRIP
// Only administrators can create trips.
router.post(
    "/",
    verify,
    verifyAdmin,
    tripController.addTrip
);


// GET ALL TRIPS
// Only administrators can view all trips, including inactive ones.
router.get(
    "/all",
    verify,
    verifyAdmin,
    tripController.getAllTrips
);


// GET ALL ACTIVE TRIPS
// This endpoint can be accessed without logging in.
router.get(
    "/",
    tripController.getAllActive
);


// GET A SPECIFIC TRIP
router.get(
    "/specific/:id",
    tripController.getTrip
);


// UPDATE TRIP
// Only administrators can update trips.
router.patch(
    "/:tripId",
    verify,
    verifyAdmin,
    tripController.updateTrip
);


// ARCHIVE TRIP
// Only administrators can archive a trip.
router.patch(
    "/:tripId/archive",
    verify,
    verifyAdmin,
    tripController.archiveTrip
);


// ACTIVATE TRIP
// Only administrators can activate a trip.
router.patch(
    "/:tripId/activate",
    verify,
    verifyAdmin,
    tripController.activateTrip
);


module.exports = router;