import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function Typewriter({ text, speed = 55, active }) {
  const [display, setDisplay] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!active) { setDisplay(''); setDone(false); return; }
    setDisplay('');
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplay(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed, active]);

  return (
    <span>
      {display}
      {!done && (
        <motion.span
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.85, repeat: Infinity }}
          style={{ marginLeft: 1 }}
        >|</motion.span>
      )}
    </span>
  );
}