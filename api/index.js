const fs = require("fs");
const path = require("path");

module.exports = function handler(req, res) {
  const html = fs.readFileSync(
    path.join(process.cwd(), "public", "index.html"),
    "utf8"
  );
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(html);
};
