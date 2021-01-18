// imports
const crypto = require("crypto");
const http = require("http");
const log = require("../utils/log.js")("server");

// how many seconds shall we consider a resource fresh/valid/whatever you call it
const CACHE_LIFETIME = process.env.CACHE_LIFETIME || 60;
// use etag for resources?
const USE_ETAG = +process.env.USE_ETAG || false;
// allow only client caches to store data?
const ALLOW_ONLY_CLIENT_CACHING = +process.env.ALLOW_ONLY_CLIENT_CACHING || false;
// use max-age=seconds instead of expires header
const USE_MAX_AGE = +process.env.USE_MAX_AGE || false;

const server = http.createServer(async (req, res) => {
    // just serve some specified files, if the client requests something else, return 404 NOT FOUND
    if(req.url === "/test.html"){

        await log("get request for resource /test.html");
        // for demonstration purposes, generate dynamic html code containing the current time
        let dynamicContent = `<!doctype html><html lang="en"><head><title>test</title></head><body>created on ${new Date().toLocaleString("de", {timeZone: "Europe/Berlin"})}</body></html>`;
        let hash = crypto.createHash("md5").update(dynamicContent).digest("base64");

        // if the client requested the resource with a hash of its cached version, check if the resource changed
        if(req.headers["if-none-match"]){
            let isSameHash = hash === req.headers["if-none-match"];
            await log(
                `checking by etag if resource is still the same:  ${isSameHash}`,
                `client-etag=${req.headers["if-none-match"]}, server-etag=${hash}`
            );
            if(isSameHash){
                // when the resource is the same, send only 304 as status
                await log("send only 304 status with empty body");
                return res.writeHead(304, "NOT-MODIFIED").end();
            }
        }

        let headers = {
            "content-type": "text/html",
            "expires": new Date(Date.now() + CACHE_LIFETIME*1000).toUTCString(),
            "cache-control": ALLOW_ONLY_CLIENT_CACHING ? "private" : "public",
        };

        if(USE_MAX_AGE){
            delete headers["expires"];
            headers["cache-control"]+="; max-age="+CACHE_LIFETIME;
        }

        if(USE_ETAG){
            headers["etag"] = hash;
        }

        await log(`serving dynamic content for ${req.url}`);
        res.writeHead(200, "OK", headers).end(dynamicContent);
    }else{
        await log(`no such resource ${req.url}`);
        res.writeHead(404, "NOT FOUND").end();
    }
});

server.listen(80);