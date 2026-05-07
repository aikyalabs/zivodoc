import { saveConfig, getConfig } from '../config.js';
import chalk from 'chalk';

export async function loginCommand(apiKey: string, options: { url?: string }): Promise<void> {
  const config = getConfig();
  config.apiKey = apiKey;
  if (options.url) config.apiUrl = options.url;
  saveConfig(config);

  console.log(chalk.green('✓') + ' API key saved to ~/.zivodoc/config.json');
  if (options.url) {
    console.log(chalk.dim(`  API URL: ${options.url}`));
  }
}
