const http = require("http");
const fs = require("fs");
const log = (...values) => {console.log(values.join(" "));  fs.appendFileSync("/events/events.log",JSON.stringify({who: "server", what: values.join(" "), when: Date.now()})+"\n", {encoding: "utf-8"});};
const delay = (s=1) => new Promise(res => setTimeout(res, s*1000));

const server = http.createServer(async (req, res) => {
    await delay();
    log(`getting request for resource ${req.url}`);
    // just serve some specified files, if the client requests something else, return 404 NOT FOUND
    if(req.url === "/test.html"){
        await delay();
        log("serving test.html file");
        res.writeHead(200, "OK", {"content-type": "text/html"});
        res.end(`<!doctype html><html lang="en"><head><title>test</title></head><body>${new Date().toISOString()}</body></html>`);
    }else if(req.url === "/example.txt"){
        await delay();
        log("serving example.txt file");
        res.writeHead(200, "OK",{"content-type": "text/plain"});
        res.end("This text file has been created at "+new Date().toISOString());
    }else{
        log(`no such resource ${req.url}`);
        res.writeHead(404, "NOT FOUND");
        res.end();
    }
});

server.listen(80);