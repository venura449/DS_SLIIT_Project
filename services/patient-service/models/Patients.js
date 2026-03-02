const { DataTypes } = require("seqelize");
const sequelize = require("../config/database");

const Patients = sequelize.define("Patients", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  authId: { 
        type: DataTypes.STRING, 
        unique: true, 
        allowNull: false
    },
  fullName: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, unique: true, validate: { isEmail: true } },
  phoneNumber: { type: DataTypes.STRING },
  dateOfBirth: { type: DataTypes.DATEONLY },
  medicalHistory: { type: DataTypes.TEXT },
});

module.exports = Patients;