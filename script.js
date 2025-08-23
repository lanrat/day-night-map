// Check for minimal, grayscale, and timestamp mode URL parameters
const urlParams = new URLSearchParams(window.location.search);
const hashParams = new URLSearchParams(window.location.hash.substring(1));
const isMinimal = urlParams.has('minimal') || hashParams.has('minimal') || 
                 window.location.search.includes('minimal') || 
                 window.location.hash.includes('minimal');
const isGrayscale = urlParams.has('grayscale') || hashParams.has('grayscale') || 
                   window.location.search.includes('grayscale') || 
                   window.location.hash.includes('grayscale');

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
        isAvailable: false                  // Whether location data is available
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

// Convert latitude/longitude to canvas coordinates (Mercator projection)
function latLngToPixel(lat, lng) {
    const x = (lng + 180) * (canvas.width / 360);
    const latRad = lat * Math.PI / 180;
    const mercatorN = Math.log(Math.tan((Math.PI / 4) + (latRad / 2)));
    const y = (canvas.height / 2) - (canvas.width * mercatorN / (2 * Math.PI));
    return { x, y };
}

// Calculate solar position based on date and time
function getSolarPosition(date) {
    const MILLISECONDS_PER_DAY = 86400000; // 24 * 60 * 60 * 1000

    // Simple, reliable approach
    const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / MILLISECONDS_PER_DAY);
    const hours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
    
    // Solar declination (simple but accurate enough)
    const declination = -23.45 * Math.cos(2 * Math.PI * (dayOfYear + 10) / 365.25);
    
    // Solar longitude: where sun is directly overhead
    // At UTC noon (12:00), sun is at longitude 0°
    // Sun moves 15° west per hour (360° / 24 hours)
    const sunLongitude = -(hours - 12) * 15;
    
    return {
        lat: declination,
        lng: sunLongitude > 180 ? sunLongitude - 360 : sunLongitude < -180 ? sunLongitude + 360 : sunLongitude
    };
}

// Calculate lunar position based on date and time
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
    
    // Longitude of ascending node (not used in simplified calculation)
    // const omega = (125.04 - 0.052954 * d) % 360;
    
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
    
    // Calculate Sun's longitude for phase calculation
    const Ls = (280.460 + 0.98564736 * d) % 360;
    const sunLambda = Ls + 1.915 * Math.sin(MsRad) + 0.020 * Math.sin(2 * MsRad);
    
    // Calculate phase angle (elongation)
    let elongation = lambda - sunLambda;
    if (elongation < 0) elongation += 360;
    
    // Calculate illuminated fraction
    const phaseAngle = 180 - elongation;
    const illuminatedFraction = (1 + Math.cos(phaseAngle * toRad)) / 2;
    
    return {
        lat: declination,
        lng: moonLongitude,
        phase: elongation,
        // TODO this does not seem to work when >= 0.5
        // also drawing may be inverted...
        illuminatedFraction: illuminatedFraction
    };
}


/**
 * Calculate sunrise and sunset times using simplified but accurate algorithm
 * @param {Date} date - The date for which to calculate sunrise/sunset  
 * @param {number} lat - Latitude in degrees
 * @param {number} lng - Longitude in degrees
 * @returns {Object} Object containing sunrise and sunset times
 */
function getSunriseSunset(date, lat, lng) {
    if (!CONFIG.location.isAvailable) {
        return { sunrise: null, sunset: null };
    }

    // Day of year
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date - start;
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    // Solar declination angle
    const P = Math.asin(0.39795 * Math.cos(0.017214 * (dayOfYear - 173)));
    
    // Argument for sunrise/sunset
    const argument = -Math.tan(lat * Math.PI / 180) * Math.tan(P);
    
    // Check for polar day/night
    if (argument < -1) return { sunrise: null, sunset: null, polarDay: true };
    if (argument > 1) return { sunrise: null, sunset: null, polarNight: true };
    
    // Hour angle
    const hourAngle = Math.acos(argument) * 180 / Math.PI;
    
    // Solar times in hours (local solar time)
    const sunriseHour = 12 - hourAngle / 15;
    const sunsetHour = 12 + hourAngle / 15;
    
    // Convert to UTC by adding longitude correction
    const sunriseUTC = sunriseHour - lng / 15;
    const sunsetUTC = sunsetHour - lng / 15;
    
    // Create Date objects
    const sunrise = new Date(date);
    sunrise.setUTCHours(Math.floor(sunriseUTC), Math.round((sunriseUTC % 1) * 60), 0, 0);
    
    const sunset = new Date(date);  
    sunset.setUTCHours(Math.floor(sunsetUTC), Math.round((sunsetUTC % 1) * 60), 0, 0);
    
    // Handle day rollover
    if (sunriseUTC < 0) {
        sunrise.setUTCDate(sunrise.getUTCDate() - 1);
        sunrise.setUTCHours(sunrise.getUTCHours() + 24);
    } else if (sunriseUTC >= 24) {
        sunrise.setUTCDate(sunrise.getUTCDate() + 1);
        sunrise.setUTCHours(sunrise.getUTCHours() - 24);
    }
    
    if (sunsetUTC < 0) {
        sunset.setUTCDate(sunset.getUTCDate() - 1);
        sunset.setUTCHours(sunset.getUTCHours() + 24);
    } else if (sunsetUTC >= 24) {
        sunset.setUTCDate(sunset.getUTCDate() + 1);
        sunset.setUTCHours(sunset.getUTCHours() - 24);
    }

    console.log(`Sunrise/Sunset for ${lat}, ${lng} on ${date.toDateString()}:`, {
        dayOfYear,
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
 * Get Unicode moon phase symbol based on elongation
 * @param {number} elongation - Moon phase elongation in degrees
 * @returns {string} Unicode moon phase symbol
 */
function getMoonPhaseSymbol(elongation) {
    if (typeof elongation !== 'number' || isNaN(elongation)) {
        return "🌑"; // Default to new moon
    }
    
    const normalizedElongation = (elongation % 360 + 360) % 360;
    
    if (normalizedElongation < 22.5 || normalizedElongation >= 337.5) {
        return "🌑"; // New Moon
    } else if (normalizedElongation < 67.5) {
        return "🌒"; // Waxing Crescent
    } else if (normalizedElongation < 112.5) {
        return "🌓"; // First Quarter
    } else if (normalizedElongation < 157.5) {
        return "🌔"; // Waxing Gibbous
    } else if (normalizedElongation < 202.5) {
        return "🌕"; // Full Moon
    } else if (normalizedElongation < 247.5) {
        return "🌖"; // Waning Gibbous
    } else if (normalizedElongation < 292.5) {
        return "🌗"; // Last Quarter
    } else {
        return "🌘"; // Waning Crescent
    }
}

/**
* Calculates the name of the moon phase based on its elongation from the sun.
* The eight major phases are returned based on standard astronomical divisions.
*
* @param {number} elongation - The angular separation in degrees between the Sun and the Moon as seen from Earth.
* @returns {string} The name of the moon phase (e.g., "New Moon", "Waxing Crescent", etc.), or an error message if the input is invalid.
*/
function getMoonPhaseName(elongation) {
    // First, validate that the input is a number.
    if (typeof elongation !== 'number' || isNaN(elongation)) {
        console.error("Invalid input: Elongation must be a number.");
        return "Invalid input";
    }

    // Normalize the elongation to a value between 0 and 360 degrees.
    // This handles negative values or values greater than 360.
    const normalizedElongation = (elongation % 360 + 360) % 360;

    // Determine the phase based on the normalized elongation.
    // The ranges are based on dividing the 360-degree cycle into 8 phases of 45 degrees each.
    if (normalizedElongation < 22.5 || normalizedElongation >= 337.5) {
        return "New Moon";
    } else if (normalizedElongation < 67.5) {
        return "Waxing Crescent";
    } else if (normalizedElongation < 112.5) {
        return "First Quarter";
    } else if (normalizedElongation < 157.5) {
        return "Waxing Gibbous";
    } else if (normalizedElongation < 202.5) {
        return "Full Moon";
    } else if (normalizedElongation < 247.5) {
        return "Waning Gibbous";
    } else if (normalizedElongation < 292.5) {
        return "Third Quarter";
    } else { // This covers the range from 292.5 up to 337.5
        return "Waning Crescent";
    }
}

// Calculate solar elevation angle
function getSolarElevation(lat, lng, sunLat, sunLng) {
    const latRad = lat * Math.PI / 180;
    const sunLatRad = sunLat * Math.PI / 180;
    const lngDiff = (lng - sunLng) * Math.PI / 180;
    
    const elevation = Math.asin(
        Math.sin(latRad) * Math.sin(sunLatRad) +
        Math.cos(latRad) * Math.cos(sunLatRad) * Math.cos(lngDiff)
    ) * 180 / Math.PI;
    
    return elevation;
}

// Calculate day/night terminator line points
function getTerminatorPoints(sunPos) {
    const points = [];
    for (let lng = -180; lng <= 180; lng += CONFIG.calculation.terminatorStep) {
        // Find latitude where solar elevation equals 0
        for (let lat = -90; lat <= 90; lat += 1) {
            const elevation = getSolarElevation(lat, lng, sunPos.lat, sunPos.lng);
            
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
                hour12: true
            });
            const sunsetStr = sunTimes.sunset.toLocaleTimeString('en-US', {
                timeZone: displayTimezone,
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
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
    
    // Update moon phase
    const moonPos = getLunarPosition(date);
    const moonSymbol = getMoonPhaseSymbol(moonPos.phase);
    const moonPhaseName = getMoonPhaseName(moonPos.phase);
    
    document.getElementById('moonSymbol').textContent = moonSymbol;
    document.getElementById('moonPhaseName').textContent = moonPhaseName;
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
            const mercatorN = (canvas.height / 2 - y) * 2 * Math.PI / canvas.width;
            const lat = Math.atan(Math.sinh(mercatorN)) * 180 / Math.PI;
            
            // Skip invalid latitudes
            if (lat > 85 || lat < -85) continue;
            
            const elevation = getSolarElevation(lat, lng, sunPos.lat, sunPos.lng);
            
            // Create overlay with different approach for grayscale
            let alpha = 0;
            let color;
            
            if (isGrayscale) {
                // Simplified 3-shade approach for 3-bit grayscale
                color = CONFIG.night.grayscale.color;
                if (elevation < CONFIG.solarElevation.grayscaleDeepNight) {
                    alpha = CONFIG.night.grayscale.opacity.deepNight; // Dark night (lighter to show map underneath)
                } else if (elevation < CONFIG.solarElevation.grayscaleTwilight) {
                    alpha = CONFIG.night.grayscale.opacity.twilight; // Twilight (lighter)
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
    
    // Draw terminator line
    if (CONFIG.visual.showTerminator){
        const terminatorPoints = getTerminatorPoints(sunPos);
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
    
    // Draw sun position with wrapping
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
    
    // Draw moon position with wrapping
    const moonPixel = latLngToPixel(moonPos.lat, moonPos.lng);
    if (moonPixel.y >= 0 && moonPixel.y <= canvas.height) {
        const drawMoon = (x, y) => {
            // Moon glow
            const moonConfig = CONFIG.moon;
            const moonGradient = ctx.createRadialGradient(x, y, 0, x, y, moonConfig.glowRadius);
            moonGradient.addColorStop(0, moonConfig.glowColor.start);
            moonGradient.addColorStop(1, moonConfig.glowColor.end);
            ctx.fillStyle = moonGradient;
            ctx.beginPath();
            ctx.arc(x, y, moonConfig.glowRadius, 0, 2 * Math.PI);
            ctx.fill();
            
            // Draw moon with phase
            const moonRadius = CONFIG.moon.radius;
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
                timeZoneName: 'short'
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
    
    document.getElementById('currentTime').textContent = timeDisplay;
    const moonPhaseName = getMoonPhaseName(moonPos.phase);
    const illumination = Math.round(moonPos.illuminatedFraction * 100);
    document.getElementById('sunPosition').textContent = 
        `Sun: ${sunPos.lat.toFixed(1)}°, ${sunPos.lng.toFixed(1)}°`;
    document.getElementById('moonPosition').textContent = 
        `Moon: ${moonPos.lat.toFixed(1)}°,${moonPos.lng.toFixed(1)}° (${moonPhaseName}, ${illumination}% illuminated)`;
    
    // Update solar info panel
    updateSolarInfoPanel(now);
}

// Initialize location and start the application
initializeLocation().then(() => {
    // Initial draw and set up auto-refresh (only if no custom timestamp)
    drawMap();
    if (!customTimestamp) {
        setInterval(drawMap, CONFIG.performance.updateInterval);
    }
});