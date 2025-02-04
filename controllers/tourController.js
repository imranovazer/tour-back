const multer = require("multer");
const sharp = require("sharp");
const Tour = require("./../models/Tour");

const APIFeatures = require("../utils/apiFeatures");
const multerStorage = multer.memoryStorage();
const User = require('../models/User')
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new Error("Not an image! Please upload only images."), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadTourImages = upload.fields([
  { name: "imageCover", maxCount: 1 },
  { name: "images", maxCount: 3 },
]);

// upload.single('image') req.file
// upload.array('images', 5) req.files

exports.resizeTourImages = async (req, res, next) => {
  try {

    const id = req.params.id || 'newTour'
    if (!req.files.imageCover && !req.files.images) return next();


    // 1) Cover image
    if (req.files.imageCover) {

      req.body.imageCover = `tour-${id}-${Date.now()}-cover.jpeg`;
      await sharp(req.files.imageCover[0].buffer)
        .resize(2000, 1333)
        .toFormat("jpeg")
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${req.body.imageCover}`);
    }

    // 2) Images
    if (req.files.images) {
      req.body.images = [];

      await Promise.all(
        req.files.images.map(async (file, i) => {
          const filename = `tour-${id}-${Date.now()}-${i + 1}.jpeg`;

          await sharp(file.buffer)
            .resize(2000, 1333)
            .toFormat("jpeg")
            .jpeg({ quality: 90 })
            .toFile(`public/img/tours/${filename}`);

          req.body.images.push(filename);
        })
      );

    }


    next();
  } catch (error) {
    res.status(400).json({
      status: "fail",
      error,
    });
  }
};

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = "5";
  req.query.sort = "-ratingsAverage,price";
  req.query.fields = "name,price,ratingsAverage,summary,difficulty,imageCover,startLocation ,startDates,ratingsQuantity,maxGroupSize,duration,locations";
  next();
};

exports.getAllTours = async (req, res, next) => {
  try {
    // To allow for nested GET reviews on tour (hack)
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };
    if (req.query.name) {
      // Case-insensitive regular expression search for 'name'
      filter.name = { $regex: new RegExp(req.query.name, 'i') };
    }

    const features = new APIFeatures(Tour.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const tours = await features.query;

    res.status(200).json({
      status: "success",
      results: tours.length,
      data: tours,
    });
  } catch (error) {
    res.status(400).json({
      status: "fail",
      error,
    });
  }
};

exports.getTourById = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id).populate("reviews");

    res.status(200).json({
      status: "success",
      data: tour,
    });
  } catch (error) {
    res.status(404).json({
      status: "fail",
      error,
    });
  }
};

exports.createTour = async (req, res) => {
  
  try {

    const newTour = await Tour.create(req.body);
    res.status(201).json({ status: "success", data: newTour });
  } catch (error) {

    res.status(500).json({
      status: "fail",
      error,
    });
  }
};

exports.updateTour = async (req, res) => {
  try {

    const newTourImages = req.body.editedImages


    if (req.body.images) {

      req.body.images.forEach(item => newTourImages.push(item));
    }

    const tour = await Tour.findByIdAndUpdate(req.params.id, { ...req.body, images: newTourImages }, {
      new: true,
      runValidators: true,
    });

    if (!tour) {
      return res.status(404).json({
        status: "fail",
        message: "Tour not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: tour,
    });
  } catch (error) {
    return res.status(400).json({
      status: "fail",
      error,
    });
  }
};

exports.deleteTour = async (req, res, next) => {
  try {
    const doc = await Tour.findByIdAndDelete(req.params.id);

    if (!doc) {
      return res.status(404).json({
        status: "fail",
        message: "Tour with that no found",
      });
    }

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    return res.status(400).json({
      status: "fail",
      error,
    });
  }
};



exports.addToCart = async (req, res) => {
  try {

    const { tourId } = req.params;
    const user = req.user


    const finded = user.cart.find(item => item.product._id == tourId);
    if (finded) {
      finded.count = finded.count + 1
      await user.save({ validateBeforeSave: false });
    }
    else {
      user.cart = [...user.cart, { count: 1, product: tourId }]
    }
    await user.save({ validateBeforeSave: false });

    await user.populate({
      path: 'cart', populate: {
        path: 'product'
      }
    })
    res.status(201).json({
      status: 'success',
      data: user
    })

  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: 'fail',
      error
    })

  }
}
exports.deleteFromCart = async (req, res) => {
  try {
    const user = req.user;
    const { deleteone } = req.body;


    //delete 
    //deleteone
    const { tourId } = req.params;

    const finded = user.cart.find(item => item.product._id == tourId);
    if (finded) {
      if (finded.count == 1) {
        user.cart = user.cart.filter(item => item.product._id != tourId);
        await user.save({ validateBeforeSave: false });
      }
      else if (finded.count > 1) {
        if (!deleteone) {
          user.cart = user.cart.filter(item => item.product._id != tourId);
          await user.save({ validateBeforeSave: false });
        }
        else if (deleteone) {
          finded.count = finded.count - 1
          await user.save({ validateBeforeSave: false });
        }
      }

      res.status(200).json({
        status: 'success',
        data: user
      })
    }
    else {

      return res.status(404).json({
        status: 'fail',
        message: 'Tour with that id not found in cart'
      })

    }

  } catch (error) {
    res.status(500).json({
      status: 'fail',
      error
    })

  }


}

exports.getTourStats = async (req, res, next) => {
  try {
    const stats = await Tour.aggregate([
      {
        $match: { ratingsAverage: { $gte: 4.5 } },
      },
      {
        $group: {
          _id: { $toUpper: "$difficulty" },
          numTours: { $sum: 1 },
          numRatings: { $sum: "$ratingsQuantity" },
          avgRating: { $avg: "$ratingsAverage" },
          avgPrice: { $avg: "$price" },
          minPrice: { $min: "$price" },
          maxPrice: { $max: "$price" },
        },
      },
      {
        $sort: { avgPrice: 1 },
      },
      // {
      //   $match: { _id: { $ne: 'EASY' } }
      // }
    ]);

    res.status(200).json({
      status: "success",
      data: {
        stats,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "fail",
      error,
    });
  }
};

exports.getMonthlyPlan = async (req, res, next) => {
  try {
    const year = req.params.year * 1; // 2021

    const plan = await Tour.aggregate([
      {
        $unwind: "$startDates",
      },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: "$startDates" },
          numTourStarts: { $sum: 1 },
          tours: { $push: "$name" },
        },
      },
      {
        $addFields: { month: "$_id" },
      },
      {
        $project: {
          _id: 0,
        },
      },
      {
        $sort: { numTourStarts: -1 },
      },
      {
        $limit: 12,
      },
    ]);

    res.status(200).json({
      status: "success",
      data: {
        plan,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      error,
    });
  }
};

// /tours-within/:distance/center/:latlng/unit/:unit
// /tours-within/233/center/34.111745,-118.113491/unit/mi
exports.getToursWithin = async (req, res, next) => {
  try {
    const { distance, latlng, unit } = req.params;
    const [lat, lng] = latlng.split(",");

    const radius = unit === "mi" ? distance / 3963.2 : distance / 6378.1;

    if (!lat || !lng) {
      return res.status(400).json({
        status: "fail",
        message: "lat and lng required ",
      });
    }

    const tours = await Tour.find({
      startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
    });

    res.status(200).json({
      status: "success",
      results: tours.length,
      data: tours,
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      error,
    });
  }
};

exports.getDistances = async (req, res, next) => {
  try {
    const { latlng, unit } = req.params;
    const [lat, lng] = latlng.split(",");

    const multiplier = unit === "mi" ? 0.000621371 : 0.001;

    if (!lat || !lng) {
      return res.status(400).json({
        status: "fail",
        message: "Please provide latitutr and longitude in the format lat,lng.",
      });
    }

    const distances = await Tour.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [lng * 1, lat * 1],
          },
          distanceField: "distance",
          distanceMultiplier: multiplier,
        },
      },
      {
        $project: {
          distance: 1,
          name: 1,
        },
      },
    ]);

    res.status(200).json({
      status: "success",
      data: {
        data: distances,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "fail",
      error,
    });
  }
};
