import { api } from "encore.dev/api";
import { nodesBucket } from "./storage";

interface DebugStorageResponse {
  totalObjects: number;
  sampleObjects: string[];
}

export const debugStorage = api<void, DebugStorageResponse>(
  { expose: true, method: "GET", path: "/nodes/debug-storage" },
  async () => {
    const sampleObjects: string[] = [];
    let totalObjects = 0;

    try {
      for await (const obj of nodesBucket.list({})) {
        totalObjects++;
        if (sampleObjects.length < 10) {
          sampleObjects.push(obj.name);
        }
      }

      return {
        totalObjects,
        sampleObjects,
      };
    } catch (error) {
      console.error("Failed to debug storage:", error);
      throw error;
    }
  }
);
