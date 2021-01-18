const http = require("http");

/**
* make a simple http request,
* get the response with common fields like 'body' or 'ok' (shorthand to check the status code to be 200 or more but less than 300)
* @function httpGet
* @param {...String|Object} urlAndSettings the url to request (must be http and not https)
* @returns {Promise<Response>} resolves with the returned response object
* */
function httpGet(...urlAndSettings){
    return new Promise((resolve, reject) => {
        http.get(...urlAndSettings, response => {
            // buffer the data we receive
            let data = "";
            response.on("data", d => data += d);
            response.on("error", () => reject(response));
            response.on("end", async () => {
                response.body = data; // assign received data as response body
                response.ok = response.statusCode >= 200 && response.statusCode < 300;
                response.sendAs = res => {
                    res.writeHead(response.statusCode, response.headers);
                    res.end(response.body);
                };
                resolve(response);
            });
        });
    });
}

module.exports = httpGet;