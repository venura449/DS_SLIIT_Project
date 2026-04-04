const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');

const logAuditEvent = async (req, {action, resourceType, resourceId, details, status = 'success'})=>{
    const actor = req.user;

    const forwarded = req.headers['x-forwarded-for'];
    const rawIp = forwarded ? forwarded.split(',')[0].trim() : (req.socket?.remoteAddress || 'unknown');
    const ipAddress = rawIp.startsWith('::ffff:') ? rawIp.slice(7) : rawIp;

    const autditData = {
        actorId: actor?.id || null ,
        actorEmail: actor?.email || null,
        actorName: actor?.name || null,
        action,
        resourceType,
        resourceId,
        details,
        ipAddress,
        status,
    };

    logger.info(autditData, `Audit Action: ${action}`);

    try{
        await AuditLog.create(auditData);
    }catch(error){
        console.error('[AuditLog] Postgres save failed: ',error.message);

        logger.error({error: error.message, originalLog: auditData}, 'DATABASE_SAVE_FALIURE');
    }
};

module.exports = {
    logAuditEvent,
};