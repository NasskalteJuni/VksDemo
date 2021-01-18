const http = require("http");
const fs = require("fs");
const port = process.env.PORT || 80;
const uuid = () => Math.random().toString(32).substring(2,7);
const logfile = "/events/events.log";


// you are probably not interested in this file
// it has nothing to do with caching and only serves to display what happens
const server = http.createServer((req, res) => {
    if(req.url === "/events"){
        res.writeHead(200, "OK", {"content-type": "text/event-stream", "connection": "keep-alive"});
        let last = Date.now();
        setInterval(() => {
            let events = fs.existsSync(logfile) ?  fs.readFileSync(logfile,{encoding: "utf-8"}) : "";
            if(events){
                events = events.split("\n");
                const newEvents = events.filter(e => e.trim().length > 0).map(e => JSON.parse(e)).filter(e => e.when >= last);
                if(newEvents.length){
                    newEvents.forEach(e => res.write(`id: ${uuid()}\nevent: log\ndata: ${JSON.stringify(e)}\n\n`));
                }else if(newEvents.length === events.length || events.length === 0){
                    res.write(`id: ${uuid()}\nevent: clear\ndata: ${JSON.stringify({who: "visualizer", what: "clear"})}\n\n`);
                }else{
                    res.write(`id: ${uuid()}\nevent: keepalive\ndata ${JSON.stringify({who: "visualizer", what: "keep-alive"})}\n\n`)
                }
                last = Date.now();
            }
        }, 1000);
    }else if(req.url === "/" || req.url === "/index.html"){
        res.writeHead(200, "OK", {"content-type": "text/html"}).end(fs.readFileSync("/app/index.html", {encoding: "utf8"}));
    }else if(req.url === "/tell_client_to_send_request"){
        // basically: clear log file by removing it
        if(fs.existsSync(logfile)) fs.unlinkSync("/events/events.log");
        // tell client server to start the request
        http.get(`http://${process.env.CLIENT}/start_request`, response => {
            if(response.statusCode >= 200 && response.statusCode < 300){
                res.writeHead(204, "OK").end();
            }else{
                res.writeHead(500, "INTERNAL SERVER ERROR").end();
            }
        });
    }else if(req.url === "/main.css"){
        res.writeHead(200, "OK", {"content-type": "text/css"}).end(fs.readFileSync("/app/main.css",{encoding: "utf8"}))
    }else{
        res.writeHead(404,"NOT FOUND").end();
    }
});

server.listen(port);