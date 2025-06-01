import {
  Tool,
  Resource,
  CallToolResult,
  ReadResourceResult,
} from "@modelcontextprotocol/sdk/types.js";
import { N2YOClient } from "./n2yo-client.js";
import { SatelliteValidator, ValidationError } from "./satellite-validation.js";
import { SpaceValidator } from "./space-validation.js";
import { LocationTimeParser } from "./location-time-parser.js";
import { UDLAuthenticator } from "./auth.js";
import { SpaceCatalog } from "./space-catalog.js";

export class N2YOServer {
  private n2yoClient: N2YOClient;
  private authenticator: UDLAuthenticator;
  private spaceCatalog: SpaceCatalog;

  constructor(apiKey?: string) {
    this.n2yoClient = new N2YOClient(apiKey);
    this.authenticator = new UDLAuthenticator();
    this.spaceCatalog = new SpaceCatalog();
  }

  getTools(): Tool[] {
    return [
      {
        name: "set_n2yo_api_key",
        description: "Configure N2YO API key for satellite tracking",
        inputSchema: {
          type: "object",
          properties: {
            apiKey: {
              type: "string",
              description: "N2YO API key from your account",
            },
          },
          required: ["apiKey"],
        },
      },
      {
        name: "query_satellites_natural",
        description:
          "Answer natural language questions about satellites like 'What satellites will be over France at 6:00 tonight?'",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description:
                "Natural language query about satellites (e.g., 'What satellites will be over France at 6:00 tonight?', 'Show me military satellites above Germany now')",
            },
            categoryFilter: {
              type: "string",
              enum: [
                "all",
                "military",
                "weather",
                "gps",
                "amateur",
                "starlink",
                "space-stations",
              ],
              default: "all",
              description: "Optional filter for satellite category",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "get_satellite_tle",
        description:
          "Get Two-Line Element (TLE) data for a satellite by NORAD ID",
        inputSchema: {
          type: "object",
          properties: {
            noradId: {
              type: "string",
              description: "NORAD catalog number",
            },
          },
          required: ["noradId"],
        },
      },
      {
        name: "get_satellites_by_category",
        description:
          "Get satellites by predefined categories (military, weather, GPS, etc.)",
        inputSchema: {
          type: "object",
          properties: {
            category: {
              type: "string",
              enum: [
                "military",
                "weather",
                "gps",
                "navigation",
                "amateur",
                "geostationary",
                "noaa",
                "starlink",
                "space-stations",
                "earth-resources",
              ],
              description: "Satellite category to retrieve",
            },
            country: {
              type: "string",
              description:
                "Filter by country or organization (e.g., 'usa', 'china', 'russia')",
            },
          },
          required: ["category"],
        },
      },
      {
        name: "get_satellite_position",
        description:
          "Get current position of a satellite relative to an observer location",
        inputSchema: {
          type: "object",
          properties: {
            noradId: {
              type: "string",
              description: "NORAD catalog number of the satellite",
            },
            observerLat: {
              type: "number",
              description: "Observer latitude in degrees",
              minimum: -90,
              maximum: 90,
            },
            observerLng: {
              type: "number",
              description: "Observer longitude in degrees",
              minimum: -180,
              maximum: 180,
            },
            observerAlt: {
              type: "number",
              description: "Observer altitude in meters above sea level",
              default: 0,
            },
            seconds: {
              type: "number",
              description:
                "Number of seconds in the future for prediction (max 300)",
              default: 0,
              maximum: 300,
            },
          },
          required: ["noradId", "observerLat", "observerLng"],
        },
      },
      {
        name: "get_visual_passes",
        description:
          "Get upcoming visual passes of a satellite for an observer location",
        inputSchema: {
          type: "object",
          properties: {
            noradId: {
              type: "string",
              description: "NORAD catalog number of the satellite",
            },
            observerLat: {
              type: "number",
              description: "Observer latitude in degrees",
              minimum: -90,
              maximum: 90,
            },
            observerLng: {
              type: "number",
              description: "Observer longitude in degrees",
              minimum: -180,
              maximum: 180,
            },
            observerAlt: {
              type: "number",
              description: "Observer altitude in meters above sea level",
              default: 0,
            },
            days: {
              type: "number",
              description: "Number of days to look ahead (max 10)",
              default: 10,
              maximum: 10,
            },
            minVisibility: {
              type: "number",
              description: "Minimum visibility in seconds (max 300)",
              default: 300,
              maximum: 300,
            },
          },
          required: ["noradId", "observerLat", "observerLng"],
        },
      },

      {
        name: "get_satellites_above",
        description: "Get all satellites currently above an observer location",
        inputSchema: {
          type: "object",
          properties: {
            observerLat: {
              type: "number",
              description: "Observer latitude in degrees",
              minimum: -90,
              maximum: 90,
            },
            observerLng: {
              type: "number",
              description: "Observer longitude in degrees",
              minimum: -180,
              maximum: 180,
            },
            observerAlt: {
              type: "number",
              description: "Observer altitude in meters above sea level",
              default: 0,
            },
            searchRadius: {
              type: "number",
              description: "Search radius in degrees (max 90)",
              default: 70,
              maximum: 90,
            },
            categoryFilter: {
              type: "string",
              enum: ["all", "military", "weather", "gps", "amateur"],
              default: "all",
              description: "Filter results by satellite category",
            },
          },
          required: ["observerLat", "observerLng"],
        },
      },
    ];
  }

  getResources(): Resource[] {
    return [
      {
        uri: "n2yo://api/status",
        name: "N2YO API Status",
        description: "Current N2YO API configuration and usage status",
        mimeType: "application/json",
      },
      {
        uri: "n2yo://categories/list",
        name: "Satellite Categories",
        description: "Available satellite categories for searching",
        mimeType: "application/json",
      },
      {
        uri: "n2yo://countries/list",
        name: "Countries and Organizations",
        description:
          "Available countries and organizations for satellite filtering",
        mimeType: "application/json",
      },
      {
        uri: "n2yo://limits/info",
        name: "API Transaction Limits",
        description: "Information about N2YO API transaction limits and usage",
        mimeType: "application/json",
      },
    ];
  }

  async callTool(name: string, args: any): Promise<CallToolResult> {
    try {
      switch (name) {
        case "set_n2yo_api_key":
          return await this.setApiKey(args.apiKey);

        case "query_satellites_natural":
          return await this.querySatellitesNatural(
            args.query,
            args.categoryFilter
          );

        case "get_satellite_tle":
          return await this.getSatelliteTle(args.noradId);

        case "get_satellites_by_category":
          return await this.getSatellitesByCategory(
            args.category,
            args.country
          );

        case "get_satellite_position":
          return await this.getSatellitePosition(args);

        case "get_visual_passes":
          return await this.getVisualPasses(args);

        case "get_satellites_above":
          return await this.getSatellitesAbove(args);

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
        isError: true,
      };
    }
  }

  async readResource(uri: string): Promise<ReadResourceResult> {
    try {
      switch (uri) {
        case "n2yo://api/status":
          const status = {
            hasApiKey: this.n2yoClient.hasApiKey(),
            transactionCounts: this.n2yoClient.getTransactionCounts(),
            limits: this.n2yoClient.getApiLimits(),
          };
          return {
            contents: [
              {
                uri,
                mimeType: "application/json",
                text: JSON.stringify(status, null, 2),
              },
            ],
          };

        case "n2yo://categories/list":
          const categories = this.n2yoClient.getAvailableCategories();
          return {
            contents: [
              {
                uri,
                mimeType: "application/json",
                text: JSON.stringify(categories, null, 2),
              },
            ],
          };

        case "n2yo://countries/list":
          const countries = this.n2yoClient.getAvailableCountries();
          return {
            contents: [
              {
                uri,
                mimeType: "application/json",
                text: JSON.stringify(countries, null, 2),
              },
            ],
          };

        case "n2yo://limits/info":
          const limits = {
            daily_limits: this.n2yoClient.getApiLimits(),
            current_usage: this.n2yoClient.getTransactionCounts(),
            remaining: Object.fromEntries(
              Object.entries(this.n2yoClient.getApiLimits()).map(
                ([key, limit]) => [
                  key,
                  limit - (this.n2yoClient.getTransactionCounts() as any)[key],
                ]
              )
            ),
          };
          return {
            contents: [
              {
                uri,
                mimeType: "application/json",
                text: JSON.stringify(limits, null, 2),
              },
            ],
          };

        default:
          throw new Error(`Unknown resource: ${uri}`);
      }
    } catch (error) {
      throw new Error(
        `Failed to read resource ${uri}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  private async configureCredentials(args: any): Promise<CallToolResult> {
    await this.authenticator.storeCredentials({
      username: args.username,
      password: args.password,
      classification: args.classification,
      apiEndpoint: args.apiEndpoint,
    });

    return {
      content: [
        {
          type: "text",
          text: `Successfully configured UDL credentials for user: ${args.username} (${args.classification})`,
        },
      ],
    };
  }

  private async loginToUdl(args: any): Promise<CallToolResult> {
    let username = args.username;
    let password = args.password;

    if (!username || !password) {
      const stored = await this.authenticator.loadCredentials();
      if (!stored) {
        return {
          content: [
            {
              type: "text",
              text: "No credentials provided and no stored credentials found. Please configure credentials first.",
            },
          ],
          isError: true,
        };
      }
      username = stored.username;
      password = "*stored*";
    }

    const session = await this.authenticator.authenticateUser(
      username,
      password
    );

    return {
      content: [
        {
          type: "text",
          text: `Successfully authenticated as ${session.username} (${session.classification}). Session expires at ${session.expiresAt}`,
        },
      ],
    };
  }

  private async logoutFromUdl(): Promise<CallToolResult> {
    await this.authenticator.logout();

    return {
      content: [
        {
          type: "text",
          text: "Successfully logged out from UDL",
        },
      ],
    };
  }

  private async getAuthStatus(): Promise<CallToolResult> {
    const status = await this.authenticator.getAuthenticationStatus();

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(status, null, 2),
        },
      ],
    };
  }

  private async checkAuthentication(
    requiredPermission?: string
  ): Promise<void> {
    const status = await this.authenticator.getAuthenticationStatus();
    if (!status.isAuthenticated) {
      throw new Error(
        "Authentication required. Please login to UDL first using the 'login_to_udl' tool."
      );
    }

    if (requiredPermission) {
      const hasPermission = await this.authenticator.validatePermission(
        requiredPermission
      );
      if (!hasPermission) {
        throw new Error(
          `Insufficient permissions. Required: ${requiredPermission}`
        );
      }
    }

    // Set API headers for authenticated requests
    try {
      const headers = await this.authenticator.getApiHeaders();
      this.spaceCatalog.setApiHeaders(headers);
    } catch (error) {
      throw new Error("Failed to get API authentication headers");
    }
  }

  private async getSpaceObject(noradId: string): Promise<CallToolResult> {
    await this.checkAuthentication("objects:get");
    SpaceValidator.validateNoradId(noradId);

    const spaceObject = await this.spaceCatalog.getObject(noradId);
    if (!spaceObject) {
      return {
        content: [
          {
            type: "text",
            text: `No space object found with NORAD ID: ${noradId}`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(spaceObject, null, 2),
        },
      ],
    };
  }

  private async searchSpaceObjects(criteria: any): Promise<CallToolResult> {
    await this.checkAuthentication("objects:search");
    const results = await this.spaceCatalog.searchObjects(criteria);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            { objects: results, count: results.length },
            null,
            2
          ),
        },
      ],
    };
  }

  private async getConjunctions(args: any): Promise<CallToolResult> {
    await this.checkAuthentication("conjunctions:read");
    SpaceValidator.validateConjunctionRequest(args);

    const conjunctions = await this.spaceCatalog.getConjunctions(
      args.primaryObject,
      args.timeWindow,
      args.threshold || 5.0
    );

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            { conjunctions, count: conjunctions.length },
            null,
            2
          ),
        },
      ],
    };
  }

  private async getOrbitalPrediction(args: any): Promise<CallToolResult> {
    await this.checkAuthentication("predictions:read");
    SpaceValidator.validateNoradId(args.noradId);
    SpaceValidator.validateTimestamp(args.predictionTime);

    const prediction = await this.spaceCatalog.predictOrbit(
      args.noradId,
      args.predictionTime,
      args.propagationModel || "SGP4"
    );

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(prediction, null, 2),
        },
      ],
    };
  }

  private async getSpaceFenceData(args: any): Promise<CallToolResult> {
    await this.checkAuthentication("spacefence:read");
    SpaceValidator.validateNoradId(args.noradId);

    const observations = await this.spaceCatalog.getSpaceFenceObservations(
      args.noradId,
      args.timeRange
    );

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            { observations, count: observations.length },
            null,
            2
          ),
        },
      ],
    };
  }

  private async setApiKey(apiKey: string): Promise<CallToolResult> {
    SatelliteValidator.validateApiKey(apiKey);
    this.n2yoClient.setApiKey(apiKey);

    return {
      content: [
        {
          type: "text",
          text: "Successfully configured N2YO API key",
        },
      ],
    };
  }

  private async querySatellitesNatural(
    query: string,
    categoryFilter: string = "all"
  ): Promise<CallToolResult> {
    try {
      // Parse the natural language query
      const parsed = LocationTimeParser.extractLocationAndTime(query);

      if (!parsed.location) {
        return {
          content: [
            {
              type: "text",
              text: "Could not identify a location in your query. Please specify a location like 'France', 'New York', or 'Germany'.",
            },
          ],
          isError: true,
        };
      }

      // Default to current time if no time specified
      const targetTime =
        parsed.time?.timestamp || Math.floor(Date.now() / 1000);
      const timeDescription = parsed.time?.description || "right now";

      // Determine which satellites to get based on the query context
      let satellites;
      const categoryId =
        categoryFilter !== "all"
          ? this.n2yoClient.getCategoryId(categoryFilter)
          : 0;

      // Check if query is asking about future time (for predictions) or current/past time (for current position)
      const timeDiff = targetTime - Math.floor(Date.now() / 1000);

      if (timeDiff > 300) {
        // More than 5 minutes in the future
        // This is a future prediction query - but N2YO "above" endpoint only shows current satellites
        // We'll get current satellites and note the limitation
        satellites = await this.n2yoClient.getSatellitesAbove(
          parsed.location.latitude,
          parsed.location.longitude,
          0, // altitude
          85, // search radius
          categoryId
        );

        const filteredSatellites =
          categoryFilter !== "all"
            ? satellites.filter((sat) =>
                this.matchesCategoryFilter(sat, categoryFilter)
              )
            : satellites;

        const response = {
          query: query,
          location: {
            name: parsed.location.name,
            coordinates: {
              latitude: parsed.location.latitude,
              longitude: parsed.location.longitude,
            },
          },
          time: {
            requested: timeDescription,
            note: "Showing satellites currently above the location. N2YO API provides current positions, not future predictions for overhead satellites.",
          },
          categoryFilter: categoryFilter,
          satellites: filteredSatellites.map((sat) => ({
            noradId: sat.satid,
            name: sat.satname,
            position: {
              latitude: sat.satlat,
              longitude: sat.satlng,
              altitude: sat.satalt,
            },
            launchDate: sat.launchDate,
            internationalDesignator: sat.intDesignator,
          })),
          count: filteredSatellites.length,
          summary: `Found ${filteredSatellites.length} ${
            categoryFilter === "all" ? "" : categoryFilter + " "
          }satellites currently above ${parsed.location.name}`,
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      } else {
        // This is a current or near-current time query
        satellites = await this.n2yoClient.getSatellitesAbove(
          parsed.location.latitude,
          parsed.location.longitude,
          0, // altitude
          85, // search radius
          categoryId
        );

        const filteredSatellites =
          categoryFilter !== "all"
            ? satellites.filter((sat) =>
                this.matchesCategoryFilter(sat, categoryFilter)
              )
            : satellites;

        const response = {
          query: query,
          location: {
            name: parsed.location.name,
            coordinates: {
              latitude: parsed.location.latitude,
              longitude: parsed.location.longitude,
            },
          },
          time: {
            description: timeDescription,
            timestamp: targetTime,
          },
          categoryFilter: categoryFilter,
          satellites: filteredSatellites.map((sat) => ({
            noradId: sat.satid,
            name: sat.satname,
            position: {
              latitude: sat.satlat,
              longitude: sat.satlng,
              altitude: sat.satalt,
            },
            launchDate: sat.launchDate,
            internationalDesignator: sat.intDesignator,
          })),
          count: filteredSatellites.length,
          summary: `Found ${filteredSatellites.length} ${
            categoryFilter === "all" ? "" : categoryFilter + " "
          }satellites above ${parsed.location.name} ${timeDescription}`,
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      }
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error processing natural language query: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
        isError: true,
      };
    }
  }

  private matchesCategoryFilter(
    satellite: any,
    categoryFilter: string
  ): boolean {
    const satName = satellite.satname?.toLowerCase() || "";

    switch (categoryFilter) {
      case "military":
        return (
          satName.includes("military") ||
          satName.includes("defense") ||
          satName.includes("nrol") ||
          (satName.includes("usa") && satName.includes("classified"))
        );

      case "weather":
        return (
          satName.includes("weather") ||
          satName.includes("noaa") ||
          satName.includes("goes") ||
          satName.includes("meteosat")
        );

      case "gps":
        return (
          satName.includes("gps") ||
          satName.includes("navstar") ||
          satName.includes("navigation")
        );

      case "amateur":
        return (
          satName.includes("amateur") ||
          satName.includes("amsat") ||
          satName.includes("cubesat")
        );

      case "starlink":
        return satName.includes("starlink");

      case "space-stations":
        return (
          satName.includes("space station") ||
          satName.includes("iss") ||
          satName.includes("tiangong")
        );

      default:
        return true;
    }
  }

  private async getSatelliteTle(noradId: string): Promise<CallToolResult> {
    SatelliteValidator.validateNoradId(noradId);

    const tleData = await this.n2yoClient.getTle(noradId);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(tleData, null, 2),
        },
      ],
    };
  }

  private async getSatellitesByCategory(
    category: string,
    country?: string
  ): Promise<CallToolResult> {
    SatelliteValidator.validateCategory(category);
    SatelliteValidator.validateCountry(country);

    const categories = this.n2yoClient.getAvailableCategories();
    const categoryInfo = categories.find((cat) => cat.name === category);

    const result = {
      category: categoryInfo,
      country_filter: country,
      note: "Use the N2YO website to browse satellites by category and country, then use get_satellite_tle with specific NORAD IDs",
      website_url: `https://www.n2yo.com/satellites/?c=${
        categoryInfo?.id || 0
      }`,
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async getSatellitePosition(args: any): Promise<CallToolResult> {
    SatelliteValidator.validatePositionRequest(args);

    const positions = await this.n2yoClient.getPositions(
      args.noradId,
      args.observerLat,
      args.observerLng,
      args.observerAlt || 0,
      args.seconds || 0
    );

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ positions, count: positions.length }, null, 2),
        },
      ],
    };
  }

  private async getVisualPasses(args: any): Promise<CallToolResult> {
    SatelliteValidator.validateVisualPassRequest(args);

    const passes = await this.n2yoClient.getVisualPasses(
      args.noradId,
      args.observerLat,
      args.observerLng,
      args.observerAlt || 0,
      args.days || 10,
      args.minVisibility || 300
    );

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ passes, count: passes.length }, null, 2),
        },
      ],
    };
  }

  private async getSatellitesAbove(args: any): Promise<CallToolResult> {
    SatelliteValidator.validateAboveRequest(args);

    const categoryId =
      args.categoryFilter && args.categoryFilter !== "all"
        ? this.n2yoClient.getCategoryId(args.categoryFilter)
        : 0;

    const satellites = await this.n2yoClient.getSatellitesAbove(
      args.observerLat,
      args.observerLng,
      args.observerAlt || 0,
      args.searchRadius || 70,
      categoryId
    );

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            { satellites, count: satellites.length },
            null,
            2
          ),
        },
      ],
    };
  }
}
