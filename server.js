require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const app = express();
app.use(cors());
app.use(express.json());
app.use("/users", require("./routes/users"));
app.use("/livestock", require("./routes/livestock"));
app.use("/market", require("./routes/market"));
app.use("/finance", require("./routes/finance"));
app.use("/weather", require("./routes/weather"));
app.use("/ai", require("./routes/ai"));
app.use("/alerts", require("./routes/alerts"));
app.use("/transport", require("./routes/transport"));
app.use("/map", require("./routes/map"));
app.use("/prices", require("./routes/prices"));
app.use("/news", require("./routes/news"));
app.use("/banks", require("./routes/banks"));
app.use("/stats", require("./routes/stats"));
app.use("/knowledge", require("./routes/knowledge"));
app.use("/diseases", require("./routes/diseases"));
app.use("/funfacts", require("./routes/funfacts"));
app.use("/shinjikh", require("./routes/shinjikh"));
app.use("/ads", require("./routes/ads"));
app.get("/dashboard", (req, res) => { res.sendFile(path.join(__dirname, "dashboard.html")); });
app.get("/", (req, res) => { res.json({ message: "Malchin Super App", version: "3.0" }); });
app.listen(5000, "0.0.0.0", () => {
  console.log("Malchin backend v3.0 running on port 5000");
  // Scraper: шинэчлэлтийг эхлүүлэх
  const scraper = require("./services/scraper");
  scraper.runAll();
  // 30 минут тутамд автомат шинэчлэх
  setInterval(() => scraper.runAll(), 30 * 60 * 1000);
});
