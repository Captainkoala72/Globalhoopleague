import React, { useState, useEffect } from 'react';
import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

interface TeamLogoProps {
  teamName: string;
  className?: string;
}

export function TeamLogo({ teamName, className = 'w-10 h-10' }: TeamLogoProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const fetchLogo = async () => {
      try {
        const logoRef = ref(storage, `${teamName} logo.png`);
        const url = await getDownloadURL(logoRef);
        if (isMounted) {
          setLogoUrl(url);
        }
      } catch (error) {
        console.warn(`Could not load logo for ${teamName}. Please check Firebase Storage rules to ensure public read access is enabled.`);
        if (isMounted) {
          setLogoUrl(null); // Fallback to null if not found
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchLogo();

    return () => {
      isMounted = false;
    };
  }, [teamName]);

  if (loading || !logoUrl) {
    return <div className={`bg-white/5 animate-pulse rounded-md ${className}`} title={teamName} />;
  }

  return (
    <img
      src={logoUrl}
      alt={`${teamName} Logo`}
      className={`object-contain ${className}`}
      style={{ imageRendering: 'pixelated' }}
    />
  );
}
