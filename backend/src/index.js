const express = require("express");
const cors = require("cors");
const { searchDepartures } = require("./departures");

const app = express();
app.use(cors());

app.get("/departures", async (req, res) => {
  const q = (req.query.q || "").trim();

  if (q.length < 3) {
    return res.status(400).json({
      error: "Query must be at least 3 characters.",
      code: "QUERY_TOO_SHORT",
    });
  }

  try {
    const result = await searchDepartures(q);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(502).json({
      error: "Could not reach rail data provider.",
      code: "UPSTREAM_ERROR",
    });
  }
});

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.listen(3001, () => {
  console.log("Backend running on http://localhost:3001");
});