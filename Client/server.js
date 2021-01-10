const http = require("http");
const log = require("../utils/log.js")("client");
const httpGet = require("../utils/httpGet.js");

const IS_CLIENT_CACHE_ENABLED = +process.env.IS_CLIENT_CACHE_ENABLED;
const RESOURCE = process.env.RESOURCE || "test.html";

let cache = {};

let server = http.createServer(async (req, res) => {
    if(IS_CLIENT_CACHE_ENABLED && cache[RESOURCE] && (new Date(cache[RESOURCE].expires) > Date.now())){
        await log(`${RESOURCE} is already in client cache: ${cache[RESOURCE].data} (expires on ${cache[RESOURCE].expires})`);
    }else{
        await log(`start request for ${RESOURCE}`);
        // request the test.html resource
        let response = await httpGet(`http://${process.env.SERVER}/${RESOURCE}`);
        if(response.ok){
            await log("received "+response.body);
            if(IS_CLIENT_CACHE_ENABLED){
                cache[RESOURCE] = {
                    data: response.body,
                    contentType: response.headers["content-type"],
                    expires: response.headers["expires"],
                };
            }
        }else{
            await log("request failed");
        }
    }

    res.writeHead(200, "DONE");
    res.end();
});

server.listen(80);