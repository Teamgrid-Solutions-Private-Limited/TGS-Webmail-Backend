const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  // Allow images, documents, and video files
  const allowedTypes = /jpeg|jpg|png|pdf|doc|docx|mp4|avi|mov|zip/;
  const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  if (ext) cb(null, true);
  else cb(new Error('Only images, documents,zip and videos are allowed!'), false);
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
