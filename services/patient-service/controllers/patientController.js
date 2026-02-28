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
        res.status(201).json({ success: true, message: 'Patient created', data: req.body });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const updatePatient = async (req, res) => {
    try {
        res.status(200).json({ success: true, message: `Patient ${req.params.id} updated` });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const deletePatient = async (req, res) => {
    try {
        res.status(200).json({ success: true, message: `Patient ${req.params.id} deleted` });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = { getPatients, getPatientById, createPatient, updatePatient, deletePatient };
