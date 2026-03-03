/**
 * Doctor Verification Model — PostgreSQL backed
 */

const db = require('../config/postgres');

const toDoc = (row) => ({
    id: row.id,
    doctorId: row.doctor_id,
    documentType: row.document_type,
    documentUrl: row.document_url,
    publicId: row.public_id,
    fileName: row.file_name,
    fileSize: row.file_size,
    uploadedAt: row.uploaded_at,
    savedAt: row.saved_at,
    status: row.status,
});

const toStatus = (row, documents = []) => ({
    doctorId: row.doctor_id,
    status: row.status,
    documentsSubmitted: row.documents_submitted,
    totalRequired: row.total_required,
    lastUpdated: row.last_updated,
    submittedAt: row.submitted_at,
    approvedAt: row.approved_at,
    rejectedAt: row.rejected_at,
    rejectionReason: row.rejection_reason,
    documents,
});

/* ── upsert helper ─────────────────────────────────────────────── */
const upsertStatus = async (doctorId) => {
    const docs = await getDocumentsByDoctorId(doctorId);
    const count = docs.length;
    const newStatus = count === 0 ? 'no_documents' : 'pending';

    const result = await db.query(
        `INSERT INTO verification_status (doctor_id, status, documents_submitted)
         VALUES ($1, $2, $3)
         ON CONFLICT (doctor_id) DO UPDATE
           SET documents_submitted = EXCLUDED.documents_submitted,
               status = CASE
                   WHEN verification_status.status IN ('submitted_for_review','approved','rejected')
                        THEN verification_status.status
                   ELSE EXCLUDED.status
               END,
               last_updated = CURRENT_TIMESTAMP
         RETURNING *`,
        [doctorId, newStatus, count]
    );

    return toStatus(result.rows[0], docs);
};

/* ── public API ────────────────────────────────────────────────── */

const saveDocument = async (documentData) => {
    const { doctorId, documentType, documentUrl, publicId, fileName, fileSize, uploadedAt } = documentData;

    const result = await db.query(
        `INSERT INTO verification_documents
            (doctor_id, document_type, document_url, public_id, file_name, file_size, uploaded_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [doctorId, documentType, documentUrl, publicId, fileName, fileSize, uploadedAt]
    );

    const doc = toDoc(result.rows[0]);
    const status = await upsertStatus(doctorId);
    return { document: doc, status };
};

const getDocumentsByDoctorId = async (doctorId) => {
    const result = await db.query(
        'SELECT * FROM verification_documents WHERE doctor_id = $1 ORDER BY saved_at ASC',
        [doctorId]
    );
    return result.rows.map(toDoc);
};

const getDocumentById = async (documentId) => {
    const result = await db.query(
        'SELECT * FROM verification_documents WHERE id = $1',
        [documentId]
    );
    return result.rows[0] ? toDoc(result.rows[0]) : null;
};

const deleteDocument = async (documentId) => {
    const doc = await getDocumentById(documentId);
    if (!doc) return false;
    await db.query('DELETE FROM verification_documents WHERE id = $1', [documentId]);
    await upsertStatus(doc.doctorId);
    return true;
};

const getVerificationStatus = async (doctorId) => {
    const statusRow = await db.query(
        'SELECT * FROM verification_status WHERE doctor_id = $1',
        [doctorId]
    );
    const docs = await getDocumentsByDoctorId(doctorId);

    if (!statusRow.rows[0]) {
        return await upsertStatus(doctorId);
    }
    return toStatus(statusRow.rows[0], docs);
};

const updateVerificationStatus = async (doctorId) => {
    return upsertStatus(doctorId);
};

const submitForVerification = async (doctorId) => {
    const result = await db.query(
        `UPDATE verification_status
         SET status = 'submitted_for_review', submitted_at = CURRENT_TIMESTAMP, last_updated = CURRENT_TIMESTAMP
         WHERE doctor_id = $1
         RETURNING *`,
        [doctorId]
    );
    const docs = await getDocumentsByDoctorId(doctorId);
    return toStatus(result.rows[0], docs);
};

const approveVerification = async (doctorId) => {
    const result = await db.query(
        `UPDATE verification_status
         SET status = 'approved', approved_at = CURRENT_TIMESTAMP, last_updated = CURRENT_TIMESTAMP
         WHERE doctor_id = $1
         RETURNING *`,
        [doctorId]
    );
    const docs = await getDocumentsByDoctorId(doctorId);
    return toStatus(result.rows[0], docs);
};

const rejectVerification = async (doctorId, reason) => {
    const result = await db.query(
        `UPDATE verification_status
         SET status = 'rejected', rejection_reason = $2, rejected_at = CURRENT_TIMESTAMP, last_updated = CURRENT_TIMESTAMP
         WHERE doctor_id = $1
         RETURNING *`,
        [doctorId, reason]
    );
    const docs = await getDocumentsByDoctorId(doctorId);
    return toStatus(result.rows[0], docs);
};

const getAllSubmissions = async () => {
    const statusRows = await db.query(
        `SELECT * FROM verification_status WHERE status != 'no_documents' ORDER BY last_updated DESC`
    );

    return Promise.all(
        statusRows.rows.map(async (row) => {
            const docs = await getDocumentsByDoctorId(row.doctor_id);
            return toStatus(row, docs);
        })
    );
};

module.exports = {
    saveDocument,
    getDocumentsByDoctorId,
    getDocumentById,
    deleteDocument,
    updateVerificationStatus,
    getVerificationStatus,
    getAllSubmissions,
    submitForVerification,
    approveVerification,
    rejectVerification,
};
