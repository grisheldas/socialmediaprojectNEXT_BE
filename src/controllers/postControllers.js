const { dbCon } = require("../connection");
const fs = require("fs");

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
};
