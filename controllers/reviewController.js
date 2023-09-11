const Review = require("./../models/Review");

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

    // const doc = await features.query.explain();
    const review = await Review.find();

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

    const newReview = await Review.create(req.body)
    const review = await Review.findById(newReview._id);
    res.status(201).json({
      status: "success",
      data: review,
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

    // const { rating, review } = req.body;

    const newReview = await Review.findByIdAndUpdate(req.params.id, req.body, {
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
