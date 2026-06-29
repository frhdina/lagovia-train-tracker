jest.mock("node-fetch");
const fetch = require("node-fetch");
const { getStations, getLiveboard } = require("../src/irail");

describe("getStations", () => {
  test("returns list of stations on success", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        station: [
          { id: "1", name: "Brussels-Central" },
          { id: "2", name: "Gent-Sint-Pieters" },
        ],
      }),
    });

    const stations = await getStations();

    expect(stations).toHaveLength(2);
    expect(stations[0].name).toBe("Brussels-Central");
  });

  test("returns empty array if station key is missing", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    const stations = await getStations();
    expect(stations).toEqual([]);
  });

  test("throws if fetch fails", async () => {
    fetch.mockRejectedValue(new Error("Network error"));

    await expect(getStations()).rejects.toThrow("Network error");
  });
});

describe("getLiveboard", () => {
  test("returns liveboard data on success", async () => {
    fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        departures: { departure: [{ vehicle: "BE.NMBS.IC1234" }] },
      }),
    });

    const data = await getLiveboard("BE.NMBS.008813003");

    expect(data.departures.departure).toHaveLength(1);
  });

  test("returns null if station not found (404)", async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({}),
    });

    const data = await getLiveboard("BE.NMBS.INVALID");
    expect(data).toBeNull();
  });

  test("throws if iRail returns server error", async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    });

    await expect(getLiveboard("BE.NMBS.008813003")).rejects.toThrow();
  });
});