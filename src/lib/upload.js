const multer = require("multer");
const fs = require("fs");

const upload = (destination, fileNamePrefix) => {
  const defaultPath = "./public";
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      console.log("ini isi file: ", file);
      const dir = defaultPath + destination;
      if (fs.existsSync(dir)) {
        console.log("file exists");
        cb(null, dir);
      } else {
        fs.mkdir(dir, { recursive: true }, (err) => cb(err, dir));
        console.log("this is the new dir ", dir);
      }
    },
    filename: function (req, file, cb) {
      let originalName = file.originalname;
      let ext = originalName.split(".");
      let filename = fileNamePrefix + Date.now() + "." + ext[ext.length - 1];
      cb(null, filename);
    },
  });

  const fileFilter = (req, file, cb) => {
    const ext = /\.(jpg|jpeg|png|gif|pdf|doc|docx|xlsx|JPEG)$/;
    if (!file.originalname.match(ext)) {
      return cb(new Error("Only selected file type are allowed"), false);
    }
    cb(null, true);
  };

  return multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: 2 * 1024 * 1024,
    },
  });
};

module.exports = upload;
