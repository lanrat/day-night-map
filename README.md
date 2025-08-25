
# Day/Night World Map

A real-time visualization of day and night regions across the world using accurate solar and lunar positioning calculations.

![Day Night Map Screenshot](map.png)

## Features

- Real-time day/night terminator line based on current UTC time
- Smooth twilight gradients showing dawn and dusk zones with professional SunCalc integration
- Solar position indicator showing where the sun is directly overhead
- Lunar position indicator showing where the moon is directly overhead with variable size based on distance
- Accurate moon phase visualization showing current illumination using SunCalc calculations
- Moon phase name and illumination percentage display
- Responsive design with normal and minimal viewing modes
- 3-column information panel showing date, sunrise/sunset times, and moon phase
- Enhanced astronomical data including solar noon, golden hour times, and moon rise/set times
- Location detection via URL parameters or HTML5 Geolocation API
- Optional location marker showing the calculation point on the map
- Grayscale mode optimized for e-ink displays with smooth gradient transitions
- Dual projection support: Equirectangular (default) and Mercator projections
- Accurate coordinate mapping with selectable projection types to match different world map formats

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
- `lat=<value>` - User latitude for location-based astronomical calculations (-90 to 90)
- `lon=<value>` - User longitude for location-based astronomical calculations (-180 to 180)
- `showloc` - Display a location marker dot at the specified lat/lon coordinates on the map
- `nosun` - Hide the sun position marker from both the map and legend
- `nomoon` - Hide the moon position marker from both the map and legend
- `projection=<value>` - Map projection type: `equirectangular` (default, matches most world map SVGs) or `mercator` (Web Mercator projection)
- `hour24` - Display all times in 24-hour format instead of 12-hour AM/PM format

**Examples:**

- `?minimal&grayscale` - Minimal grayscale mode
- `?timestamp=1672531200` - New Year 2023 at midnight UTC
- `?timezone=America/New_York` - Display time in Eastern timezone
- `?timezone=Asia/Tokyo&minimal` - Tokyo time in minimal mode
- `#minimal&timestamp=1672531200000` - Minimal mode at specific time (milliseconds)
- `?minimal&grayscale&timestamp=1640995200&timezone=Europe/London` - All parameters combined
- `?hour24` - Display all times in 24-hour format
- `?hour24&timezone=Europe/Berlin` - 24-hour format with Berlin timezone
- `?lat=40.7128&lon=-74.0060` - New York City location for sunrise/sunset calculations
- `?lat=51.5074&lon=-0.1278&timezone=Europe/London` - London coordinates with local timezone
- `?lat=35.6762&lon=139.6503&hour24&timezone=Asia/Tokyo` - Tokyo location with 24-hour format
- `?lat=37.7749&lon=-122.4194&showloc` - San Francisco with location marker dot
- `?lat=35.6762&lon=139.6503&showloc&grayscale` - Tokyo with location marker in grayscale mode
- `?nosun` - Day/night map without sun marker (minimal display)
- `?nomoon` - Day/night map without moon marker
- `?nosun&nomoon` - Clean day/night map with no celestial body markers
- `?minimal&grayscale&nosun&nomoon` - Ultra-minimal grayscale display with only day/night regions
- `?projection=mercator` - Use Mercator projection instead of equirectangular
- `?lat=40.7589&lon=-73.9851&showloc&projection=mercator&minimal` - Times Square with Mercator projection in minimal mode

## Technical Details

The application uses the professional-grade [SunCalc library](https://github.com/mourner/suncalc) for accurate astronomical calculations combined with custom algorithms for celestial positioning. Solar and lunar positions are calculated using hybrid approaches that leverage SunCalc for complex calculations while maintaining efficient custom code for subsolar/sublunar point positioning.

### SunCalc Integration Features

- **Solar calculations**: Sunrise/sunset times, solar noon, golden hour periods, and solar elevation angles
- **Lunar calculations**: Moon phase, illumination fraction, moonrise/moonset times, and lunar distance for variable sizing
- **Location support**: Automatic geolocation detection or manual coordinates via URL parameters
- **Timezone awareness**: Display times in any IANA timezone with fallback to user's local timezone

### Rendering System

The day/night visualization uses HTML5 Canvas with optimized pixel-level rendering:

- **Twilight gradients**: Smooth transitions through astronomical, nautical, and civil twilight zones
- **Grayscale optimization**: E-ink friendly rendering with smooth gradients (not just 3-shade discrete zones)
- **Variable moon sizing**: Moon size changes based on actual Earth-Moon distance (perigee vs apogee)
- **Edge wrapping**: Celestial bodies wrap around map edges for continuous world view
- **Location markers**: Optional red location dot (black in grayscale) with white border to mark calculation coordinates
- **Dynamic legend**: Location marker automatically appears in legend when `showloc` parameter is used

### Map Projections

The application supports two coordinate projection systems:

- **Equirectangular** (default): Simple linear lat/lon mapping that matches most world map SVG files and images
- **Mercator**: Web Mercator projection commonly used in web mapping applications
- **Automatic detection**: Defaults to equirectangular to match the included world map SVG, but can be switched via URL parameter

### Information Panel

The 3-column solar information panel displays:

- **Date column**: Current date with day length calculation
- **Sun column**: Sunrise/sunset times with up/down arrows, plus solar noon and golden hour times
- **Moon column**: Current phase symbol and name with illumination percentage, plus moonrise/moonset times

Location-dependent calculations require either URL parameters (`lat=` and `lon=`) or browser geolocation permission. Without location data, sunrise/sunset and moon rise/set times display as "Unknown".

The map updates every minute to reflect current conditions. When using the `timestamp` parameter, the map displays a static snapshot of that specific moment and does not auto-refresh.

Inspired by [Time and Date Day and Night World Map](https://www.timeanddate.com/worldclock/sunearth.html)

## Developing

Test with

```shell
python3 -m http.server
```

Then visit [http://localhost:8000/](http://localhost:8000/)
