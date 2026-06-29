const fetch = require("node-fetch");

const IRAIL_BASE = "https://api.irail.be";

async function getStations() {
  const res = await fetch(`${IRAIL_BASE}/stations/?format=json&lang=en`);
  const data = await res.json();
  return data.station || [];
}

async function getLiveboard(stationId) {
  const url = `${IRAIL_BASE}/liveboard/?id=${stationId}&format=json&lang=en&arrdep=dep`;
  const res = await fetch(url);
  if (res.status === 404) return null;
  return await res.json();
}

module.exports = { getStations, getLiveboard };