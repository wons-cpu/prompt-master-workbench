const http = require("http");
const https = require("https");

http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-api-key, anthropic-version, anthropic-dangerous-direct-browser-access");

  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }

  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    const proxyReq = https.request({
      hostname: "api.anthropic.com",
      path: "/v1/messages",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": req.headers["x-api-key"],
        "anthropic-version": "2023-06-01",
      },
    }, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });
    proxyReq.write(body);
    proxyReq.end();
  });
}).listen(3001, () => console.log("Proxy running on http://localhost:3001"));
