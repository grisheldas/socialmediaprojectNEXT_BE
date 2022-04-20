const { createJwtAccess, createJwtEmail } = require("../lib/jwt"); // token library
const { registerService, loginService } = require("../services/authServices"); // logic
const { dbCon } = require("../connection"); // connect to database
const nodemailer = require("nodemailer"); // for sending email
const handlebars = require("handlebars");
const path = require("path"); // to work with file/directory path
const fs = require("fs"); // interacting with file system
const myCache = require("../lib/cache");

// setting up nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "gonewithewind1@gmail.com",
    pass: process.env.NODEMAIL_SECRET,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// connect logic to APIs
module.exports = {
  register: async (req, res) => {
    try {
      const { data: userData } = await registerService(req.body);

      let timecreated = new Date().getTime();
      // data used for making token
      const dataToken = {
        id: userData.id,
        username: userData.username,
        timecreated,
      };

      let success = myCache.set(userData.id, dataToken, 300);
      if (!success) {
        throw { message: "error cachingggg" };
      }

      // make token access and verified email
      const tokenAccess = createJwtAccess(dataToken);
      const tokenEmail = createJwtEmail(dataToken);

      const host =
        process.env.NODE_ENV === "production"
          ? "http://yourdomainname"
          : "http://localhost:3000";

      const link = `${host}/verified/${tokenEmail}`;

      // setting up e-mail for verification
      let filePath = path.resolve(
        __dirname,
        "../template/verificationEmail.html"
      );

      // change from html to string using fs.readFile
      let htmlString = fs.readFileSync(filePath, "utf-8");
      // console.log(htmlString);
      const template = handlebars.compile(htmlString);
      const htmlToEmail = template({
        username: userData.username,
        link,
      });
      // console.log(htmlToEmail);

      transporter.sendMail({
        // its actually async
        from: "Teatalk <gonewithewind1@gmail.com>",
        // to: userData.email,
        to: "grisheldaathallahsilviyana@gmail.com",
        subject: "Complete your sign up!",
        html: htmlToEmail,
      });

      // send user's data to make access token for login
      res.set("x-token-access", tokenAccess);
      return res.status(200).send(userData);
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message: error.message || error });
    }
  },

  login: async (req, res) => {
    try {
      const { success, data: userData, message } = await loginService(req.body);

      const dataToken = {
        id: userData.id,
        username: userData.username,
      };

      const tokenAccess = createJwtAccess(dataToken);
      res.set("x-token-access", tokenAccess);
      return res.status(200).send(userData);
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message: error.message || error });
    }
  },

  keeplogin: async (req, res) => {
    const { id } = req.user;
    let conn, sql;
    try {
      conn = await dbCon.promise();
      sql = `select * from users where id = ?`;
      let [result] = await conn.query(sql, [id]);
      return res.status(200).send(result[0]);
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message: error.message } || error);
    }
  },

  accountVerified: async (req, res) => {
    const { id } = req.user;
    let conn, sql;
    try {
      conn = await dbCon.promise().getConnection();
      await conn.beginTransaction();
      sql = `select id from users where id = ? and isVerified = 1`;
      let [userVerified] = await conn.query(sql, [id]);
      console.log(req.user, "ini req user acc verified");
      if (userVerified.length) {
        throw { message: "email verified, dont click again" };
      }

      sql = `update users set ? where id =?`;
      let updateData = {
        isVerified: 1,
      };
      await conn.query(sql, [updateData, id]);

      sql = `select id, username, isVerified, email from users where id = ?`;
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
  sendEmailVerified: async (req, res) => {
    const { id, email, username } = req.body;
    try {
      let timecreated = new Date().getTime();
      const dataToken = {
        id: id,
        username: username,
        timecreated,
      };

      let success = myCache.set(id, dataToken, 5 * 60);
      if (!success) {
        throw { message: "error caching" };
      }

      const tokenEmail = createJwtEmail(dataToken);
      const host =
        process.env.NODE_ENV === "production"
          ? "http://yourdomainname"
          : "http://localhost:3000";
      const link = `${host}/verified/${tokenEmail}`;
      let filepath = path.resolve(
        __dirname,
        "../template/verificationEmail.html"
      );
      let htmlString = fs.readFileSync(filepath, "utf-8");
      const template = handlebars.compile(htmlString);
      const htmlToEmail = template({
        username: username,
        link,
      });
      await transporter.sendMail({
        from: "Teatalk <gonewithewind1@gmail.com>",
        // to: email,
        to: `grisheldaathallahsilviyana@gmail.com`,
        subject: "Complete your sign up!",
        html: htmlToEmail,
      });
      return res.status(200).send({ message: "berhasil kirim email lagi99x" });
    } catch (error) {
      console.log(error);
      return res.status(200).send({ message: error.message || error });
    }
  },
};
