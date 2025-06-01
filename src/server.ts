import {
  Tool,
  Resource,
  CallToolResult,
  ReadResourceResult,
} from "@modelcontextprotocol/sdk/types.js";
import { N2YOClient } from "./n2yo-client.js";
import { SatelliteValidator, ValidationError } from "./satellite-validation.js";
import { LocationTimeParser } from "./location-time-parser.js";

export class N2YOServer {
  private n2yoClient: N2YOClient;

  constructor(apiKey?: string) {
    this.n2yoClient = new N2YOClient(apiKey);
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
        name: "query_satellites_with_tle",
        description: "Find satellites by natural language query and return structured data with Name and TLE",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Natural language query about satellites (e.g., 'ISS', 'Starlink satellites over California', 'military satellites')",
            },
            categoryFilter: {
              type: "string",
              enum: ["all", "military", "weather", "gps", "amateur", "starlink", "space-stations"],
              default: "all",
              description: "Optional filter for satellite category",
            },
            maxResults: {
              type: "number",
              default: 10,
              description: "Maximum number of satellites to return (default: 10)",
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
        name: "get_radio_passes",
        description: "Get upcoming radio communication passes of a satellite for an observer location",
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
            minElevation: {
              type: "number",
              description: "Minimum elevation in degrees (max 90)",
              default: 10,
              maximum: 90,
            },
          },
          required: ["noradId", "observerLat", "observerLng"],
        },
      },
      {
        name: "search_satellites_by_name",
        description: "Search for satellites by name or international designator",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search term (satellite name or international designator)",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "get_recent_launches",
        description: "Get satellites launched in the last 30 days",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_space_debris",
        description: "Get space debris currently above an observer location",
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
          },
          required: ["observerLat", "observerLng"],
        },
      },
      {
        name: "get_satellite_trajectory",
        description: "Get satellite trajectory over time period for visualization",
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
              description: "Time period in seconds for trajectory (max 3600)",
              default: 300,
              maximum: 3600,
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
          return await this.querySatellitesNatural(args.query, args.categoryFilter);
        
        case "query_satellites_with_tle":
          return await this.querySatellitesWithTle(args.query, args.categoryFilter, args.maxResults);
        
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
        
        case "get_radio_passes":
          return await this.getRadioPasses(args);
        
        case "search_satellites_by_name":
          return await this.searchSatellitesByName(args.query);
        
        case "get_recent_launches":
          return await this.getRecentLaunches();
        
        case "get_space_debris":
          return await this.getSpaceDebris(args);
        
        case "get_satellite_trajectory":
          return await this.getSatelliteTrajectory(args);
        
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

  private async querySatellitesWithTle(query: string, categoryFilter: string = "all", maxResults: number = 10): Promise<CallToolResult> {
    try {
      // First, use the existing natural language query to find satellites
      const naturalQueryResult = await this.querySatellitesNatural(query, categoryFilter);
      
      if (naturalQueryResult.isError) {
        return naturalQueryResult;
      }

      // Parse the response to extract satellite data
      const responseText = naturalQueryResult.content[0]?.text;
      if (typeof responseText !== 'string') {
        throw new Error('Invalid response format from natural query');
      }
      const naturalData = JSON.parse(responseText);
      const satellites = naturalData.satellites || [];

      // Limit results
      const limitedSatellites = satellites.slice(0, maxResults);

      // Get TLE data for each satellite
      const satellitesWithTle = [];
      for (const satellite of limitedSatellites) {
        try {
          const tleResult = await this.getSatelliteTle(String(satellite.noradId));
          if (!tleResult.isError) {
            const tleResponseText = tleResult.content[0]?.text;
            if (typeof tleResponseText !== 'string') {
              continue;
            }
            const tleData = JSON.parse(tleResponseText);
            satellitesWithTle.push({
              name: satellite.name,
              noradId: String(satellite.noradId),
              tle: tleData,
              position: satellite.position,
              launchDate: satellite.launchDate,
              internationalDesignator: satellite.internationalDesignator,
            });
          }
        } catch (error) {
          // Skip satellites that don't have TLE data available
          console.warn(`Could not get TLE for satellite ${satellite.noradId}: ${error}`);
        }
      }

      // Return structured response
      const response = {
        query: query,
        location: naturalData.location,
        time: naturalData.time,
        categoryFilter: categoryFilter,
        satellites: satellitesWithTle,
        count: satellitesWithTle.length,
        totalFound: satellites.length,
        summary: `Found ${satellitesWithTle.length} satellites with TLE data (${satellites.length} total matches)`,
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response, null, 2),
          },
        ],
      };

    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error processing query with TLE: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
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

  private async getRadioPasses(args: any): Promise<CallToolResult> {
    SatelliteValidator.validateVisualPassRequest(args); // Same validation as visual passes
    
    const passes = await this.n2yoClient.getRadioPasses(
      args.noradId,
      args.observerLat,
      args.observerLng,
      args.observerAlt || 0,
      args.days || 10,
      args.minElevation || 10
    );
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ 
            satellite: { noradId: args.noradId },
            observer: {
              latitude: args.observerLat,
              longitude: args.observerLng,
              altitude: args.observerAlt || 0,
            },
            radioPasses: passes, 
            count: passes.length,
            note: "Radio passes optimized for communication windows with elevation and timing data"
          }, null, 2),
        },
      ],
    };
  }

  private async searchSatellitesByName(query: string): Promise<CallToolResult> {
    if (!query || query.trim().length === 0) {
      return {
        content: [
          {
            type: "text",
            text: "Search query cannot be empty",
          },
        ],
        isError: true,
      };
    }

    const results = this.n2yoClient.searchSatellitesByName(query.trim());
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ 
            query: query.trim(),
            satellites: results, 
            count: results.length,
            note: "Use the NORAD ID (satid) to get more detailed information about specific satellites"
          }, null, 2),
        },
      ],
    };
  }

  private async getRecentLaunches(): Promise<CallToolResult> {
    const launches = await this.n2yoClient.getRecentLaunches();
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ 
            timeRange: "Last 30 days",
            recentLaunches: launches, 
            count: launches.length,
            note: "Recently launched satellites with current position data"
          }, null, 2),
        },
      ],
    };
  }

  private async getSpaceDebris(args: any): Promise<CallToolResult> {
    SatelliteValidator.validateAboveRequest(args);
    
    const debris = await this.n2yoClient.getSpaceDebris(
      args.observerLat,
      args.observerLng,
      args.observerAlt || 0,
      args.searchRadius || 70
    );
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ 
            observer: {
              latitude: args.observerLat,
              longitude: args.observerLng,
              altitude: args.observerAlt || 0,
            },
            searchRadius: args.searchRadius || 70,
            spaceDebris: debris, 
            count: debris.length,
            warning: "Space debris tracking is important for collision avoidance"
          }, null, 2),
        },
      ],
    };
  }

  private async getSatelliteTrajectory(args: any): Promise<CallToolResult> {
    SatelliteValidator.validatePositionRequest(args);
    
    const trajectory = await this.n2yoClient.getSatelliteTrajectory(
      args.noradId,
      args.observerLat,
      args.observerLng,
      args.observerAlt || 0,
      args.seconds || 300
    );
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ 
            satellite: { noradId: args.noradId },
            observer: {
              latitude: args.observerLat,
              longitude: args.observerLng,
              altitude: args.observerAlt || 0,
            },
            timeSpan: args.seconds || 300,
            trajectory: trajectory, 
            count: trajectory.length,
            note: "Position data points over time for trajectory visualization"
          }, null, 2),
        },
      ],
    };
  }
}
