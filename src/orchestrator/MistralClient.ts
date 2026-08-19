export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
}

interface MistralApiResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export class MistralClient {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl = 'https://api.mistral.ai/v1/chat/completions';

  constructor() {
    const key = process.env.MISTRAL_API_KEY;
    if (!key) throw new Error('MISTRAL_API_KEY is not set in .env');
    this.apiKey = key;
    this.model = process.env.MISTRAL_MODEL ?? 'mistral-small-latest';
  }

  async chat(messages: ChatMessage[], opts: ChatOptions = {}): Promise<string> {
    const { temperature = 0.1, maxTokens = 4096 } = opts;

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Mistral API error ${response.status}: ${errorText}`);
    }

    const data = (await response.json()) as MistralApiResponse;
    const content = data.choices[0]?.message?.content;

    if (!content) throw new Error('Mistral returned empty response');

    return content;
  }
}
