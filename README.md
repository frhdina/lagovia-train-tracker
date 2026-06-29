# Lagovia Train Tracker

A real-time train departure tracker . Users can search for any Belgian station by name and see all upcoming departures within the next 15 minutes — including train number, destination, scheduled time, delay, and cancellation status.

The app uses the [iRail API](https://docs.irail.be/) as its data source, which provides free and open access to Belgian rail data.

---

## What This Project Does

- Search for stations by typing part of the name (e.g. "Bru" or "Gent")
- Returns all departures in the next 15 minutes from every matching station
- Shows train number, destination, scheduled time, delay in minutes, platform, and cancelled status
- Queries shorter than 3 characters return a clear error message
- Frontend auto-updates every 30 seconds so the board stays live

---

## Tech Stack

- **Backend:** Node.js + Express 
- **Frontend:** React
- **Data source:** iRail API (Belgian rail, no authentication required)
- **Testing:** Jest + Supertest (backend), React Testing Library (frontend)

---

## How to Run the Backend

```bash
cd backend
npm install
node src/index.js
```

The API will be running at `http://localhost:3001`

Test it in your browser:
`http://localhost:3001/health`

`http://localhost:3001/departures?q=Bru`

---

## How to Run the Frontend

Open a **new terminal** (keep the backend running):

```bash
cd frontend
npm install
npm start
```

The app will open at `http://localhost:3000`

> ⚠️ Make sure the backend is running first, otherwise the frontend will show "Cannot connect to server."

---

## How to Run Tests

**Backend tests:**
```bash
cd backend
npm test
```

**Frontend tests:**
```bash
cd frontend
npm test -- --watchAll=false
```

---

## API Reference

### `GET /departures?q=<query>`

Returns upcoming departures within the next 15 minutes from all stations matching the query.

| Param | Required | Description |
|-------|----------|-------------|
| `q` | Yes | Station name (min 3 characters) |

**Example response:**
```json
{
  "query": "Bru",
  "timestamp": "2025-11-12T10:32:00.000Z",
  "window_minutes": 15,
  "stations": [
    {
      "station_id": "BE.NMBS.008813003",
      "station_name": "Brussels-Central",
      "departures": [
        {
          "train_id": "IC1234",
          "destination": "Gent-Sint-Pieters",
          "scheduled_time": "2025-11-12T10:40:00.000Z",
          "delay_minutes": 5,
          "cancelled": false,
          "platform": "3"
        }
      ]
    }
  ],
  "total_departures": 1
}
```

**Error response:**
```json
{
  "error": "Query must be at least 3 characters.",
  "code": "QUERY_TOO_SHORT"
}
```