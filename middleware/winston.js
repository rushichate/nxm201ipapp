
const winston = require("winston")
require("winston-mongodb")

const winstonLogger = winston.createLogger({
    transports:[
        new winston.transports.Console(),
        new winston.transports.MongoDB({
            db:process.env.mongoURL,
            options:{useUnifiedTopology:true},
            collection:"error",
            level:"error"
        })
    ]
})

module.exports = {
    winstonLogger
}