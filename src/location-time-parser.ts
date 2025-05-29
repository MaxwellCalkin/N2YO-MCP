export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  name: string;
  country?: string;
}

export interface ParsedDateTime {
  timestamp: number;
  timezone?: string;
  description: string;
}

export class LocationTimeParser {
  // Major countries and cities with their approximate center coordinates
  private static readonly LOCATION_DATABASE: Record<string, LocationCoordinates> = {
    // Countries
    "france": { latitude: 46.2276, longitude: 2.2137, name: "France", country: "France" },
    "germany": { latitude: 51.1657, longitude: 10.4515, name: "Germany", country: "Germany" },
    "spain": { latitude: 40.4637, longitude: -3.7492, name: "Spain", country: "Spain" },
    "italy": { latitude: 41.8719, longitude: 12.5674, name: "Italy", country: "Italy" },
    "united kingdom": { latitude: 55.3781, longitude: -3.4360, name: "United Kingdom", country: "UK" },
    "uk": { latitude: 55.3781, longitude: -3.4360, name: "United Kingdom", country: "UK" },
    "england": { latitude: 52.3555, longitude: -1.1743, name: "England", country: "UK" },
    "usa": { latitude: 39.8283, longitude: -98.5795, name: "United States", country: "USA" },
    "united states": { latitude: 39.8283, longitude: -98.5795, name: "United States", country: "USA" },
    "america": { latitude: 39.8283, longitude: -98.5795, name: "United States", country: "USA" },
    "canada": { latitude: 56.1304, longitude: -106.3468, name: "Canada", country: "Canada" },
    "china": { latitude: 35.8617, longitude: 104.1954, name: "China", country: "China" },
    "russia": { latitude: 61.5240, longitude: 105.3188, name: "Russia", country: "Russia" },
    "japan": { latitude: 36.2048, longitude: 138.2529, name: "Japan", country: "Japan" },
    "india": { latitude: 20.5937, longitude: 78.9629, name: "India", country: "India" },
    "australia": { latitude: -25.2744, longitude: 133.7751, name: "Australia", country: "Australia" },
    "brazil": { latitude: -14.2350, longitude: -51.9253, name: "Brazil", country: "Brazil" },
    "mexico": { latitude: 23.6345, longitude: -102.5528, name: "Mexico", country: "Mexico" },
    "south korea": { latitude: 35.9078, longitude: 127.7669, name: "South Korea", country: "South Korea" },
    "netherlands": { latitude: 52.1326, longitude: 5.2913, name: "Netherlands", country: "Netherlands" },
    "poland": { latitude: 51.9194, longitude: 19.1451, name: "Poland", country: "Poland" },
    "ukraine": { latitude: 48.3794, longitude: 31.1656, name: "Ukraine", country: "Ukraine" },
    "turkey": { latitude: 38.9637, longitude: 35.2433, name: "Turkey", country: "Turkey" },
    "israel": { latitude: 31.0461, longitude: 34.8516, name: "Israel", country: "Israel" },
    "saudi arabia": { latitude: 23.8859, longitude: 45.0792, name: "Saudi Arabia", country: "Saudi Arabia" },
    "iran": { latitude: 32.4279, longitude: 53.6880, name: "Iran", country: "Iran" },
    "egypt": { latitude: 26.0975, longitude: 30.0444, name: "Egypt", country: "Egypt" },
    "south africa": { latitude: -30.5595, longitude: 22.9375, name: "South Africa", country: "South Africa" },
    "nigeria": { latitude: 9.0820, longitude: 8.6753, name: "Nigeria", country: "Nigeria" },
    "argentina": { latitude: -38.4161, longitude: -63.6167, name: "Argentina", country: "Argentina" },
    "chile": { latitude: -35.6751, longitude: -71.5430, name: "Chile", country: "Chile" },
    "colombia": { latitude: 4.5709, longitude: -74.2973, name: "Colombia", country: "Colombia" },
    "peru": { latitude: -9.1900, longitude: -75.0152, name: "Peru", country: "Peru" },
    "venezuela": { latitude: 6.4238, longitude: -66.5897, name: "Venezuela", country: "Venezuela" },
    "ecuador": { latitude: -1.8312, longitude: -78.1834, name: "Ecuador", country: "Ecuador" },
    "bolivia": { latitude: -16.2902, longitude: -63.5887, name: "Bolivia", country: "Bolivia" },
    "uruguay": { latitude: -32.5228, longitude: -55.7658, name: "Uruguay", country: "Uruguay" },
    "paraguay": { latitude: -23.4425, longitude: -58.4438, name: "Paraguay", country: "Paraguay" },
    
    // Major cities
    "paris": { latitude: 48.8566, longitude: 2.3522, name: "Paris", country: "France" },
    "london": { latitude: 51.5074, longitude: -0.1278, name: "London", country: "UK" },
    "berlin": { latitude: 52.5200, longitude: 13.4050, name: "Berlin", country: "Germany" },
    "madrid": { latitude: 40.4168, longitude: -3.7038, name: "Madrid", country: "Spain" },
    "rome": { latitude: 41.9028, longitude: 12.4964, name: "Rome", country: "Italy" },
    "new york": { latitude: 40.7128, longitude: -74.0060, name: "New York", country: "USA" },
    "los angeles": { latitude: 34.0522, longitude: -118.2437, name: "Los Angeles", country: "USA" },
    "chicago": { latitude: 41.8781, longitude: -87.6298, name: "Chicago", country: "USA" },
    "houston": { latitude: 29.7604, longitude: -95.3698, name: "Houston", country: "USA" },
    "toronto": { latitude: 43.6532, longitude: -79.3832, name: "Toronto", country: "Canada" },
    "vancouver": { latitude: 49.2827, longitude: -123.1207, name: "Vancouver", country: "Canada" },
    "tokyo": { latitude: 35.6762, longitude: 139.6503, name: "Tokyo", country: "Japan" },
    "beijing": { latitude: 39.9042, longitude: 116.4074, name: "Beijing", country: "China" },
    "shanghai": { latitude: 31.2304, longitude: 121.4737, name: "Shanghai", country: "China" },
    "moscow": { latitude: 55.7558, longitude: 37.6176, name: "Moscow", country: "Russia" },
    "mumbai": { latitude: 19.0760, longitude: 72.8777, name: "Mumbai", country: "India" },
    "delhi": { latitude: 28.7041, longitude: 77.1025, name: "Delhi", country: "India" },
    "sydney": { latitude: -33.8688, longitude: 151.2093, name: "Sydney", country: "Australia" },
    "melbourne": { latitude: -37.8136, longitude: 144.9631, name: "Melbourne", country: "Australia" },
    "sao paulo": { latitude: -23.5505, longitude: -46.6333, name: "São Paulo", country: "Brazil" },
    "rio de janeiro": { latitude: -22.9068, longitude: -43.1729, name: "Rio de Janeiro", country: "Brazil" },
    "mexico city": { latitude: 19.4326, longitude: -99.1332, name: "Mexico City", country: "Mexico" },
    "amsterdam": { latitude: 52.3676, longitude: 4.9041, name: "Amsterdam", country: "Netherlands" },
    "brussels": { latitude: 50.8503, longitude: 4.3517, name: "Brussels", country: "Belgium" },
    "zurich": { latitude: 47.3769, longitude: 8.5417, name: "Zurich", country: "Switzerland" },
    "vienna": { latitude: 48.2082, longitude: 16.3738, name: "Vienna", country: "Austria" },
    "stockholm": { latitude: 59.3293, longitude: 18.0686, name: "Stockholm", country: "Sweden" },
    "copenhagen": { latitude: 55.6761, longitude: 12.5683, name: "Copenhagen", country: "Denmark" },
    "oslo": { latitude: 59.9139, longitude: 10.7522, name: "Oslo", country: "Norway" },
    "helsinki": { latitude: 60.1699, longitude: 24.9384, name: "Helsinki", country: "Finland" },
    "warsaw": { latitude: 52.2297, longitude: 21.0122, name: "Warsaw", country: "Poland" },
    "prague": { latitude: 50.0755, longitude: 14.4378, name: "Prague", country: "Czech Republic" },
    "budapest": { latitude: 47.4979, longitude: 19.0402, name: "Budapest", country: "Hungary" },
    "bucharest": { latitude: 44.4268, longitude: 26.1025, name: "Bucharest", country: "Romania" },
    "athens": { latitude: 37.9838, longitude: 23.7275, name: "Athens", country: "Greece" },
    "istanbul": { latitude: 41.0082, longitude: 28.9784, name: "Istanbul", country: "Turkey" },
    "tel aviv": { latitude: 32.0853, longitude: 34.7818, name: "Tel Aviv", country: "Israel" },
    "jerusalem": { latitude: 31.7683, longitude: 35.2137, name: "Jerusalem", country: "Israel" },
    "dubai": { latitude: 25.2048, longitude: 55.2708, name: "Dubai", country: "UAE" },
    "riyadh": { latitude: 24.7136, longitude: 46.6753, name: "Riyadh", country: "Saudi Arabia" },
    "cairo": { latitude: 30.0444, longitude: 31.2357, name: "Cairo", country: "Egypt" },
    "cape town": { latitude: -33.9249, longitude: 18.4241, name: "Cape Town", country: "South Africa" },
    "johannesburg": { latitude: -26.2041, longitude: 28.0473, name: "Johannesburg", country: "South Africa" },
    "lagos": { latitude: 6.5244, longitude: 3.3792, name: "Lagos", country: "Nigeria" },
    "buenos aires": { latitude: -34.6118, longitude: -58.3960, name: "Buenos Aires", country: "Argentina" },
    "santiago": { latitude: -33.4489, longitude: -70.6693, name: "Santiago", country: "Chile" },
    "bogota": { latitude: 4.7110, longitude: -74.0721, name: "Bogotá", country: "Colombia" },
    "lima": { latitude: -12.0464, longitude: -77.0428, name: "Lima", country: "Peru" },
    "caracas": { latitude: 10.4806, longitude: -66.9036, name: "Caracas", country: "Venezuela" },
    "quito": { latitude: -0.1807, longitude: -78.4678, name: "Quito", country: "Ecuador" },
    "la paz": { latitude: -16.5000, longitude: -68.1193, name: "La Paz", country: "Bolivia" },
    "montevideo": { latitude: -34.9011, longitude: -56.1645, name: "Montevideo", country: "Uruguay" },
    "asuncion": { latitude: -25.2637, longitude: -57.5759, name: "Asunción", country: "Paraguay" },
  };

  static parseLocation(locationText: string): LocationCoordinates | null {
    const normalized = locationText.toLowerCase().trim();
    
    // Direct lookup
    if (this.LOCATION_DATABASE[normalized]) {
      return this.LOCATION_DATABASE[normalized];
    }

    // Try partial matches
    for (const [key, coords] of Object.entries(this.LOCATION_DATABASE)) {
      if (key.includes(normalized) || normalized.includes(key)) {
        return coords;
      }
    }

    // Try with common variations
    const variations = [
      normalized.replace(/\s+/g, ""),
      normalized.replace(/\s+/g, " "),
      normalized.replace(/^the\s+/, ""),
    ];

    for (const variation of variations) {
      if (this.LOCATION_DATABASE[variation]) {
        return this.LOCATION_DATABASE[variation];
      }
    }

    return null;
  }

  static parseDateTime(timeText: string, referenceLocation?: LocationCoordinates): ParsedDateTime | null {
    const now = new Date();
    const normalized = timeText.toLowerCase().trim();

    // Handle relative times like "tonight", "6:00 tonight", "tomorrow morning", etc.
    if (normalized.includes("tonight") || normalized.includes("this evening")) {
      const today = new Date(now);
      today.setHours(21, 0, 0, 0); // Default to 9 PM
      
      // Look for specific time like "6:00 tonight"
      const timeMatch = normalized.match(/(\d{1,2}):?(\d{2})?\s*(?:pm|am)?/);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2] || "0");
        
        // If no AM/PM specified and it's a reasonable evening time, assume PM
        if (!normalized.includes("am") && !normalized.includes("pm") && hours <= 12) {
          if (hours < 6) hours += 12; // 6:00 tonight = 6 PM, not 6 AM
        } else if (normalized.includes("pm") && hours < 12) {
          hours += 12;
        }
        
        today.setHours(hours, minutes, 0, 0);
      }
      
      return {
        timestamp: Math.floor(today.getTime() / 1000),
        description: `Tonight at ${today.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`,
      };
    }

    if (normalized.includes("tomorrow")) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      if (normalized.includes("morning")) {
        tomorrow.setHours(9, 0, 0, 0);
      } else if (normalized.includes("afternoon")) {
        tomorrow.setHours(15, 0, 0, 0);
      } else if (normalized.includes("evening") || normalized.includes("night")) {
        tomorrow.setHours(21, 0, 0, 0);
      } else {
        // Look for specific time
        const timeMatch = normalized.match(/(\d{1,2}):?(\d{2})?\s*(?:pm|am)?/);
        if (timeMatch) {
          let hours = parseInt(timeMatch[1]);
          const minutes = parseInt(timeMatch[2] || "0");
          
          if (normalized.includes("pm") && hours < 12) {
            hours += 12;
          } else if (normalized.includes("am") && hours === 12) {
            hours = 0;
          }
          
          tomorrow.setHours(hours, minutes, 0, 0);
        } else {
          tomorrow.setHours(12, 0, 0, 0); // Default to noon
        }
      }
      
      return {
        timestamp: Math.floor(tomorrow.getTime() / 1000),
        description: `Tomorrow at ${tomorrow.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`,
      };
    }

    if (normalized.includes("now") || normalized.includes("currently") || normalized.includes("right now")) {
      return {
        timestamp: Math.floor(now.getTime() / 1000),
        description: "Right now",
      };
    }

    // Handle "in X hours/minutes"
    const inTimeMatch = normalized.match(/in\s+(\d+)\s+(hour|minute)s?/);
    if (inTimeMatch) {
      const amount = parseInt(inTimeMatch[1]);
      const unit = inTimeMatch[2];
      const future = new Date(now);
      
      if (unit === "hour") {
        future.setHours(future.getHours() + amount);
      } else {
        future.setMinutes(future.getMinutes() + amount);
      }
      
      return {
        timestamp: Math.floor(future.getTime() / 1000),
        description: `In ${amount} ${unit}${amount > 1 ? 's' : ''}`,
      };
    }

    // Handle specific times like "6:00 PM", "18:00", "6 PM"
    const timeMatch = normalized.match(/(\d{1,2}):?(\d{2})?\s*(pm|am)?/);
    if (timeMatch) {
      const today = new Date(now);
      let hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2] || "0");
      const period = timeMatch[3];
      
      if (period === "pm" && hours < 12) {
        hours += 12;
      } else if (period === "am" && hours === 12) {
        hours = 0;
      } else if (!period && hours <= 12) {
        // No AM/PM specified, guess based on current time and reasonableness
        const currentHour = now.getHours();
        if (hours < 6 && currentHour >= 12) {
          hours += 12; // Assume PM for times before 6 if it's already afternoon
        }
      }
      
      today.setHours(hours, minutes, 0, 0);
      
      // If the time has already passed today, assume tomorrow
      if (today < now) {
        today.setDate(today.getDate() + 1);
      }
      
      return {
        timestamp: Math.floor(today.getTime() / 1000),
        description: `Today at ${today.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`,
      };
    }

    return null;
  }

  static extractLocationAndTime(query: string): {
    location?: LocationCoordinates;
    time?: ParsedDateTime;
    cleanQuery: string;
  } {
    const normalized = query.toLowerCase();
    
    // Extract location patterns
    const locationPatterns = [
      /over\s+([a-zA-Z\s]+?)(?:\s+at|\s+tonight|\s+tomorrow|\s+in\s+\d+|\s+now|\s*$)/,
      /in\s+([a-zA-Z\s]+?)(?:\s+at|\s+tonight|\s+tomorrow|\s+in\s+\d+|\s+now|\s*$)/,
      /above\s+([a-zA-Z\s]+?)(?:\s+at|\s+tonight|\s+tomorrow|\s+in\s+\d+|\s+now|\s*$)/,
    ];

    let location: LocationCoordinates | undefined;
    let locationMatch = "";

    for (const pattern of locationPatterns) {
      const match = normalized.match(pattern);
      if (match) {
        locationMatch = match[1].trim();
        location = this.parseLocation(locationMatch) || undefined;
        if (location) break;
      }
    }

    // Extract time patterns
    const timePatterns = [
      /at\s+([^,]+?)(?:\s+over|\s+in|\s+above|\s*$)/,
      /(tonight|tomorrow|now|currently|right now)/,
      /(in\s+\d+\s+(?:hour|minute)s?)/,
      /(\d{1,2}:?\d{0,2}\s*(?:pm|am)?)/,
    ];

    let time: ParsedDateTime | undefined;
    let timeMatch = "";

    for (const pattern of timePatterns) {
      const match = normalized.match(pattern);
      if (match) {
        timeMatch = match[1].trim();
        time = this.parseDateTime(timeMatch, location) || undefined;
        if (time) break;
      }
    }

    // Create clean query by removing location and time references
    let cleanQuery = query;
    if (locationMatch) {
      cleanQuery = cleanQuery.replace(new RegExp(`\\b(?:over|in|above)\\s+${locationMatch}\\b`, 'gi'), '');
    }
    if (timeMatch) {
      cleanQuery = cleanQuery.replace(new RegExp(`\\b(?:at\\s+)?${timeMatch}\\b`, 'gi'), '');
    }
    cleanQuery = cleanQuery.replace(/\s+/g, ' ').trim();

    return { location, time, cleanQuery };
  }

  static getAllSupportedLocations(): LocationCoordinates[] {
    return Object.values(this.LOCATION_DATABASE);
  }
}