const mongoose = require("mongoose");

const tripSchema = new mongoose.Schema({
    origin: {
        type: String,
        required: [true, "Origin is required"],
        trim: true
    },

    destination: {
        type: String,
        required: [true, "Destination is required"],
        trim: true
    },

    departureDate: {
        type: Date,
        required: [true, "Departure date is required"]
    },

    departureTime: {
        type: String,
        required: [true, "Departure time is required"],
        trim: true
    },

    busClass: {
        type: String,
        enum: [
            "Regular Aircon",
            "Deluxe",
            "First Class",
            "Sleeper"
        ],
        required: [true, "Bus class is required"]
    },

    fare: {
        type: Number,
        required: [true, "Fare is required"],
        min: [0, "Fare cannot be negative"]
    },

    totalSeats: {
        type: Number,
        required: [true, "Total seats is required"],
        min: [1, "Total seats must be at least 1"]
    },

    availableSeats: {
        type: Number,
        required: true,
        min: [0, "Available seats cannot be negative"]
    },

    isActive: {
        type: Boolean,
        default: true
    },

    createdOn: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Trip", tripSchema);
