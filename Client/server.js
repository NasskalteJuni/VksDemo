const http = require("http");
const log = require("../utils/log.js")("client");
const httpGet = require("../utils/httpGet.js");
const getCacheControlHeaders = require("../utils/getCacheControlHeaders");

const IS_CLIENT_CACHE_ENABLED = +process.env.IS_CLIENT_CACHE_ENABLED;
const RESOURCE = process.env.RESOURCE || "test.html";
const HTTP_PROXY = process.env.http_proxy || "";
const SERVER = process.env.SERVER || "";

let cache = {};

let server = http.createServer(async (req, res) => {
    const end = () => res.writeHead(200, "DONE").end();
    // can the client cache resources and does he already have a not-expired the resource in cache?
    // If yes, do not request the resource.
    if(IS_CLIENT_CACHE_ENABLED && cache[RESOURCE] && new Date(cache[RESOURCE].expires) > new Date()){
        await log(
            `${RESOURCE} is already in client cache: ${cache[RESOURCE].data}`,
            `(it will expire at ${cache[RESOURCE].expires.toLocaleString("de", {timeZone: "Europe/Berlin"})})`
        );
        return end();
    }


    let requestSettings;
    if(HTTP_PROXY){
        await log(`request via configured http proxy "${HTTP_PROXY}" to server "${SERVER}" for resource ${RESOURCE}`);
        // if an admin configured a squid web proxy cache on the client, then the client knows he must send the request to the configured proxy
        requestSettings = {host: HTTP_PROXY, port: 3128, path: `http://${SERVER}/${RESOURCE}`};
    }else{
        // otherwise, the client sends the request to the server (or its reverse proxy, which is transparent to the client)
        requestSettings = {host: SERVER, path: `/${RESOURCE}`};
    }
    // if there has been an etag for a cached resource, add it as header to check if the resource is still the same
    if(cache[RESOURCE]?.etag){
        await log(`set if-none-match with etag ${cache[RESOURCE].etag}`);
        requestSettings.headers = {"if-none-match": cache[RESOURCE].etag};
    }

    // request the test.html resource.
    await log(`start request for ${RESOURCE}`);
    let response = await httpGet(requestSettings);

    // check if the response is a 304 - NOT MODIFIED
    if(response.statusCode === 304){
        await log(`received a 304 non-modified response, keep resource in cache and use cached version.`);
        let httpHeaderCacheInfo = getCacheControlHeaders(response, "CLIENT");
        cache[RESOURCE].expires = httpHeaderCacheInfo.expires;
    }
    // per default, do not cache http responses without 2XX status code
    if(!response.ok && response.statusCode === 304){
        await log(`received response with status-code ${response.statusCode}`);
        return end();
    }

    let httpHeaderCacheInfo = getCacheControlHeaders(response, "CLIENT");
    await log(
        `received ${response.body} `,
        `expires on: ${httpHeaderCacheInfo.expires?.toLocaleString("de", {timeZone: "Europe/Berlin"}) || "immediately, no caching"}`,
        `cache-control related headers: ${httpHeaderCacheInfo.headersPresent.map(header => header.name + "=" + header.value).join(", ")}`,
        `used cache control header: "${httpHeaderCacheInfo.headerUsed?.name}"`
    );


    if(IS_CLIENT_CACHE_ENABLED){
        // if the client can cache resources, save the resource, what it is and when it's expired
        cache[RESOURCE] = {
            data: response.body,
            contentType: response.headers["content-type"],
            expires: httpHeaderCacheInfo.expires,
            etag: httpHeaderCacheInfo.etag || null
        };
    }

    end();
});

server.listen(80);