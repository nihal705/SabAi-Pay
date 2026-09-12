import { useState, useEffect } from 'react';

export function useFooterDetection() {
  const [isFooterVisible, setIsFooterVisible] = useState(false);

  useEffect(() => {
    const footer = document.querySelector(
      'footer, .footer, .home-footer, .dashboard-footer'
    );
    if (!footer) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsFooterVisible(entry.isIntersecting),
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
    );
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  return { isFooterVisible };
}