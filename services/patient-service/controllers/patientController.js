const patientService = require('../services/patientService');

const getPatients = async (req, res) => {
    try {
        res.status(200).json({ success: true, message: 'Get all patients', data: [] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const getPatientById = async (req, res) => {
    try {
        res.status(200).json({ success: true, message: `Get patient ${req.params.id}`, data: null });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const createPatient = async (req, res) => {
    try {
        const patient = await patientService.registerPatient(req.body);
        res.status(201).json({ success: true, message: 'Patient created', data: patient });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const uploadReport = async(req,res)=>{
    try{
        const {id} = req.params;
        const document = await patientService.uploadDocument(id,req.file);
        res.status(201).json({success:true,message:'Document uploaded',data:document});
    }catch(error){
        res.status(500).json({success:false,error:error.message});
    }
}

const getHistory = async(req,res)=>{
    try{
        const patient = await patientService.findByPk(req.params.id,{include:'Documnets'});
        res.status(200).json({success:true,message:'Patient history',data:patient});
    }catch(error){
        res.status(500).json({success:false,error:error.message});
    }
};

module.exports = { getPatients, getPatientById, createPatient, updatePatient, deletePatient, uploadReport, getHistory };
