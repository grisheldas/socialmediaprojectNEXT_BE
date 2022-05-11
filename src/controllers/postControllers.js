const { dbCon } = require("../connection");
const fs = require("fs");
const db = require("../connection/mysqldb");

module.exports = {
  createPost: async (req, res) => {
    console.log("ini req file", req.file);
    console.log("ini body", req.body);
    let path = "/postpicture";
    const data = JSON.parse(req.body.data);
    const { id } = req.user;
    const imagePath = req.file ? `${path}/${req.file.filename}` : null;

    let newPost = { ...data, user_id: id };

    if (imagePath) {
      newPost.image_url = imagePath;
    }

    let conn, sql;
    try {
      conn = await dbCon.promise().getConnection();
      await conn.beginTransaction();
      sql = `insert into posts set ?`;
      await conn.query(sql, [newPost]);

      sql = `select * from posts`;
      let [result] = await conn.query(sql);
      await conn.commit();
      conn.release();
      return res.status(200).send(result);
    } catch (error) {
      conn.rollback();
      conn.release();
      console.log(error);
      return res.status(500).send({ message: error.message || error });
    }
  },

  fetchPosts: async (req, res) => {
    let conn, sql;
    let { id } = req.user;
    let { page, limit } = req.query;

    if (!page) {
      page = 0;
    }

    if (!limit) {
      limit = 10;
    }

    let offset = page * parseInt(limit);

    try {
      conn = await dbCon.promise().getConnection();

      await conn.beginTransaction();

      // get tabel posts && users && likes && with limit set

      sql = `select posts.id, caption, username, user_id, profilepicture, image_url, fullname, created_at,
        if (id_like is null, 0, 1) as already_like, 
        (SELECT count(*) FROM likes WHERE posts_id = posts.id) as number_of_likes from posts 
        INNER JOIN users ON posts.user_id = users.id 
        LEFT JOIN (SELECT id as id_like, posts_id FROM likes WHERE user_id = ?) as l ON posts.id = l.posts_id 
        ORDER BY posts.created_at DESC LIMIT ${dbCon.escape(
          offset
        )}, ${dbCon.escape(limit)};`;
      let [result] = await conn.query(sql, id);

      // count total posts
      sql = `select count(*) as total_posts from posts`;
      let [totalPosts] = await conn.query(sql);

      // count total comments for each post
      sql = `select count(comment) as total_comments from comments where posts_id = ?`;
      for (let i = 0; i < result.length; i++) {
        const element = result[i];
        const [commentsCount] = await conn.query(sql, element.id);

        result[i] = { ...result[i], comments: commentsCount[0].total_comments };
      }

      await conn.commit();
      conn.release();
      res.set("x-total-count", totalPosts[0].total_posts);
      return res.status(200).send(result);
    } catch (error) {
      conn.rollback();
      conn.release();
      console.log(error);
      return res.status(500).send({ message: error.message || error });
    }
  },

  fetchUserPosts: async (req, res) => {
    const { id } = req.user;
    let { page, limit } = req.query;

    if (!page) {
      page = 0;
    }

    if (!limit) {
      limit = 10;
    }

    let offset = page * parseInt(limit);

    let conn, sql;
    try {
      conn = await dbCon.promise().getConnection();

      await conn.beginTransaction();

      sql = `select posts.id, user_id, caption, image_url, fullname, username, profilepicture, created_at,
      if (id_like is null, 0, 1) as already_like,
      (select count(*) from likes where posts_id = posts.id) as number_of_likes from posts 
      inner join users on posts.user_id = users.id
      LEFT JOIN (SELECT id as id_like, posts_id FROM likes WHERE user_id = ?) as l ON posts.id = l.posts_id 
      where user_id = ${id} order by posts.created_at desc limit ${dbCon.escape(
        offset
      )}, ${dbCon.escape(limit)}`;
      let [result] = await conn.query(sql, id);

      sql = `select count(*) as total_posts from posts`;
      let [totalPosts] = await conn.query(sql);

      sql = `select count(comment) as total_comments from comments where posts_id = ?`;
      for (let i = 0; i < result.length; i++) {
        const element = result[i];
        const [commentsCount] = await conn.query(sql, element.id);

        result[i] = { ...result[i], comments: commentsCount[0].total_comments };
      }

      await conn.commit();
      conn.release();
      res.set("x-userposts-count", totalPosts[0].total_posts);
      return res.status(200).send(result);
    } catch (error) {
      conn.rollback();
      conn.release();
      console.log(error);
      return res.status(500).send({ message: error.message || error });
    }
  },

  deletePost: async (req, res) => {
    let { post_id } = req.params;

    let conn, sql;
    try {
      conn = await dbCon.promise().getConnection();
      await conn.beginTransaction();

      sql = `select caption, image_url, created_at, user_id from posts where id = ?`;
      let [result] = await conn.query(sql, post_id);

      if (!result.length) {
        throw { message: "post not found" };
      }

      if (result[0].image_url) {
        fs.unlinkSync("./public" + result[0].image_url);
      }

      sql = `delete from comments where posts_id = ?`;
      await conn.query(sql, post_id);

      sql = `delete from likes where posts_id = ?`;
      await conn.query(sql, post_id);

      sql = `delete from posts where id = ?`;
      await conn.query(sql, post_id);

      conn.release();
      conn.commit();
      return res.status(200).send({ message: "post deleted" });
    } catch (error) {
      conn.rollback();
      conn.release();
      console.log(error);
      return res.status(500).send({ message: error.message || error });
    }
  },

  getUserPostDetail: async (req, res) => {
    let { id } = req.user;
    const { post_id } = req.params;

    let conn, sql;
    try {
      conn = await dbCon.promise().getConnection();

      sql = `select posts.id, user_id, caption, image_url, fullname, username, profilepicture, created_at,
      if (id_like is null, 0, 1) as already_like, 
      (select count(*) from likes where posts_id = posts.id) as number_of_likes from posts 
      inner join users on posts.user_id = users.id
      LEFT JOIN (SELECT id as id_like, posts_id FROM likes WHERE user_id = ?) as l ON posts.id = l.posts_id  where posts.id = ?`;
      let [result] = await conn.query(sql, [id, post_id]);

      conn.release();
      return res.status(200).send(result[0]);
    } catch (error) {
      console.log(error);
      conn.rollback();
      conn.release();
      return res.status(500).send({ message: error.message || error });
    }
  },

  updatePost: async (req, res) => {
    const { post_id } = req.params;

    let path = "/postpicture";
    const data = JSON.parse(req.body.data);
    const imagePath = req.file ? `${path}/${req.file.filename}` : null;

    let updateData = { ...data };

    if (imagePath) {
      updateData.profilepicture = imagePath;
    }

    let conn, sql;
    try {
      conn = await dbCon.promise().getConnection();

      await conn.beginTransaction();
      sql = `select caption, image_url, created_at, user_id from posts where id = ?`;
      let [result] = await conn.query(sql, post_id);

      if (!result.length) {
        throw { message: "post not found" };
      }

      if (imagePath) {
        if (result[0].image_url) {
          fs.unlinkSync("./public" + result[0].image_url);
        }
      }

      sql = `update posts set ? where id = ?`;
      await conn.query(sql, [data, post_id]);

      sql = `select * from posts where id = ?`;
      let [result1] = await conn.query(sql, post_id);

      await conn.commit();
      conn.release();
      return res.status(200).send(result1[0]);
    } catch (error) {
      console.log(error);
      conn.release();
      conn.rollback();
      return res.status(500).send({ message: error.message || error });
    }
  },

  addComment: async (req, res) => {
    let { post_id } = req.params;
    post_id = parseInt(post_id);
    const { id } = req.user;
    const { comment } = req.body;

    let conn, sql;
    try {
      conn = await dbCon.promise().getConnection();

      await conn.beginTransaction();

      sql = `insert into comments set ?`;
      let addComment = {
        comment: comment,
        user_id: id,
        posts_id: post_id,
      };
      await conn.query(sql, [addComment]);

      sql = `select * from comments`;
      let [comments] = await conn.query(sql);
      conn.release();
      conn.commit();

      return res.status(200).send(comments);
    } catch (error) {
      console.log(error);
      conn.release();
      conn.rollback();
      return res.status(500).send({ message: error.message });
    }
  },

  getComments: async (req, res) => {
    let { post_id } = req.params;
    post_id = parseInt(post_id);

    let conn, sql;
    try {
      conn = await dbCon.promise().getConnection();

      await conn.beginTransaction();

      sql = `select comments.id, comments.comment, comments.posts_id, comments.created_at, comments.user_id, 
      users.username, users.profilepicture, users.fullname from comments join users on users.id = comments.user_id
      where comments.posts_id = ? order by comments.created_at desc`;
      let [comments] = await conn.query(sql, post_id);

      sql = `select count(*) as total_comments from comments where posts_id = ?`;
      let [totalComments] = await conn.query(sql, post_id);

      conn.commit();
      conn.release();
      res.set("x-comments-count", totalComments[0].total_comments);
      return res.status(200).send(comments);
    } catch (error) {
      conn.rollback();
      conn.release();
      console.log(error);
      return res.status(500).send({ message: error.message || error });
    }
  },

  addLike: async (req, res) => {
    let { id } = req.user;
    let { post_id } = req.params;
    post_id = parseInt(post_id);

    let sql, conn;
    try {
      conn = await dbCon.promise().getConnection();

      await conn.beginTransaction();

      sql = `select * from posts inner join likes on likes.posts_id = posts.id
      where posts.id = ? and likes.user_id = ?`;
      let [resultLiked] = await conn.query(sql, [post_id, id]);

      if (resultLiked.length >= 1) {
        sql = `delete from likes where posts_id = ? and user_id = ?`;
        await conn.query(sql, [post_id, id]);
        conn.release();
        conn.commit();
        return res.status(200).send({ message: "unliked" });
      }

      sql = `insert into likes set ?`;
      let inputData = {
        posts_id: post_id,
        user_id: id,
      };
      await conn.query(sql, inputData);

      conn.release();
      conn.commit();
      return res.status(200).send({ message: "liked" });
    } catch (error) {
      console.log(error);
      conn.rollback();
      conn.release();
      return res.status(500).send({ message: error.message || error });
    }
  },

  fetchUserPostMedia: async (req, res) => {
    const { id } = req.user;
    let { page, limit } = req.query;

    if (!page) {
      page = 0;
    }

    if (!limit) {
      limit = 10;
    }

    let offset = page * parseInt(limit);

    let conn, sql;
    try {
      conn = await dbCon.promise().getConnection();

      await conn.beginTransaction();

      sql = `select posts.id, user_id, caption, image_url, fullname, username, profilepicture, created_at,
      if (id_like is null, 0, 1) as already_like,
      (select count(*) from likes where posts_id = posts.id) as number_of_likes from posts 
      inner join users on posts.user_id = users.id
      LEFT JOIN (SELECT id as id_like, posts_id FROM likes WHERE user_id = ?) as l ON posts.id = l.posts_id 
      where user_id = ? and image_url is not null order by posts.created_at desc limit ${dbCon.escape(
        offset
      )}, ${dbCon.escape(limit)}`;
      let [result] = await conn.query(sql, [id, id]);

      sql = `select count(*) as total_posts from posts where image_url is not null`;
      let [totalPosts] = await conn.query(sql);

      sql = `select count(comment) as total_comments from comments where posts_id = ?`;
      for (let i = 0; i < result.length; i++) {
        const element = result[i];
        const [commentsCount] = await conn.query(sql, element.id);

        result[i] = { ...result[i], comments: commentsCount[0].total_comments };
      }

      await conn.commit();
      conn.release();
      res.set("x-usermediaposts-count", totalPosts[0].total_posts);
      return res.status(200).send(result);
    } catch (error) {
      conn.rollback();
      conn.release();
      console.log(error);
      return res.status(500).send({ message: error.message || error });
    }
  },

  fetchUserLikedPosts: async (req, res) => {
    const { id } = req.user;
    let { page, limit } = req.query;

    if (!page) {
      page = 0;
    }

    if (!limit) {
      limit = 10;
    }

    let offset = page * parseInt(limit);

    let conn, sql;
    try {
      conn = await dbCon.promise().getConnection();

      await conn.beginTransaction();

      sql = `select posts.id, caption, username, user_id, profilepicture, image_url, fullname, created_at,
      if (id_like is null, 0, 1) as already_like, 
      (SELECT count(*) FROM likes WHERE posts_id = posts.id) as number_of_likes from posts 
      INNER JOIN users ON posts.user_id = users.id 
      LEFT JOIN (SELECT id as id_like, posts_id FROM likes WHERE user_id = ?) as l ON posts.id = l.posts_id 
      ORDER BY posts.created_at DESC LIMIT ${dbCon.escape(
        offset
      )}, ${dbCon.escape(limit)};`;
      let [result] = await conn.query(sql, id);

      sql = `select count(comment) as total_comments from comments where posts_id = ?`;
      for (let i = 0; i < result.length; i++) {
        const element = result[i];
        const [commentsCount] = await conn.query(sql, element.id);

        result[i] = { ...result[i], comments: commentsCount[0].total_comments };
      }

      await conn.commit();
      conn.release();

      const resultBaru = result.filter((val) => {
        return val.already_like == 1;
      });

      res.set("x-userlikedposts-count", resultBaru.length);
      return res.status(200).send(resultBaru);
    } catch (error) {
      conn.rollback();
      conn.release();
      console.log(error);
      return res.status(500).send({ message: error.message || error });
    }
  },
};
