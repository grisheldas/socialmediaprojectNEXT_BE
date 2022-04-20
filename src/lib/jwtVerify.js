const jwt = require("jsonwebtoken");
// const myCache = require("./cache");

module.exports = {
  verifyTokenAccess: async (req, res, next) => {
    const authHeader = req.headers["authorization"];
    let token;
    if (authHeader) {
      token = authHeader.split(" ")[1] ? authHeader.split(" ")[1] : authHeader;
    } else {
      token = null;
    }

    let key = process.env.JWT_SECRET;
    try {
      let decode = await jwt.verify(token, key);
      req.user = decode;
      next();
    } catch (error) {
      return res.status(401).send({ message: "user unauthorized" });
    }
  },

  verifyTokenEmail: async (req, res, next) => {
    const authHeader = req.headers["authorization"];
    console.log(req.headers);
    let token;
    if (authHeader) {
      token = authHeader.split(" ")[1] ? authHeader.split(" ")[1] : authHeader;
    } else {
      token = null;
    }
    console.log(token);
    let key = process.env.JWT_SECRET;
    try {
      let decode = await jwt.verify(token, key);
      req.user = decode;
      next();
    } catch (error) {
      console.log(error);
      return res.status(401).send({ message: "user unauthorized" });
    }
  },

  // verifyLastToken: (req, res, next) => {
  //   const { timecreated, id } = req.user;
  //   let isiCache = myCache.get(id);
  //   console.log(isiCache);
  //   if (timecreated === isiCache.timecreated) {
  //     next();
  //   } else {
  //     return res.status(401).send({ message: "unauthorized" });
  //   }
  // },
};
