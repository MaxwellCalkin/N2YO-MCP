export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class SpaceValidator {
  static validateNoradId(noradId: string): void {
    if (!noradId || typeof noradId !== "string") {
      throw new ValidationError("NORAD ID is required and must be a string");
    }
    
    if (!/^\d{1,9}$/.test(noradId)) {
      throw new ValidationError("NORAD ID must be a numeric string (1-9 digits)");
    }
  }

  static validateTle(tle: any): void {
    if (!tle || typeof tle !== "object") {
      throw new ValidationError("TLE data is required and must be an object");
    }

    if (!tle.line1 || typeof tle.line1 !== "string" || tle.line1.length !== 69) {
      throw new ValidationError("TLE line1 must be exactly 69 characters");
    }

    if (!tle.line2 || typeof tle.line2 !== "string" || tle.line2.length !== 69) {
      throw new ValidationError("TLE line2 must be exactly 69 characters");
    }

    if (!tle.epoch || typeof tle.epoch !== "string") {
      throw new ValidationError("TLE epoch is required");
    }

    if (isNaN(Date.parse(tle.epoch))) {
      throw new ValidationError("TLE epoch must be a valid ISO date string");
    }

    const catalogNumber1 = tle.line1.substring(2, 7).trim();
    const catalogNumber2 = tle.line2.substring(2, 7).trim();
    
    if (catalogNumber1 !== catalogNumber2) {
      throw new ValidationError("Catalog numbers in TLE lines must match");
    }

    const checksum1 = this.calculateTleChecksum(tle.line1.substring(0, 68));
    const checksum2 = this.calculateTleChecksum(tle.line2.substring(0, 68));
    
    if (parseInt(tle.line1.charAt(68)) !== checksum1) {
      throw new ValidationError("TLE line1 checksum is invalid");
    }
    
    if (parseInt(tle.line2.charAt(68)) !== checksum2) {
      throw new ValidationError("TLE line2 checksum is invalid");
    }
  }

  static validateSpaceObject(obj: any): void {
    if (!obj || typeof obj !== "object") {
      throw new ValidationError("Space object data is required");
    }

    this.validateNoradId(obj.noradId);

    if (!obj.name || typeof obj.name !== "string" || obj.name.length === 0) {
      throw new ValidationError("Object name is required");
    }

    if (obj.name.length > 24) {
      throw new ValidationError("Object name must be 24 characters or less");
    }

    this.validateTle(obj.tle);

    const validTypes = ["satellite", "debris", "rocket body", "unknown"];
    if (!obj.objectType || !validTypes.includes(obj.objectType)) {
      throw new ValidationError(`Object type must be one of: ${validTypes.join(", ")}`);
    }

    if (obj.classification) {
      const validClassifications = ["unclassified", "cui", "secret"];
      if (!validClassifications.includes(obj.classification)) {
        throw new ValidationError(`Classification must be one of: ${validClassifications.join(", ")}`);
      }
    }

    if (obj.source && (typeof obj.source !== "string" || obj.source.length > 100)) {
      throw new ValidationError("Source must be a string of 100 characters or less");
    }
  }

  static validateTimestamp(timestamp: string): void {
    if (!timestamp || typeof timestamp !== "string") {
      throw new ValidationError("Timestamp is required and must be a string");
    }

    if (isNaN(Date.parse(timestamp))) {
      throw new ValidationError("Timestamp must be a valid ISO date string");
    }
  }

  static validateConjunctionRequest(request: any): void {
    if (!request || typeof request !== "object") {
      throw new ValidationError("Conjunction request is required");
    }

    this.validateNoradId(request.primaryObject);

    if (!request.timeWindow || typeof request.timeWindow !== "object") {
      throw new ValidationError("Time window is required");
    }

    this.validateTimestamp(request.timeWindow.start);
    this.validateTimestamp(request.timeWindow.end);

    const startTime = new Date(request.timeWindow.start);
    const endTime = new Date(request.timeWindow.end);
    
    if (startTime >= endTime) {
      throw new ValidationError("Start time must be before end time");
    }

    if (request.threshold !== undefined) {
      if (typeof request.threshold !== "number" || request.threshold <= 0) {
        throw new ValidationError("Threshold must be a positive number");
      }
    }
  }

  static validateSearchCriteria(criteria: any): void {
    if (criteria.epochRange) {
      if (!criteria.epochRange.start || !criteria.epochRange.end) {
        throw new ValidationError("Epoch range must have both start and end dates");
      }
      
      this.validateTimestamp(criteria.epochRange.start);
      this.validateTimestamp(criteria.epochRange.end);
    }

    if (criteria.objectType) {
      const validTypes = ["satellite", "debris", "rocket body", "unknown"];
      if (!validTypes.includes(criteria.objectType)) {
        throw new ValidationError(`Object type must be one of: ${validTypes.join(", ")}`);
      }
    }

    if (criteria.classification) {
      const validClassifications = ["unclassified", "cui", "secret"];
      if (!validClassifications.includes(criteria.classification)) {
        throw new ValidationError(`Classification must be one of: ${validClassifications.join(", ")}`);
      }
    }
  }

  private static calculateTleChecksum(line: string): number {
    let checksum = 0;
    for (let i = 0; i < line.length; i++) {
      const char = line.charAt(i);
      if (char >= "0" && char <= "9") {
        checksum += parseInt(char);
      } else if (char === "-") {
        checksum += 1;
      }
    }
    return checksum % 10;
  }

  static validateOrbitalElements(elements: any): void {
    const required = ["inclination", "raan", "eccentricity", "argOfPerigee", "meanAnomaly", "meanMotion"];
    
    for (const field of required) {
      if (elements[field] === undefined || typeof elements[field] !== "number") {
        throw new ValidationError(`${field} is required and must be a number`);
      }
    }

    if (elements.inclination < 0 || elements.inclination > 180) {
      throw new ValidationError("Inclination must be between 0 and 180 degrees");
    }

    if (elements.eccentricity < 0 || elements.eccentricity >= 1) {
      throw new ValidationError("Eccentricity must be between 0 and 1");
    }

    if (elements.meanMotion <= 0) {
      throw new ValidationError("Mean motion must be positive");
    }
  }
}