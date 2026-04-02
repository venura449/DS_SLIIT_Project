const AuditLog = require('../models/AuditLog');

/**
 * Record an admin audit event.
 * Call this after a successful admin action.
 *
 * @param {import('express').Request} req - Express request (provides actor + IP)
 * @param {Object} event
 * @param {string} event.action       - e.g. 'USER_UPDATED'
 * @param {string} [event.resourceType] - e.g. 'user'
 * @param {string|number} [event.resourceId] - ID of the affected record
 * @param {Object} [event.details]   - Extra context stored as JSON
 * @param {string} [event.status]    - 'success' | 'failure'
 */
const logAuditEvent = async (req, { action, resourceType, resourceId, details, status = 'success' }) => {
    try {
        const actor = req.user;
        const forwarded = req.headers['x-forwarded-for'];
        const rawIp = forwarded ? forwarded.split(',')[0].trim() : (req.socket?.remoteAddress || 'unknown');
        const ipAddress = rawIp.startsWith('::ffff:') ? rawIp.slice(7) : rawIp;

        await AuditLog.create({
            actorId: actor?.id || null,
            actorEmail: actor?.email || null,
            actorName: actor?.name || null,
            action,
            resourceType,
            resourceId,
            details,
            ipAddress,
            status,
        });
    } catch (err) {
        // Audit logging must never break the main operation
        console.error('[AuditLog] Failed to write audit entry:', err.message);
    }
};

module.exports = { logAuditEvent };
