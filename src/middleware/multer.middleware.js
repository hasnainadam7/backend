import multer from "multer";
import path from "path";

// Set the temporary file storage path
const filePath = path.join(process.cwd(), "public", "temp");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, filePath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileExtension = path.extname(file.originalname); // Get file extension
    const safeFilename = file.originalname.replace(/\s+/g, "-").toLowerCase(); // Remove spaces
    cb(null, `${safeFilename}-${uniqueSuffix}${fileExtension}`);
  },
});

const upload = multer({ storage });

export default upload;
