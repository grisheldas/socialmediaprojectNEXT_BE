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

    // tambah default value di frontend nanti
    let updateData = { ...data };

    // menambah profile pic kalau ada
    if (imagePath) {
      updateData.profilepicture = imagePath;
    }

    let conn, sql;
    try {
      conn = await dbCon.promise().getConnection();
      await conn.beginTransaction();
      sql = `update users set ? where id = ?`;
      await conn.query(sql, [updateData, id]);

      sql = `select * from users where id = ?`;
      let [result] = await conn.query(sql, [id]);
      await conn.commit();
      conn.release();
      return res.status(200).send(result[0]);
    } catch (error) {
      conn.rollback();
      conn.release();
      console.log(error);
      return res.status(500).send({ message: error.message || error });
    }
  },
};
