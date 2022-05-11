const express = require("express");
const Router = express.Router();
const { verifyTokenAccess } = require("../lib/jwtVerify");
const {
  createPost,
  fetchPosts,
  fetchUserPosts,
  deletePost,
  getUserPostDetail,
  updatePost,
  addComment,
  getComments,
  addLike,
  fetchUserPostMedia,
  fetchUserLikedPosts,
} = require("./../controllers/postControllers");
const upload = require("../lib/upload");

const uploader = upload("/postpicture", "POST").single("image_url");

Router.post("/addnewpost", verifyTokenAccess, uploader, createPost);
Router.get("/fetchposts", verifyTokenAccess, fetchPosts);
Router.get("/fetchuserposts", verifyTokenAccess, fetchUserPosts);
Router.delete("/deletepost/:post_id", verifyTokenAccess, deletePost);
Router.get(
  "/fetchuserpostdetail/:post_id",
  verifyTokenAccess,
  getUserPostDetail
);
Router.patch("/updatepost/:post_id", verifyTokenAccess, uploader, updatePost);
Router.post("/addcomment/:post_id", verifyTokenAccess, addComment);
Router.get("/fetchcomments/:post_id", verifyTokenAccess, getComments);
Router.post("/addlike/:post_id", verifyTokenAccess, addLike);
Router.get("/fetchusermediaposts", verifyTokenAccess, fetchUserPostMedia);
Router.get("/fetchuserlikedposts", verifyTokenAccess, fetchUserLikedPosts);

module.exports = Router;
