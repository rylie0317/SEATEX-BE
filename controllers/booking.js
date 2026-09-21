const Booking = require("../models/Booking");
const Trip = require("../models/Trip");
const User = require("../models/User");

const { errorHandler } = require("../auth");

const {
    sendBookingConfirmation,
    sendPaymentRejection
} = require("../utils/email");


// ==========================================
// CREATE BOOKING
// ==========================================

module.exports.bookTrip = async (req, res) => {

    try {

        // Get the logged-in passenger's ID.
        const userId = req.user.id;

        // Get booking information.
        const {
            tripId,
            numberOfPassengers
        } = req.body;

        // Validate required information.
        if (!tripId || !numberOfPassengers) {

            return res.status(400).send({
                message:
                    "Trip ID and number of passengers are required"
            });

        }

        // Convert number of passengers to a number.
        const passengers = Number(numberOfPassengers);

        // Make sure the number of passengers is valid.
        if (!Number.isInteger(passengers) || passengers < 1) {

            return res.status(400).send({
                message:
                    "Number of passengers must be at least 1"
            });

        }

        // Find the selected trip.
        const trip = await Trip.findById(tripId);

        if (!trip) {

            return res.status(404).send({
                message: "Trip not found"
            });

        }

        // Prevent booking inactive trips.
        if (!trip.isActive) {

            return res.status(400).send({
                message:
                    "This trip is no longer available"
            });

        }

        // Check available seats.
        if (passengers > trip.availableSeats) {

            return res.status(400).send({
                message:
                    "Not enough available seats"
            });

        }

        // Calculate total fare.
        const totalFare =
            Number(trip.fare) * passengers;

        // Calculate 30% downpayment.
        const downpaymentAmount =
            totalFare * 0.30;

        // Create booking.
        const newBooking = new Booking({

            userId: userId,

            tripId: tripId,

            numberOfPassengers: passengers,

            totalFare: totalFare,

            downpaymentAmount: downpaymentAmount,

            paymentAmount: 0,

            paymentType: null,

            paymentProof: null,

            paymentStatus: "Pending Payment",

            failureReason: null,

            bookingStatus: "Pending"

        });

        // Save booking.
        const savedBooking =
            await newBooking.save();

        return res.status(201).send({

            success: true,

            message:
                "Booking created please proceed with payment",

            booking:
                savedBooking

        });

    } catch (error) {

        console.error(
            "CREATE BOOKING ERROR:",
            error
        );

        // Return validation errors clearly.
        if (error.name === "ValidationError") {

            return res.status(400).send({

                message:
                    "Booking validation failed",

                errors:
                    Object.values(error.errors)
                        .map(err => err.message)

            });

        }

        return errorHandler(error, req, res);

    }

};


// ==========================================
// GET USER BOOKINGS
// ==========================================

module.exports.getBookings = async (req, res) => {

    try {

        // Get logged-in passenger.
        const userId = req.user.id;

        // Find passenger's bookings.
        const bookings =
            await Booking.find({
                userId: userId
            }).sort({
                bookedOn: -1
            });

        if (bookings.length === 0) {

            return res.status(200).send([]);

        }

        // Get the trip information for each booking.
        const bookingsWithTrips =
            await Promise.all(

                bookings.map(async (booking) => {

                    const trip =
                        await Trip.findById(
                            booking.tripId
                        );

                    return {

                        ...booking.toObject(),

                        trip: trip
                            ? {

                                _id:
                                    trip._id,

                                origin:
                                    trip.origin,

                                destination:
                                    trip.destination,

                                departureDate:
                                    trip.departureDate,

                                departureTime:
                                    trip.departureTime,

                                busClass:
                                    trip.busClass || "N/A",

                                fare:
                                    trip.fare,

                                totalSeats:
                                    trip.totalSeats,

                                availableSeats:
                                    trip.availableSeats,

                                isActive:
                                    trip.isActive

                            }
                            : null

                    };

                })

            );

        return res.status(200).send(
            bookingsWithTrips
        );

    } catch (error) {

        return errorHandler(error, req, res);

    }

};


// ==========================================
// SUBMIT PAYMENT PROOF
// ==========================================

module.exports.submitPaymentProof = async (req, res) => {

    try {

        // Get logged-in passenger.
        const userId = req.user.id;

        // Get booking ID.
        const bookingId = req.params.bookingId;

        // Get payment information.
        const {
            paymentAmount,
            paymentType
        } = req.body;


        // ==========================================
        // VALIDATE FILE
        // ==========================================

        if (!req.file) {

            return res.status(400).send({
                message:
                    "Proof of payment is required"
            });

        }


        // ==========================================
        // VALIDATE PAYMENT AMOUNT
        // ==========================================

        if (
            paymentAmount === undefined ||
            paymentAmount === null ||
            paymentAmount === ""
        ) {

            return res.status(400).send({
                message:
                    "Payment amount is required"
            });

        }


        const amount =
            Number(paymentAmount);


        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {

            return res.status(400).send({
                message:
                    "Payment amount must be greater than 0"
            });

        }


        // ==========================================
        // VALIDATE PAYMENT TYPE
        // ==========================================

        if (
            paymentType !== "Downpayment" &&
            paymentType !== "Full Payment"
        ) {

            return res.status(400).send({
                message:
                    "Payment type must be Downpayment or Full Payment"
            });

        }


        // ==========================================
        // FIND BOOKING
        // ==========================================

        const booking =
            await Booking.findOne({

                _id: bookingId,

                userId: userId

            });


        if (!booking) {

            return res.status(404).send({
                message:
                    "Booking not found"
            });

        }


        // ==========================================
        // PREVENT PAYMENT AFTER APPROVAL
        // ==========================================

        if (
            booking.paymentStatus === "Approved"
        ) {

            return res.status(400).send({
                message:
                    "Payment has already been approved"
            });

        }


        // ==========================================
        // DETERMINE REQUIRED AMOUNT
        // ==========================================

        let requiredAmount;


        if (
            paymentType === "Downpayment"
        ) {

            requiredAmount =
                booking.downpaymentAmount;

        } else {

            requiredAmount =
                booking.totalFare;

        }


        // ==========================================
        // VALIDATE PAYMENT AMOUNT
        // ==========================================

        if (
            Math.abs(
                amount - requiredAmount
            ) > 0.01
        ) {

            return res.status(400).send({

                message:
                    `Payment amount must be exactly ₱${requiredAmount} for ${paymentType}`

            });

        }


        // ==========================================
        // CONVERT IMAGE TO BASE64
        // ==========================================

        const base64Image =
            req.file.buffer.toString("base64");

        const paymentProof =
            `data:${req.file.mimetype};base64,${base64Image}`;


        // ==========================================
        // SAVE PAYMENT INFORMATION
        // ==========================================

        booking.paymentProof =
            paymentProof;

        booking.paymentAmount =
            amount;

        booking.paymentType =
            paymentType;

        booking.failureReason =
            null;

        booking.paymentStatus =
            "Pending Verification";

        booking.bookingStatus =
            "Pending";


        // ==========================================
        // SAVE BOOKING
        // ==========================================

        const updatedBooking =
            await booking.save();


        // ==========================================
        // RESPONSE
        // ==========================================

        return res.status(200).send({

            success: true,

            message:
                "Proof of payment submitted successfully",

            booking:
                updatedBooking

        });


    } catch (error) {

        console.error(
            "SUBMIT PAYMENT PROOF ERROR:",
            error
        );

        return errorHandler(
            error,
            req,
            res
        );

    }

};

// module.exports.submitPaymentProof = async (req, res) => {

//     try {

//         // Get logged-in passenger.
//         const userId = req.user.id;

//         // Get booking ID.
//         const bookingId =
//             req.params.bookingId;

//         // Get payment information.
//         const {
//             paymentAmount,
//             paymentType
//         } = req.body;

//         // Check uploaded file.
//         if (!req.file) {

//             return res.status(400).send({
//                 message:
//                     "Proof of payment is required"
//             });

//         }

//         // Validate payment amount.
//         if (
//             paymentAmount === undefined ||
//             paymentAmount === null ||
//             paymentAmount === ""
//         ) {

//             return res.status(400).send({
//                 message:
//                     "Payment amount is required"
//             });

//         }

//         // Convert payment amount to number.
//         const amount =
//             Number(paymentAmount);

//         // Make sure payment amount is valid.
//         if (!Number.isFinite(amount) || amount <= 0) {

//             return res.status(400).send({
//                 message:
//                     "Payment amount must be greater than 0"
//             });

//         }

//         // Validate payment type.
//         if (
//             paymentType !== "Downpayment" &&
//             paymentType !== "Full Payment"
//         ) {

//             return res.status(400).send({
//                 message:
//                     "Payment type must be Downpayment or Full Payment"
//             });

//         }

//         // Find booking belonging to passenger.
//         const booking =
//             await Booking.findOne({

//                 _id:
//                     bookingId,

//                 userId:
//                     userId

//             });

//         if (!booking) {

//             return res.status(404).send({
//                 message:
//                     "Booking not found"
//             });

//         }

//         // Do not allow payment proof
//         // after payment has already been approved.
//         if (
//             booking.paymentStatus === "Approved"
//         ) {

//             return res.status(400).send({
//                 message:
//                     "Payment has already been approved"
//             });

//         }

//         // Determine the required payment amount.
//         let requiredAmount;

//         if (paymentType === "Downpayment") {

//             requiredAmount =
//                 booking.downpaymentAmount;

//         } else {

//             requiredAmount =
//                 booking.totalFare;

//         }

//         // Make sure the submitted amount
//         // matches the selected payment type.
//         if (
//             Math.abs(amount - requiredAmount) > 0.01
//         ) {

//             return res.status(400).send({

//                 message:
//                     `Payment amount must be exactly ₱${requiredAmount} for ${paymentType}`

//             });

//         }

//         // Save payment proof.
//         booking.paymentProof =
//             `/uploads/payment-proofs/${req.file.filename}`;

//         // Save actual payment information.
//         booking.paymentAmount =
//             amount;

//         booking.paymentType =
//             paymentType;

//         // Clear any previous failure reason.
//         booking.failureReason =
//             null;

//         // Set payment status to pending verification.
//         booking.paymentStatus =
//             "Pending Verification";

//         // Keep booking pending until admin approves payment.
//         booking.bookingStatus =
//             "Pending";

//         // Save booking.
//         const updatedBooking =
//             await booking.save();

//         return res.status(200).send({

//             success: true,

//             message:
//                 "Proof of payment submitted successfully",

//             booking:
//                 updatedBooking

//         });

//     } catch (error) {

//         return errorHandler(error, req, res);

//     }

// };


// ==========================================
// GET ALL BOOKINGS (ADMIN)
// ==========================================

module.exports.getAllBookings = async (req, res) => {

    try {

        const bookings =
            await Booking.find({})
                .sort({
                    bookedOn: -1
                });

        const bookingsWithDetails =
            await Promise.all(

                bookings.map(async (booking) => {

                    const [trip, user] =
                        await Promise.all([

                            Trip.findById(
                                booking.tripId
                            ),

                            User.findById(
                                booking.userId
                            ).select(
                                "firstName lastName email mobileNo"
                            )

                        ]);

                    return {

                        ...booking.toObject(),

                        customer: user
                            ? {

                                _id:
                                    user._id,

                                firstName:
                                    user.firstName,

                                lastName:
                                    user.lastName,

                                email:
                                    user.email,

                                mobileNo:
                                    user.mobileNo

                            }
                            : null,

                        trip: trip
                            ? {

                                _id:
                                    trip._id,

                                origin:
                                    trip.origin,

                                destination:
                                    trip.destination,

                                departureDate:
                                    trip.departureDate,

                                departureTime:
                                    trip.departureTime,

                                busClass:
                                    trip.busClass || "N/A",

                                fare:
                                    trip.fare,

                                totalSeats:
                                    trip.totalSeats,

                                availableSeats:
                                    trip.availableSeats,

                                isActive:
                                    trip.isActive

                            }
                            : null

                    };

                })

            );

        return res.status(200).send(
            bookingsWithDetails
        );

    } catch (error) {

        return errorHandler(error, req, res);

    }

};


// ==========================================
// GET PENDING PAYMENTS
// ==========================================

module.exports.getPendingBookings = async (req, res) => {

    try {

        const bookings =
            await Booking.find({

                paymentStatus:
                    "Pending Verification"

            }).sort({

                bookedOn:
                    1

            });

        const bookingsWithDetails =
            await Promise.all(

                bookings.map(async (booking) => {

                    const [trip, user] =
                        await Promise.all([

                            Trip.findById(
                                booking.tripId
                            ),

                            User.findById(
                                booking.userId
                            ).select(
                                "firstName lastName email mobileNo"
                            )

                        ]);

                    return {

                        ...booking.toObject(),

                        customer: user
                            ? {

                                _id:
                                    user._id,

                                firstName:
                                    user.firstName,

                                lastName:
                                    user.lastName,

                                email:
                                    user.email,

                                mobileNo:
                                    user.mobileNo

                            }
                            : null,

                        trip: trip
                            ? {

                                _id:
                                    trip._id,

                                origin:
                                    trip.origin,

                                destination:
                                    trip.destination,

                                departureDate:
                                    trip.departureDate,

                                departureTime:
                                    trip.departureTime,

                                busClass:
                                    trip.busClass || "N/A",

                                fare:
                                    trip.fare,

                                totalSeats:
                                    trip.totalSeats,

                                availableSeats:
                                    trip.availableSeats

                            }
                            : null

                    };

                })

            );

        return res.status(200).send(
            bookingsWithDetails
        );

    } catch (error) {

        return errorHandler(error, req, res);

    }

};


// ==========================================
// APPROVE PAYMENT
// ==========================================

module.exports.approvePayment = async (req, res) => {

    try {

        const bookingId =
            req.params.bookingId;

        const {
            paymentAmount,
            paymentType
        } = req.body;

        const amount =
            Number(paymentAmount);

        // Validate payment amount.
        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {

            return res.status(400).send({

                message:
                    "Payment amount must be greater than 0"

            });

        }

        // Validate payment type.
        if (
            paymentType !== "Downpayment" &&
            paymentType !== "Full Payment"
        ) {

            return res.status(400).send({

                message:
                    "Payment type must be Downpayment or Full Payment"

            });

        }

        // Find booking.
        const booking =
            await Booking.findById(
                bookingId
            );

        if (!booking) {

            return res.status(404).send({
                message:
                    "Booking not found"
            });

        }

        // Make sure payment proof exists.
        if (!booking.paymentProof) {

            return res.status(400).send({

                message:
                    "Payment proof has not been submitted"

            });

        }

        // Make sure booking is pending verification.
        if (
            booking.paymentStatus !==
            "Pending Verification"
        ) {

            return res.status(400).send({

                message:
                    "Booking is not pending payment verification"

            });

        }

        // Determine required amount.
        const requiredAmount =
            paymentType === "Downpayment"
                ? booking.downpaymentAmount
                : booking.totalFare;

        // Validate amount.
        if (
            Math.abs(amount - requiredAmount) >
            0.01
        ) {

            return res.status(400).send({

                message:
                    `Payment amount must be exactly ₱${requiredAmount} for ${paymentType}`

            });

        }

        // Find the trip first.
        const trip =
            await Trip.findById(
                booking.tripId
            );

        if (!trip) {

            return res.status(404).send({
                message:
                    "Trip not found"
            });

        }

        // Check if trip is still active.
        if (!trip.isActive) {

            return res.status(400).send({

                message:
                    "This trip is no longer available"

            });

        }

        // IMPORTANT:
        // Seats are deducted ONLY when
        // admin approves the payment.
        //
        // Use findOneAndUpdate instead of
        // changing the Trip document and calling
        // trip.save().
        //
        // This avoids validating unrelated fields
        // such as totalSeats and also prevents
        // two approvals from taking the same seats.

        const updatedTrip =
            await Trip.findOneAndUpdate(

                {
                    _id: booking.tripId,

                    isActive: true,

                    availableSeats: {
                        $gte:
                            booking.numberOfPassengers
                    }

                },

                {
                    $inc: {
                        availableSeats:
                            -booking.numberOfPassengers
                    }

                },

                {
                    new: true
                }

            );

        // If no Trip was updated,
        // there are not enough seats.
        if (!updatedTrip) {

            return res.status(400).send({

                message:
                    "Not enough available seats to confirm this booking"

            });

        }

        // Update booking payment information.
        booking.paymentAmount =
            amount;

        booking.paymentType =
            paymentType;

        booking.failureReason =
            null;

        booking.paymentStatus =
            "Approved";

        booking.bookingStatus =
            "Confirmed";

        // Save updated booking.
        const updatedBooking =
            await booking.save();

        // Get passenger information.
        const user =
            await User.findById(
                booking.userId
            );

        if (!user) {

            return res.status(404).send({

                message:
                    "Passenger account not found"

            });

        }

        // Send confirmation email.
        let emailSent = true;

        try {

            await sendBookingConfirmation(
                user.email,
                updatedBooking
            );

        } catch (emailError) {

            emailSent = false;

            console.error(
                "Approval email failed:",
                emailError
            );

        }

        return res.status(200).send({

            success: true,

            message:
                emailSent
                    ? "Payment approved and passenger notified"
                    : "Payment approved but email notification failed",

            emailSent:
                emailSent,

            booking:
                updatedBooking,

            availableSeats:
                updatedTrip.availableSeats

        });

    } catch (error) {

        console.error(
            "APPROVE PAYMENT ERROR:",
            error
        );

        return errorHandler(
            error,
            req,
            res
        );

    }

};


// ==========================================
// MARK PAYMENT AS FAILED
// ==========================================

module.exports.failPayment = async (req, res) => {

    try {

        const bookingId =
            req.params.bookingId;

        const {
            failureReason,
            otherReason
        } = req.body;

        const finalFailureReason =
            failureReason === "Other"
                ? otherReason?.trim()
                : failureReason;

        // Validate final failure reason.
        if (!finalFailureReason) {

            return res.status(400).send({

                message:
                    "Failure reason is required"

            });

        }

        // Find booking.
        const booking =
            await Booking.findById(
                bookingId
            );

        if (!booking) {

            return res.status(404).send({
                message:
                    "Booking not found"
            });

        }

        // Make sure payment is pending verification.
        if (
            booking.paymentStatus !==
            "Pending Verification"
        ) {

            return res.status(400).send({

                message:
                    "Booking is not pending payment verification"

            });

        }

        // Keep original payment information
        // for the rejection email.
        const originalPaymentAmount =
            booking.paymentAmount;

        const originalPaymentType =
            booking.paymentType;

        // Update booking.
        booking.paymentStatus =
            "Failed";

        booking.failureReason =
            finalFailureReason;

        booking.paymentAmount =
            0;

        booking.paymentType =
            null;

        booking.bookingStatus =
            "Pending";

        // Save booking.
        const updatedBooking =
            await booking.save();

        // Get passenger.
        const user =
            await User.findById(
                booking.userId
            );

        if (!user) {

            return res.status(404).send({

                message:
                    "Passenger account not found"

            });

        }

        // Preserve original payment information
        // for the email only.
        const emailBooking = {

            ...updatedBooking.toObject(),

            paymentAmount:
                originalPaymentAmount,

            paymentType:
                originalPaymentType

        };

        // Send rejection email.
        let emailSent = true;

        try {

            await sendPaymentRejection(
                user.email,
                emailBooking
            );

        } catch (emailError) {

            emailSent = false;

            console.error(
                "Failed-payment email failed:",
                emailError
            );

        }

        return res.status(200).send({

            success: true,

            message:
                emailSent
                    ? "Payment marked as failed and passenger notified"
                    : "Payment marked as failed but email notification failed",

            emailSent:
                emailSent,

            booking:
                updatedBooking

        });

    } catch (error) {

        return errorHandler(
            error,
            req,
            res
        );

    }

};