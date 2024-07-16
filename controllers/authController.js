const userModel = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require('dotenv').config(); // Load environment variables

const registerController = async (req, res) => {
  try {
    const existingUser = await userModel.findOne({ email: req.body.email });
    // Validation
    if (existingUser) {
      return res.status(200).send({
        success: false,
        message: "User already exists",
      });
    }
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    req.body.password = hashedPassword;
    // Save user
    const user = new userModel(req.body);
    await user.save();
    return res.status(201).send({
      success: true,
      message: "User registered successfully",
      user,
    });
  } catch (error) {
    console.log("Error in Register API:", error);
    res.status(500).send({
      success: false,
      message: "Error in Register API",
      error,
    });
  }
};

const loginController = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    console.log("Login request received:", { email, role });

    const user = await userModel.findOne({ email });
    if (!user) {
      console.log("User not found:", email);
      return res.status(404).send({
        success: false,
        message: "Invalid Credentials",
      });
    }

    console.log("User found:", user);

    // Check if the role is present in the request body
    if (!role) {
      console.log("Role is missing in the request");
      return res.status(400).send({
        success: false,
        message: "Role is required",
      });
    }

    // Check role
    if (user.role !== role) {
      console.log("Role mismatch:", { expected: user.role, received: role });
      return res.status(400).send({
        success: false,
        message: "Role doesn't match",
      });
    }

    // Compare password
    const comparePassword = await bcrypt.compare(password, user.password);
    if (!comparePassword) {
      console.log("Password mismatch for user:", email);
      return res.status(400).send({
        success: false,
        message: "Invalid Credentials",
      });
    }

    if (!process.env.JWT_SECRET) {
      console.log("JWT_SECRET is not defined in environment variables");
      return res.status(500).send({
        success: false,
        message: "Server configuration error",
      });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    console.log("Login successful for user:", email);
    return res.status(200).send({
      success: true,
      message: "Login Successfully",
      token,
      user,
    });
  } catch (error) {
    console.log("Error in Login API:", error);
    res.status(500).send({
      success: false,
      message: "Error in Login API",
      error,
    });
  }
};

// GET CURRENT USER
const currentUserController = async (req, res) => {
  try {
    const user = await userModel.findOne({ _id: req.body.userId });
    return res.status(200).send({
      success: true,
      message: "User fetched successfully",
      user,
    });
  } catch (error) {
    console.log("Error in fetching current user:", error);
    return res.status(500).send({
      success: false,
      message: "Unable to get current user",
      error,
    });
  }
};

module.exports = { registerController, loginController, currentUserController };
