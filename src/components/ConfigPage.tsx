import { useState, useEffect } from 'react';
import { Config } from '../types';
import { getConfig, updateConfig } from '../utils/db';
import '../styles/ConfigPage.css';

interface ConfigPageProps {
  onClose: () => void;
}

export function ConfigPage({ onClose }: ConfigPageProps) {
  const [config, setConfig] = useState<Config>({
    awsRegion: '',
    awsAccessKey: '',
    awsSecretKey: '',
    bedrockModel: 'anthropic.claude-v2'
  });

  const [showAccessKey, setShowAccessKey] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);

  useEffect(() => {
    const loadConfig = async () => {
      const savedConfig = await getConfig();
      if (savedConfig) {
        setConfig(savedConfig);
      }
    };
    loadConfig();
  }, []);

  const handleChange = async (field: keyof Config, value: string) => {
    const newConfig = { ...config, [field]: value };
    setConfig(newConfig);
    await updateConfig(newConfig);
  };

  return (
    <div className="config-page">
      <div className="config-container">
        <div className="config-header">
          <h2>Configuration</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="config-form">
          <div className="form-group">
            <label htmlFor="awsRegion">AWS Region</label>
            <input
              type="text"
              id="awsRegion"
              value={config.awsRegion}
              onChange={(e) => handleChange('awsRegion', e.target.value)}
              placeholder="e.g., us-east-1"
            />
          </div>

          <div className="form-group">
            <label htmlFor="awsAccessKey">AWS Access Key</label>
            <div className="password-input">
              <input
                type={showAccessKey ? "text" : "password"}
                id="awsAccessKey"
                value={config.awsAccessKey}
                onChange={(e) => handleChange('awsAccessKey', e.target.value)}
                placeholder="Enter AWS Access Key"
              />
              <button
                className="toggle-visibility"
                onClick={() => setShowAccessKey(!showAccessKey)}
              >
                {showAccessKey ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="awsSecretKey">AWS Secret Key</label>
            <div className="password-input">
              <input
                type={showSecretKey ? "text" : "password"}
                id="awsSecretKey"
                value={config.awsSecretKey}
                onChange={(e) => handleChange('awsSecretKey', e.target.value)}
                placeholder="Enter AWS Secret Key"
              />
              <button
                className="toggle-visibility"
                onClick={() => setShowSecretKey(!showSecretKey)}
              >
                {showSecretKey ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="bedrockModel">Bedrock Model</label>
            <select
              id="bedrockModel"
              value={config.bedrockModel}
              onChange={(e) => handleChange('bedrockModel', e.target.value)}
            >
              <option value="anthropic.claude-v2">Claude V2</option>
              <option value="anthropic.claude-v1">Claude V1</option>
              <option value="anthropic.claude-instant-v1">Claude Instant V1</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
