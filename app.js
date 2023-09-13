const path = require("path");
const express = require("express");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const compression = require("compression");
const cors = require("cors");

const userRouter = require("./routes/userRoutes");
const tourRoutes = require("./routes/tourRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const bookingRoutes = require("./routes/bookingRoutes")
const app = express();

const bookingController = require('./controllers/bookingController')

app.use(cors({
  origin: ['http://localhost:5173', 'https://tour-front-chi.vercel.app'],
  credentials: true,
}));
// app.use((req, res, next) => {
//   res.header('Access-Control-Allow-Origin', '*');
//   next();
// });

// app.options("*", cors());
// app.use(cors('*'));

app.use(express.static(path.join(__dirname, "public")));
// app.use(express.static('public'))

app.use(helmet());
// app.post(
//   '/webhook-checkout',
//   bodyParser.raw({ type: 'application/json' }),
//   bookingController.webhookCheckout
// );
app.post(
  '/webhook-checkout',
  bodyParser.raw({ type: 'application/json' }),
  bookingController.webhookCheckout
);
app.post(
  '/webhook-cash-in',
  bodyParser.raw({ type: 'application/json' }),
  bookingController.webhookCashIn
);
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

app.use(mongoSanitize());

app.use(xss());

app.use(
  hpp({
    whitelist: [
      "duration",
      "ratingsQuantity",
      "ratingsAverage",
      "maxGroupSize",
      "difficulty",
      "price",
    ],
  })
);

app.use(compression());

// 3) ROUTES

app.use("/api/users", userRouter);
app.use("/api/tours", tourRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/bookings", bookingRoutes)

app.get("/", (req, res) => {
  res.send("Hi in my api")
})
module.exports = app;
