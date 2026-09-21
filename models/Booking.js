const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "User ID is required"]
    },

    tripId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Trip",
        required: [true, "Trip ID is required"]
    },

    numberOfPassengers: {
        type: Number,
        required: [true, "Number of passengers is required"],
        min: [1, "Number of passengers must be at least 1"]
    },

    totalFare: {
        type: Number,
        required: [true, "Total fare is required"],
        min: [0, "Total fare cannot be negative"]
    },

    downpaymentAmount: {
        type: Number,
        required: [true, "Downpayment amount is required"],
        min: [0, "Downpayment amount cannot be negative"]
    },

    paymentAmount: {
        type: Number,
        default: 0,
        min: [0, "Payment amount cannot be negative"]
    },

    paymentType: {
        type: String,
        enum: [
            "Downpayment",
            "Full Payment"
        ],
        default: null
    },

    paymentProof: {
        type: String,
        default: null
    },

    paymentStatus: {
        type: String,
        enum: [
            "Pending Payment",
            "Pending Verification",
            "Approved",
            "Failed"
        ],
        default: "Pending Payment"
    },

    failureReason: {
        type: String,
        default: null,
        trim: true
    },

    bookingStatus: {
        type: String,
        enum: [
            "Pending",
            "Confirmed",
            "Cancelled"
        ],
        default: "Pending"
    },

    bookedOn: {
        type: Date,
        default: Date.now
    }

});

module.exports = mongoose.model(
    "Booking",
    bookingSchema
);