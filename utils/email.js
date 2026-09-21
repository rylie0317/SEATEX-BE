const nodemailer = require("nodemailer");

// ==========================================
// EMAIL TRANSPORTER
// ==========================================

const transporter = nodemailer.createTransport({

    service: "gmail",

    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }

});


// Check if the Gmail transporter is ready.
transporter.verify((error) => {

    if (error) {

        console.error(
            "EMAIL ERROR:",
            error
        );

    } else {

        console.log(
            "SEATEX email transporter is ready."
        );

    }

});


// ==========================================
// PAYMENT APPROVED EMAIL
// ==========================================

module.exports.sendBookingConfirmation = async (
    email,
    booking
) => {

    try {

        let paymentMessage = "";

        if (booking.paymentType === "Downpayment") {

            paymentMessage = `
                Your downpayment of
                <strong>₱${booking.paymentAmount}</strong>
                has been successfully received.
                Your booking is confirmed.
            `;

        } else if (booking.paymentType === "Full Payment") {

            paymentMessage = `
                Your full payment of
                <strong>₱${booking.paymentAmount}</strong>
                has been successfully received.
                Your booking is fully paid.
            `;

        } else {

            paymentMessage = `
                Your payment of
                <strong>₱${booking.paymentAmount}</strong>
                has been successfully received.
            `;

        }

        console.log(
            "SENDING APPROVAL EMAIL TO:",
            email
        );

        const info = await transporter.sendMail({

            from:
                `"SEATEX" <${process.env.EMAIL_USER}>`,

            to:
                email,

            subject:
                "SEATEX Payment Approved",

            html: `
                <!DOCTYPE html>

                <html>

                <body>

                    <h2>
                        SEATEX Payment Approved
                    </h2>

                    <p>
                        Good news! Your payment has been
                        successfully verified by SEATEX.
                    </p>

                    <hr>

                    <p>
                        <strong>Booking ID:</strong>
                        ${booking._id}
                    </p>

                    <p>
                        <strong>Number of Passengers:</strong>
                        ${booking.numberOfPassengers}
                    </p>

                    <p>
                        <strong>Total Fare:</strong>
                        ₱${booking.totalFare}
                    </p>

                    <p>
                        <strong>Amount Paid:</strong>
                        ₱${booking.paymentAmount}
                    </p>

                    <p>
                        <strong>Payment Type:</strong>
                        ${booking.paymentType}
                    </p>

                    <p>
                        <strong>Payment Status:</strong>
                        Approved
                    </p>

                    <hr>

                    <p>
                        ${paymentMessage}
                    </p>

                    <p>
                        <strong>SEATEX</strong>
                    </p>

                </body>

                </html>
            `

        });

        console.log(
            "APPROVAL EMAIL SENT:",
            info.messageId
        );

        console.log(
            "EMAIL RESPONSE:",
            info.response
        );

        return info;

    } catch (error) {

        console.error(
            "APPROVAL EMAIL ERROR:",
            error
        );

        throw error;

    }

};


// ==========================================
// PAYMENT FAILED EMAIL
// ==========================================

module.exports.sendPaymentRejection = async (
    email,
    booking
) => {

    try {

        console.log(
            "SENDING PAYMENT FAILURE EMAIL TO:",
            email
        );

        const info = await transporter.sendMail({

            from:
                `"SEATEX" <${process.env.EMAIL_USER}>`,

            to:
                email,

            subject:
                "SEATEX Payment Failed",

            html: `
                <!DOCTYPE html>

                <html>

                <body>

                    <h2>
                        SEATEX Payment Failed
                    </h2>

                    <p>
                        We are sorry, but your submitted
                        payment could not be approved.
                    </p>

                    <hr>

                    <p>
                        <strong>Booking ID:</strong>
                        ${booking._id}
                    </p>

                    <p>
                        <strong>Number of Passengers:</strong>
                        ${booking.numberOfPassengers}
                    </p>

                    <p>
                        <strong>Total Fare:</strong>
                        ₱${booking.totalFare}
                    </p>

                    <p>
                        <strong>Required Downpayment:</strong>
                        ₱${booking.downpaymentAmount}
                    </p>

                    <p>
                        <strong>Amount Submitted:</strong>
                        ₱${booking.paymentAmount}
                    </p>

                    <p>
                        <strong>Payment Status:</strong>
                        Failed
                    </p>

                    <p>
                        <strong>Reason:</strong>
                        ${booking.failureReason}
                    </p>

                    <hr>

                    <p>
                        Please review the reason above and
                        submit a new valid proof of payment
                        through your SEATEX account.
                    </p>

                    <p>
                        <strong>SEATEX</strong>
                    </p>

                </body>

                </html>
            `

        });

        console.log(
            "PAYMENT FAILURE EMAIL SENT:",
            info.messageId
        );

        console.log(
            "EMAIL RESPONSE:",
            info.response
        );

        return info;

    } catch (error) {

        console.error(
            "PAYMENT FAILURE EMAIL ERROR:",
            error
        );

        throw error;

    }

};