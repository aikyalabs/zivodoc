import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const CONFIG_DIR = path.join(os.homedir(), '.zivodoc');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

interface CliConfig {
  apiKey?: string;
  apiUrl?: string;
}

export function getConfig(): CliConfig {
  try {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveConfig(config: CliConfig): void {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export function getApiKey(): string | undefined {
  return process.env.ZIVODOC_API_KEY ?? getConfig().apiKey;
}

export function getApiUrl(): string {
  return process.env.ZIVODOC_API_URL ?? getConfig().apiUrl ?? 'https://api.zivodoc.com';
}
