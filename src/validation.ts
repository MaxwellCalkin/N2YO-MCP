export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export interface ValidationRule {
  required?: boolean;
  type?: "string" | "number" | "boolean" | "object" | "array";
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  validator?: (value: any) => boolean;
  message?: string;
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

export class Validator {
  static validate(data: any, schema: ValidationSchema): void {
    for (const [field, rule] of Object.entries(schema)) {
      const value = data[field];

      if (rule.required && (value === undefined || value === null)) {
        throw new ValidationError(rule.message || `Field '${field}' is required`, field);
      }

      if (value !== undefined && value !== null) {
        this.validateField(value, rule, field);
      }
    }
  }

  private static validateField(value: any, rule: ValidationRule, field: string): void {
    if (rule.type && typeof value !== rule.type) {
      throw new ValidationError(
        rule.message || `Field '${field}' must be of type ${rule.type}`,
        field
      );
    }

    if (rule.minLength !== undefined && typeof value === "string" && value.length < rule.minLength) {
      throw new ValidationError(
        rule.message || `Field '${field}' must be at least ${rule.minLength} characters long`,
        field
      );
    }

    if (rule.maxLength !== undefined && typeof value === "string" && value.length > rule.maxLength) {
      throw new ValidationError(
        rule.message || `Field '${field}' must be no more than ${rule.maxLength} characters long`,
        field
      );
    }

    if (rule.pattern && typeof value === "string" && !rule.pattern.test(value)) {
      throw new ValidationError(
        rule.message || `Field '${field}' does not match required pattern`,
        field
      );
    }

    if (rule.validator && !rule.validator(value)) {
      throw new ValidationError(
        rule.message || `Field '${field}' failed custom validation`,
        field
      );
    }
  }

  static validateKey(key: string): void {
    const keySchema: ValidationSchema = {
      key: {
        required: true,
        type: "string",
        minLength: 1,
        maxLength: 255,
        pattern: /^[a-zA-Z0-9._-]+$/,
        message: "Key must be 1-255 characters and contain only letters, numbers, dots, underscores, and hyphens",
      },
    };

    this.validate({ key }, keySchema);
  }

  static validateMetadata(metadata: any): void {
    if (metadata === null || metadata === undefined) {
      return;
    }

    if (typeof metadata !== "object" || Array.isArray(metadata)) {
      throw new ValidationError("Metadata must be an object");
    }

    const metadataSchema: ValidationSchema = {
      type: {
        type: "string",
        maxLength: 100,
      },
      source: {
        type: "string",
        maxLength: 255,
      },
      timestamp: {
        type: "string",
        validator: (value: string) => !isNaN(Date.parse(value)),
        message: "Timestamp must be a valid ISO date string",
      },
      tags: {
        type: "object",
        validator: (value: any) => {
          if (!Array.isArray(value)) return false;
          return value.every((tag: any) => 
            typeof tag === "string" && 
            tag.length > 0 && 
            tag.length <= 50 &&
            /^[a-zA-Z0-9._-]+$/.test(tag)
          );
        },
        message: "Tags must be an array of strings (1-50 chars, alphanumeric with dots, underscores, hyphens)",
      },
    };

    for (const [key, value] of Object.entries(metadata)) {
      if (metadataSchema[key]) {
        this.validateField(value, metadataSchema[key], key);
      } else {
        if (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") {
          throw new ValidationError(`Custom metadata field '${key}' must be string, number, or boolean`, key);
        }
      }
    }
  }

  static validateSearchQuery(query: string): void {
    const querySchema: ValidationSchema = {
      query: {
        required: true,
        type: "string",
        minLength: 1,
        maxLength: 1000,
        message: "Search query must be 1-1000 characters",
      },
    };

    this.validate({ query }, querySchema);
  }

  static sanitizeData(data: any): string {
    if (typeof data === "string") {
      return data;
    }
    
    try {
      return JSON.stringify(data);
    } catch (error) {
      throw new ValidationError("Data must be serializable to JSON");
    }
  }
}