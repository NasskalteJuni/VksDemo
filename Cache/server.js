const http = require("http");
const log = require("../utils/log.js")("cache");
const httpGet = require("../utils/httpGet.js");
const getCacheControlHeaders = require("../utils/getCacheControlHeaders.js");

// write resources in a simple dictionary, with their URL as key and expires + actual response content as values
const cache = {};

// who do we cache for, what's the FQDN of our upstream server? (We need this to redirect requests to this server on cache misses)
const UPSTREAM = process.env.UPSTREAM_SERVER || "server";

// if this is set, the cache will always cache a resource for a given number of seconds (ignoring expires or other control headers)
// Mainly added this for debugging purposes
const ALWAYS_CACHE_FOR = process.env.ALLWAYS_CACHE_FOR || 0;


// define how our server handles requests, and requests means GET requests for this example
const server = http.createServer(async (req, res) => {
    await log(`getting request for ${req.url}`);
    // take the resource url
    let resource = req.url;

    // check if it is in our cache
    let cached = cache[resource];

    // if yes
    if(cached){
        // is it still valid/fresh? if yes
        if(new Date(cached.expires) > Date.now()){
            // send the resource to the client without bothering our upstream server
            await log(`serving request for ${resource} from cache.`);
            let headers = {
                "expires": cached.expires.toUTCString(),
                "content-type": cached.contentType,
            };
            if(cached.etag) headers.etag = cached.etag;
            return res.writeHead(200, "OK", headers).end(cached.data);
        }else{
            await log("resource was cached, but too old & expired. Delete from cache");
            // the resource is cached, but already expired. remove it from cache, carry on as if it wasn't in cache
            delete cache[resource];
        }
    }

    await log("cache miss, forward request to server");

    // if we got here, the resource was not in cache or the cache was stale. request the resource from the server
    let upstreamResponse = await httpGet(`http://${UPSTREAM}${req.url}`, {headers: req.headers});
    await log(`received response from upstream server for ${resource}`);

    // if everything is ok
    if(upstreamResponse.ok){
        let httpHeaderCacheInfo = getCacheControlHeaders(upstreamResponse);
        if(httpHeaderCacheInfo.isAllowed){
            await log(`adding resource ${resource} to cache...`);
            // update our cache with whatever we received
            cache[resource] = {
                data: upstreamResponse.body,
                contentType: upstreamResponse.headers["content-type"],
                expires: ALWAYS_CACHE_FOR ? new Date(Date.now() + ALWAYS_CACHE_FOR) : httpHeaderCacheInfo.expires,
                etag: httpHeaderCacheInfo.etag
            };
        }else{
            await log(`not allowed to cache resource`);
        }
    }

    // send / forward the fresh data to the client
    await log(`serving request for ${resource} from upstream server with fresh data`);
    upstreamResponse.sendAs(res);
});

server.listen(80);