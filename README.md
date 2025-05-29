# N2YO Satellite Tracker MCP Server

A Model Context Protocol (MCP) server that provides access to N2YO satellite tracking data, including TLE (Two-Line Element) data, satellite positions, and pass predictions.

## Overview

This MCP server integrates with the N2YO.com API to provide satellite tracking capabilities. N2YO is a real-time satellite tracking service that offers comprehensive data on satellites, including military, weather, GPS, amateur radio, and commercial satellites.

### Key Features

- **Natural Language Queries**: Ask questions like "What satellites will be over France at 6:00 tonight?"
- **TLE Data Access**: Get Two-Line Element data for any satellite by NORAD ID
- **Category-based Search**: Find satellites by type (military, weather, GPS, etc.)
- **Country Filtering**: Filter satellites by country or organization
- **Real-time Positioning**: Get current satellite positions relative to observer
- **Pass Predictions**: Predict when satellites will be visible from your location
- **Overhead Tracking**: Find all satellites currently above a specific location

## Installation

```bash
git clone <repository-url>
cd n2yo-satellite-tracker-mcp
npm install
npm run build
```

## Setup

1. **Get N2YO API Key**: Register at [N2YO.com](https://www.n2yo.com/) and generate an API key from your profile
2. **Configure the server**: Use the `set_n2yo_api_key` tool to configure your API key
3. **Start tracking**: Use the various tools to track satellites

## Usage

```bash
npm start
```

The server connects to MCP-compatible clients via stdio transport.

## Tools Available

### `set_n2yo_api_key`
Configure your N2YO API key for accessing satellite data.

**Parameters:**
- `apiKey` (required): Your N2YO API key

### `query_satellites_natural`
Answer natural language questions about satellites (🌟 **NEW FEATURE**).

**Parameters:**
- `query` (required): Natural language query like "What satellites will be over France at 6:00 tonight?"
- `categoryFilter` (optional): Filter by category: "all", "military", "weather", "gps", "amateur", "starlink", "space-stations"

**Supported Query Patterns:**
- **Location**: Countries (France, Germany, USA), cities (Paris, London, New York)
- **Time**: "tonight", "6:00 PM", "tomorrow morning", "in 2 hours", "now"
- **Categories**: Can be specified in query or categoryFilter parameter

### `get_satellite_tle`
Get Two-Line Element (TLE) data for a specific satellite.

**Parameters:**
- `noradId` (required): NORAD catalog number (e.g., "25544" for ISS)

### `get_satellites_by_category`
Browse satellites by predefined categories.

**Parameters:**
- `category` (required): One of: "military", "weather", "gps", "navigation", "amateur", "geostationary", "noaa", "starlink", "space-stations", "earth-resources"
- `country` (optional): Country code filter (e.g., "usa", "china", "russia")

### `get_satellite_position`
Get current position of a satellite relative to an observer location.

**Parameters:**
- `noradId` (required): NORAD catalog number
- `observerLat` (required): Observer latitude (-90 to 90)
- `observerLng` (required): Observer longitude (-180 to 180)
- `observerAlt` (optional): Observer altitude in meters (default: 0)
- `seconds` (optional): Seconds in future for prediction (0-300, default: 0)

### `get_visual_passes`
Get upcoming visual passes of a satellite for an observer location.

**Parameters:**
- `noradId` (required): NORAD catalog number
- `observerLat` (required): Observer latitude (-90 to 90)
- `observerLng` (required): Observer longitude (-180 to 180)
- `observerAlt` (optional): Observer altitude in meters (default: 0)
- `days` (optional): Days to look ahead (1-10, default: 10)
- `minVisibility` (optional): Minimum visibility in seconds (1-300, default: 300)

### `get_satellites_above`
Get all satellites currently above an observer location.

**Parameters:**
- `observerLat` (required): Observer latitude (-90 to 90)
- `observerLng` (required): Observer longitude (-180 to 180)
- `observerAlt` (optional): Observer altitude in meters (default: 0)
- `searchRadius` (optional): Search radius in degrees (1-90, default: 70)
- `categoryFilter` (optional): Filter by category or "all" (default: "all")

## Resources Available

### `n2yo://api/status`
Current N2YO API configuration and usage status including:
- API key configuration status
- Transaction counts for each endpoint
- Daily API limits

### `n2yo://categories/list`
Available satellite categories for searching:
- Military satellites
- Weather satellites
- GPS operational satellites
- Amateur radio satellites
- And more...

### `n2yo://countries/list`
Available countries and organizations for satellite filtering.

### `n2yo://limits/info`
Information about N2YO API transaction limits and current usage.

## Natural Language Query Capabilities

The `query_satellites_natural` tool can understand and parse various natural language patterns:

### **Supported Locations** (100+ countries and cities)
- **Countries**: France, Germany, USA, China, Russia, Japan, UK, Canada, Australia, etc.
- **Major Cities**: Paris, London, New York, Tokyo, Berlin, Moscow, Sydney, etc.
- **Query Examples**:
  - "over France"
  - "above Germany" 
  - "in New York"

### **Supported Time Expressions**
- **Relative Times**: "tonight", "tomorrow", "now", "right now"
- **Specific Times**: "6:00 PM", "18:00", "6:00 tonight"
- **Future Times**: "in 2 hours", "tomorrow morning"
- **Query Examples**:
  - "at 6:00 tonight"
  - "tomorrow morning"
  - "in 3 hours"

### **Example Natural Language Queries**
- "What satellites will be over France at 6:00 tonight?"
- "Show me military satellites above Germany now"
- "What Starlink satellites are over New York right now?"
- "Which satellites will be above Tokyo tomorrow morning?"
- "Find weather satellites over London in 2 hours"

## Satellite Categories

The server supports the following satellite categories:

- **military** (30): Military satellites
- **weather** (3): Weather satellites  
- **gps** (20): GPS operational satellites
- **navigation** (24): Navy Navigation Satellite System
- **amateur** (18): Amateur radio satellites
- **geostationary** (10): Geostationary satellites
- **noaa** (4): NOAA satellites
- **starlink** (52): Starlink constellation
- **space-stations** (2): International Space Station and others
- **earth-resources** (6): Earth observation satellites

## Example Usage

### Configure API Key
```json
{
  "tool": "set_n2yo_api_key",
  "arguments": {
    "apiKey": "YOUR-N2YO-API-KEY"
  }
}
```

### Natural Language Queries (🌟 **NEW**)
```json
{
  "tool": "query_satellites_natural",
  "arguments": {
    "query": "What satellites will be over France at 6:00 tonight?"
  }
}
```

```json
{
  "tool": "query_satellites_natural",
  "arguments": {
    "query": "Show me military satellites above Germany now",
    "categoryFilter": "military"
  }
}
```

```json
{
  "tool": "query_satellites_natural",
  "arguments": {
    "query": "What Starlink satellites are over New York right now?",
    "categoryFilter": "starlink"
  }
}
```

### Get ISS TLE Data
```json
{
  "tool": "get_satellite_tle",
  "arguments": {
    "noradId": "25544"
  }
}
```

### Find Military Satellites
```json
{
  "tool": "get_satellites_by_category",
  "arguments": {
    "category": "military",
    "country": "usa"
  }
}
```

### Track ISS Position
```json
{
  "tool": "get_satellite_position",
  "arguments": {
    "noradId": "25544",
    "observerLat": 40.7128,
    "observerLng": -74.0060,
    "observerAlt": 0
  }
}
```

### Get ISS Pass Predictions
```json
{
  "tool": "get_visual_passes",
  "arguments": {
    "noradId": "25544",
    "observerLat": 40.7128,
    "observerLng": -74.0060,
    "days": 7
  }
}
```

### Find Satellites Overhead
```json
{
  "tool": "get_satellites_above",
  "arguments": {
    "observerLat": 40.7128,
    "observerLng": -74.0060,
    "searchRadius": 80,
    "categoryFilter": "military"
  }
}
```

## API Limits

N2YO provides free API access with the following daily limits:
- **TLE requests**: 1,000 per day
- **Position requests**: 1,000 per day
- **Visual passes**: 100 per day
- **Radio passes**: 100 per day
- **Above requests**: 100 per day

## Development

```bash
# Watch mode for development
npm run dev

# Build for production
npm run build

# Start the server
npm start
```

## Popular Satellites

Some commonly tracked satellites you can use for testing:

- **ISS**: 25544
- **Hubble Space Telescope**: 20580
- **GPS satellites**: Use category "gps"
- **Starlink**: Use category "starlink"
- **Weather satellites**: Use category "weather"

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Related Links

- [N2YO.com](https://www.n2yo.com/) - Real-time satellite tracking
- [N2YO API Documentation](https://www.n2yo.com/api/)
- [Model Context Protocol](https://modelcontextprotocol.io/) - Learn about MCP
- [NORAD Catalog](https://celestrak.com/) - Satellite catalog information