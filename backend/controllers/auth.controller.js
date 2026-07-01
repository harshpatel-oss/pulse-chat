import bcrypt from "bcryptjs";
import crypto from "crypto";
import { validationResult } from "express-validator";

import User from "../models/user.model.js";
import RefreshToken from "../models/refreshToken.model.js";

import {
  signAccessToken,
  signRefreshToken,
  verifyToken,
} from "../utils/token.js";

import { sendResetEmail } from "../lib/email.js";
import { successResponse, errorResponse } from "../utils/response.js";
import cloudinary from "../lib/cloudinary.js";

import {
  COOKIE_NAME,
  COOKIE_SAME_SITE,
  CLIENT_URL,
  COOKIE_SECURE,
} from "../config/index.js";

// ---------------- COOKIE ----------------
const createTokenCookie = (res, token) => {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAME_SITE,
    path: "/",
    maxAge: 1000 * 60 * 60 * 24 * 30,
  });
};

// ======================================================
// SIGNUP
// ======================================================
export const signup = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return errorResponse(res, errors.array()[0].msg, 400);

  const { fullName, email, password, bio, username } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return errorResponse(res, "Account already exists", 409);

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      fullName,
      email,
      username,
      password: hashedPassword,
      bio,
    });

    const accessToken = signAccessToken({ userId: newUser._id });
    const refreshToken = signRefreshToken({ userId: newUser._id });

    const refreshDoc = await RefreshToken.create({
      userId: newUser._id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    await User.findByIdAndUpdate(newUser._id, {
      $push: { refreshTokens: refreshDoc._id },
    });

    createTokenCookie(res, refreshToken);

    return successResponse(
      res,
      {
        userData: newUser,
        accessToken,
        message: "Account created successfully",
      },
      201
    );
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// ======================================================
// LOGIN
// ======================================================
export const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return errorResponse(res, errors.array()[0].msg, 400);

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user)
      return errorResponse(res, "Invalid credentials", 401);

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return errorResponse(res, "Invalid credentials", 401);

    const accessToken = signAccessToken({ userId: user._id });
    const refreshToken = signRefreshToken({ userId: user._id });

    const refreshDoc = await RefreshToken.create({
      userId: user._id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    await User.findByIdAndUpdate(user._id, {
      $push: { refreshTokens: refreshDoc._id },
    });

    createTokenCookie(res, refreshToken);

    return successResponse(res, {
      userData: user,
      accessToken,
      message: "Login successful",
    });
  } catch (err) {
    console.log(err);
    return errorResponse(res, err.message, 500);
  }
};

// ======================================================
// LOGOUT (single device)
// ======================================================
export const logout = async (req, res) => {
  try {
    const token = req.cookies[COOKIE_NAME];

    if (token) {
      await RefreshToken.updateOne(
        { token },
        { $set: { revoked: true } }
      );
    }

    res.clearCookie(COOKIE_NAME, { path: "/" });

    return successResponse(res, {
      message: "Logged out successfully",
    });
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// ======================================================
// LOGOUT ALL DEVICES
// ======================================================
export const logoutAll = async (req, res) => {
  try {
    const userId = req.user._id;

    await RefreshToken.updateMany(
      { userId },
      { $set: { revoked: true } }
    );

    await User.findByIdAndUpdate(userId, {
      $set: { refreshTokens: [] },
    });

    res.clearCookie(COOKIE_NAME, { path: "/" });

    return successResponse(res, {
      message: "Logged out from all devices",
    });
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// ======================================================
// REFRESH TOKEN (FIXED - NO LOOP, NO RACE CONDITION)
// ======================================================
export const refreshToken = async (req, res) => {
  try {
    const token = req.cookies[COOKIE_NAME];

    if (!token)
      return errorResponse(res, "Refresh token missing", 401);

    const tokenDoc = await RefreshToken.findOne({ token });

    if (!tokenDoc || tokenDoc.revoked)
      return errorResponse(res, "Invalid refresh token", 401);

    if (tokenDoc.expiresAt < Date.now())
      return errorResponse(res, "Refresh token expired", 401);

    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      return errorResponse(res, "Invalid token signature", 401);
    }

    const user = await User.findById(payload.userId);
    if (!user)
      return errorResponse(res, "User not found", 404);

    // ---------------- ROTATE TOKEN SAFELY ----------------
    const newRefreshToken = signRefreshToken({
    userId: user._id,
    tokenId: crypto.randomUUID(),
    });

    tokenDoc.revoked = true;
    tokenDoc.replacedByToken = newRefreshToken;
    await tokenDoc.save();

    const newRefreshDoc = await RefreshToken.create({
      userId: user._id,
      token: newRefreshToken,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    await User.findByIdAndUpdate(user._id, {
      $push: { refreshTokens: newRefreshDoc._id },
    });

    const accessToken = signAccessToken({ userId: user._id });

    createTokenCookie(res, newRefreshToken);

    return successResponse(res, {
      accessToken,
      user,
    });
  } catch (err) {
    console.error("REFRESH ERROR:", err);
    return errorResponse(res, "Refresh failed", 401);
  }
};

// ======================================================
// FORGOT PASSWORD
// ======================================================
export const forgotPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return errorResponse(res, errors.array()[0].msg, 400);

  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user)
      return successResponse(res, {
        message: "If account exists, reset link sent.",
      });

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashed = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordToken = hashed;
    user.resetPasswordExpires = Date.now() + 1000 * 60 * 20;

    await user.save();

    const resetLink = `${CLIENT_URL}/reset-password?token=${resetToken}`;

    await sendResetEmail({
      to: user.email,
      subject: "Reset Password",
      text: resetLink,
      html: `<a href="${resetLink}">${resetLink}</a>`,
    });

    return successResponse(res, {
      message: "Password reset email sent.",
    });
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// ======================================================
// RESET PASSWORD
// ======================================================
export const resetPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return errorResponse(res, errors.array()[0].msg, 400);

  const { token, password } = req.body;

  try {
    const hashed = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashed,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user)
      return errorResponse(res, "Invalid or expired token", 400);

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    return successResponse(res, {
      message: "Password reset successful",
    });
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// ======================================================
// CHANGE PASSWORD
// ======================================================
export const changePassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return errorResponse(res, errors.array()[0].msg, 400);

  const { currentPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.user._id);
    if (!user)
      return errorResponse(res, "User not found", 404);

    const valid = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!valid)
      return errorResponse(res, "Incorrect password", 401);

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return successResponse(res, {
      message: "Password changed successfully",
    });
  } catch (err) {
    console.log(err)
    return errorResponse(res, err.message, 500);
  }
};

// ======================================================
// UPDATE PROFILE
// ======================================================
export const updateProfile = async (req, res) => {
  const {
    profilePic,
    coverImage,
    bio,
    fullName,
    username,
    status,
  } = req.body;

  try {
    const user = await User.findById(req.user._id);

    if (!user)
      return errorResponse(res, "User not found", 404);

    if (profilePic?.startsWith("data:")) {
      const upload = await cloudinary.uploader.upload(
        profilePic,
        { folder: "profiles" }
      );
      user.profilePic = upload.secure_url;
    }

    if (coverImage?.startsWith("data:")) {
      const upload = await cloudinary.uploader.upload(
        coverImage,
        { folder: "profiles" }
      );
      user.coverImage = upload.secure_url;
    }

    if (fullName) user.fullName = fullName;
    if (username) user.username = username;
    if (bio) user.bio = bio;
    if (status) user.status = status;

    await user.save();

    return successResponse(res, {
      user,
      message: "Profile updated successfully",
    });
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};