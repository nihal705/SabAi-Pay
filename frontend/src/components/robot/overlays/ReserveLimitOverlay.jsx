import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { C } from '../constants';

export default function ReserveLimitOverlay({ active }) {
  const [value, setValue] = useState(1000);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (!active) {
      setValue(1000);
      setConfirmed(false);
      return;
    }
    const steps = [
      { v: 1800, t: 900 },
      { v: 2600, t: 1600 },
      { v: 3400, t: 2400 },
      { v: 4200, t: 3200 },
      { v: 5000, t: 4000 },
    ];
    const timers = steps.map(({ v, t }) => setTimeout(() => setValue(v), t));
    const doneT = setTimeout(() => setConfirmed(true), 4600);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(doneT);
    };
  }, [active]);

  const pct = (value - 1000) / 4000;

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="reserveLimit"
          initial={{ opacity: 0, x: -30, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -30, scale: 0.9 }}
          transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
          style={{
            position: 'absolute', top: 48, left: -104, width: 148,
            background: '#fff', borderRadius: 14,
            padding: '11px 13px',
            boxShadow: '0 10px 28px rgba(10,14,26,0.14), 0 2px 6px rgba(10,14,26,0.05)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            display: 'flex', flexDirection: 'column', gap: 8,
          }}
        >
          <div style={{ fontSize: 7.5, color: C.grey, letterSpacing: 0.8, fontWeight: 700 }}>
            ✦ RESERVE PAY
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 8.5, color: C.grey, fontWeight: 500 }}>
              Monthly limit
            </span>
            <motion.span
              key={value}
              initial={{ scale: 1.15, color: C.amberGlow }}
              animate={{ scale: 1, color: C.navy }}
              transition={{ duration: 0.22 }}
              style={{ fontSize: 14, fontWeight: 800, letterSpacing: -0.2 }}
            >
              ₹{value.toLocaleString('en-IN')}
            </motion.span>
          </div>

          <div
            style={{
              position: 'relative', height: 6, borderRadius: 3,
              background: C.greySoft, overflow: 'hidden',
            }}
          >
            <motion.div
              animate={{ width: `${pct * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              style={{
                position: 'absolute', top: 0, left: 0, bottom: 0,
                background: `linear-gradient(90deg, ${C.teal}, ${C.amber})`,
                borderRadius: 3,
              }}
            />
          </div>

          <motion.div
            animate={{ left: `calc(${pct * 100}% - 6px)` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{
              position: 'absolute', top: 69,
              width: 12, height: 12, borderRadius: '50%',
              background: '#fff',
              border: `2.5px solid ${C.amber}`,
              boxShadow: '0 2px 6px rgba(245,166,35,0.5)',
              pointerEvents: 'none',
            }}
          />

          <div
            style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: 6.5, color: '#9CA3AF', marginTop: -3,
            }}
          >
            <span>₹1K</span><span>₹3K</span><span>₹5K</span>
          </div>

          <AnimatePresence>
            {confirmed && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 380, damping: 18 }}
                style={{
                  background: `${C.green}18`, color: C.green,
                  padding: '5px 8px', borderRadius: 8,
                  fontSize: 8.5, fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: 5,
                  letterSpacing: 0.2,
                }}
              >
                <motion.div
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 14 }}
                  style={{
                    width: 13, height: 13, borderRadius: '50%',
                    background: C.green, color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 8, fontWeight: 800, flexShrink: 0,
                  }}
                >✓</motion.div>
                Limit set for Swiggy
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}