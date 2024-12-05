import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import { Config, ChatMessage, ConverseRequest, BedrockMessage, ContentBlock } from '../types';

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

  async sendMessage(config: Config, messages: ChatMessage[]): Promise<string> {
    const bedrockMessages = this.convertToBedrockMessages(messages);
    
    const request: ConverseRequest = {
      modelId: config.bedrockModel,
      messages: bedrockMessages,
      //system: [{ text: "You are a helpful AI assistant." }],
      inferenceConfig: {
        maxTokens: 4096,
        temperature: 0.7,
        topP: 1
      }
    };

    try {
      const response_string = await this.converseModel(request);
      return response_string;
    } catch (error) {
      console.error('Error calling Bedrock:', error);
      // Extract the actual error message from AWS error response
      if (error instanceof Error) {
        // AWS SDK errors typically include detailed information in the message
        const errorMessage = error.message;
        // Remove any internal AWS error codes or prefixes if present
        const cleanedMessage = errorMessage.replace(/^(\w+Error:)?\s*/, '').trim();
        throw new Error(cleanedMessage);
      }
      throw error; // Re-throw if it's not an Error instance
    }
  }

  async converseModel(request: ConverseRequest): Promise<string> {
    console.log('request:', request);

    // Get the last message from the messages array
    const lastMessage = request.messages[request.messages.length - 1];

    // Convert our content blocks to Bedrock's expected format
    const convertedContent = lastMessage.content.map(block => {
      if (block.type === 'text') {
        return { text: block.text };
      }
      // For now, we'll only support text content as that's what's primarily used
      // Other content types can be added as needed
      return { text: '[Unsupported content type]' };
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

    const command = new ConverseCommand(input as any); // Using type assertion for now

    try {
      const response = await this.client.send(command);

      if (!response.output?.message?.content?.[0]?.text) {
        throw new Error('Invalid response format from Bedrock');
      }

      const responseText = response.output.message.content[0].text;
      console.log('Response:', responseText);
      return responseText;

    } catch (err) {
      // Extract the actual error details from AWS SDK error
      if (err instanceof Error) {
        // AWS SDK errors typically contain service-specific details
        const errorMessage = err.message;
        // Clean up the error message by removing AWS internal error codes
        const cleanedMessage = errorMessage.replace(/^(\w+Error:)?\s*/, '').trim();
        throw new Error(cleanedMessage);
      }
      throw err; // Re-throw if it's not an Error instance
    }
  }
}

export async function createBedrockClient(config: Config): Promise<BedrockClient> {
  return new BedrockClient(config);
}
