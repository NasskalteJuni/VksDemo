const stream = require("stream");
const fs = require("fs");
/**
 * This class streams log-events based on a given events.log file
 * This file has a special format: each line of this file contains a json object with the properties who, what and when.
 * This Streamer checks for updates in the log file (new, appended entries) and streams those updates
 * @class LogEventStreamer
 * */
class LogEventStreamer{

    /**
     * @constructor
     * @param {Object} settings
     * @param {Number} [settings.checkInterval=0.5] how often (time in seconds) this eventLogFileStreamer should check for changes
     * @param {String} [settings.logFileLocation="/events/events.log"] the path to the logfile, including the filename itself
     * */
    constructor({checkInterval=0.5, logFileLocation="/events/events.log"} ={}){
        this.stream = new stream.Writable();
        this._seen = [];
        this._interval = setInterval(() => {
            // there may be the chance that the logfile is currently deleted
            // this can be done to flush the logfile
            if(fs.existsSync(logFileLocation)){
                let fileContent = fs.readFileSync(logFileLocation,{encoding: "utf-8"});
                // all log file lines except empty ones
                let allLines = fileContent.split("\n").filter(e => e.trim().length > 0);
                // now, just select the events added since our last read
                let newLines;
                let hasLogBeenFlushed = this._hasLogBeenFlushed(allLines);
                if(!hasLogBeenFlushed){
                    // if we cleared our log file, all lines we read are new lines
                    newLines = allLines;
                }else{
                    // just the lines after the already seen ones
                    newLines = allLines.slice(this._seen.length);
                }
                if(newLines.length){
                    newLines.forEach(line => stream.write(line));
                }else if(hasLogBeenFlushed){
                    stream.write(null);
                }
            }
        }, checkInterval);
    }

    /**
     * close the stream and stop checking for updates
     * */
    close(){
        if(this._interval){
            clearInterval(this._interval);
            this.stream.close();
        }
    }

    /**
     * @private
     * @param {Array<String>} logLines a list of all log file lines
     * @returns {Boolean} true if the log has been cleared / flushed / deleted
     * */
    _hasLogBeenFlushed(logLines){
        if(logLines < this._seen.length){
            return true;
        }

        // how many non-new log lines have been changed?
        let changedLogLines = this._seen.filter((seenLogLine, i) => seenLogLine !== logLines[i]);
        return changedLogLines.length > 0;
    }
}