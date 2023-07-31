const multer = require("multer");
const sharp = require("sharp");
const User = require("./../models/User.js");

const multerStorage = multer.memoryStorage();

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

exports.uploadUserPhoto = upload.single("photo");

exports.resizeUserPhoto = async (req, res, next) => {
  try {
    if (!req.file) return next();

    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

    await sharp(req.file.buffer)
      .resize(500, 500)
      .toFormat("jpeg")
      .jpeg({ quality: 90 })
      .toFile(`public/img/users/${req.file.filename}`);

    next();
  } catch (error) {
    console.log(error);
  }
};

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = async (req, res, next) => {
  // 1) Create error if user POSTs password data
  try {
    if (req.body.password || req.body.passwordConfirm) {
      return res.status(400).json({
        status: "fail",
        message: "This route is not for password updates.",
      });
    }

    // 2) Filtered out unwanted fields names that are not allowed to be updated
    const filteredBody = filterObj(req.body, "name", "email");
    if (req.file) filteredBody.photo = req.file.filename;

    // 3) Update user document
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      filteredBody,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      status: "success",
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "fail",
      error,
    });
  }
};

exports.deleteMe = async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.user.id);

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    res.status(400).json({
      status: "fail",
      error,
    });
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    res.status(200).json({
      status: "success",
      data: {
        data: doc,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "fail",
      error,
    });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find();

    res.status(200).json({
      status: "success",
      data: users,
    });
  } catch (error) {
    res.status(400).json({
      status: "fail",
      error,
    });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const newUser = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({
      status: "success",
      data: newUser,
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      error,
    });
  }
};

// Do NOT update passwords with this!
exports.deleteUserById = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    res.status(204).json({
      status: "success",
      data: user,
    });
  } catch (error) {
    res.status(400).json({
      status: "fail",
      error,
    });
  }
};
exports.createUser = async (req, res, next) => {
  try {
    const { name, email, photo, role, password, passwordConfirm } = req.body;

    const user = await User.create({
      name,
      email,
      password,
      photo,
      role,
      passwordConfirm,
    });
    res.status(201).json({
      status: "success",
      data: user,
    });
  } catch (error) {
    res.status(400).json({ status: "fail", error });
  }
};
