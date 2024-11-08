const express = require("express");
let server = express();

server.set("view engine", "ejs");

server.use(express.static("public"));

server.get("/portfolio", (req, res) => {
  res.render("portfolio");
});
server.get("/", (req, res) => {
  res.send(res.render("bootStrapHomePage"));
});

server.listen(4500, () => {
  console.log(`Server Started at localhost:4500`);
});