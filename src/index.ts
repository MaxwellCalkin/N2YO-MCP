#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { N2YOServer } from "./server.js";

async function main() {
  const server = new Server(
    {
      name: "n2yo-satellite-tracker",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
        resources: {},
      },
    }
  );

  const apiKey = process.env.N2YO_API_KEY;
  const n2yoServer = new N2YOServer(apiKey);

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: n2yoServer.getTools(),
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    return await n2yoServer.callTool(request.params.name, request.params.arguments);
  });

  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
      resources: n2yoServer.getResources(),
    };
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    return await n2yoServer.readResource(request.params.uri);
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});