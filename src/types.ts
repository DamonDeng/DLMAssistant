export type ContentType = 'text' | 'image' | 'document' | 'video' | 'toolUse' | 'toolResult' | 'guardContent';

export interface BaseContentBlock {
  type: ContentType;
}

export interface TextContentBlock extends BaseContentBlock {
  type: 'text';
  text: string;
}

export interface ImageContentBlock extends BaseContentBlock {
  type: 'image';
  image: {
    format: 'png' | 'jpeg' | 'gif' | 'webp';
    source: {
      bytes: Uint8Array;
    };
  };
}

export interface DocumentContentBlock extends BaseContentBlock {
  type: 'document';
  document: {
    format: 'pdf' | 'csv' | 'doc' | 'docx' | 'xls' | 'xlsx' | 'html' | 'txt' | 'md';
    name: string;
    source: {
      bytes: Uint8Array;
    };
  };
}

export interface VideoContentBlock extends BaseContentBlock {
  type: 'video';
  video: {
    format: 'mkv' | 'mov' | 'mp4' | 'webm' | 'flv' | 'mpeg' | 'mpg' | 'wmv' | 'three_gp';
    source: {
      bytes: Uint8Array;
      s3Location?: {
        uri: string;
        bucketOwner?: string;
      };
    };
  };
}

export interface ToolUseContentBlock extends BaseContentBlock {
  type: 'toolUse';
  toolUse: {
    toolUseId: string;
    name: string;
    input: any;
  };
}

export interface ToolResultContentBlock extends BaseContentBlock {
  type: 'toolResult';
  toolResult: {
    toolUseId: string;
    content: Array<{
      json?: any;
      text?: string;
      image?: ImageContentBlock['image'];
      document?: DocumentContentBlock['document'];
      video?: VideoContentBlock['video'];
    }>;
    status: 'success' | 'error';
  };
}

export interface GuardContentBlock extends BaseContentBlock {
  type: 'guardContent';
  guardContent: {
    text: {
      text: string;
      qualifiers: Array<'grounding_source' | 'query' | 'guard_content'>;
    };
  };
}

export type ContentBlock = 
  | TextContentBlock 
  | ImageContentBlock 
  | DocumentContentBlock 
  | VideoContentBlock 
  | ToolUseContentBlock 
  | ToolResultContentBlock 
  | GuardContentBlock;

export interface ChatMessage {
  id: string; // Changed from number to string
  role: 'user' | 'assistant';
  dlm_message_type: 'error' | 'chat' | 'system';
  content: ContentBlock[];
  timestamp: number;
  // Legacy support
  legacy_content?: string;
  legacy_content_type?: string;
  // For streaming support
  isStreaming?: boolean;
}

export interface ChatSession {
  id: number;
  title: string;
  preview: string;
  messages: ChatMessage[];
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
  role: 'user' | 'assistant';
  content: ContentBlock[];
}

export interface ConverseRequest {
  modelId: string;
  messages: BedrockMessage[];
  system?: Array<{
    text: string;
    guardContent?: {
      text: {
        text: string;
        qualifiers: Array<'grounding_source' | 'query' | 'guard_content'>;
      };
    };
  }>;
  inferenceConfig?: {
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    stopSequences?: string[];
  };
  toolConfig?: {
    tools: Array<{
      toolSpec: {
        name: string;
        description?: string;
        inputSchema: {
          json: any;
        };
      };
    }>;
    toolChoice?: {
      auto?: {};
      any?: {};
      tool?: {
        name: string;
      };
    };
  };
}

export interface ConverseResponse {
  output?: {
    message?: {
      role: 'assistant';
      content: ContentBlock[];
    };
  };
  stopReason?: 'end_turn' | 'tool_use' | 'max_tokens' | 'stop_sequence' | 'guardrail_intervened' | 'content_filtered';
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  metrics?: {
    latencyMs: number;
  };
}

export type StreamingCallback = (text: string, done: boolean) => void;
