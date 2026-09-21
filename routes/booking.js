
const express = require("express");
const multer = require("multer");

const bookingController =
    require("../controllers/booking");

const {
    verify,
    verifyAdmin
} = require("../auth");

const router = express.Router();


// ==========================================
// PAYMENT PROOF UPLOAD
// ==========================================

// Store uploaded images in memory instead of
// writing them to the Vercel filesystem.
const storage = multer.memoryStorage();

const upload = multer({
    storage,

    limits: {
        fileSize: 10 * 1024 * 1024
    },

    fileFilter: function (req, file, cb) {

        const allowedTypes = [
            "image/jpeg",
            "image/png"
        ];

        if (allowedTypes.includes(file.mimetype)) {

            cb(null, true);

        } else {

            cb(
                new Error(
                    "Only JPG, JPEG, and PNG images are allowed"
                )
            );

        }
    }
});


// ==========================================
// PASSENGER ROUTES
// ==========================================


// CREATE BOOKING

router.post(
    "/book",
    verify,
    bookingController.bookTrip
);


// GET USER BOOKINGS

router.get(
    "/get-bookings",
    verify,
    bookingController.getBookings
);


// SUBMIT / RESUBMIT PAYMENT PROOF

router.patch(
    "/:bookingId/payment-proof",
    verify,
    upload.single("paymentProof"),
    bookingController.submitPaymentProof
);


// ==========================================
// ADMIN ROUTES
// ==========================================


// GET ALL BOOKINGS

router.get(
    "/admin/all",
    verify,
    verifyAdmin,
    bookingController.getAllBookings
);


// GET PENDING PAYMENT VERIFICATIONS

router.get(
    "/admin/pending",
    verify,
    verifyAdmin,
    bookingController.getPendingBookings
);


// APPROVE PAYMENT

router.patch(
    "/admin/:bookingId/approve-payment",
    verify,
    verifyAdmin,
    bookingController.approvePayment
);


// FAIL PAYMENT

router.patch(
    "/admin/:bookingId/fail-payment",
    verify,
    verifyAdmin,
    bookingController.failPayment
);


module.exports = router;

// const express = require("express");
// const multer = require("multer");
// const path = require("path");

// const bookingController =
//     require("../controllers/booking");

// const {
//     verify,
//     verifyAdmin
// } = require("../auth");

// const router = express.Router();


// // PAYMENT PROOF STORAGE
// const storage =
//     multer.diskStorage({

//         destination:
//             function (
//                 req,
//                 file,
//                 cb
//             ) {
//                 cb(
//                     null,
//                     path.join(
//                         __dirname,
//                         "../uploads/payment-proofs"
//                     )
//                 );
//             },

//         filename:
//             function (
//                 req,
//                 file,
//                 cb
//             ) {
//                 const uniqueName =
//                     Date.now() +
//                     "-" +
//                     file.originalname;

//                 cb(
//                     null,
//                     uniqueName
//                 );
//             }
//     });


// const upload =
//     multer({

//         storage,

//         fileFilter:
//             function (
//                 req,
//                 file,
//                 cb
//             ) {

//                 const extension =
//                     file.originalname
//                         .toLowerCase()
//                         .split(".")
//                         .pop();

//                 if (
//                     [
//                         "jpg",
//                         "jpeg",
//                         "png"
//                     ].includes(
//                         extension
//                     )
//                 ) {
//                     cb(
//                         null,
//                         true
//                     );
//                 } else {
//                     cb(
//                         new Error(
//                             "Only JPG, JPEG, and PNG images are allowed"
//                         )
//                     );
//                 }
//             }
//     });


// // ==========================================
// // PASSENGER ROUTES
// // ==========================================

// // CREATE BOOKING
// router.post(
//     "/book",
//     verify,
//     bookingController.bookTrip
// );


// // GET USER BOOKINGS
// router.get(
//     "/get-bookings",
//     verify,
//     bookingController.getBookings
// );


// // SUBMIT / RESUBMIT PAYMENT PROOF
// router.patch(
//     "/:bookingId/payment-proof",
//     verify,
//     upload.single(
//         "paymentProof"
//     ),
//     bookingController.submitPaymentProof
// );


// // ==========================================
// // ADMIN ROUTES
// // ==========================================

// // GET ALL BOOKINGS
// router.get(
//     "/admin/all",
//     verify,
//     verifyAdmin,
//     bookingController.getAllBookings
// );


// // GET PENDING PAYMENT VERIFICATIONS
// router.get(
//     "/admin/pending",
//     verify,
//     verifyAdmin,
//     bookingController.getPendingBookings
// );


// // APPROVE PAYMENT
// router.patch(
//     "/admin/:bookingId/approve-payment",
//     verify,
//     verifyAdmin,
//     bookingController.approvePayment
// );


// // FAIL PAYMENT
// router.patch(
//     "/admin/:bookingId/fail-payment",
//     verify,
//     verifyAdmin,
//     bookingController.failPayment
// );


// module.exports = router;