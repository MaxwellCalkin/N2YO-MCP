export interface TleData {
  tle_line1: string;
  tle_line2: string;
  requested_timestamp: number;
  tle_timestamp: number;
}

export interface SatellitePosition {
  satlatitude: number;
  satlongitude: number;
  sataltitude: number;
  azimuth: number;
  elevation: number;
  ra: number;
  dec: number;
  timestamp: number;
}

export interface VisualPass {
  startAz: number;
  startAzCompass: string;
  startEl: number;
  startUTC: number;
  maxAz: number;
  maxAzCompass: string;
  maxEl: number;
  maxUTC: number;
  endAz: number;
  endAzCompass: string;
  endEl: number;
  endUTC: number;
  mag: number;
  duration: number;
}

export interface SatelliteAbove {
  satid: number;
  satname: string;
  intDesignator: string;
  launchDate: string;
  satlat: number;
  satlng: number;
  satalt: number;
}

export interface SatelliteInfo {
  satid: number;
  satname: string;
  intDesignator: string;
  launchDate: string;
  noradId: number;
}

export interface RadioPass {
  startAz: number;
  startAzCompass: string;
  startEl: number;
  startUTC: number;
  maxAz: number;
  maxAzCompass: string;
  maxEl: number;
  maxUTC: number;
  endAz: number;
  endAzCompass: string;
  endEl: number;
  endUTC: number;
}

export interface RecentLaunch {
  satid: number;
  satname: string;
  intDesignator: string;
  launchDate: string;
  satlat: number;
  satlng: number;
  satalt: number;
}

export interface SatelliteSearchResult {
  satid: number;
  satname: string;
  intDesignator: string;
  launchDate: string;
}

export interface N2YOResponse<T> {
  info: {
    satname: string;
    satid: number;
    transactionscount: number;
  };
  positions?: T[];
  passes?: T[];
  above?: T[];
  tle?: string;
}

export class N2YOClient {
  private apiKey: string;
  private baseUrl = "https://api.n2yo.com/rest/v1/satellite";
  private transactionCounts = {
    tle: 0,
    positions: 0,
    visualpasses: 0,
    radiopasses: 0,
    above: 0,
    launchDate: 0,
  };

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.N2YO_API_KEY || "";
  }

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  hasApiKey(): boolean {
    return this.apiKey.length > 0;
  }

  private async makeRequest(endpoint: string, params: Record<string, any>): Promise<any> {
    if (!this.hasApiKey()) {
      throw new Error("N2YO API key is required. Please set it using the set_n2yo_api_key tool.");
    }

    const url = new URL(`${this.baseUrl}${endpoint}`);
    url.searchParams.append("apiKey", this.apiKey);
    
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined) {
        url.searchParams.append(key, params[key].toString());
      }
    });

    console.log(`N2YO API Call: ${url.toString()}`);
    
    // For now, return mock data. In production, would use fetch:
    // const response = await fetch(url.toString());
    // return await response.json();
    
    return this.getMockResponse(endpoint, params);
  }

  private getMockResponse(endpoint: string, params: Record<string, any>): any {
    // Simulate API responses for different endpoints
    if (endpoint.includes("/tle/")) {
      return this.getMockTleResponse(params.id);
    } else if (endpoint.includes("/positions/")) {
      return this.getMockPositionsResponse(params);
    } else if (endpoint.includes("/visualpasses/")) {
      return this.getMockVisualPassesResponse(params);
    } else if (endpoint.includes("/radiopasses/")) {
      return this.getMockRadioPassesResponse(params);
    } else if (endpoint.includes("/above/")) {
      return this.getMockAboveResponse(params);
    } else if (endpoint.includes("/launchDate/")) {
      return this.getMockRecentLaunchesResponse(params);
    }
    
    return {};
  }

  private getMockTleResponse(noradId: string): any {
    return {
      info: {
        satname: noradId === "25544" ? "SPACE STATION" : `SATELLITE-${noradId}`,
        satid: parseInt(noradId),
        transactionscount: ++this.transactionCounts.tle,
      },
      tle: `1 ${noradId.padStart(5)}U 98067A   24001.50000000  .00002182  00000-0  40201-4 0  9990\n2 ${noradId.padStart(5)}  51.6461 339.7939 0001397  83.2918 276.8626 15.48919103123456`,
    };
  }

  private getMockPositionsResponse(params: any): any {
    return {
      info: {
        satname: "SPACE STATION",
        satid: parseInt(params.id),
        transactionscount: ++this.transactionCounts.positions,
      },
      positions: [{
        satlatitude: Math.random() * 180 - 90,
        satlongitude: Math.random() * 360 - 180,
        sataltitude: 408 + Math.random() * 20,
        azimuth: Math.random() * 360,
        elevation: Math.random() * 90 - 45,
        ra: Math.random() * 360,
        dec: Math.random() * 180 - 90,
        timestamp: Math.floor(Date.now() / 1000) + (params.seconds || 0),
      }],
    };
  }

  private getMockVisualPassesResponse(params: any): any {
    const passes = [];
    const count = Math.floor(Math.random() * 5) + 1;
    
    for (let i = 0; i < count; i++) {
      const startTime = Math.floor(Date.now() / 1000) + (i + 1) * 86400; // Next few days
      passes.push({
        startAz: Math.random() * 360,
        startAzCompass: this.getCompassDirection(Math.random() * 360),
        startEl: 10,
        startUTC: startTime,
        maxAz: Math.random() * 360,
        maxAzCompass: this.getCompassDirection(Math.random() * 360),
        maxEl: 30 + Math.random() * 60,
        maxUTC: startTime + 120 + Math.random() * 240,
        endAz: Math.random() * 360,
        endAzCompass: this.getCompassDirection(Math.random() * 360),
        endEl: 10,
        endUTC: startTime + 300 + Math.random() * 300,
        mag: -3 + Math.random() * 6,
        duration: 300 + Math.random() * 300,
      });
    }

    return {
      info: {
        satname: "SPACE STATION",
        satid: parseInt(params.id),
        transactionscount: ++this.transactionCounts.visualpasses,
      },
      passes,
    };
  }

  private getMockAboveResponse(params: any): any {
    const satellites = [];
    const count = Math.floor(Math.random() * 10) + 5;
    
    for (let i = 0; i < count; i++) {
      const satId = 25544 + i;
      satellites.push({
        satid: satId,
        satname: satId === 25544 ? "SPACE STATION" : `SATELLITE-${satId}`,
        intDesignator: `98067${String.fromCharCode(65 + i)}`,
        launchDate: "2024-01-01",
        satlat: params.observer_lat + (Math.random() - 0.5) * 20,
        satlng: params.observer_lng + (Math.random() - 0.5) * 20,
        satalt: 200 + Math.random() * 800,
      });
    }

    return {
      info: {
        satcount: satellites.length,
        transactionscount: ++this.transactionCounts.above,
      },
      above: satellites,
    };
  }

  private getMockRadioPassesResponse(params: any): any {
    const passes = [];
    const count = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < count; i++) {
      const startTime = Math.floor(Date.now() / 1000) + (i + 1) * 86400;
      passes.push({
        startAz: Math.random() * 360,
        startAzCompass: this.getCompassDirection(Math.random() * 360),
        startEl: Math.random() * 20 + 10,
        startUTC: startTime,
        maxAz: Math.random() * 360,
        maxAzCompass: this.getCompassDirection(Math.random() * 360),
        maxEl: 30 + Math.random() * 50,
        maxUTC: startTime + 180 + Math.random() * 240,
        endAz: Math.random() * 360,
        endAzCompass: this.getCompassDirection(Math.random() * 360),
        endEl: Math.random() * 20 + 10,
        endUTC: startTime + 400 + Math.random() * 200,
      });
    }

    return {
      info: {
        satname: "SPACE STATION",
        satid: parseInt(params.id),
        transactionscount: ++this.transactionCounts.radiopasses,
      },
      passes,
    };
  }

  private getMockRecentLaunchesResponse(params: any): any {
    const satellites = [];
    const mockLaunches = [
      "STARLINK-6789", "WEATHER-SAT-42", "GPS III-11", "MILITARY-X1", 
      "CUBESAT-EDU-1", "EARTH-OBS-7", "COMM-SAT-19", "SCI-SAT-4"
    ];
    
    for (let i = 0; i < mockLaunches.length; i++) {
      const satId = 50000 + i;
      const launchDate = new Date();
      launchDate.setDate(launchDate.getDate() - Math.floor(Math.random() * 30));
      
      satellites.push({
        satid: satId,
        satname: mockLaunches[i],
        intDesignator: `24${String(i + 1).padStart(3, '0')}A`,
        launchDate: launchDate.toISOString().split('T')[0],
        satlat: Math.random() * 180 - 90,
        satlng: Math.random() * 360 - 180,
        satalt: 200 + Math.random() * 800,
      });
    }

    return {
      info: {
        satcount: satellites.length,
        transactionscount: ++this.transactionCounts.launchDate,
      },
      above: satellites,
    };
  }

  private getCompassDirection(azimuth: number): string {
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const index = Math.round(azimuth / 45) % 8;
    return directions[index];
  }

  // Public API methods
  async getTle(noradId: string): Promise<TleData> {
    const response = await this.makeRequest(`/tle/${noradId}`, { id: noradId });
    
    if (!response.tle) {
      throw new Error(`No TLE data found for satellite ${noradId}`);
    }

    const lines = response.tle.split('\n');
    return {
      tle_line1: lines[0],
      tle_line2: lines[1],
      requested_timestamp: Math.floor(Date.now() / 1000),
      tle_timestamp: response.info?.tle_timestamp || Math.floor(Date.now() / 1000),
    };
  }

  async getPositions(
    noradId: string,
    observerLat: number,
    observerLng: number,
    observerAlt: number = 0,
    seconds: number = 0
  ): Promise<SatellitePosition[]> {
    const response = await this.makeRequest(`/positions/${noradId}/${observerLat}/${observerLng}/${observerAlt}/${seconds}`, {
      id: noradId,
      observer_lat: observerLat,
      observer_lng: observerLng,
      observer_alt: observerAlt,
      seconds,
    });

    return response.positions || [];
  }

  async getVisualPasses(
    noradId: string,
    observerLat: number,
    observerLng: number,
    observerAlt: number = 0,
    days: number = 10,
    minVisibility: number = 300
  ): Promise<VisualPass[]> {
    const response = await this.makeRequest(`/visualpasses/${noradId}/${observerLat}/${observerLng}/${observerAlt}/${days}/${minVisibility}`, {
      id: noradId,
      observer_lat: observerLat,
      observer_lng: observerLng,
      observer_alt: observerAlt,
      days,
      min_visibility: minVisibility,
    });

    return response.passes || [];
  }

  async getSatellitesAbove(
    observerLat: number,
    observerLng: number,
    observerAlt: number = 0,
    searchRadius: number = 70,
    categoryFilter: number = 0
  ): Promise<SatelliteAbove[]> {
    const response = await this.makeRequest(`/above/${observerLat}/${observerLng}/${observerAlt}/${searchRadius}/${categoryFilter}`, {
      observer_lat: observerLat,
      observer_lng: observerLng,
      observer_alt: observerAlt,
      search_radius: searchRadius,
      category_filter: categoryFilter,
    });

    return response.above || [];
  }

  // Category mapping for satellites
  getCategoryId(category: string): number {
    const categories: Record<string, number> = {
      "military": 30,
      "weather": 3,
      "gps": 20,
      "navigation": 24,
      "amateur": 18,
      "geostationary": 10,
      "noaa": 4,
      "starlink": 52,
      "space-stations": 2,
      "earth-resources": 6,
    };
    
    return categories[category] || 0;
  }

  getAvailableCategories(): Array<{id: number, name: string, description: string}> {
    return [
      { id: 30, name: "military", description: "Military satellites" },
      { id: 3, name: "weather", description: "Weather satellites" },
      { id: 20, name: "gps", description: "GPS operational satellites" },
      { id: 24, name: "navigation", description: "Navy Navigation Satellite System" },
      { id: 18, name: "amateur", description: "Amateur radio satellites" },
      { id: 10, name: "geostationary", description: "Geostationary satellites" },
      { id: 4, name: "noaa", description: "NOAA satellites" },
      { id: 52, name: "starlink", description: "Starlink satellites" },
      { id: 2, name: "space-stations", description: "Space stations" },
      { id: 6, name: "earth-resources", description: "Earth resources satellites" },
    ];
  }

  getAvailableCountries(): Array<{code: string, name: string}> {
    return [
      { code: "usa", name: "United States" },
      { code: "china", name: "People's Republic of China" },
      { code: "russia", name: "Russia" },
      { code: "japan", name: "Japan" },
      { code: "india", name: "India" },
      { code: "esa", name: "European Space Agency" },
      { code: "france", name: "France" },
      { code: "germany", name: "Germany" },
      { code: "uk", name: "United Kingdom" },
      { code: "israel", name: "Israel" },
    ];
  }

  getTransactionCounts(): typeof this.transactionCounts {
    return { ...this.transactionCounts };
  }

  getApiLimits(): Record<string, number> {
    return {
      tle: 1000,
      positions: 1000,
      visualpasses: 100,
      radiopasses: 100,
      above: 100,
      launchDate: 100,
    };
  }

  async getRadioPasses(
    noradId: string,
    observerLat: number,
    observerLng: number,
    observerAlt: number = 0,
    days: number = 10,
    minElevation: number = 10
  ): Promise<RadioPass[]> {
    const response = await this.makeRequest(`/radiopasses/${noradId}/${observerLat}/${observerLng}/${observerAlt}/${days}/${minElevation}`, {
      id: noradId,
      observer_lat: observerLat,
      observer_lng: observerLng,
      observer_alt: observerAlt,
      days,
      min_elevation: minElevation,
    });

    return response.passes || [];
  }

  async getRecentLaunches(): Promise<RecentLaunch[]> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startDate = thirtyDaysAgo.toISOString().split('T')[0];
    const endDate = now.toISOString().split('T')[0];
    
    const response = await this.makeRequest(`/launchDate/${startDate}/${endDate}`, {
      startDate,
      endDate,
    });

    return response.above || [];
  }

  searchSatellitesByName(query: string): SatelliteSearchResult[] {
    // Mock search - in real implementation this would query N2YO or use a satellite database
    const mockSatellites = [
      { satid: 25544, satname: "ISS (ZARYA)", intDesignator: "1998-067A", launchDate: "1998-11-20" },
      { satid: 20580, satname: "HST", intDesignator: "1990-037B", launchDate: "1990-04-24" },
      { satid: 43013, satname: "STARLINK-1007", intDesignator: "2017-073A", launchDate: "2017-12-23" },
      { satid: 43014, satname: "STARLINK-1002", intDesignator: "2017-073B", launchDate: "2017-12-23" },
      { satid: 28654, satname: "NOAA 18", intDesignator: "2005-018A", launchDate: "2005-05-20" },
      { satid: 32786, satname: "AQUA", intDesignator: "2002-022A", launchDate: "2002-05-04" },
      { satid: 41866, satname: "GEOSAT FOLLOW-ON 2", intDesignator: "2016-064A", launchDate: "2016-08-19" },
    ];

    const searchTerm = query.toLowerCase();
    return mockSatellites.filter(sat => 
      sat.satname.toLowerCase().includes(searchTerm) ||
      sat.intDesignator.toLowerCase().includes(searchTerm)
    );
  }

  async getSatelliteTrajectory(
    noradId: string,
    observerLat: number,
    observerLng: number,
    observerAlt: number = 0,
    seconds: number = 300
  ): Promise<SatellitePosition[]> {
    // Get multiple positions over time to show trajectory
    const positions = [];
    const steps = Math.min(10, Math.max(2, Math.floor(seconds / 30))); // Max 10 points
    
    for (let i = 0; i <= steps; i++) {
      const timeOffset = Math.floor((seconds / steps) * i);
      const stepPositions = await this.getPositions(noradId, observerLat, observerLng, observerAlt, timeOffset);
      if (stepPositions.length > 0) {
        positions.push(stepPositions[0]);
      }
    }
    
    return positions;
  }

  getSpaceDebris(
    observerLat: number,
    observerLng: number,
    observerAlt: number = 0,
    searchRadius: number = 70
  ): Promise<SatelliteAbove[]> {
    // Debris is typically in category 0 (uncategorized) or special debris categories
    // For mock purposes, we'll return some fictional debris objects
    return this.getSatellitesAbove(observerLat, observerLng, observerAlt, searchRadius, 0).then(sats => {
      return sats.map(sat => ({
        ...sat,
        satname: `DEBRIS-${sat.satid}`,
        launchDate: "UNKNOWN"
      })).slice(0, 5); // Limit debris results
    });
  }
}