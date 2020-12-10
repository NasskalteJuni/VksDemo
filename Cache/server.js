const http = require("http");
const fs = require("fs");
const log = (...values) => {console.log(values.join(" ")); fs.appendFileSync("/events/events.log",JSON.stringify({who: "cache", what: values.join(" "), when: Date.now()})+"\n", {encoding: "utf-8"});};
const delay = (s=1) => new Promise(res => setTimeout(res, s*1000));

// write resources in a simple dictionary, with their URL as key and expires + actual response content as values
const cache = {};
// who do we cache for, what's the FQDN of our upstream server? (We need this to redirect requests to this server on cache misses)
const upstream = process.env.UPSTREAM_SERVER || "server";
// how many seconds shall we consider a resource fresh/valid/whatever you call it
const cache_lifetime = process.env.CACHE_TIME || 60;

// define how our server handles requests, and requests means GET requests for this example
const server = http.createServer(async (req, res) => {
    await delay();
    log(`getting request for ${req.url}`);
    // take the resource url
    const resource = req.url;
    // check if it is in our cache
    const cached = cache[resource];
    // if yes
    if(cached){
        // is it still valid/fresh? if yes
        if(cached.expires > Date.now()){
            // send the resource to the client without bothering our upstream server
            log(`serving request for ${resource} from cache.`);
            res.writeHead(200, "OK", {
                "cache-control": "expires: " + new Date(cached.expires).toUTCString(),
                "content-type": cached.contentType,
                "X-Server": "Cache-Server"
            });
            return res.end(cached.data);
        }else{
            log("resource was cached, but too old & expired. Delete from cache");
            // the resource is cached, but already expired. remove it from cache, carry on as if it wasn't in cache
            delete cache[resource];
        }
    }
    await delay();
    log("cache miss, forward request to server");
    // seems like we are here since we have to get the resource from our upstream server... do exactly that
    http.get(`http://${upstream}${resource}`, (upstreamResponse) => {
        // buffer the data we receive from our upstream
        let data = "";
        upstreamResponse.on("data", d => data+=d);
        upstreamResponse.on("end", async () => {
            const contentType = upstreamResponse.headers["content-type"];
            log(`received response from upstream server for ${resource}`);
            // if everything is ok
            if(upstreamResponse.statusCode >= 200 && upstreamResponse.statusCode < 300){
                await delay();
                log(`adding resource ${resource} to cache...`);
                // update our cache with whatever we received
                cache[resource] = {
                    data,
                    contentType,
                    expires: Date.now() + cache_lifetime * 1000,
                };
            }
            await delay();
            // send the fresh data to the client (forwarding some necessary things)
            log(`serving request for ${resource} from upstream server with fresh data`);
            res.writeHead(upstreamResponse.statusCode, upstreamResponse.statusText, {
                "content-type": upstreamResponse.headers["content-type"],
                "x-server": upstreamResponse.headers["x-server"] || "server"
            });
            res.end(data);
        });
        // if something fails: log errors and respond with a server error to clients
        upstreamResponse.on("error", err => {
            console.error(err);
            res.writeHead(500, "UPSTREAM ERROR");
            res.end();
        });
    });
});

server.listen(80);