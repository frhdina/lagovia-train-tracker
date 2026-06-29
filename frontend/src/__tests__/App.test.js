import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import App from "../App";

// Mock fetch globally
beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("App", () => {

  test("renders the title", () => {
    render(<App />);
    expect(screen.getByText(/Lagovia Train Tracker/i)).toBeInTheDocument();
  });

  test("renders the search input", () => {
    render(<App />);
    expect(screen.getByPlaceholderText(/Search station/i)).toBeInTheDocument();
  });

  test("shows error if query is less than 3 characters", async () => {
    render(<App />);
    const input = screen.getByPlaceholderText(/Search station/i);

    fireEvent.change(input, { target: { value: "Br" } });

    await waitFor(() => {
      expect(screen.getByText(/at least 3 characters/i)).toBeInTheDocument();
    });
  });

  test("shows loading then results on successful search", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
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
      }),
    });

    render(<App />);
    const input = screen.getByPlaceholderText(/Search station/i);
    fireEvent.change(input, { target: { value: "Bru" } });

    await waitFor(() => {
      expect(screen.getByText("Brussels-Central")).toBeInTheDocument();
      expect(screen.getByText("IC1234")).toBeInTheDocument();
      expect(screen.getByText("Gent")).toBeInTheDocument();
    });
  });

  test("shows error message if fetch fails", async () => {
    global.fetch.mockRejectedValue(new Error("Network error"));

    render(<App />);
    const input = screen.getByPlaceholderText(/Search station/i);
    fireEvent.change(input, { target: { value: "Bru" } });

    await waitFor(() => {
      expect(screen.getByText(/Cannot connect to server/i)).toBeInTheDocument();
    });
  });

  test("shows no departures message when stations list is empty", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        query: "xyz",
        timestamp: new Date().toISOString(),
        window_minutes: 15,
        stations: [],
        total_departures: 0,
      }),
    });

    render(<App />);
    const input = screen.getByPlaceholderText(/Search station/i);
    fireEvent.change(input, { target: { value: "xyz" } });

    await waitFor(() => {
      expect(screen.getByText(/No departures/i)).toBeInTheDocument();
    });
  });

  test("shows cancelled label for cancelled trains", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        query: "Bru",
        timestamp: new Date().toISOString(),
        window_minutes: 15,
        stations: [
          {
            station_id: "1",
            station_name: "Brussels-Central",
            departures: [
              {
                train_id: "IC9999",
                destination: "Kortrijk",
                scheduled_time: new Date().toISOString(),
                delay_minutes: 0,
                cancelled: true,
                platform: "?",
              },
            ],
          },
        ],
        total_departures: 1,
      }),
    });

    render(<App />);
    const input = screen.getByPlaceholderText(/Search station/i);
    fireEvent.change(input, { target: { value: "Bru" } });

    await waitFor(() => {
      expect(screen.getByText(/Cancelled/i)).toBeInTheDocument();
    });
  });

});