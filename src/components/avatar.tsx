import React from 'react';

interface AvatarProps {
  isBot?: boolean;
  avatar?: string;
  size?: number;
}

export function Avatar({ isBot, avatar, size = 36 }: AvatarProps) {
  const style: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: isBot ? '#e3f2fd' : '#f3f4f6',
    color: isBot ? '#1565c0' : '#374151',
    fontSize: size * 0.5,
    fontWeight: 600,
    flexShrink: 0,
    border: '1px solid',
    borderColor: isBot ? '#90caf9' : '#d1d5db',
  };

  // If avatar is provided, render it as an image
  if (avatar) {
    return (
      <div style={style}>
        <img 
          src={avatar} 
          alt="avatar" 
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            objectFit: 'cover'
          }}
        />
      </div>
    );
  }

  // Otherwise, render a default avatar with initials
  return (
    <div style={style}>
      {isBot ? (
        <svg 
          viewBox="0 0 24 24" 
          fill="currentColor" 
          style={{ width: '60%', height: '60%' }}
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"/>
        </svg>
      ) : (
        <span>U</span>
      )}
    </div>
  );
}

// Add CSS for avatar animations
const style = document.createElement('style');
style.textContent = `
  .avatar-appear {
    animation: avatarAppear 0.2s ease;
  }

  @keyframes avatarAppear {
    from {
      transform: scale(0.8);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }

  .avatar-pulse {
    animation: avatarPulse 2s infinite;
  }

  @keyframes avatarPulse {
    0% {
      box-shadow: 0 0 0 0 rgba(144, 202, 249, 0.4);
    }
    70% {
      box-shadow: 0 0 0 6px rgba(144, 202, 249, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(144, 202, 249, 0);
    }
  }
`;
document.head.appendChild(style);
