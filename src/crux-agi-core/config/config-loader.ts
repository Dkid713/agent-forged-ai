import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { AthenaConfig } from "../types/core";

export function loadAthenaConfig(configPath?: string): AthenaConfig {
  const p =
    configPath ??
    path.join(process.cwd(), "src", "crux-agi-core", "config", "athena.config.yml");
  const raw = fs.readFileSync(p, "utf-8");
  const parsed = yaml.load(raw) as AthenaConfig;
  return parsed;
}
