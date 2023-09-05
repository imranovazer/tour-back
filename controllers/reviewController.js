const Review = require("./../models/Review");
const APIFeatures = require("../utils/apiFeatures");
const { login } = require("./authController");
exports.setTourUserIds = (req, res, next) => {
  // Allow nested routes
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};


exports.getMyReviews = async (req, res) => {
  try {
    const myId = req.user._id;
    const reviews = await Review.find({ user: myId });
    res.status(200).json(
      {
        status: 'sucess',
        data: reviews
      }
    )
  } catch (error) {
    res.status(500).json(
      {
        status: 'fail',
        error
      }
    )
  }
}

exports.getAllReviews = async (req, res) => {
  try {

    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };


    const features = new APIFeatures(Review.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    // const doc = await features.query.explain();
    const review = await features.query;

    // SEND RESPONSE
    res.status(200).json({
      status: "success",
      results: review.length,
      data: review,
    });
  } catch (error) { }
};

exports.getReviewById = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        status: "fail",
        message: "No review found with that id",
      });
    }

    res.status(200).json({
      status: "success",
      data: review,
    });
  } catch (error) {
    return res.status(500).json({
      status: "fail",
      error,
    });
  }
};

exports.createReview = async (req, res, next) => {
  try {

    const newReview = await Review.create(req.body);

    res.status(201).json({
      status: "success",
      data: newReview,
    });
  } catch (error) {

    res.status(500).json({
      status: "fail",
      error,
    });
  }
};

exports.updateReview = async (req, res) => {
  try {

    const { rating, review } = req.body;
    console.log(rating, review);
    const newReview = await Review.findByIdAndUpdate(req.params.id, { rating, review }, {
      new: true,
      runValidators: true,
    })

    return res.status(200).json(
      {
        status: 'success',
        data: newReview
      }
    )
  } catch (error) {
    console.log(error);
    return res.status(500).json(
      {
        status: 'fail',
        error
      }
    )
  }
}
exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);

    if (!review) {
      return res.status(404).json({
        status: "fail",
        message: "No review found with that ID ",
      });
    }

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      error,
    });
  }
};
