export interface AiModel {
  value: string
  label: string
  group: string
}

export const AI_MODELS: AiModel[] = [
  { value: 'Qwen/Qwen2.5-32B-Instruct', label: 'Qwen 2.5 32B Instruct', group: 'Qwen' },
  { value: 'Qwen/Qwen2.5-7B-Instruct', label: 'Qwen 2.5 7B Instruct', group: 'Qwen' },
  { value: 'Qwen/Qwen2.5-3B-Instruct', label: 'Qwen 2.5 3B Instruct', group: 'Qwen' },
  { value: 'Qwen/Qwen2.5-1.5B-Instruct', label: 'Qwen 2.5 1.5B Instruct', group: 'Qwen' },
  { value: 'Qwen/Qwen3-8B', label: 'Qwen 3 8B', group: 'Qwen' },
  { value: 'Qwen/Qwen3-4B', label: 'Qwen 3 4B', group: 'Qwen' },
  { value: 'Qwen/Qwen3-1.7B', label: 'Qwen 3 1.7B', group: 'Qwen' },
  { value: 'Qwen/Qwen3-0.6B', label: 'Qwen 3 0.6B', group: 'Qwen' },
  { value: 'meta-llama/Meta-Llama-3.1-8B-Instruct', label: 'Llama 3.1 8B Instruct', group: 'Llama' },
  { value: 'meta-llama/Llama-3.1-8B-Instruct', label: 'Llama 3.1 8B Instruct (alt)', group: 'Llama' },
  { value: 'meta-llama/Llama-3.2-1B-Instruct', label: 'Llama 3.2 1B Instruct', group: 'Llama' },
  { value: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-32B', label: 'DeepSeek R1 32B', group: 'Deepseek' },
  { value: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B', label: 'DeepSeek R1 7B', group: 'Deepseek' },
  { value: 'mistralai/Mistral-7B-Instruct-v0.2', label: 'Mistral 7B Instruct v0.2', group: 'Mistral' },
]

export const AI_MODEL_GROUPS = Array.from(new Set(AI_MODELS.map((m) => m.group)))

export function getModelLabel(value: string): string {
  return AI_MODELS.find((m) => m.value === value)?.label ?? value.split('/').pop() ?? value
}
