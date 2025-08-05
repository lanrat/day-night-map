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
        canvas.width = 1000;
        canvas.height = 500;
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
        illuminatedFraction: illuminatedFraction
    };
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
    for (let lng = -180; lng <= 180; lng += 2) {
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

// Main drawing function
function drawMap() {
    const now = customTimestamp ? new Date(customTimestamp) : new Date();
    const sunPos = getSolarPosition(now);
    const moonPos = getLunarPosition(now);
    
    // Clear canvas (make transparent for overlay)
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw night overlay with optimized approach for grayscale
    const pixelSize = 2; // Balanced performance and quality
    
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
            let color = [0, 0, 30]; // Default blue for color mode
            
            if (isGrayscale) {
                // Simplified 3-shade approach for 3-bit grayscale
                color = [0, 0, 0]; // Pure black overlay
                if (elevation < -6) {
                    alpha = 0.70; // Dark night (lighter to show map underneath)
                } else if (elevation < 0) {
                    alpha = 0.25; // Twilight (lighter)
                }
            } else {
                // Original smooth gradient for color displays
                if (elevation < -12) {
                    alpha = 0.8; // Deep night
                } else if (elevation < -6) {
                    // Astronomical twilight
                    const factor = (elevation + 12) / 6;
                    alpha = 0.8 - (0.2 * factor);
                } else if (elevation < -1) {
                    // Nautical/civil twilight
                    const factor = (elevation + 6) / 5;
                    alpha = 0.6 - (0.4 * factor);
                } else if (elevation < 0) {
                    // Very light twilight at horizon
                    const factor = (elevation + 1) / 1;
                    alpha = 0.2 - (0.2 * factor);
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
    /*const terminatorPoints = getTerminatorPoints(sunPos);
    if (terminatorPoints.length > 1) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        terminatorPoints.forEach((point, i) => {
            if (i === 0) ctx.moveTo(point.x, point.y);
            else ctx.lineTo(point.x, point.y);
        });
        ctx.stroke();
    }*/
    
    // Draw sun position
    const sunPixel = latLngToPixel(sunPos.lat, sunPos.lng);
    if (sunPixel.y >= 0 && sunPixel.y <= canvas.height) {
        if (isGrayscale) {
            // High contrast sun for grayscale
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(sunPixel.x, sunPixel.y, 12, 0, 2 * Math.PI);
            ctx.fill();
            
            // Black border for contrast
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(sunPixel.x, sunPixel.y, 12, 0, 2 * Math.PI);
            ctx.stroke();
            
            // Add sun rays pattern
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 1;
            for (let i = 0; i < 8; i++) {
                const angle = (i * Math.PI) / 4;
                const x1 = sunPixel.x + Math.cos(angle) * 15;
                const y1 = sunPixel.y + Math.sin(angle) * 15;
                const x2 = sunPixel.x + Math.cos(angle) * 20;
                const y2 = sunPixel.y + Math.sin(angle) * 20;
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }
        } else {
            // Original color sun
            const gradient = ctx.createRadialGradient(sunPixel.x, sunPixel.y, 0, sunPixel.x, sunPixel.y, 30);
            gradient.addColorStop(0, 'rgba(255, 215, 0, 0.8)');
            gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(sunPixel.x, sunPixel.y, 30, 0, 2 * Math.PI);
            ctx.fill();
            
            // Sun core
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(sunPixel.x, sunPixel.y, 10, 0, 2 * Math.PI);
            ctx.fill();
        }
    }
    
    // Draw moon position
    const moonPixel = latLngToPixel(moonPos.lat, moonPos.lng);
    if (moonPixel.y >= 0 && moonPixel.y <= canvas.height) {
        // Moon glow
        const moonGradient = ctx.createRadialGradient(moonPixel.x, moonPixel.y, 0, moonPixel.x, moonPixel.y, 25);
        moonGradient.addColorStop(0, 'rgba(220, 220, 220, 0.8)');
        moonGradient.addColorStop(1, 'rgba(220, 220, 220, 0)');
        ctx.fillStyle = moonGradient;
        ctx.beginPath();
        ctx.arc(moonPixel.x, moonPixel.y, 25, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw moon with phase
        const moonRadius = 10;
        ctx.save();
        ctx.translate(moonPixel.x, moonPixel.y);
        
        // Create clipping circle for moon
        ctx.beginPath();
        ctx.arc(0, 0, moonRadius, 0, 2 * Math.PI);
        ctx.clip();
        
        // Fill with dark color (shadow)
        ctx.fillStyle = isGrayscale ? 'black' : '#606060';
        ctx.fillRect(-moonRadius, -moonRadius, moonRadius * 2, moonRadius * 2);
        
        // Draw the illuminated part based on actual illuminated fraction
        ctx.fillStyle = isGrayscale ? 'white' : '#F0F0F0';
        const illuminatedFraction = moonPos.illuminatedFraction;
        const phase = moonPos.phase;
        
        // The terminator position determines how much of the moon we see
        // illuminatedFraction = 0.5 means exactly half lit (quarter phases)
        // illuminatedFraction = 0 means new moon (fully dark)
        // illuminatedFraction = 1 means full moon (fully lit)
        
        if (phase < 180) {
            // Waxing - light on right side
            if (illuminatedFraction <= 0.5) {
                // Crescent phase (0% to 50% illuminated)
                // The terminator curves from the left edge inward
                const terminatorX = moonRadius * (1 - 2 * illuminatedFraction);
                
                ctx.beginPath();
                ctx.arc(0, 0, moonRadius, -Math.PI/2, Math.PI/2);
                ctx.quadraticCurveTo(terminatorX, 0, 0, -moonRadius);
                ctx.quadraticCurveTo(terminatorX, 0, 0, moonRadius);
                ctx.fill();
            } else {
                // Gibbous phase (50% to 100% illuminated)
                // The terminator curves from center outward to left edge
                const t = (illuminatedFraction - 0.5) * 2; // 0 to 1
                const terminatorX = -moonRadius * t;
                
                // Fill entire right half
                ctx.fillRect(0, -moonRadius, moonRadius, moonRadius * 2);
                
                // Add the curved part on the left
                ctx.beginPath();
                ctx.moveTo(0, -moonRadius);
                ctx.quadraticCurveTo(terminatorX, 0, 0, moonRadius);
                ctx.quadraticCurveTo(terminatorX, 0, 0, -moonRadius);
                ctx.closePath();
                ctx.fill();
            }
        } else {
            // Waning - light on left side
            if (illuminatedFraction <= 0.5) {
                // Crescent phase (0% to 50% illuminated)
                // The terminator curves from the right edge inward
                const terminatorX = -moonRadius * (1 - 2 * illuminatedFraction);
                
                ctx.beginPath();
                ctx.arc(0, 0, moonRadius, Math.PI/2, 3*Math.PI/2);
                ctx.quadraticCurveTo(terminatorX, 0, 0, moonRadius);
                ctx.quadraticCurveTo(terminatorX, 0, 0, -moonRadius);
                ctx.fill();
            } else {
                // Gibbous phase (50% to 100% illuminated)
                // The terminator curves from center outward to right edge
                const t = (illuminatedFraction - 0.5) * 2; // 0 to 1
                const terminatorX = moonRadius * t;
                
                // Fill entire left half
                ctx.fillRect(-moonRadius, -moonRadius, moonRadius, moonRadius * 2);
                
                // Add the curved part on the right
                ctx.beginPath();
                ctx.moveTo(0, -moonRadius);
                ctx.quadraticCurveTo(terminatorX, 0, 0, moonRadius);
                ctx.quadraticCurveTo(terminatorX, 0, 0, -moonRadius);
                ctx.closePath();
                ctx.fill();
            }
        }
        
        ctx.restore();
    }
    
    
    // Update info display
    const timeString = now.toUTCString().replace(/:\d{2} GMT$/, ' GMT');
    document.getElementById('currentTime').textContent = 
        `Current UTC Time:\n${timeString}`;
    const moonPhaseName = getMoonPhaseName(moonPos.phase);
    const illumination = Math.round(moonPos.illuminatedFraction * 100);
    document.getElementById('sunPosition').textContent = 
        `Sun: ${sunPos.lat.toFixed(1)}°, ${sunPos.lng.toFixed(1)}°`;
    document.getElementById('moonPosition').textContent = 
        `Moon: ${moonPos.lat.toFixed(1)}°,${moonPos.lng.toFixed(1)}°\n(${moonPhaseName}, ${illumination}% illuminated)`;
}

// Initial draw and set up auto-refresh (only if no custom timestamp)
drawMap();
if (!customTimestamp) {
    setInterval(drawMap, 60000); // Update every minute
}