export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class SatelliteValidator {
  static validateNoradId(noradId: string): void {
    if (!noradId || typeof noradId !== "string") {
      throw new ValidationError("NORAD ID is required and must be a string");
    }
    
    if (!/^\d{1,6}$/.test(noradId)) {
      throw new ValidationError("NORAD ID must be a numeric string (1-6 digits)");
    }
  }

  static validateCoordinates(lat: number, lng: number, alt?: number): void {
    if (typeof lat !== "number" || lat < -90 || lat > 90) {
      throw new ValidationError("Latitude must be a number between -90 and 90 degrees");
    }

    if (typeof lng !== "number" || lng < -180 || lng > 180) {
      throw new ValidationError("Longitude must be a number between -180 and 180 degrees");
    }

    if (alt !== undefined && (typeof alt !== "number" || alt < -1000 || alt > 50000)) {
      throw new ValidationError("Altitude must be a number between -1000 and 50000 meters");
    }
  }

  static validateCategory(category: string): void {
    const validCategories = [
      "military", "weather", "gps", "navigation", "amateur", 
      "geostationary", "noaa", "starlink", "space-stations", "earth-resources"
    ];

    if (!category || typeof category !== "string") {
      throw new ValidationError("Category is required and must be a string");
    }

    if (!validCategories.includes(category)) {
      throw new ValidationError(`Category must be one of: ${validCategories.join(", ")}`);
    }
  }

  static validateCountry(country?: string): void {
    if (country !== undefined) {
      if (typeof country !== "string" || country.length < 2 || country.length > 10) {
        throw new ValidationError("Country code must be a string between 2-10 characters");
      }

      if (!/^[a-zA-Z]+$/.test(country)) {
        throw new ValidationError("Country code must contain only letters");
      }
    }
  }

  static validateSearchRadius(radius: number): void {
    if (typeof radius !== "number" || radius < 1 || radius > 90) {
      throw new ValidationError("Search radius must be a number between 1 and 90 degrees");
    }
  }

  static validateDays(days: number): void {
    if (typeof days !== "number" || days < 1 || days > 10) {
      throw new ValidationError("Days must be a number between 1 and 10");
    }
  }

  static validateSeconds(seconds: number): void {
    if (typeof seconds !== "number" || seconds < 0 || seconds > 300) {
      throw new ValidationError("Seconds must be a number between 0 and 300");
    }
  }

  static validateVisibility(visibility: number): void {
    if (typeof visibility !== "number" || visibility < 1 || visibility > 300) {
      throw new ValidationError("Minimum visibility must be a number between 1 and 300 seconds");
    }
  }

  static validateApiKey(apiKey: string): void {
    if (!apiKey || typeof apiKey !== "string") {
      throw new ValidationError("API key is required and must be a string");
    }

    if (apiKey.length < 10 || apiKey.length > 100) {
      throw new ValidationError("API key must be between 10 and 100 characters");
    }

    if (!/^[a-zA-Z0-9-_]+$/.test(apiKey)) {
      throw new ValidationError("API key must contain only alphanumeric characters, hyphens, and underscores");
    }
  }

  static validatePositionRequest(args: any): void {
    this.validateNoradId(args.noradId);
    this.validateCoordinates(args.observerLat, args.observerLng, args.observerAlt);
    
    if (args.seconds !== undefined) {
      this.validateSeconds(args.seconds);
    }
  }

  static validateVisualPassRequest(args: any): void {
    this.validateNoradId(args.noradId);
    this.validateCoordinates(args.observerLat, args.observerLng, args.observerAlt);
    
    if (args.days !== undefined) {
      this.validateDays(args.days);
    }

    if (args.minVisibility !== undefined) {
      this.validateVisibility(args.minVisibility);
    }
  }

  static validateAboveRequest(args: any): void {
    this.validateCoordinates(args.observerLat, args.observerLng, args.observerAlt);
    
    if (args.searchRadius !== undefined) {
      this.validateSearchRadius(args.searchRadius);
    }

    if (args.categoryFilter && args.categoryFilter !== "all") {
      this.validateCategory(args.categoryFilter);
    }
  }
}