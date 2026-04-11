import type { AIConfig } from '../config/config.js';
import { DashScopeClient } from './dashscope.js';
import type { TextGenerationProvider } from './provider.js';

export function createTextGenerationProvider(config: AIConfig): TextGenerationProvider {
  switch (config.provider) {
    case 'dashscope':
      return new DashScopeClient(config);
    default:
      throw new Error(`Unsupported AI provider: ${String(config.provider)}`);
  }
}
