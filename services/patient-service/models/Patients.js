const { DataTypes } = require("seqelize");
const sequelize = require("../config/postgres");

const Patients = sequelize.define("Patients", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  fullName: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, unique: true, validate: { isEmail: true } },
  phoneNumber: { type: DataTypes.STRING },
  medicalHistory: { type: DataTypes.TEXT },
  profilePictureUrl: { type: DataTypes.STRING },
});
