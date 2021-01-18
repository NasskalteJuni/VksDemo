const fs = require("fs");
const delay = require("./delay.js");

/**
 * create a log function for a given service
 * @param {String} service
 * @returns {log} a log function
 * */
function getLogFor(service){
    /**
     * @typedef log
     * @function
     * logs the given values to a log file under /events/events.log
     * @param {...*} values some values to write into the log file as special event log message
     * @returns {Promise} resolves when done logging
     * */
    async function log(...values){
        values = values.join("\n");
        console.log(values);
        let logMessage = JSON.stringify({who: service, what: values, when: Date.now()})+"\n";
        fs.appendFileSync("/events/events.log",logMessage, {encoding: "utf-8"});
        await delay();
    }

    return log;
}

module.exports = getLogFor;