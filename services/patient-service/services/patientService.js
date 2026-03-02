const { Patients, Documents } = require("../models");

exports.getOrCreatePatient = async (authData) => {
  let patient = await Patients.findOne({ where: { authId: authData.authId } });

  if (!patient) {
    patient = await Patients.create({
      authId: authData.authId,
      email: authData.email,
      fullName: "New Patient",
    });
  }
  return patient;
};

exports.updateProfile = async (authId, updateData) => {
  const patient = await Patients.findOne({ where: { authId } });
  if (!patient) {
    throw new Error("Patient not found");
  }
  return await patient.update(updateData);
};

exports.uploadDocument = async (patientId, file) => {
  const document = await Documents.create({
    patientId,
    fileName: file.originalname,
    fileUrl: `/uploads/${file.filename}`,
    documentType: "Report",
  });
  return document;
};

exports.getPatientHistory = async (patientId) => {
  return await Documents.findAll({
    where: { patientId },
    order: [["createdAt", "DESC"]],
  });
};
