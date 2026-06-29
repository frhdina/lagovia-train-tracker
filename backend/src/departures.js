const { getStations, getLiveboard } = require("./irail");

const WINDOW_MINUTES = 15;

async function searchDepartures(query) {
  const nowUnix = Math.floor(Date.now() / 1000);
  const windowEnd = nowUnix + WINDOW_MINUTES * 60;

  // 1. Get all stations and filter by query
  const allStations = await getStations();
  const matched = allStations.filter(s =>
    s.name.toLowerCase().includes(query.toLowerCase())
  );

  if (matched.length === 0) {
    return {
      query,
      timestamp: new Date().toISOString(),
      window_minutes: WINDOW_MINUTES,
      stations: [],
      total_departures: 0,
    };
  }

  // 2. Fetch all liveboards in parallel
  const results = await Promise.all(
    matched.map(station => fetchStationDepartures(station, nowUnix, windowEnd))
  );

  // 3. Remove nulls and empty stations
  const stations = results.filter(s => s && s.departures.length > 0);

  return {
    query,
    timestamp: new Date().toISOString(),
    window_minutes: WINDOW_MINUTES,
    stations,
    total_departures: stations.reduce((sum, s) => sum + s.departures.length, 0),
  };
}

async function fetchStationDepartures(station, nowUnix, windowEnd) {
  try {
    const liveboard = await getLiveboard(station.id);
    if (!liveboard) return null;

    const departures = (liveboard.departures?.departure || [])
      .filter(dep => {
        const t = parseInt(dep.time, 10);
        return t >= nowUnix - 60 && t <= windowEnd;
      })
      .map(dep => ({
        train_id: dep.vehicle.split(".").pop(),
        destination: dep.station,
        scheduled_time: new Date(parseInt(dep.time, 10) * 1000).toISOString(),
        delay_minutes: Math.round(parseInt(dep.delay || "0", 10) / 60),
        cancelled: dep.canceled === "1",
        platform: dep.platform || null,
      }));

    return departures.length > 0
      ? { station_id: station.id, station_name: station.name, departures }
      : null;

  } catch (err) {
    console.warn(`Skipping ${station.name}: ${err.message}`);
    return null;
  }
}

module.exports = { searchDepartures };