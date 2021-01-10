const http = require("http");
const log = require("../utils/log.js")("server");

// how many seconds shall we consider a resource fresh/valid/whatever you call it
const CACHE_LIFETIME = process.env.CACHE_LIFETIME || 60;

const server = http.createServer(async (req, res) => {
    await log(`getting request for resource ${req.url}`);
    // just serve some specified files, if the client requests something else, return 404 NOT FOUND
    if(req.url === "/test.html"){
        await log("serving test.html file");
        res.writeHead(200, "OK", {
            "content-type": "text/html",
            "expires": new Date(Date.now() + CACHE_LIFETIME*1000).toUTCString(),
            "cache-control": "public",
        });
        res.end(`<!doctype html><html lang="en"><head><title>test</title></head><body>${new Date().toISOString()}</body></html>`);
    }else if(req.url === "/example.txt"){
        await log("serving example.txt file");
        res.writeHead(200, "OK",{
            "content-type": "text/plain",
            "cache-control": "max-age="+CACHE_LIFETIME
        });
        res.end("This text file has been created at "+new Date().toISOString());
    }else{
        await log(`no such resource ${req.url}`);
        res.writeHead(404, "NOT FOUND");
        res.end();
    }
});

server.listen(80);