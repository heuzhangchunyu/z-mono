import type { AIConfig } from '../config/config.js';
import { DashScopeClient } from './dashscope.js';
import type { ImageGenerationProvider, TextGenerationProvider } from './provider.js';

export function createTextGenerationProvider(config: AIConfig): TextGenerationProvider {
  switch (config.provider) {
    case 'dashscope':
      return new DashScopeClient(config);
    default:
      throw new Error(`Unsupported AI provider: ${String(config.provider)}`);
  }
}

export function createImageGenerationProvider(config: AIConfig): ImageGenerationProvider {
  switch (config.provider) {
    case 'dashscope':
      return new DashScopeClient(config);
    default:
      throw new Error(`Unsupported AI provider: ${String(config.provider)}`);
  }
}
