const axios = require('axios');

// Python ML service URL
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5000';

const analyzeSymptoms = async (req, res) => {
    try {
        const { symptoms, sessionSymptoms } = req.body;
        if (!symptoms) {
            return res.status(400).json({ success: false, message: 'Symptoms are required' });
        }

        // Call Python ML service
        const response = await axios.post(`${ML_SERVICE_URL}/api/symptoms/analyze`, {
            symptoms: symptoms,
            sessionSymptoms: sessionSymptoms || []
        });

        // Return the ML service response
        return res.status(200).json(response.data);

    } catch (error) {
        console.error('Error analyzing symptoms:', error.message);

        // If Python service is not available, return mock response
        if (error.code === 'ECONNREFUSED') {
            return res.status(200).json({
                success: true,
                data: {
                    symptoms: req.body.symptoms,
                    detectedSymptoms: ['symptom_detected'],
                    possibleConditions: ['Consult a physician'],
                    confidence: 0.5,
                    recommendation: 'Python ML service is not running. Please start the service: python ml-integration/symptom_analyzer.py',
                }
            });
        }

        res.status(500).json({ success: false, error: error.message });
    }
};

const getAnalysisHistory = async (req, res) => {
    try {
        res.status(200).json({ success: true, message: 'Analysis history', data: [] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = { analyzeSymptoms, getAnalysisHistory };
