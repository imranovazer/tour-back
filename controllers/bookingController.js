const stripe = require("stripe")(
  "sk_test_51MifzoArPTsTEfKP7bzd0cQpjZe0fAGANXaAAp2WyLGbuCusNYGS1RzpTW6VFOOnk9bifO2buWBvGV8hpaMo1MVg00bktzHt1G"
);
const Tour = require("../models/Tour");
const User = require("../models/User");
const Booking = require("../models/Booking");

exports.purchaseByWallet = async (req, res) => {
  7
  try {
    const user = req.user;
    let totalPrice = 0;
    const bookingData = user.cart.map((item) => {
      totalPrice = totalPrice + item.count * item.product.price;
      return { count: item.count, tour: item.product._id }


    });
    if (user.wallet >= totalPrice) {

      user.wallet = user.wallet - totalPrice;
      user.cart = [];
      const newBooking = await Booking.create(
        {
          products: bookingData,
          user: user._id,
          price: totalPrice,
          paid: true

        }
      )
      await user.save({ validateBeforeSave: false });

      return res.status(200).json({
        status: "success",
        data: user
      });

    }
    else {
      return res.status(403).json({
        status: "fail",
        message: 'Not enough money in your wallet'
      });
    }

  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: "fail",
      error,
    });
  }
};

exports.cashIn = async (req, res) => {
  try {
    const { amount } = req.body;
    const session = await stripe.checkout.sessions.create({

      payment_method_types: ["card"],
      mode: "payment",

      success_url: `${process.env.FRONT_URL}/payment-success`,
      cancel_url: `${process.env.FRONT_URL}/payment-fail/`,
      customer_email: req.user.email,
      // client_reference_id: req.params.tourId,

      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: amount * 100,
            product_data: {
              name: "Cash in",
              description: "Fill up your wallet",
              images: [
                "https://www.revenued.com/wp-content/uploads/2019/05/revenued_cash_in_cash_out_illustration-1.png",
              ],
            },
          },
          quantity: 1,
        },
      ],
    });

    // 3) Create session as response
    res.status(200).json({
      status: "success",
      session,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: "fail",
      error,
    });
  }
};


exports.getCheckoutSession = async (req, res) => {
  try {
    const user = req.user;
    const session = await stripe.checkout.sessions.create(
      {
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: user.cart.map(item => {
          return {
            price_data: {
              currency: 'usd',
              product_data: {
                name: item.product.name,
                description: item.product.summary,
                images: [
                  `https://9afe-82-194-17-140.ngrok-free.app/img/tours/${item.product.imageCover}`
                ],


              },

              unit_amount: item.product.price * 100

            },
            quantity: item.count
          }
        }),
        success_url: `${process.env.FRONT_URL}/payment-success`,
        cancel_url: `${process.env.FRONT_URL}/payment-fail/`,
        customer_email: req.user.email,
      }
    )

    return res.status(200).json({
      status: 'success',
      data: session
    })

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: 'fail',
      error
    })
  }

}

const createBookingCheckout = async (session) => {

  console.log("bookingCheckout");
  // const user = await User.findOne({ email: session.customer_email });

  // const price = session.amount_total / 100;

  // user.wallet = user.wallet - price;

  // await user.save({ validateBeforeSave: false });
};

const cashInToUser = async (session) => {
  console.log("CashINCheckout");
  const user = await User.findOne({ email: session.customer_email });

  const price = session.amount_total / 100;

  user.wallet = user.wallet + price;

  await user.save({ validateBeforeSave: false });
};



const cashInSecret = "whsec_kUd9Xs4cL6Ie6YShUpkmVD4F7kq3JqtE";
exports.webhookCashIn = (req, res, next) => {
  const signature = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, cashInSecret);
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed")
    cashInToUser(event.data.object);

  res.status(200).json({ received: true });
};
const checkoutSecret = "whsec_LSPmKHeUGPuPoCulXXUMHfootknzDfIJ";
exports.webhookCheckout = (req, res, next) => {
  const signature = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, checkoutSecret);
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed")
    createBookingCheckout(event.data.object);

  res.status(200).json({ received: true });
};

// exports.createBooking = factory.createOne(Booking);
// exports.getBooking = factory.getOne(Booking);
// exports.getAllBookings = factory.getAll(Booking);
// exports.updateBooking = factory.updateOne(Booking);
// exports.deleteBooking = factory.deleteOne(Booking);
