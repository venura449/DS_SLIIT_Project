const patientService = require("../services/patientService");

const getProfile = async (req, res) => {
  try {
    const profile = await patientService.getOrCreatePatient(req.user);
    res
      .status(200)
      .json({
        success: true,
        message: "Profile retrieved successfully",
        data: profile,
      });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Falled to retrieve profile",
        error: error.message,
      });
  }
};

const updateProfile = async (req, res) => {
  try {
    const updated = await patientService.updateProfile(
      req.user.authId,
      req.body,
    );
    res
      .status(200)
      .json({
        success: true,
        message: "Profile updated successfully",
        data: updated,
      });
  } catch (error) {
    res
      .status(400)
      .json({
        success: false,
        message: "Failed to update profile",
        error: error.message,
      });
  }
};

const uploadDocument = async (req, res) => {
  try {
    const profile = await patientService.getOrCreatePatient(req.user);
    const doc = await patientService.uploadDocument(profile.id, req.file);
    res
      .status(200)
      .json({
        success: true,
        message: "Document uploaded successfully",
        data: doc,
      });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to upload document",
        error: error.message,
      });
  }
};

const getMyDocuments = async (req, res) => {
  try {
    const profile = await patientService.getOrCreatePatient(req.user);
    const docs = await patientService.getPatientHistory(profile.id);
    res.status(200).json(docs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
module.exports = { getProfile, updateProfile, uploadDocument, getMyDocuments };
