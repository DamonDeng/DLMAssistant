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

  private countWords(messages: ChatMessage[]): number {
    return messages.reduce((count, msg) => {
      const textContent = msg.content
        .filter(block => block.type === 'text')
        .map(block => (block as any).text)
        .join(' ');
      return count + textContent.split(/\s+/).length;
    }, 0);
  }

  async generateTopic(messages: ChatMessage[]): Promise<string> {
    // Only generate topic if there are more than 50 words
    if (this.countWords(messages) < 50) {
      return "New Chat";
    }

    // Create a prompt for topic generation
    const topicPrompt: ChatMessage = {
      id: "topic-prompt",
      role: "user",
      dlm_message_type: "system",
      content: [{
        type: "text",
        text: "Please generate a concise topic (maximum 6 words) that summarizes the key theme of this conversation. Focus on the main subject matter being discussed. Return only the topic without any additional explanation or punctuation."
      }],
      timestamp: Date.now()
    };

    // Prepare messages for the request
    const bedrockMessages = this.convertToBedrockMessages([...messages, topicPrompt]);
    
    const request: ConverseRequest = {
      modelId: "anthropic.claude-v2", // Using Claude v2 for consistent summarization
      messages: bedrockMessages,
      inferenceConfig: {
        maxTokens: 20, // Small limit since we only need a short topic
        temperature: 0.5, // Lower temperature for more focused output
        topP: 1
      }
    };

    try {
      const response = await this.converseModel(request);
      // Clean up the response: remove quotes, periods, and trim whitespace
      const topic = response.replace(/['"\.]+/g, '').trim();
      // Limit to 6 words
      const words = topic.split(/\s+/);
      return words.slice(0, 6).join(' ');
    } catch (error) {
      console.error('Error generating topic:', error);
      return "New Chat";
    }
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

    // Convert all messages to Bedrock format
    const convertedMessages = request.messages.map(msg => ({
      role: msg.role,
      content: msg.content.map(block => {
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
      })
    }));

    const input = {
      modelId: request.modelId,
      messages: convertedMessages,
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

    // Convert all messages to Bedrock format
    const convertedMessages = request.messages.map(msg => ({
      role: msg.role,
      content: msg.content.map(block => {
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
      })
    }));

    const input = {
      modelId: request.modelId,
      messages: convertedMessages,
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
