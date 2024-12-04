export interface Message {
  id: number;
  content: string;
  content_type?: string;
  sent: boolean;
  timestamp: string;
}

export interface ChatSession {
  id: number;
  title: string;
  preview: string;
  messages: Message[];
  deleted?: boolean;
}

export interface Config {
  id?: string;
  awsRegion: string;
  awsAccessKey: string;
  awsSecretKey: string;
  bedrockModel: string;
  bedrockEndpoint?: string;
}

export interface BedrockMessage {
  role: string;
  content: Array<{
    type: 'text';
    text: string;
  }>;
}

export interface BedrockRequest {
  messages: BedrockMessage[];
  max_tokens: number;
  temperature: number;
  top_p: number;
  anthropic_version: string;
}

export interface BedrockResponse {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}
