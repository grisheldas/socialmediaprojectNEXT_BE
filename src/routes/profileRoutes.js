const express = require("express");
const { verifyTokenAccess } = require("../lib/jwtVerify");
const Router = express.Router();
const { updateProfile } = require("./../controllers/profileControllers");
// const { addProfilePicture } = profileControllers;
const upload = require("../lib/upload");

const uploader = upload("/profilepicture", "PP").single("profilepicture");

Router.patch("/", verifyTokenAccess, uploader, updateProfile);

module.exports = Router;
