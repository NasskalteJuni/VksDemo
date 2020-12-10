const http = require("http");
const fs = require("fs");
const log = (...values) => {console.log(values.join(" ")); fs.appendFileSync("/events/events.log",JSON.stringify({who: "client", what: values.join(" "), when: Date.now()})+"\n", {encoding: "utf-8"});};
const delay = (s=1) => new Promise(res => setTimeout(res, s*1000));

const server = http.createServer(async (req, res) => {
    if(req.url === "/start_request"){
        log("start request for test.html");
        await delay();
        // request the test.html resource
        http.get(`http://${process.env.SERVER}/test.html`,response => {
            if(response.statusCode >= 200 && response.statusCode < 300){
                log("incoming response");
                // just log the received content...
                let data = "";
                response.on("data", d => data+=d);
                response.on("end", () => log("received "+data));
            }else{
                log("request failed ("+response.statusCode+" - "+response.statusText+")")
            }
            res.writeHead(200);
            res.end();
        });
    }else{
        res.writeHead(404, "NOT FOUND");
        res.end();
    }
});

server.listen(80);