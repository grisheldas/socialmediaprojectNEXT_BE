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

      // get tabel posts && users && likes && with limit set
      sql = `select posts.id, caption, image_url, fullname, username, user_id, profilepicture, created_at,
      (select count(*) from likes where posts_id = posts.id) as number_of_likes from posts 
      inner join users on posts.user_id = users.id order by posts.created_at desc limit
      ${dbCon.escape(offset)}, ${dbCon.escape(limit)}`;
      let [result] = await conn.query(sql);

      sql = `select count(*) as total_posts from posts`;
      let [totalPosts] = await conn.query(sql);

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
};
