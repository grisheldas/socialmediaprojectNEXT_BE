require("dotenv").config();
const express = require("express");
const app = express();
const PORT = process.env.PORT || 5000;
const cors = require("cors");
const morgan = require("morgan");

morgan.token("date", function (req, res) {
  return new Date().toString();
});

app.use(morgan(":method :url :res[content-length] - :response-time ms :date"));

app.use(express.json());

app.use(
  cors({
    exposedHeaders: ["x-token-access", "x-total-count"],
  })
);

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.send("<h1>Backend Teatalk 1.0</h1>");
});

const { authRoutes } = require("./src/routes");
app.use("/auth", authRoutes);

const { profileRoutes } = require("./src/routes");
app.use("/profilepicture", profileRoutes);

const { postRoutes } = require("./src/routes");
app.use("/post", postRoutes);

app.listen(PORT, () => console.log(`app jalan di ${PORT}`));
