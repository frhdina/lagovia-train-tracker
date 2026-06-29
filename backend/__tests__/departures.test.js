// Mock the irail module so we don't make real HTTP calls in tests
jest.mock("../src/irail", () => ({
  getStations: jest.fn(),
  getLiveboard: jest.fn(),
}));

const { getStations, getLiveboard } = require("../src/irail");
const { searchDepartures } = require("../src/departures");

// Helper: creates a fake departure unix timestamp X minutes from now
const minsFromNow = (mins) => Math.floor(Date.now() / 1000) + mins * 60;

describe("searchDepartures", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns empty stations if no station matches query", async () => {
    getStations.mockResolvedValue([
      { id: "1", name: "Gent-Sint-Pieters" },
      { id: "2", name: "Antwerpen-Centraal" },
    ]);

    const result = await searchDepartures("xyz");

    expect(result.stations).toHaveLength(0);
    expect(result.total_departures).toBe(0);
  });

  test("returns matching stations with departures in the 15 min window", async () => {
    getStations.mockResolvedValue([
      { id: "1", name: "Brussels-Central" },
    ]);

    getLiveboard.mockResolvedValue({
      departures: {
        departure: [
          {
            time: String(minsFromNow(5)),   // 5 mins from now — inside window
            vehicle: "BE.NMBS.IC1234",
            station: "Antwerpen-Centraal",
            delay: "0",
            canceled: "0",
            platform: "3",
          },
        ],
      },
    });

    const result = await searchDepartures("Brussels");

    expect(result.stations).toHaveLength(1);
    expect(result.stations[0].station_name).toBe("Brussels-Central");
    expect(result.stations[0].departures[0].train_id).toBe("IC1234");
    expect(result.stations[0].departures[0].delay_minutes).toBe(0);
    expect(result.stations[0].departures[0].cancelled).toBe(false);
    expect(result.total_departures).toBe(1);
  });

  test("excludes departures outside the 15 min window", async () => {
    getStations.mockResolvedValue([
      { id: "1", name: "Brussels-Central" },
    ]);

    getLiveboard.mockResolvedValue({
      departures: {
        departure: [
          {
            time: String(minsFromNow(20)), // 20 mins — outside window
            vehicle: "BE.NMBS.IC9999",
            station: "Liège",
            delay: "0",
            canceled: "0",
            platform: "1",
          },
        ],
      },
    });

    const result = await searchDepartures("Brussels");

    expect(result.stations).toHaveLength(0);
    expect(result.total_departures).toBe(0);
  });

  test("correctly parses delay in minutes", async () => {
    getStations.mockResolvedValue([
      { id: "1", name: "Gent-Sint-Pieters" },
    ]);

    getLiveboard.mockResolvedValue({
      departures: {
        departure: [
          {
            time: String(minsFromNow(5)),
            vehicle: "BE.NMBS.IC5678",
            station: "Kortrijk",
            delay: "360",  // 360 seconds = 6 minutes
            canceled: "0",
            platform: "2",
          },
        ],
      },
    });

    const result = await searchDepartures("Gent");

    expect(result.stations[0].departures[0].delay_minutes).toBe(6);
  });

  test("marks cancelled departures correctly", async () => {
    getStations.mockResolvedValue([
      { id: "1", name: "Gent-Sint-Pieters" },
    ]);

    getLiveboard.mockResolvedValue({
      departures: {
        departure: [
          {
            time: String(minsFromNow(5)),
            vehicle: "BE.NMBS.IC0000",
            station: "Kortrijk",
            delay: "0",
            canceled: "1",
            platform: "2",
          },
        ],
      },
    });

    const result = await searchDepartures("Gent");

    expect(result.stations[0].departures[0].cancelled).toBe(true);
  });

  test("skips station if liveboard returns null", async () => {
    getStations.mockResolvedValue([
      { id: "1", name: "Brussels-Central" },
      { id: "2", name: "Brussels-North" },
    ]);

    getLiveboard
      .mockResolvedValueOnce(null)  // first station returns null
      .mockResolvedValueOnce({
        departures: {
          departure: [
            {
              time: String(minsFromNow(5)),
              vehicle: "BE.NMBS.IC1111",
              station: "Leuven",
              delay: "0",
              canceled: "0",
              platform: "1",
            },
          ],
        },
      });

    const result = await searchDepartures("Brussels");

    expect(result.stations).toHaveLength(1);
    expect(result.stations[0].station_name).toBe("Brussels-North");
  });

});