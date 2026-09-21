const Trip = require("../models/Trip");
const { errorHandler } = require("../auth");

const BUS_CLASSES = [
    "Regular Aircon",
    "Deluxe",
    "First Class",
    "Sleeper"
];

function validateTripInput(body) {
    const requiredFields = [
        "origin",
        "destination",
        "departureDate",
        "departureTime",
        "busClass",
        "fare",
        "totalSeats"
    ];

    for (const field of requiredFields) {
        if (body[field] === undefined || body[field] === null || String(body[field]).trim() === "") {
            return `${field} is required`;
        }
    }

    if (!BUS_CLASSES.includes(body.busClass)) {
        return "Invalid bus class";
    }

    const fare = Number(body.fare);
    const totalSeats = Number(body.totalSeats);

    if (!Number.isFinite(fare) || fare < 0) {
        return "Fare must be a valid non-negative number";
    }

    if (!Number.isInteger(totalSeats) || totalSeats < 1) {
        return "Total seats must be a whole number greater than 0";
    }

    const date = new Date(body.departureDate);
    if (Number.isNaN(date.getTime())) {
        return "Departure date is invalid";
    }

    return null;
}

module.exports.addTrip = async (req, res) => {
    try {
        const validationError = validateTripInput(req.body);
        if (validationError) {
            return res.status(400).send({ message: validationError });
        }

        const totalSeats = Number(req.body.totalSeats);

        const newTrip = new Trip({
            origin: req.body.origin.trim(),
            destination: req.body.destination.trim(),
            departureDate: new Date(req.body.departureDate),
            departureTime: req.body.departureTime.trim(),
            busClass: req.body.busClass,
            fare: Number(req.body.fare),
            totalSeats,
            availableSeats: totalSeats,
            isActive: true
        });

        const result = await newTrip.save();

        return res.status(201).send({
            success: true,
            message: "Trip added successfully",
            trip: result
        });
    } catch (error) {
        return errorHandler(error, req, res);
    }
};

module.exports.getAllTrips = async (req, res) => {
    try {
        const trips = await Trip.find({}).sort({ departureDate: 1, createdOn: 1 });
        return res.status(200).send(trips);
    } catch (error) {
        return errorHandler(error, req, res);
    }
};

module.exports.getAllActive = async (req, res) => {
    try {
        const trips = await Trip.find({ isActive: true }).sort({ departureDate: 1, createdOn: 1 });
        return res.status(200).send(trips);
    } catch (error) {
        return errorHandler(error, req, res);
    }
};

module.exports.getTrip = async (req, res) => {
    try {
        const trip = await Trip.findById(req.params.id);

        if (!trip) {
            return res.status(404).send({ message: "Trip not found" });
        }

        return res.status(200).send(trip);
    } catch (error) {
        return errorHandler(error, req, res);
    }
};

module.exports.updateTrip = async (req, res) => {
    try {
        const validationError = validateTripInput(req.body);
        if (validationError) {
            return res.status(400).send({ message: validationError });
        }

        const trip = await Trip.findById(req.params.tripId);
        if (!trip) {
            return res.status(404).send({ message: "Trip not found" });
        }

        const totalSeats = Number(req.body.totalSeats);
        const consumedSeats = trip.totalSeats - trip.availableSeats;

        if (totalSeats < consumedSeats) {
            return res.status(400).send({
                message: `Total seats cannot be lower than the ${consumedSeats} seat(s) already used by confirmed bookings.`
            });
        }

        trip.origin = req.body.origin.trim();
        trip.destination = req.body.destination.trim();
        trip.departureDate = new Date(req.body.departureDate);
        trip.departureTime = req.body.departureTime.trim();
        trip.busClass = req.body.busClass;
        trip.fare = Number(req.body.fare);
        trip.totalSeats = totalSeats;
        trip.availableSeats = totalSeats - consumedSeats;

        const updatedTrip = await trip.save();

        return res.status(200).send({
            success: true,
            message: "Trip updated successfully",
            trip: updatedTrip
        });
    } catch (error) {
        return errorHandler(error, req, res);
    }
};

module.exports.archiveTrip = async (req, res) => {
    try {
        const trip = await Trip.findById(req.params.tripId);

        if (!trip) {
            return res.status(404).send({ message: "Trip not found" });
        }

        trip.isActive = false;
        const updatedTrip = await trip.save();

        return res.status(200).send({
            success: true,
            message: "Trip archived successfully",
            trip: updatedTrip
        });
    } catch (error) {
        return errorHandler(error, req, res);
    }
};

module.exports.activateTrip = async (req, res) => {
    try {
        const trip = await Trip.findById(req.params.tripId);

        if (!trip) {
            return res.status(404).send({ message: "Trip not found" });
        }

        trip.isActive = true;
        const updatedTrip = await trip.save();

        return res.status(200).send({
            success: true,
            message: "Trip activated successfully",
            trip: updatedTrip
        });
    } catch (error) {
        return errorHandler(error, req, res);
    }
};
