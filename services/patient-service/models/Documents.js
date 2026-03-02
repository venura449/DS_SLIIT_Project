const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Documents = sequelize.define("Documents", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  fileName: { type: DataTypes.STRING },
  fileUrl: { type: DataTypes.STRING },
  documentType: { type: DataTypes.ENUM("Report", "Prescription", "LabResult") },
  patientId:{type:DataTypes.UUID}
});

Patients.hasMany(Documents, {foreignKey:'patientId'});
