export interface Message {
  id: number;
  content: string;
  sent: boolean;
  timestamp: string;
}

export interface ChatSession {
  id: number;
  title: string;
  preview: string;
  messages: Message[];
}

export interface Config {
  id?: string;
  awsRegion: string;
  awsAccessKey: string;
  awsSecretKey: string;
  bedrockModel: string;
}
