/**
* delay by resolving after the given number of seconds
* if you use 'async', await delay(1) will have the same effect as sleep(1) in other programming languages
* @param {Number} [s=1] the number of seconds to wait (not milliseconds!)
* @returns {Promise} resolves after the given time (cannot reject)
*/
function delay(s=1){
    return new Promise(res => setTimeout(res, s*1000));
}

module.exports = delay;
