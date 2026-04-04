const pino = require('pino');
const path = require('path');

const logDirectory = path.join(process.cwd(), 'logs');
console.log(logDirectory);
const transport = pino.transport({
    target: 'pino-roll',
    options:{
        file:path.join(logDirectory, 'audit'),
        size: '0.5K',
        frequency: 'daily',
        mkdir:true,
        extension:'.json',
        dateFormat: 'yyyy-MM-dd'
    },

});

const logger = pino({
    timestamp: pino.stdTimeFunctions.isoTime,
    base: undefined,
    formatters:{
        level:(label)=>{
            return {level: label.toUpperCase()};
        },
    },
},transport);

module.exports = logger;