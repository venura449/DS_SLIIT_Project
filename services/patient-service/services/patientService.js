const {Patients, Documents} = require("../models");
const kafka = require('../config/kafka');
const fs = requrie('fs');
const path = require('path');

const producer = kafka.producer();

exports.registerPatient = async(PatientData)=>{
    const patient = await Patients.create(PatientData);

    await producer.connect();
    await producer.send({
        topic:'patient-registered',
        messages:[{
            value:JSON.stringify({id:patient.id,email:patient.email}),
        }]
    });
    return patient;
};


exports.uploadDocument = async(patientId, file)=>{
    
    const document = await Documents.create({
        patientId,
        fileName: file.originalname,
        fileUrl: `/uploads/${file.filename}`,
        documentType:'Report'
    });
    return document;
}