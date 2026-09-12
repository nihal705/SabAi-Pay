import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { C } from '../constants';
import Typewriter from '../Typewriter';

export default function AgentPayFlowOverlay({ active }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!active) { setStep(0); return; }
    const t1 = setTimeout(() => setStep(1), 2600);
    const t2 = setTimeout(() => setStep(2), 4800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [active]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="agentPayFlow"
          initial={{ opacity: 0, x: -30, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -30, scale: 0.9 }}
          transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
          style={{
            position: 'absolute', top: 48, left: -100, width: 140,
            background: '#fff', borderRadius: 14, padding: 10,
            boxShadow: '0 10px 28px rgba(10,14,26,0.14), 0 2px 6px rgba(10,14,26,0.05)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: 10, display: 'flex', flexDirection: 'column', gap: 6,
          }}
        >
          <div style={{
            fontSize: 7.5, color: C.grey, letterSpacing: 0.8, fontWeight: 700,
          }}>
            ✦ SABAI ASSISTANT
          </div>

          <div style={{
            background: C.indigo, color: '#fff',
            padding: '7px 9px', borderRadius: 11, borderTopRightRadius: 3,
            fontSize: 9.5, lineHeight: 1.35,
            alignSelf: 'flex-end', maxWidth: '90%',
            fontWeight: 500, marginLeft: 'auto',
          }}>
            <Typewriter text="Order 2 biryanis from Swiggy" speed={55} active={active} />
          </div>

          {step >= 1 && (
            <motion.div
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                display: 'flex', gap: 3, padding: '7px 10px',
                background: C.greySoft, borderRadius: 11,
                borderTopLeftRadius: 3, width: 'fit-content',
                alignItems: 'center',
              }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ y: [0, -3, 0], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
                  style={{ width: 4, height: 4, borderRadius: '50%', background: C.grey }}
                />
              ))}
            </motion.div>
          )}

          {step >= 2 && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              style={{
                background: C.greySoft, padding: '8px 10px',
                borderRadius: 11, borderTopLeftRadius: 3,
                fontSize: 9.5, color: C.navy,
                display: 'flex', gap: 6, alignItems: 'center', fontWeight: 500,
              }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 420, damping: 15 }}
                style={{
                  width: 15, height: 15, borderRadius: '50%',
                  background: C.amber, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 9, fontWeight: 800,
                  flexShrink: 0,
                  boxShadow: `0 2px 6px ${C.amber}66`,
                }}
              >✓</motion.div>
              <span>Found Paradise Biryani</span>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}