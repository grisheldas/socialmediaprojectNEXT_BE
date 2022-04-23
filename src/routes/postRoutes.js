const express = require("express");
const Router = express.Router();
const { verifyTokenAccess } = require("../lib/jwtVerify");
const { createPost, fetchPosts } = require("./../controllers/postControllers");
const upload = require("../lib/upload");

const uploader = upload("/postpicture", "POST").single("image_url");

Router.post("/addnewpost", verifyTokenAccess, uploader, createPost);
Router.get("/fetchposts", fetchPosts);

module.exports = Router;
