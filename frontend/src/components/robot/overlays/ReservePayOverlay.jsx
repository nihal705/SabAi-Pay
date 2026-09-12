import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { C } from '../constants';

export default function ReservePayOverlay({ active }) {
  const [count, setCount] = useState(5000);

  useEffect(() => {
    if (!active) { setCount(5000); return; }
    const ts = [
      setTimeout(() => setCount(4980), 2400),
      setTimeout(() => setCount(4940), 3800),
      setTimeout(() => setCount(4870), 5200),
      setTimeout(() => setCount(4790), 6400),
    ];
    return () => ts.forEach(clearTimeout);
  }, [active]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="phone"
          initial={{ opacity: 0, y: 30, rotate: -8 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          exit={{ opacity: 0, y: 20, rotate: 8 }}
          transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
          style={{
            position: 'absolute', top: 76, right: -22,
            width: 74, height: 130, borderRadius: 14,
            background: '#0B1020',
            border: `2px solid ${C.teal}`,
            padding: 5,
            boxShadow: `0 14px 34px rgba(10,14,26,0.35), 0 0 0 1px ${C.teal}22`,
          }}
        >
          <div style={{
            width: '100%', height: '100%', borderRadius: 9,
            background: '#0F1424',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 4, padding: 5,
          }}>
            <div style={{ fontSize: 5.5, color: C.teal, letterSpacing: 1.1, fontWeight: 700 }}>
              RESERVE PAY
            </div>
            <motion.div
              key={count}
              initial={{ scale: 1.18, color: C.amberGlow }}
              animate={{ scale: 1, color: C.cream }}
              transition={{ duration: 0.28 }}
              style={{
                fontSize: 17, fontWeight: 800,
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >₹{count}</motion.div>
            <div style={{ fontSize: 5.5, color: '#6B7280' }}>limit left</div>
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 1.6, type: 'spring', stiffness: 400 }}
              style={{
                marginTop: 4, fontSize: 5.5,
                background: C.green, color: '#fff',
                padding: '2px 6px', borderRadius: 6, fontWeight: 700,
                letterSpacing: 0.3,
              }}
            >✓ NO PIN</motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}