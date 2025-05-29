import { promises as fs } from "fs";
import { join } from "path";
import { homedir } from "os";

export interface DataEntry {
  key: string;
  data: any;
  metadata?: {
    type?: string;
    source?: string;
    timestamp?: string;
    tags?: string[];
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
}

export interface LibraryStats {
  totalEntries: number;
  totalSize: number;
  lastUpdated: string;
  tags: string[];
  types: string[];
}

export interface DataSchema {
  version: string;
  entryStructure: {
    required: string[];
    optional: string[];
  };
  metadataFields: string[];
}

export class DataLibrary {
  private dataDir: string;
  private data: Map<string, DataEntry> = new Map();
  private initialized = false;

  constructor(dataDir?: string) {
    this.dataDir = dataDir || join(homedir(), ".udl-data");
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;

    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      await this.loadData();
      this.initialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize data library: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async loadData(): Promise<void> {
    try {
      const dataFile = join(this.dataDir, "data.json");
      const content = await fs.readFile(dataFile, "utf-8");
      const entries: DataEntry[] = JSON.parse(content);
      
      this.data.clear();
      for (const entry of entries) {
        this.data.set(entry.key, entry);
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        this.data.clear();
      } else {
        throw error;
      }
    }
  }

  private async saveData(): Promise<void> {
    try {
      const dataFile = join(this.dataDir, "data.json");
      const entries = Array.from(this.data.values());
      await fs.writeFile(dataFile, JSON.stringify(entries, null, 2));
    } catch (error) {
      throw new Error(`Failed to save data: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async store(key: string, data: any, metadata?: any): Promise<DataEntry> {
    await this.ensureInitialized();

    const now = new Date().toISOString();
    const entry: DataEntry = {
      key,
      data: typeof data === "string" ? data : JSON.stringify(data),
      metadata: {
        ...metadata,
        timestamp: metadata?.timestamp || now,
      },
      createdAt: this.data.get(key)?.createdAt || now,
      updatedAt: now,
    };

    this.data.set(key, entry);
    await this.saveData();
    return entry;
  }

  async retrieve(key: string): Promise<DataEntry | null> {
    await this.ensureInitialized();
    return this.data.get(key) || null;
  }

  async delete(key: string): Promise<boolean> {
    await this.ensureInitialized();
    const existed = this.data.delete(key);
    if (existed) {
      await this.saveData();
    }
    return existed;
  }

  async listKeys(filter?: string, tags?: string[]): Promise<string[]> {
    await this.ensureInitialized();
    
    let keys = Array.from(this.data.keys());

    if (filter) {
      const regex = new RegExp(filter, "i");
      keys = keys.filter(key => regex.test(key));
    }

    if (tags && tags.length > 0) {
      keys = keys.filter(key => {
        const entry = this.data.get(key);
        const entryTags = entry?.metadata?.tags || [];
        return tags.some(tag => entryTags.includes(tag));
      });
    }

    return keys.sort();
  }

  async search(query: string, metadataFilter?: any): Promise<DataEntry[]> {
    await this.ensureInitialized();
    
    const results: DataEntry[] = [];
    const queryRegex = new RegExp(query, "i");

    for (const entry of this.data.values()) {
      let matches = false;

      if (queryRegex.test(entry.key) || queryRegex.test(String(entry.data))) {
        matches = true;
      }

      if (entry.metadata) {
        const metadataStr = JSON.stringify(entry.metadata);
        if (queryRegex.test(metadataStr)) {
          matches = true;
        }
      }

      if (matches && metadataFilter) {
        for (const [filterKey, filterValue] of Object.entries(metadataFilter)) {
          const entryValue = entry.metadata?.[filterKey];
          if (entryValue !== filterValue) {
            matches = false;
            break;
          }
        }
      }

      if (matches) {
        results.push(entry);
      }
    }

    return results.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async getStats(): Promise<LibraryStats> {
    await this.ensureInitialized();

    const entries = Array.from(this.data.values());
    const tags = new Set<string>();
    const types = new Set<string>();
    let totalSize = 0;
    let lastUpdated = "";

    for (const entry of entries) {
      totalSize += JSON.stringify(entry).length;
      
      if (entry.updatedAt > lastUpdated) {
        lastUpdated = entry.updatedAt;
      }

      if (entry.metadata?.tags) {
        entry.metadata.tags.forEach(tag => tags.add(tag));
      }

      if (entry.metadata?.type) {
        types.add(entry.metadata.type);
      }
    }

    return {
      totalEntries: entries.length,
      totalSize,
      lastUpdated: lastUpdated || new Date().toISOString(),
      tags: Array.from(tags).sort(),
      types: Array.from(types).sort(),
    };
  }

  async getSchema(): Promise<DataSchema> {
    return {
      version: "1.0.0",
      entryStructure: {
        required: ["key", "data", "createdAt", "updatedAt"],
        optional: ["metadata"],
      },
      metadataFields: ["type", "source", "timestamp", "tags"],
    };
  }

  async clear(): Promise<void> {
    await this.ensureInitialized();
    this.data.clear();
    await this.saveData();
  }

  async export(): Promise<DataEntry[]> {
    await this.ensureInitialized();
    return Array.from(this.data.values());
  }

  async import(entries: DataEntry[]): Promise<void> {
    await this.ensureInitialized();
    
    for (const entry of entries) {
      this.data.set(entry.key, entry);
    }
    
    await this.saveData();
  }
}