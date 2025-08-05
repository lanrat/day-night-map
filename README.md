
# Day/Night World Map

A real-time visualization of day and night regions across the world using accurate solar and lunar positioning calculations.

## Features

- Real-time day/night terminator line based on current UTC time
- Smooth twilight gradients showing dawn and dusk zones
- Solar position indicator showing where the sun is directly overhead
- Lunar position indicator showing where the moon is directly overhead
- Accurate moon phase visualization showing current illumination
- Moon phase name and illumination percentage display
- Responsive design with normal and minimal viewing modes
- Grayscale mode optimized for 3-bit displays and e-ink screens
- Accurate Mercator projection using SVG world map

## Usage

- **Normal mode**: Open [lanrat.github.io/day-night-map/](https://lanrat.github.io/day-night-map/) in a web browser
- **Minimal mode**: Open [lanrat.github.io/day-night-map/?minimal](https://lanrat.github.io/day-night-map/?minimal) for a full-screen view with info bar at bottom
- **Grayscale mode**: Add `&grayscale` to any URL for optimized display on grayscale/e-ink displays (e.g., `?minimal&grayscale`)
- **Static timestamp mode**: Add `&timestamp=<unix_timestamp>` to display the map at a specific time instead of current time

### URL Parameters

All parameters can be combined and used with either query string (`?`) or hash (`#`) format:

- `minimal` - Full-screen minimal view
- `grayscale` - Optimized for grayscale/e-ink displays  
- `timestamp=<value>` - Display map at specific time (Unix timestamp in seconds or milliseconds)
- `timezone=<value>` - Display date/time in specified timezone (IANA timezone name, defaults to user's local timezone)

**Examples:**
- `?minimal&grayscale` - Minimal grayscale mode
- `?timestamp=1672531200` - New Year 2023 at midnight UTC
- `?timezone=America/New_York` - Display time in Eastern timezone
- `?timezone=Asia/Tokyo&minimal` - Tokyo time in minimal mode
- `#minimal&timestamp=1672531200000` - Minimal mode at specific time (milliseconds)
- `?minimal&grayscale&timestamp=1640995200&timezone=Europe/London` - All parameters combined

## Technical Details

The application calculates solar and lunar positions using simplified astronomical formulas and renders day/night regions using HTML5 Canvas with smooth alpha blending for twilight zones. Both the sun and moon positions show where each celestial body is directly overhead on Earth's surface.

The moon display includes accurate phase visualization based on its elongation from the sun, showing the correct illuminated fraction with proper waxing/waning orientation. The phase name (New Moon, First Quarter, Full Moon, etc.) and illumination percentage are displayed in the info panel.

Grayscale mode provides optimized rendering for limited-color displays by using high contrast black and white elements, simplified twilight zones, and distinctive sun/moon icons with clear visual patterns.

The map updates every minute to reflect current conditions. When using the `timestamp` parameter, the map displays a static snapshot of that specific moment and does not auto-refresh.

Inspired by [Time and Date Day and Night World Map](https://www.timeanddate.com/worldclock/sunearth.html)
