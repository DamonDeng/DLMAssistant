import { useState, useEffect } from 'react';
import { Config } from '../types';
import { getConfig, updateConfig } from '../utils/db';
import { useTranslation } from '../i18n/LanguageContext';
import '../styles/ConfigPage.css';

export function ConfigPage() {
  const { t, language, setLanguage } = useTranslation();
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
          <h2>{t('configuration')}</h2>
        </div>

        <div className="config-form">
          <div className="form-group">
            <label htmlFor="awsRegion">{t('awsRegion')}</label>
            <input
              type="text"
              id="awsRegion"
              value={config.awsRegion}
              onChange={(e) => handleChange('awsRegion', e.target.value)}
              placeholder={t('enterAwsRegion')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="awsAccessKey">{t('awsAccessKey')}</label>
            <div className="password-input">
              <input
                type={showAccessKey ? "text" : "password"}
                id="awsAccessKey"
                value={config.awsAccessKey}
                onChange={(e) => handleChange('awsAccessKey', e.target.value)}
                placeholder={t('enterAwsAccessKey')}
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
            <label htmlFor="awsSecretKey">{t('awsSecretKey')}</label>
            <div className="password-input">
              <input
                type={showSecretKey ? "text" : "password"}
                id="awsSecretKey"
                value={config.awsSecretKey}
                onChange={(e) => handleChange('awsSecretKey', e.target.value)}
                placeholder={t('enterAwsSecretKey')}
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
            <label htmlFor="bedrockModel">{t('bedrockModel')}</label>
            <select
              id="bedrockModel"
              value={config.bedrockModel}
              onChange={(e) => handleChange('bedrockModel', e.target.value)}
            >
              <option value="amazon.nova-pro-v1:0">Nova Pro</option>
              <option value="anthropic.claude-3-sonnet-20240229-v1:0">Claude 3 Sonet</option>
              <option value="anthropic.claude-v2">Claude V2</option>
              <option value="anthropic.claude-instant-v1">Claude Instant V1</option>
            </select>
          </div>

          <div className="form-group language-section">
            <label htmlFor="language">Language</label>
            <select
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'en' | 'zh')}
              className="language-select"
            >
              <option value="en">English</option>
              <option value="zh">中文</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
