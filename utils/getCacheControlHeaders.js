const ROLE = Object.freeze({CLIENT: "CLIENT", SERVER: "SERVER", CACHE: "CACHE"});

/**
 * @typedef Header
 * @property {String} name Header name like 'cache-control'
 * @property {String} value Header value for key
 * */
/**
 * @typedef EffectiveCacheControl
 * @property {Date|null} expires the expiry time as Date or null, if no header regarding expiry is sent
 * @property {Array<Header>} headersPresent a list of all cache related headers
 * @property {Header|null} headerUsed the effective header, if there are conflicting cache control headers
 * @property {String|null} etag the etag validator value, if present
 * @property {Boolean} isAllowed  if the service is allowed to cache the given request
 * */

/**
 * Get cache controlling headers used in this example ( -> does not work with all possible headers)
 * @param {Response} httpResponse a response (possibly) containing headers related to cache control
 * @param  {String} [role="CACHE"] the role of the invoking entity. If cache-control: private, setting role="CLIENT" will allow caching while role="CACHE" will ignore the headers
 * @returns {EffectiveCacheControl} the used headers and the resulting values for expiry
 * */
function getCacheControlHeaders(httpResponse, role=ROLE.CACHE){
    /** @var {EffectiveCacheControl} effective */
    let effective = {
        expires: null,
        headersPresent: [],
        headerUsed: null,
        etag: null,
        isAllowed: true
    };
    return Object.keys(httpResponse.headers).reduce((effectiveCacheControl, currentHeaderName) => {
        // for string comparisons, always work on lower case (so "Cache-Control" and "cache-control" are the same)
        let currentHeaderValue = httpResponse.headers[currentHeaderName].toLowerCase();
        currentHeaderName = currentHeaderName.toLowerCase();
        let currentHeader = {name: currentHeaderName, value: currentHeaderValue};


        // check if the user is allowed to use the cache-control headers
        if(currentHeaderName === "cache-control" && currentHeaderValue){
            // only clients are allowed to cache headers with the cache-control: private directive, ignore them otherwise
            let isNotAllowedForProxies = currentHeaderValue.indexOf("private") >= 0;
            let isNotAllowedForAll = currentHeaderValue.indexOf("no-cache") >= 0;
            if((isNotAllowedForProxies && role !== "CLIENT") || isNotAllowedForAll){
                return {expires: null, headersPresent: [], headerUsed: null, etag: null, isAllowed: false};
            }
        }


        switch(currentHeaderName){
            case "cache-control":
                effectiveCacheControl.headersPresent.push(currentHeader);
                // to use this header, require a max-age setting
                // the header could also just be 'cache-control: public',
                // but this does not tell us anything about its expiration time
                let expiry = getMaxAgeDate(currentHeaderValue);
                console.log()
                if(expiry){
                    effectiveCacheControl.headerUsed = currentHeader;
                    effectiveCacheControl.expires = expiry;
                }
                return effectiveCacheControl;
            case "expires":
                effectiveCacheControl.headersPresent.push(currentHeader);
                // cache control has a higher priority than expires,
                // so if we already use cache-control max-age, do not replace it
                if(effectiveCacheControl.headerUsed?.value === "cache-control"){
                    return effectiveCacheControl;
                }
                // if not, just overwrite the expiry
                effectiveCacheControl.expires = new Date(currentHeaderValue);
                effectiveCacheControl.headerUsed = currentHeader;
                return effectiveCacheControl;
            case "etag":
                effectiveCacheControl.headersPresent.push(currentHeader);
                effectiveCacheControl.etag = currentHeaderValue;
                if(!effectiveCacheControl.headerUsed){
                   effectiveCacheControl.headerUsed = currentHeader;
                }
                return effectiveCacheControl;
            default:
                return effectiveCacheControl;
        }

    }, effective);
}

/**
 * @param {String} cacheControlHeaderValue Cache-Control Header
 * @returns {Date | null} if a max age directive was present, its Date is returned, if not, it's null
 * */
function getMaxAgeDate(cacheControlHeaderValue){
    let matched = cacheControlHeaderValue.match(/max-age=(?<seconds>\d+)/gi);
    let seconds = matched ? +matched[0].replace("max-age=","") : null;
    if(isNaN(seconds) || !seconds) return null;

    // convert seconds to milliseconds and create a new date in the future
    return new Date(Date.now() + seconds*1000);
}

module.exports = getCacheControlHeaders;