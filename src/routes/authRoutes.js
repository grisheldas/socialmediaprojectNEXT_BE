const express = require("express");
const Router = express.Router();
const { authControllers } = require("../controllers");
const { verifyTokenAccess, verifyTokenEmail } = require("../lib/jwtVerify");
const verifyLastToken = require("../lib/verifyLastToken");
const {
  register,
  login,
  keeplogin,
  sendEmailVerified,
  accountVerified,
  sendVerificationEmail,
} = authControllers;

Router.post("/register", register);
Router.post("/login", login);
Router.get("/keeplogin", verifyTokenAccess, keeplogin);
Router.get("/verified", verifyTokenEmail, verifyLastToken, accountVerified);
Router.post("/sendemail-verified", sendEmailVerified);
Router.get("/sendverificationemail", verifyTokenAccess, sendVerificationEmail);

module.exports = Router;
