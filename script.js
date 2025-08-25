// Check for minimal, grayscale, and timestamp mode URL parameters
const urlParams = new URLSearchParams(window.location.search);
const hashParams = new URLSearchParams(window.location.hash.substring(1));
const isMinimal = urlParams.has('minimal') || hashParams.has('minimal') || 
                 window.location.search.includes('minimal') || 
                 window.location.hash.includes('minimal');
const isGrayscale = urlParams.has('grayscale') || hashParams.has('grayscale') || 
                   window.location.search.includes('grayscale') || 
                   window.location.hash.includes('grayscale');
const hideSun = urlParams.has('nosun') || hashParams.has('nosun') || 
               window.location.search.includes('nosun') || 
               window.location.hash.includes('nosun');
const hideMoon = urlParams.has('nomoon') || hashParams.has('nomoon') || 
                window.location.search.includes('nomoon') || 
                window.location.hash.includes('nomoon');
const use24Hour = urlParams.has('hour24') || hashParams.has('hour24') || 
                 window.location.search.includes('hour24') || 
                 window.location.hash.includes('hour24');

// Check for timestamp parameter (accepts Unix timestamp in seconds or milliseconds)
let customTimestamp = null;
if (urlParams.has('timestamp')) {
    const timestampValue = urlParams.get('timestamp');
    const timestamp = parseInt(timestampValue, 10);
    if (!isNaN(timestamp)) {
        // If timestamp looks like seconds (less than year 2100), convert to milliseconds
        customTimestamp = timestamp < 4102444800 ? timestamp * 1000 : timestamp;
    }
} else if (hashParams.has('timestamp')) {
    const timestampValue = hashParams.get('timestamp');
    const timestamp = parseInt(timestampValue, 10);
    if (!isNaN(timestamp)) {
        // If timestamp looks like seconds (less than year 2100), convert to milliseconds
        customTimestamp = timestamp < 4102444800 ? timestamp * 1000 : timestamp;
    }
}

// Check for timezone parameter (accepts IANA timezone names)
let displayTimezone = null;
if (urlParams.has('timezone')) {
    displayTimezone = urlParams.get('timezone');
} else if (hashParams.has('timezone')) {
    displayTimezone = hashParams.get('timezone');
}
// If no timezone specified, use user's local timezone
if (!displayTimezone) {
    displayTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    console.log(`No timezone specified, using browser default: ${displayTimezone}`);
} else {
    console.log(`Using specified timezone: ${displayTimezone}`);
}

// Check for show location dot parameter
const showLocationDot = urlParams.has('showloc') || hashParams.has('showloc') || 
                       window.location.search.includes('showloc') || 
                       window.location.hash.includes('showloc');

// Check for projection type parameter (default to equirectangular to match SVG)
let projectionType = 'equirectangular';
if (urlParams.has('projection')) {
    const proj = urlParams.get('projection').toLowerCase();
    if (proj === 'mercator' || proj === 'equirectangular') {
        projectionType = proj;
    }
} else if (hashParams.has('projection')) {
    const proj = hashParams.get('projection').toLowerCase();
    if (proj === 'mercator' || proj === 'equirectangular') {
        projectionType = proj;
    }
}

// Check for location parameters (latitude and longitude)
let userLatitude = null;
let userLongitude = null;

if (urlParams.has('lat')) {
    const lat = parseFloat(urlParams.get('lat'));
    if (!isNaN(lat) && lat >= -90 && lat <= 90) {
        userLatitude = lat;
    }
} else if (hashParams.has('lat')) {
    const lat = parseFloat(hashParams.get('lat'));
    if (!isNaN(lat) && lat >= -90 && lat <= 90) {
        userLatitude = lat;
    }
}

if (urlParams.has('lon')) {
    const lon = parseFloat(urlParams.get('lon'));
    if (!isNaN(lon) && lon >= -180 && lon <= 180) {
        userLongitude = lon;
    }
} else if (hashParams.has('lon')) {
    const lon = parseFloat(hashParams.get('lon'));
    if (!isNaN(lon) && lon >= -180 && lon <= 180) {
        userLongitude = lon;
    }
}

// Configuration for celestial body sizes and colors
const CONFIG = {
    sun: {
        grayscale: {
            radius: 12,             // Radius of sun circle in grayscale mode (pixels)
            rayLength: 20,          // Length of sun rays extending from circle (pixels)
            fillColor: 'white',     // Fill color of sun circle in grayscale mode
            strokeColor: 'black',   // Border color of sun circle in grayscale mode
            rayColor: 'black'       // Color of sun rays in grayscale mode
        },
        color: {
            glowRadius: 30,         // Radius of sun glow effect in color mode (pixels)
            coreRadius: 10,         // Radius of sun core circle in color mode (pixels)
            glowColor: {
                start: 'rgba(255, 215, 0, 0.8)',  // Inner color of sun glow gradient
                end: 'rgba(255, 215, 0, 0)'       // Outer color of sun glow gradient (transparent)
            },
            coreColor: '#FFD700'    // Color of sun core circle in color mode
        }
    },
    moon: {
        radius: 8,                 // Radius of moon circle (pixels)
        glowRadius: 25,             // Radius of moon glow effect (pixels)
        glowColor: {
            start: 'rgba(220, 220, 220, 0.8)',  // Inner color of moon glow gradient
            end: 'rgba(220, 220, 220, 0)'       // Outer color of moon glow gradient (transparent)
        },
        color: {
            light: {
                grayscale: 'white', // Color of illuminated moon surface in grayscale mode
                color: '#F0F0F0'    // Color of illuminated moon surface in color mode
            },
            shadow: {
                grayscale: 'black', // Color of moon shadow/dark side in grayscale mode
                color: '#606060'    // Color of moon shadow/dark side in color mode
            }
        },
        strokeColor: 'rgba(0, 0, 0, 0.8)'  // Color of moon outline/border
    },
    night: {
        grayscale: {
            color: [0, 0, 0],       // RGB color array for night overlay in grayscale mode
            opacity: {
                deepNight: 0.70,    // Opacity of night overlay in deep night (grayscale mode)
                twilight: 0.25      // Opacity of night overlay in twilight (grayscale mode)
            }
        },
        color: {
            color: [0, 0, 30],      // RGB color array for night overlay in color mode (dark blue)
            opacity: {
                deepNight: 0.8,             // Opacity of night overlay in deep night (color mode)
                astronomicalTwilight: 0.6,  // Opacity of night overlay in astronomical twilight (color mode)
                nauticalTwilight: 0.2       // Opacity of night overlay in nautical twilight (color mode)
            }
        }
    },
    performance: {
        pixelSize: 2,               // Size of pixels for night overlay rendering (larger = faster, lower quality)
        updateInterval: 60000       // Auto-refresh interval in milliseconds (60000 = 1 minute)
    },
    visual: {
        canvas: {
            defaultWidth: 1000,     // Default canvas width in normal mode (pixels)
            defaultHeight: 500      // Default canvas height in normal mode (pixels)
        },
        lineWidths: {
            sunStroke: 2,           // Line width of sun border in grayscale mode (pixels)
            sunRays: 1,             // Line width of sun rays in grayscale mode (pixels)
            moonStroke: 1,          // Line width of moon outline/border (pixels)
            terminator: 2           // Line width of day/night terminator line (pixels, currently unused)
        },
        sunRayCount: 8,             // Number of sun rays to draw in grayscale mode
        edgeWrapThreshold: 50,      // Distance from canvas edge to wrap celestial bodies (pixels)
        showTerminator: false        // Show the terminator line between day/night
    },
    calculation: {
        moonPhaseStep: 0.1,         // Angular step size for moon phase curve calculation (radians, smaller = smoother)
        terminatorStep: 1           // Longitude step for terminator line calculation (degrees, smaller = smoother)
    },
    solarElevation: {
        deepNight: -12,             // Solar elevation below which is considered deep night (degrees)
        astronomicalTwilight: -6,   // Solar elevation for astronomical twilight boundary (degrees)
        nauticalTwilight: -1,       // Solar elevation for nautical/civil twilight boundary (degrees)
        horizon: 0,                 // Solar elevation for day/night boundary (degrees)
        grayscaleDeepNight: -6,     // Solar elevation for deep night in grayscale mode (degrees)
        grayscaleTwilight: 0        // Solar elevation for twilight in grayscale mode (degrees)
    },
    location: {
        latitude: userLatitude || null,     // User latitude from URL parameters or geolocation
        longitude: userLongitude || null,   // User longitude from URL parameters or geolocation
        isAvailable: false,                 // Whether location data is available
        showDot: showLocationDot,           // Whether to show location dot on map
        dot: {
            radius: 4,                      // Radius of location dot (pixels)
            color: {
                fill: '#FF4444',            // Fill color of location dot in color mode
                stroke: '#FFFFFF',          // Stroke color of location dot in color mode
                grayscale: {
                    fill: 'black',          // Fill color of location dot in grayscale mode
                    stroke: 'white'         // Stroke color of location dot in grayscale mode
                }
            },
            strokeWidth: 2                  // Width of stroke around location dot
        }
    },
    time: {
        use24Hour: use24Hour || false       // Use 24-hour format (defaults to 12-hour format)
    }
};

// Initialize location data
function initializeLocation() {
    // Check if location is already provided via URL parameters
    if (CONFIG.location.latitude !== null && CONFIG.location.longitude !== null) {
        CONFIG.location.isAvailable = true;
        return Promise.resolve();
    }
    
    // Try to get location via Geolocation API
    if ('geolocation' in navigator) {
        return new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    CONFIG.location.latitude = position.coords.latitude;
                    CONFIG.location.longitude = position.coords.longitude;
                    CONFIG.location.isAvailable = true;
                    resolve();
                },
                (error) => {
                    console.warn('Geolocation failed:', error.message);
                    CONFIG.location.isAvailable = false;
                    resolve();
                },
                {
                    enableHighAccuracy: false,
                    timeout: 10000,
                    maximumAge: 300000 // 5 minutes
                }
            );
        });
    } else {
        CONFIG.location.isAvailable = false;
        return Promise.resolve();
    }
}

// Apply modes if requested
if (isMinimal) {
    document.documentElement.classList.add('minimal-mode');
}
if (isGrayscale) {
    document.documentElement.classList.add('grayscale-mode');
}

// Update location legend based on showloc parameter and mode
function updateLocationLegend() {
    const locationLegend = document.getElementById('locationLegend');
    
    if (CONFIG.location.showDot && CONFIG.location.isAvailable) {
        // Show the location legend
        locationLegend.style.display = 'flex';
        
        // Update colors based on current mode
        const legendColor = locationLegend.querySelector('.legend-color');
        const dotConfig = CONFIG.location.dot;
        
        if (isGrayscale) {
            legendColor.style.backgroundColor = dotConfig.color.grayscale.fill;
            legendColor.style.borderColor = dotConfig.color.grayscale.stroke;
        } else {
            legendColor.style.backgroundColor = dotConfig.color.fill;
            legendColor.style.borderColor = dotConfig.color.stroke;
        }
    } else {
        // Hide the location legend
        locationLegend.style.display = 'none';
    }
}

// Update legend visibility based on celestial body parameters
function updateCelestialLegend() {
    const sunLegend = document.getElementById('sunLegend');
    const moonLegend = document.getElementById('moonLegend');
    
    if (sunLegend) {
        sunLegend.style.display = hideSun ? 'none' : 'flex';
    }
    
    if (moonLegend) {
        moonLegend.style.display = hideMoon ? 'none' : 'flex';
    }
}

const canvas = document.getElementById('mapCanvas');
const ctx = canvas.getContext('2d');

// Function to update canvas size
function updateCanvasSize() {
    if (isMinimal) {
        // In minimal mode, size canvas to fill container
        const container = document.querySelector('.map-container');
        const rect = container.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
    } else {
        // Normal mode - fixed size
        canvas.width = CONFIG.visual.canvas.defaultWidth;
        canvas.height = CONFIG.visual.canvas.defaultHeight;
    }
}

// Initial canvas size setup
updateCanvasSize();

// Update canvas size on window resize in minimal mode
if (isMinimal) {
    window.addEventListener('resize', () => {
        updateCanvasSize();
        drawMap(); // Redraw after resize
    });
}

// Convert latitude/longitude to canvas coordinates with projection support
function latLngToPixel(lat, lng) {
    // Longitude is the same for both projections
    const x = (lng + 180) * (canvas.width / 360);
    
    let y;
    if (projectionType === 'equirectangular') {
        // Simple linear mapping for equirectangular projection
        // This matches most world map SVGs including the BlankMap-Equirectangular.svg
        y = (90 - lat) * (canvas.height / 180);
    } else {
        // Mercator projection (original implementation)
        const latRad = lat * Math.PI / 180;
        const mercatorN = Math.log(Math.tan((Math.PI / 4) + (latRad / 2)));
        y = (canvas.height / 2) - (canvas.width * mercatorN / (2 * Math.PI));
    }
    
    return { x, y };
}

// Calculate solar position based on date and time (hybrid approach)
function getSolarPosition(date) {
    // Calculate solar declination directly (this method works reliably)
    const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    const declination = -23.45 * Math.cos(2 * Math.PI * (dayOfYear + 10) / 365.25);
    
    // Calculate longitude where sun is directly overhead (subsolar point)
    // Solar time equation: 15° per hour, sun is at 0° longitude at 12:00 UTC
    const hours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
    const sunLongitude = -(hours - 12) * 15;
    
    const normalizedLng = sunLongitude > 180 ? sunLongitude - 360 : sunLongitude < -180 ? sunLongitude + 360 : sunLongitude;
    
    console.log(`Solar position: lat=${declination.toFixed(2)}°, lng=${normalizedLng.toFixed(2)}°`);
    
    return {
        lat: declination,
        lng: normalizedLng
    };
}

// Calculate lunar position based on date and time (use original calculation + SunCalc illumination)
function getLunarPosition(date) {
    // Calculate Julian Date
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    const hour = date.getUTCHours();
    const minute = date.getUTCMinutes();
    const second = date.getUTCSeconds();
    
    // Calculate Julian Date
    let a = Math.floor((14 - month) / 12);
    let y = year + 4800 - a;
    let m = month + 12 * a - 3;
    
    let JD = day + Math.floor((153 * m + 2) / 5) + 365 * y + 
             Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
    JD += (hour - 12) / 24 + minute / 1440 + second / 86400;
    
    // Days since J2000.0
    const d = JD - 2451545.0;
    
    // Moon's mean longitude
    const Lm = (218.316 + 13.176396 * d) % 360;
    
    // Moon's mean anomaly
    const Mm = (134.963 + 13.064993 * d) % 360;
    
    // Sun's mean anomaly
    const Ms = (357.529 + 0.98560028 * d) % 360;
    
    // Moon's argument of latitude
    const F = (93.272 + 13.229350 * d) % 360;
    
    // Convert to radians
    const toRad = Math.PI / 180;
    const MmRad = Mm * toRad;
    const MsRad = Ms * toRad;
    const FRad = F * toRad;
    
    // Calculate ecliptic longitude (simplified but accurate to ~1 degree)
    let lambda = Lm;
    lambda += 6.289 * Math.sin(MmRad);
    lambda += 1.274 * Math.sin(2 * FRad - MmRad);
    lambda += 0.658 * Math.sin(2 * FRad);
    lambda += 0.214 * Math.sin(2 * MmRad);
    lambda -= 0.186 * Math.sin(MsRad);
    lambda -= 0.114 * Math.sin(2 * FRad);
    
    // Calculate ecliptic latitude
    let beta = 5.128 * Math.sin(FRad);
    beta += 0.280 * Math.sin(MmRad + FRad);
    beta += 0.277 * Math.sin(MmRad - FRad);
    
    // Convert to radians
    const lambdaRad = lambda * toRad;
    const betaRad = beta * toRad;
    
    // Obliquity of ecliptic
    const epsilon = 23.439 * toRad;
    
    // Convert to equatorial coordinates
    const alpha = Math.atan2(
        Math.sin(lambdaRad) * Math.cos(epsilon) - Math.tan(betaRad) * Math.sin(epsilon),
        Math.cos(lambdaRad)
    );
    
    const delta = Math.asin(
        Math.sin(betaRad) * Math.cos(epsilon) + 
        Math.cos(betaRad) * Math.sin(epsilon) * Math.sin(lambdaRad)
    );
    
    // Convert to degrees
    const declination = delta / toRad;
    let rightAscension = alpha / toRad;
    if (rightAscension < 0) rightAscension += 360;
    
    // Calculate Greenwich Sidereal Time
    const T = d / 36525.0;
    let GST = 280.46061837 + 360.98564736629 * d + 0.000387933 * T * T;
    GST = GST % 360;
    if (GST < 0) GST += 360;
    
    // Geographic longitude where moon is overhead
    let moonLongitude = rightAscension - GST;
    
    // Normalize to -180 to 180
    while (moonLongitude > 180) moonLongitude -= 360;
    while (moonLongitude < -180) moonLongitude += 360;
    
    // Use SunCalc for phase and illumination data
    const moonIllum = SunCalc.getMoonIllumination(date);
    const elongation = moonIllum.phase * 360; // Convert 0-1 to 0-360 degrees
    
    console.log(`Lunar position: lat=${declination.toFixed(2)}°, lng=${moonLongitude.toFixed(2)}°`);
    
    return {
        lat: declination,
        lng: moonLongitude,
        phase: elongation,
        illuminatedFraction: moonIllum.fraction
    };
}


/**
 * Calculate sunrise and sunset times using SunCalc library
 * @param {Date} date - The date for which to calculate sunrise/sunset  
 * @param {number} lat - Latitude in degrees
 * @param {number} lng - Longitude in degrees
 * @returns {Object} Object containing sunrise and sunset times
 */
function getSunriseSunset(date, lat, lng) {
    if (!CONFIG.location.isAvailable) {
        return { sunrise: null, sunset: null };
    }

    // Use SunCalc library for accurate calculations
    const times = SunCalc.getTimes(date, lat, lng);
    
    const sunrise = times.sunrise;
    const sunset = times.sunset;
    
    // Check for invalid times (polar regions)
    if (isNaN(sunrise.getTime()) || isNaN(sunset.getTime())) {
        // Determine if it's polar day or night based on sun position
        const sunPos = SunCalc.getPosition(date, lat, lng);
        const elevation = sunPos.altitude * 180 / Math.PI; // Convert to degrees
        
        if (elevation > 0) {
            return { sunrise: null, sunset: null, polarDay: true };
        } else {
            return { sunrise: null, sunset: null, polarNight: true };
        }
    }

    console.log(`Sunrise/Sunset for ${lat}, ${lng} on ${date.toDateString()}:`, {
        sunriseUTC: sunrise.toISOString().substr(11, 8) + ' UTC',
        sunsetUTC: sunset.toISOString().substr(11, 8) + ' UTC',
        sunriseLocal: sunrise.toLocaleString(undefined, { timeZone: displayTimezone }),
        sunsetLocal: sunset.toLocaleString(undefined, { timeZone: displayTimezone })
    });

    return { sunrise, sunset };
}

/**
 * Calculate day length from sunrise and sunset times
 * @param {Date|null} sunrise - Sunrise time
 * @param {Date|null} sunset - Sunset time
 * @returns {string} Formatted day length string
 */
function calculateDayLength(sunrise, sunset) {
    if (!sunrise || !sunset) {
        return "Unknown";
    }
    
    const diffMs = sunset.getTime() - sunrise.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m daylight`;
}

/**
 * Get moon phase symbol and name based on SunCalc phase value
 * @param {number} phase - SunCalc phase value (0 = new, 0.25 = first quarter, 0.5 = full, 0.75 = last quarter, 1 = new)
 * @returns {Object} Object with symbol and name properties
 */
function getMoonPhase(phase) {
    if (typeof phase !== 'number' || isNaN(phase)) {
        return { symbol: "🌑", name: "New Moon" };
    }
    
    // SunCalc phase: 0 = new moon, 0.25 = first quarter, 0.5 = full moon, 0.75 = last quarter, 1 = new moon
    if (phase < 0.03125 || phase >= 0.96875) {
        return { symbol: "🌑", name: "New Moon" };
    } else if (phase < 0.21875) {
        return { symbol: "🌒", name: "Waxing Crescent" };
    } else if (phase < 0.28125) {
        return { symbol: "🌓", name: "First Quarter" };
    } else if (phase < 0.46875) {
        return { symbol: "🌔", name: "Waxing Gibbous" };
    } else if (phase < 0.53125) {
        return { symbol: "🌕", name: "Full Moon" };
    } else if (phase < 0.71875) {
        return { symbol: "🌖", name: "Waning Gibbous" };
    } else if (phase < 0.78125) {
        return { symbol: "🌗", name: "Last Quarter" };
    } else {
        return { symbol: "🌘", name: "Waning Crescent" };
    }
}

// Calculate solar elevation angle using SunCalc
function getSolarElevation(lat, lng, date) {
    const sunPos = SunCalc.getPosition(date, lat, lng);
    return sunPos.altitude * 180 / Math.PI; // Convert from radians to degrees
}

// Calculate day/night terminator line points
function getTerminatorPoints(sunPos, date) {
    const points = [];
    for (let lng = -180; lng <= 180; lng += CONFIG.calculation.terminatorStep) {
        // Find latitude where solar elevation equals 0
        for (let lat = -90; lat <= 90; lat += 1) {
            const elevation = getSolarElevation(lat, lng, date);
            
            // Check if this point is close to the terminator (elevation ≈ 0)
            if (Math.abs(elevation) < 0.5) {
                const pixel = latLngToPixel(lat, lng);
                if (pixel.y >= 0 && pixel.y <= canvas.height) {
                    points.push(pixel);
                }
                break; // Found terminator for this longitude
            }
        }
    }
    return points;
}

// Helper function to draw celestial body with edge wrapping
function drawCelestialBodyWithWrapping(pixel, drawFunction, wrapThreshold = CONFIG.visual.edgeWrapThreshold) {
    // Always draw the primary icon
    drawFunction(pixel.x, pixel.y);
    
    // Check if near left edge and should wrap to right side
    if (pixel.x < wrapThreshold) {
        drawFunction(pixel.x + canvas.width, pixel.y);
    }
    
    // Check if near right edge and should wrap to left side  
    if (pixel.x > canvas.width - wrapThreshold) {
        drawFunction(pixel.x - canvas.width, pixel.y);
    }
}

/**
 * Update the solar information panel with current astronomical data
 * @param {Date} date - Current date/time
 */
function updateSolarInfoPanel(date) {
    // Update date display
    const dateString = date.toLocaleDateString('en-US', {
        timeZone: displayTimezone,
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    document.getElementById('currentDate').textContent = dateString;
    
    // Update sun times (sunrise/sunset) if location is available
    if (CONFIG.location.isAvailable) {
        const sunTimes = getSunriseSunset(date, CONFIG.location.latitude, CONFIG.location.longitude);
        
        if (sunTimes.polarNight) {
            document.getElementById('sunrise').textContent = '❄️ Polar Night';
            document.getElementById('sunset').textContent = '';
            document.getElementById('dayLength').textContent = '0h 0m daylight';
        } else if (sunTimes.polarDay) {
            document.getElementById('sunrise').textContent = '☀️ Polar Day';
            document.getElementById('sunset').textContent = '';
            document.getElementById('dayLength').textContent = '24h 0m daylight';
        } else if (sunTimes.sunrise && sunTimes.sunset) {
            const sunriseStr = sunTimes.sunrise.toLocaleTimeString('en-US', {
                timeZone: displayTimezone,
                hour: 'numeric',
                minute: '2-digit',
                hour12: !CONFIG.time.use24Hour
            });
            const sunsetStr = sunTimes.sunset.toLocaleTimeString('en-US', {
                timeZone: displayTimezone,
                hour: 'numeric',
                minute: '2-digit',
                hour12: !CONFIG.time.use24Hour
            });
            
            document.getElementById('sunrise').textContent = `↑ ${sunriseStr}`;
            document.getElementById('sunset').textContent = `↓ ${sunsetStr}`;
            document.getElementById('dayLength').textContent = calculateDayLength(sunTimes.sunrise, sunTimes.sunset);
        }
    } else {
        document.getElementById('sunrise').textContent = 'Location';
        document.getElementById('sunset').textContent = 'Unknown';
        document.getElementById('dayLength').textContent = '';
    }
    
    // Update moon phase using SunCalc directly
    const moonIllumination = SunCalc.getMoonIllumination(date);
    const moonPhase = getMoonPhase(moonIllumination.phase);
    
    document.getElementById('moonSymbol').textContent = moonPhase.symbol;
    document.getElementById('moonPhaseName').textContent = moonPhase.name;
}

// Main drawing function
function drawMap() {
    const now = customTimestamp ? new Date(customTimestamp) : new Date();
    const sunPos = getSolarPosition(now);
    const moonPos = getLunarPosition(now);
    
    // Clear canvas (make transparent for overlay)
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw night overlay with optimized approach for grayscale
    const pixelSize = CONFIG.performance.pixelSize;
    
    // Use image data for smooth pixel manipulation
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    const data = imageData.data;
    
    for (let x = 0; x < canvas.width; x += pixelSize) {
        for (let y = 0; y < canvas.height; y += pixelSize) {
            // Convert pixel back to lat/lng
            const lng = (x / canvas.width) * 360 - 180;
            
            let lat;
            if (projectionType === 'equirectangular') {
                // Simple linear mapping for equirectangular projection
                lat = 90 - (y / canvas.height) * 180;
            } else {
                // Mercator projection (original implementation)
                const mercatorN = (canvas.height / 2 - y) * 2 * Math.PI / canvas.width;
                lat = Math.atan(Math.sinh(mercatorN)) * 180 / Math.PI;
            }
            
            // Skip invalid latitudes for Mercator projection only
            if (projectionType === 'mercator') {
                // Mercator has mathematical limits around ±85°
                if (lat > 85 || lat < -85) continue;
            }
            // For equirectangular, render the full latitude range to match the SVG map
            
            const elevation = getSolarElevation(lat, lng, now);
            
            // Create overlay with different approach for grayscale
            let alpha = 0;
            let color;
            
            if (isGrayscale) {
                // Smooth gradient approach for grayscale (same as color mode but grayscale)
                color = CONFIG.night.grayscale.color;
                if (elevation < CONFIG.solarElevation.deepNight) {
                    alpha = CONFIG.night.grayscale.opacity.deepNight; // Deep night
                } else if (elevation < CONFIG.solarElevation.astronomicalTwilight) {
                    // Astronomical twilight
                    const factor = (elevation - CONFIG.solarElevation.deepNight) / (CONFIG.solarElevation.astronomicalTwilight - CONFIG.solarElevation.deepNight);
                    alpha = CONFIG.night.grayscale.opacity.deepNight - ((CONFIG.night.grayscale.opacity.deepNight - 0.4) * factor);
                } else if (elevation < CONFIG.solarElevation.nauticalTwilight) {
                    // Nautical/civil twilight
                    const factor = (elevation - CONFIG.solarElevation.astronomicalTwilight) / (CONFIG.solarElevation.nauticalTwilight - CONFIG.solarElevation.astronomicalTwilight);
                    alpha = 0.4 - (0.4 - CONFIG.night.grayscale.opacity.twilight) * factor;
                } else if (elevation < CONFIG.solarElevation.horizon) {
                    // Very light twilight at horizon
                    const factor = (elevation - CONFIG.solarElevation.nauticalTwilight) / (CONFIG.solarElevation.horizon - CONFIG.solarElevation.nauticalTwilight);
                    alpha = CONFIG.night.grayscale.opacity.twilight - (CONFIG.night.grayscale.opacity.twilight * factor);
                }
            } else {
                // Original smooth gradient for color displays
                color = CONFIG.night.color.color;
                if (elevation < CONFIG.solarElevation.deepNight) {
                    alpha = CONFIG.night.color.opacity.deepNight; // Deep night
                } else if (elevation < CONFIG.solarElevation.astronomicalTwilight) {
                    // Astronomical twilight
                    const factor = (elevation - CONFIG.solarElevation.deepNight) / (CONFIG.solarElevation.astronomicalTwilight - CONFIG.solarElevation.deepNight);
                    alpha = CONFIG.night.color.opacity.deepNight - ((CONFIG.night.color.opacity.deepNight - CONFIG.night.color.opacity.astronomicalTwilight) * factor);
                } else if (elevation < CONFIG.solarElevation.nauticalTwilight) {
                    // Nautical/civil twilight
                    const factor = (elevation - CONFIG.solarElevation.astronomicalTwilight) / (CONFIG.solarElevation.nauticalTwilight - CONFIG.solarElevation.astronomicalTwilight);
                    alpha = CONFIG.night.color.opacity.astronomicalTwilight - ((CONFIG.night.color.opacity.astronomicalTwilight - CONFIG.night.color.opacity.nauticalTwilight) * factor);
                } else if (elevation < CONFIG.solarElevation.horizon) {
                    // Very light twilight at horizon
                    const factor = (elevation - CONFIG.solarElevation.nauticalTwilight) / (CONFIG.solarElevation.horizon - CONFIG.solarElevation.nauticalTwilight);
                    alpha = CONFIG.night.color.opacity.nauticalTwilight - (CONFIG.night.color.opacity.nauticalTwilight * factor);
                }
            }
            
            // Apply to image data for smoother rendering
            if (alpha > 0) {
                for (let dx = 0; dx < pixelSize && x + dx < canvas.width; dx++) {
                    for (let dy = 0; dy < pixelSize && y + dy < canvas.height; dy++) {
                        const idx = ((y + dy) * canvas.width + (x + dx)) * 4;
                        data[idx] = color[0];     // R
                        data[idx + 1] = color[1]; // G
                        data[idx + 2] = color[2]; // B
                        data[idx + 3] = Math.floor(alpha * 255 * (isGrayscale ? 1 : 0.75)); // A
                    }
                }
            }
        }
    }
    
    // Render the image data
    ctx.putImageData(imageData, 0, 0);
    
    // Draw location dot after night overlay but before sun/moon (so it's above map but below celestial bodies)
    if (CONFIG.location.showDot && CONFIG.location.isAvailable && 
        CONFIG.location.latitude !== null && CONFIG.location.longitude !== null) {
        const locationPixel = latLngToPixel(CONFIG.location.latitude, CONFIG.location.longitude);
        
        if (locationPixel.y >= 0 && locationPixel.y <= canvas.height) {
            const drawLocationDot = (x, y) => {
                const dotConfig = CONFIG.location.dot;
                const radius = dotConfig.radius;
                const strokeWidth = dotConfig.strokeWidth;
                
                if (isGrayscale) {
                    // Grayscale location dot
                    ctx.fillStyle = dotConfig.color.grayscale.fill;
                    ctx.strokeStyle = dotConfig.color.grayscale.stroke;
                } else {
                    // Color location dot
                    ctx.fillStyle = dotConfig.color.fill;
                    ctx.strokeStyle = dotConfig.color.stroke;
                }
                
                ctx.lineWidth = strokeWidth;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, 2 * Math.PI);
                ctx.fill();
                ctx.stroke();
            };
            
            drawCelestialBodyWithWrapping(locationPixel, drawLocationDot);
        }
    }
    
    // Draw terminator line
    if (CONFIG.visual.showTerminator){
        const terminatorPoints = getTerminatorPoints(sunPos, now);
        if (terminatorPoints.length > 1) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            terminatorPoints.forEach((point, i) => {
                if (i === 0) ctx.moveTo(point.x, point.y);
                else ctx.lineTo(point.x, point.y);
            });
            ctx.stroke();
        }
    }
    
    // Draw sun position with wrapping (only if not hidden)
    if (!hideSun) {
        const sunPixel = latLngToPixel(sunPos.lat, sunPos.lng);
        if (sunPixel.y >= 0 && sunPixel.y <= canvas.height) {
            const drawSun = (x, y) => {
            if (isGrayscale) {
                // High contrast sun for grayscale
                const sunConfig = CONFIG.sun.grayscale;
                
                ctx.fillStyle = sunConfig.fillColor;
                ctx.beginPath();
                ctx.arc(x, y, sunConfig.radius, 0, 2 * Math.PI);
                ctx.fill();
                
                // Border for contrast
                ctx.strokeStyle = sunConfig.strokeColor;
                ctx.lineWidth = CONFIG.visual.lineWidths.sunStroke;
                ctx.beginPath();
                ctx.arc(x, y, sunConfig.radius, 0, 2 * Math.PI);
                ctx.stroke();
                
                // Add sun rays pattern
                ctx.strokeStyle = sunConfig.rayColor;
                ctx.lineWidth = CONFIG.visual.lineWidths.sunRays;
                for (let i = 0; i < CONFIG.visual.sunRayCount; i++) {
                    const angle = (i * Math.PI) / (CONFIG.visual.sunRayCount / 2);
                    const x1 = x + Math.cos(angle) * (sunConfig.radius + 3);
                    const y1 = y + Math.sin(angle) * (sunConfig.radius + 3);
                    const x2 = x + Math.cos(angle) * sunConfig.rayLength;
                    const y2 = y + Math.sin(angle) * sunConfig.rayLength;
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.stroke();
                }
            } else {
                // Color sun
                const sunConfig = CONFIG.sun.color;
                
                const gradient = ctx.createRadialGradient(x, y, 0, x, y, sunConfig.glowRadius);
                gradient.addColorStop(0, sunConfig.glowColor.start);
                gradient.addColorStop(1, sunConfig.glowColor.end);
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(x, y, sunConfig.glowRadius, 0, 2 * Math.PI);
                ctx.fill();
                
                // Sun core
                ctx.fillStyle = sunConfig.coreColor;
                ctx.beginPath();
                ctx.arc(x, y, sunConfig.coreRadius, 0, 2 * Math.PI);
                ctx.fill();
            }
        };
        
            drawCelestialBodyWithWrapping(sunPixel, drawSun);
        }
    }
    
    // Draw moon position with wrapping (only if not hidden)
    if (!hideMoon) {
        const moonPixel = latLngToPixel(moonPos.lat, moonPos.lng);
        if (moonPixel.y >= 0 && moonPixel.y <= canvas.height) {
            const drawMoon = (x, y) => {
            // Get moon distance for variable sizing
            const moonDistance = SunCalc.getMoonPosition(now, 0, 0).distance;
            // Moon distance varies from ~356,000 km (perigee) to ~407,000 km (apogee)
            // Scale factor: smaller radius when moon is farther away
            const avgDistance = 384400; // Average Earth-Moon distance in km
            const sizeScale = avgDistance / moonDistance;
            
            // Moon glow with variable size
            const moonConfig = CONFIG.moon;
            const scaledGlowRadius = moonConfig.glowRadius * sizeScale;
            const moonGradient = ctx.createRadialGradient(x, y, 0, x, y, scaledGlowRadius);
            moonGradient.addColorStop(0, moonConfig.glowColor.start);
            moonGradient.addColorStop(1, moonConfig.glowColor.end);
            ctx.fillStyle = moonGradient;
            ctx.beginPath();
            ctx.arc(x, y, scaledGlowRadius, 0, 2 * Math.PI);
            ctx.fill();
            
            // Draw moon with phase and variable size
            const moonRadius = CONFIG.moon.radius * sizeScale;
            ctx.save();
            ctx.translate(x, y);
            
            // Create clipping circle for moon
            ctx.beginPath();
            ctx.arc(0, 0, moonRadius, 0, 2 * Math.PI);
            ctx.clip();
            
            // Fill with dark color (shadow)
            ctx.fillStyle = isGrayscale ? moonConfig.color.shadow.grayscale : moonConfig.color.shadow.color;
            ctx.fillRect(-moonRadius, -moonRadius, moonRadius * 2, moonRadius * 2);
            
            // Draw the illuminated part based on actual illuminated fraction
            ctx.fillStyle = isGrayscale ? moonConfig.color.light.grayscale : moonConfig.color.light.color;
            const illuminatedFraction = moonPos.illuminatedFraction;
            const phase = moonPos.phase;
            
            // Create accurate moon phase using proper elliptical terminator
            // illuminatedFraction = 0 means new moon (fully dark)
            // illuminatedFraction = 0.5 means quarter moon (half lit)  
            // illuminatedFraction = 1 means full moon (fully lit)
            
            if (illuminatedFraction > 0.01) { // Don't draw anything for new moon
                ctx.beginPath();
                
                if (phase < 180) {
                    // Waxing phases - illuminated portion on right side
                    if (illuminatedFraction < 0.5) {
                        // Waxing crescent - draw crescent on right
                        const k = 2 * illuminatedFraction - 1; // -1 to 0
                        const a = moonRadius * Math.abs(k); // ellipse width
                        
                        // Right semi-circle (always visible part)
                        ctx.arc(0, 0, moonRadius, -Math.PI/2, Math.PI/2, false);
                        
                        // Elliptical terminator curve
                        for (let angle = -Math.PI/2; angle <= Math.PI/2; angle += CONFIG.calculation.moonPhaseStep) {
                            const y = moonRadius * Math.sin(angle);
                            const x = a * Math.cos(angle);
                            if (angle === -Math.PI/2) {
                                ctx.lineTo(x, y);
                            } else {
                                ctx.lineTo(x, y);
                            }
                        }
                        ctx.closePath();
                    } else {
                        // Waxing gibbous - draw most of circle except left crescent
                        const k = 2 * illuminatedFraction - 1; // 0 to 1
                        const a = moonRadius * k; // ellipse width
                        
                        // Full circle
                        ctx.arc(0, 0, moonRadius, 0, 2 * Math.PI, false);
                        ctx.fill();
                        
                        // Subtract the dark crescent on left
                        ctx.globalCompositeOperation = 'destination-out';
                        ctx.beginPath();
                        ctx.arc(0, 0, moonRadius, Math.PI/2, 3*Math.PI/2, false);
                        
                        for (let angle = Math.PI/2; angle <= 3*Math.PI/2; angle += CONFIG.calculation.moonPhaseStep) {
                            const y = moonRadius * Math.sin(angle);
                            const x = -a * Math.cos(angle);
                            ctx.lineTo(x, y);
                        }
                        ctx.closePath();
                        ctx.fill();
                        ctx.globalCompositeOperation = 'source-over';
                        
                        // Re-draw to fix any artifacts
                        ctx.fillStyle = isGrayscale ? moonConfig.color.light.grayscale : moonConfig.color.light.color;
                        ctx.beginPath();
                        ctx.arc(0, 0, moonRadius, -Math.PI/2, Math.PI/2, false);
                        for (let angle = -Math.PI/2; angle <= Math.PI/2; angle += CONFIG.calculation.moonPhaseStep) {
                            const y = moonRadius * Math.sin(angle);
                            const x = -a * Math.cos(angle);
                            ctx.lineTo(x, y);
                        }
                        ctx.closePath();
                    }
                } else {
                    // Waning phases - illuminated portion on left side  
                    if (illuminatedFraction < 0.5) {
                        // Waning crescent - draw crescent on left
                        const k = 2 * illuminatedFraction - 1; // -1 to 0
                        const a = moonRadius * Math.abs(k); // ellipse width
                        
                        // Left semi-circle (always visible part)
                        ctx.arc(0, 0, moonRadius, Math.PI/2, 3*Math.PI/2, false);
                        
                        // Elliptical terminator curve  
                        for (let angle = 3*Math.PI/2; angle >= Math.PI/2; angle -= CONFIG.calculation.moonPhaseStep) {
                            const y = moonRadius * Math.sin(angle);
                            const x = -a * Math.cos(angle);
                            ctx.lineTo(x, y);
                        }
                        ctx.closePath();
                    } else {
                        // Waning gibbous - draw most of circle except right crescent
                        const k = 2 * illuminatedFraction - 1; // 0 to 1  
                        const a = moonRadius * k; // ellipse width
                        
                        // Full circle
                        ctx.arc(0, 0, moonRadius, 0, 2 * Math.PI, false);
                        ctx.fill();
                        
                        // Subtract the dark crescent on right
                        ctx.globalCompositeOperation = 'destination-out';
                        ctx.beginPath();
                        ctx.arc(0, 0, moonRadius, -Math.PI/2, Math.PI/2, false);
                        
                        for (let angle = -Math.PI/2; angle <= Math.PI/2; angle += CONFIG.calculation.moonPhaseStep) {
                            const y = moonRadius * Math.sin(angle);
                            const x = a * Math.cos(angle);
                            ctx.lineTo(x, y);
                        }
                        ctx.closePath();
                        ctx.fill();
                        ctx.globalCompositeOperation = 'source-over';
                        
                        // Re-draw to fix any artifacts
                        ctx.fillStyle = isGrayscale ? moonConfig.color.light.grayscale : moonConfig.color.light.color;
                        ctx.beginPath();
                        ctx.arc(0, 0, moonRadius, Math.PI/2, 3*Math.PI/2, false);
                        for (let angle = Math.PI/2; angle <= 3*Math.PI/2; angle += CONFIG.calculation.moonPhaseStep) {
                            const y = moonRadius * Math.sin(angle);
                            const x = a * Math.cos(angle);
                            ctx.lineTo(x, y);
                        }
                        ctx.closePath();
                    }
                }
                
                ctx.fill();
            }
            
            ctx.restore();
            
            // Add outline for visibility on light backgrounds
            ctx.strokeStyle = moonConfig.strokeColor;
            ctx.lineWidth = CONFIG.visual.lineWidths.moonStroke;
            ctx.beginPath();
            ctx.arc(x, y, moonRadius, 0, 2 * Math.PI);
            ctx.stroke();
        };
        
            drawCelestialBodyWithWrapping(moonPixel, drawMoon);
        }
    }
    
    // Update info display
    let timeDisplay;
    try {
        if (isMinimal) {
            // In minimal mode, show only the date in specified timezone
            const dateString = now.toLocaleDateString('en-US', {
                timeZone: displayTimezone,
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            timeDisplay = `${dateString}`;
        } else {
            // In normal mode, show full time in specified timezone
            const timeString = now.toLocaleString('en-US', {
                timeZone: displayTimezone,
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZoneName: 'short',
                hour12: !CONFIG.time.use24Hour
            });
            timeDisplay = `Current Time:\n${timeString}`;
        }
    } catch (error) {
        // Fallback to UTC if timezone is invalid
        console.warn('Invalid timezone:', displayTimezone, 'Falling back to UTC');
        if (isMinimal) {
            const dateString = now.toUTCString().split(' ').slice(0, 4).join(' ');
            timeDisplay = `${dateString}`;
        } else {
            const timeString = now.toUTCString().replace(/:\d{2} GMT$/, ' GMT');
            timeDisplay = `UTC Time:\n${timeString}`;
        }
    }
        
    // Use SunCalc directly for moon info display
    const moonIllumination = SunCalc.getMoonIllumination(now);
    const moonPhase = getMoonPhase(moonIllumination.phase);
    const illumination = Math.round(moonIllumination.fraction * 100);
    
    // Add additional solar and lunar events for non-minimal mode
    let sunInfoText = `Sun: ${sunPos.lat.toFixed(1)}°, ${sunPos.lng.toFixed(1)}°`;
    let moonInfoText = `Moon: ${moonPos.lat.toFixed(1)}°,${moonPos.lng.toFixed(1)}°\n${moonPhase.name}, ${illumination}% illuminated`;
    
    if (!isMinimal && CONFIG.location.isAvailable) {
        // Add solar events
        const solarTimes = SunCalc.getTimes(now, CONFIG.location.latitude, CONFIG.location.longitude);
        const solarNoon = solarTimes.solarNoon;
        const goldenHourEnd = solarTimes.goldenHourEnd;
        const goldenHour = solarTimes.goldenHour;
        
        if (solarNoon && !isNaN(solarNoon.getTime())) {
            const noonStr = solarNoon.toLocaleTimeString(undefined, { 
                timeZone: displayTimezone, 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: !CONFIG.time.use24Hour
            });
            sunInfoText += `\nSolar Noon: ${noonStr}`;
        }
        
        if (goldenHourEnd && goldenHour && !isNaN(goldenHourEnd.getTime()) && !isNaN(goldenHour.getTime())) {
            const morningGolden = goldenHourEnd.toLocaleTimeString(undefined, { 
                timeZone: displayTimezone, 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: !CONFIG.time.use24Hour
            });
            const eveningGolden = goldenHour.toLocaleTimeString(undefined, { 
                timeZone: displayTimezone, 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: !CONFIG.time.use24Hour
            });
            sunInfoText += `\nGolden Hour: ${morningGolden} - ${eveningGolden}`;
        }
        
        // Add lunar events
        const moonTimes = SunCalc.getMoonTimes(now, CONFIG.location.latitude, CONFIG.location.longitude);
        
        if (moonTimes.rise && !isNaN(moonTimes.rise.getTime())) {
            const moonriseStr = moonTimes.rise.toLocaleTimeString(undefined, { 
                timeZone: displayTimezone, 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: !CONFIG.time.use24Hour
            });
            moonInfoText += `\nMoonrise: ${moonriseStr}`;
        }
        
        if (moonTimes.set && !isNaN(moonTimes.set.getTime())) {
            const moonsetStr = moonTimes.set.toLocaleTimeString(undefined, { 
                timeZone: displayTimezone, 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: !CONFIG.time.use24Hour
            });
            moonInfoText += `\nMoonset: ${moonsetStr}`;
        }
        
        if (moonTimes.alwaysUp) {
            moonInfoText += `\nMoon: Always visible`;
        } else if (moonTimes.alwaysDown) {
            moonInfoText += `\nMoon: Below horizon`;
        }
    }
    
    document.getElementById('sunPosition').textContent = sunInfoText;
    document.getElementById('moonPosition').textContent = moonInfoText;
    
    // Update solar info panel
    updateSolarInfoPanel(now);
}

// Initialize location and start the application
initializeLocation().then(() => {
    // Update location legend after location is determined
    updateLocationLegend();
    
    // Update celestial body legend visibility
    updateCelestialLegend();
    
    // Initial draw and set up auto-refresh (only if no custom timestamp)
    drawMap();
    if (!customTimestamp) {
        setInterval(drawMap, CONFIG.performance.updateInterval);
    }
});