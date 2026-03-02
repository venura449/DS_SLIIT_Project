const express = require("express");
const router = express.Router();
const {
  getProfile,
  uploadDocument,
  getMyDocuments,
  updateProfile,
} = require("../controllers/patientController");
const { protect } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/multerConfig");

router.get("/profile", protect, getProfile);
router.post("/documents", protect, upload.single("file"), uploadDocument);
router.get("/documents", protect, getMyDocuments);
router.put("/profile", protect, updateProfile);

module.exports = router;
