const request = require("supertest");
const express = require("express");
const cors = require("cors");

// Mock the departures module
jest.mock("../src/departures", () => ({
  searchDepartures: jest.fn(),
}));

const { searchDepartures } = require("../src/departures");

// Rebuild the app without app.listen) 
function buildApp() {
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
      res.status(502).json({
        error: "Could not reach rail data provider.",
        code: "UPSTREAM_ERROR",
      });
    }
  });

  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  return app;
}

const app = buildApp();

describe("GET /health", () => {
  test("returns status ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});

describe("GET /departures", () => {
  beforeEach(() => jest.clearAllMocks());

  test("returns 400 if query is less than 3 characters", async () => {
    const res = await request(app).get("/departures?q=Br");
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("QUERY_TOO_SHORT");
  });

  test("returns 400 if query is empty", async () => {
    const res = await request(app).get("/departures?q=");
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("QUERY_TOO_SHORT");
  });

  test("returns departure data on valid query", async () => {
    searchDepartures.mockResolvedValue({
      query: "Bru",
      timestamp: new Date().toISOString(),
      window_minutes: 15,
      stations: [
        {
          station_id: "1",
          station_name: "Brussels-Central",
          departures: [
            {
              train_id: "IC1234",
              destination: "Gent",
              scheduled_time: new Date().toISOString(),
              delay_minutes: 0,
              cancelled: false,
              platform: "3",
            },
          ],
        },
      ],
      total_departures: 1,
    });

    const res = await request(app).get("/departures?q=Bru");
    expect(res.status).toBe(200);
    expect(res.body.stations).toHaveLength(1);
    expect(res.body.total_departures).toBe(1);
  });

  test("returns 502 if searchDepartures throws", async () => {
    searchDepartures.mockRejectedValue(new Error("iRail down"));

    const res = await request(app).get("/departures?q=Bru");
    expect(res.status).toBe(502);
    expect(res.body.code).toBe("UPSTREAM_ERROR");
  });

  test("returns empty stations if no matches found", async () => {
    searchDepartures.mockResolvedValue({
      query: "xyz",
      timestamp: new Date().toISOString(),
      window_minutes: 15,
      stations: [],
      total_departures: 0,
    });

    const res = await request(app).get("/departures?q=xyz");
    expect(res.status).toBe(200);
    expect(res.body.stations).toHaveLength(0);
  });
});