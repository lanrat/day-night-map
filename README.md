
# Day/Night World Map

A real-time visualization of day and night regions across the world using accurate solar positioning calculations.

## Features

- Real-time day/night terminator line based on current UTC time
- Smooth twilight gradients showing dawn and dusk zones
- Solar position indicator showing where the sun is directly overhead
- Responsive design with normal and minimal viewing modes
- Accurate Mercator projection using SVG world map

## Usage

- **Normal mode**: Open [lanrat.github.io/day-night-map/](https://lanrat.github.io/day-night-map/) in a web browser
- **Minimal mode**: Open  [lanrat.github.io/day-night-map/?minimal](https://lanrat.github.io/day-night-map/?minimal) for a full-screen view without UI elements

## Technical Details

The application calculates solar position using simplified astronomical formulas and renders day/night regions using HTML5 Canvas with smooth alpha blending for twilight zones. The map updates every minute to reflect current conditions.
