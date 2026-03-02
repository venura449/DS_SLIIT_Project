const express = require('express');
const multer = require('multer');
const router = express.Router();
const ctrl = require('../controllers/medicalRecordController');
const { authMiddleware } = require('../middlewares/authMiddleware');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
    fileFilter: (req, file, cb) => {
        const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
        if (allowed.includes(file.mimetype)) return cb(null, true);
        cb(new Error('Only PDF, JPEG, and PNG files are allowed'), false);
    },
});

// Patient — own records
router.post('/', authMiddleware, upload.single('file'), ctrl.uploadRecord);
router.get('/', authMiddleware, ctrl.getMyRecords);
router.delete('/:id', authMiddleware, ctrl.deleteRecord);

// Doctor — view records of a specific patient (any authenticated user with a valid token)
router.get('/patient/:patientId', authMiddleware, ctrl.getPatientRecords);

module.exports = router;
