const express = require('express');
const bookingController = require('./../controllers/bookingController');
const authController = require('./../controllers/authController');

const router = express.Router();

router.use(authController.protect);
router.post('/cash-in', bookingController.cashIn)

router.post('/checkout-wallet', bookingController.purchaseByWallet);
router.get('/checkout-session', bookingController.getCheckoutSession);


router.route('/my-bookings').get(bookingController.getMyBookings)




// router
//   .route('/')
//   .get(bookingController.getAllBookings)
//   .post(bookingController.createBooking);


router
    .route('/:id')
    .delete(bookingController.deleteBooking);
//   .get(bookingController.getBooking)
//   .patch(bookingController.updateBooking)

module.exports = router;
