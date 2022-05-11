const { dbCon } = require("../connection");
const crypto = require("crypto");
const db = require("../connection/mysqldb");
const { createJwtAccess } = require("../lib/jwt");

const hashPass = (password) => {
  let hashing = crypto
    .createHmac("sha256", "puripuriprisoner")
    .update(password)
    .digest("hex");
  return hashing;
};

module.exports = {
  registerService: async (data) => {
    // TODO ALGORTIHM REGISTER:
    // 1. (OPTIONAL) CEK VALIDASI PASSWORDNYA, USERNAME TIDAK BOLEH ADA SPASI
    // 2. CEK APAKAH USERNAME atau email  SUDAH ADA DI DATABASE
    // 3. KALO ADA , THROW ERROR USERNAME atau email TELAH DIGUNAKAN
    // 4. KALA NGGAK ADA , CREATE DATA USER KE DATABASE KE TABLE USER,
    // 4a. sebelum diinput kedalam table password di hashing/bcrypt
    // 5. PASTIKAN ISVERIFIED 0 BY DEFAULT.
    // 6. GET DATA USER, TERUS BUAT TOKEN DARI DATA USER,
    // 7. KIRIM EMAIL VERIFIKASI  DENGAN WAKTU X MENIT
    // 8. JIKA LANGSUNG LOGIN ,
    // 9. DATA USER DAN TOKEN KRIIM KE USER.

    let conn, sql;
    let { username, email, password } = data;
    try {
      conn = await dbCon.promise().getConnection();
      let spasi = new RegExp(/ /g);
      if (spasi.test(username)) {
        throw { message: "you cant use space" };
      }

      let unique = new RegExp(
        /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,16}$/g
      );
      if (!unique.test(password)) {
        throw {
          message:
            "password should contain at least one number and one special character",
        };
      }

      // await conn.beginTransaction();
      sql = `select id from users where username = ? or email = ?`;
      let [result] = await conn.query(sql, [username, email]);
      if (result.length) {
        throw { message: "Username or e-mail has been used" };
      }

      sql = `INSERT INTO users set ?`;
      let insertData = {
        username,
        email,
        password: hashPass(password),
      };
      let [result1] = await conn.query(sql, insertData);
      // await conn.commit()

      sql = `select id, username, isVerified, email from users where id = ?`;

      let [userData] = await conn.query(sql, [result1.insertId]);
      console.log(userData);
      conn.release();
      return { success: true, data: userData[0] };
    } catch (error) {
      console.log(error);
      conn.release();
      throw { message: error.message || error };
    }
  },
  // LOGIN TODO:
  // 1. login boleh pake username atau email
  // 2. encript dulu passwordnya
  // 3. get data user dengan username atau email dan password
  // 4. kalo user ada maka kriim token access, sama data user
  // 5. get data post juga

  loginService: async (data) => {
    let { username, email, password } = data;
    let conn, sql;

    try {
      conn = await dbCon.promise().getConnection();
      password = hashPass(password);

      sql = `select * from users where (username = ? or email = ? and password = ?)`;
      let [result] = await conn.query(sql, [username, email, password]);

      if (!result.length) {
        console.log("test");
        throw { message: "user not found" };
      }

      conn.release();
      // res.set("x-access-token", tokenAccess);
      return { success: true, data: result[0] };
    } catch (error) {
      conn.rollback();
      conn.release();
      console.log(error);
      return { message: error.message || error };
    }
  },
};
