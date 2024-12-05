import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import { Config, ChatMessage, ConverseRequest, BedrockMessage, ContentBlock, StreamingCallback } from '../types';

export class BedrockClient {
  private client: BedrockRuntimeClient;

  constructor(config: Config) {
    this.client = new BedrockRuntimeClient({
      region: config.awsRegion,
      credentials: {
        accessKeyId: config.awsAccessKey,
        secretAccessKey: config.awsSecretKey,
      },
      ...(config.bedrockEndpoint && { endpoint: config.bedrockEndpoint })
    });
  }

  private convertToBedrockMessages(messages: ChatMessage[]): BedrockMessage[] {
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }

  async sendMessage(config: Config, messages: ChatMessage[], onStream?: StreamingCallback): Promise<string> {
    const bedrockMessages = this.convertToBedrockMessages(messages);
    
    const request: ConverseRequest = {
      modelId: config.bedrockModel,
      messages: bedrockMessages,
      inferenceConfig: {
        maxTokens: 4096,
        temperature: 0.7,
        topP: 1
      }
    };

    try {
      if (onStream) {
        const response_string = await this.converseModelStreaming(request, onStream);
        return response_string;
      } else {
        const response_string = await this.converseModel(request);
        return response_string;
      }
    } catch (error) {
      console.error('Error calling Bedrock:', error);
      if (error instanceof Error) {
        const errorMessage = error.message;
        const cleanedMessage = errorMessage.replace(/^(\w+Error:)?\s*/, '').trim();
        throw new Error(cleanedMessage);
      }
      throw error;
    }
  }

  async converseModel(request: ConverseRequest): Promise<string> {
    console.log('request:', request);

    const lastMessage = request.messages[request.messages.length - 1];
    const convertedContent = lastMessage.content.map(block => {
      switch (block.type) {
        case 'text':
          return { text: block.text };
        case 'image':
          return {
            image: {
              format: block.image.format,
              source: {
                bytes: block.image.source.bytes
              }
            }
          };
        default:
          return { text: '[Unsupported content type]' };
      }
    });

    const input = {
      modelId: request.modelId,
      messages: [{
        role: lastMessage.role,
        content: convertedContent
      }],
      ...(request.system && { system: request.system }),
      ...(request.inferenceConfig && { inferenceConfig: request.inferenceConfig })
    };

    const command = new ConverseCommand(input as any);

    try {
      const response = await this.client.send(command);

      if (!response.output?.message?.content?.[0]?.text) {
        throw new Error('Invalid response format from Bedrock');
      }

      const responseText = response.output.message.content[0].text;
      console.log('Response:', responseText);
      return responseText;

    } catch (err) {
      if (err instanceof Error) {
        const errorMessage = err.message;
        const cleanedMessage = errorMessage.replace(/^(\w+Error:)?\s*/, '').trim();
        throw new Error(cleanedMessage);
      }
      throw err;
    }
  }

  async converseModelStreaming(request: ConverseRequest, onStream: StreamingCallback): Promise<string> {
    console.log('streaming request:', request);

    const lastMessage = request.messages[request.messages.length - 1];
    const convertedContent = lastMessage.content.map(block => {
      switch (block.type) {
        case 'text':
          return { text: block.text };
        case 'image':
          return {
            image: {
              format: block.image.format,
              source: {
                bytes: block.image.source.bytes
              }
            }
          };
        default:
          return { text: '[Unsupported content type]' };
      }
    });

    const input = {
      modelId: request.modelId,
      messages: [{
        role: lastMessage.role,
        content: convertedContent
      }],
      ...(request.system && { system: request.system }),
      ...(request.inferenceConfig && { inferenceConfig: request.inferenceConfig }),
      stream: true
    };

    try {
      const response = await this.client.send(new ConverseCommand(input as any));
      let fullResponse = '';

      // Handle the response as chunks
      if (response.output?.message?.content?.[0]?.text) {
        const text = response.output.message.content[0].text;
        // Split the response into smaller chunks to simulate streaming
        const chunks = text.match(/.{1,4}/g) || [];
        
        for (const chunk of chunks) {
          fullResponse += chunk;
          onStream(chunk, false);
          // Add a small delay between chunks to simulate streaming
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
      
      onStream('', true); // Signal completion
      return fullResponse;

    } catch (err) {
      if (err instanceof Error) {
        const errorMessage = err.message;
        const cleanedMessage = errorMessage.replace(/^(\w+Error:)?\s*/, '').trim();
        throw new Error(cleanedMessage);
      }
      throw err;
    }
  }
}

export async function createBedrockClient(config: Config): Promise<BedrockClient> {
  return new BedrockClient(config);
}
