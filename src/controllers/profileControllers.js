const { dbCon } = require("../connection");
const fs = require("fs");

module.exports = {
  updateProfile: async (req, res) => {
    // console.log("ini req.files", req.file);
    // console.log("ini body", req.body);
    let path = "/profilepicture";
    const data = JSON.parse(req.body.data);
    const { id } = req.user;
    const imagePath = req.file ? `${path}/${req.file.filename}` : null;

    let updateData = { ...data };

    // if new photo is selected
    if (imagePath) {
      updateData.profilepicture = imagePath;
    }

    let conn, sql;
    try {
      conn = await dbCon.promise().getConnection();
      await conn.beginTransaction();

      if (updateData.username) {
        sql = `select id from users where username = ?`;
        let [usernameFound] = await conn.query(sql, updateData.username);
        if (usernameFound.length) {
          throw { message: "Username has been used" };
        }
      }

      sql = `select * from users where id = ?`;
      let [result] = await conn.query(sql, [id]);

      if (result[0].profilepicture) {
        fs.unlinkSync("./public" + result[0].profilepicture);
      }

      sql = `update users set ? where id = ?`;
      await conn.query(sql, [updateData, id]);
      // DELETE FOTO LAMANYA BELUM

      sql = `select * from users where id = ?`;
      let [result1] = await conn.query(sql, [id]);

      await conn.commit();
      conn.release();
      return res.status(200).send(result1[0]);
    } catch (error) {
      conn.rollback();
      conn.release();
      console.log(error);
      return res.status(500).send({ message: error.message || error });
    }
  },
};
