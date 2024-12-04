import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { Config, Message, BedrockRequest, BedrockResponse } from '../types';

const ANTHROPIC_VERSION = "bedrock-2023-05-31";

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

  private convertToBedrockMessages(messages: Message[]): BedrockRequest['messages'] {
    return messages.map(msg => ({
      role: msg.sent ? 'user' : 'assistant',
      content: [{
        type: 'text',
        text: msg.content
      }]
    }));
  }

  async sendMessage(config: Config, messages: Message[]): Promise<string> {
    const bedrockMessages = this.convertToBedrockMessages(messages);
    
    const request = {
      modelId: config.bedrockModel,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        // anthropic_version: ANTHROPIC_VERSION,
        messages: bedrockMessages,
        // max_tokens: 4096,
        // temperature: 0.7,
        //top_p: 1,
      })
    };

    try {
      const command = new InvokeModelCommand(request);
      const response = await this.client.send(command);

      if (!response.body) {
        throw new Error('No response body received from Bedrock');
      }

      const responseText = new TextDecoder().decode(response.body);
      const responseData = JSON.parse(responseText) as BedrockResponse;

      // print out responseData to check it
      console.log(responseData);

      if (!responseData.content?.[0]?.text) {
        throw new Error('Invalid response format from Bedrock');
      }

      return responseData.content[0].text;
    } catch (error) {
      console.error('Error calling Bedrock:', error);
      throw error;
    }
  }
}

export async function createBedrockClient(config: Config): Promise<BedrockClient> {
  return new BedrockClient(config);
}
