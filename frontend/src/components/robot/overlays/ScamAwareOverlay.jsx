import { motion, AnimatePresence } from 'framer-motion';
import { C } from '../constants';

export default function ScamAwareOverlay({ active }) {
  return (
    <AnimatePresence>
      {active && (
        <>
          <motion.div
            key="banner"
            initial={{ opacity: 0, y: -10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
            style={{
              position: 'absolute', top: 40, left: -30, width: 190,
              background: C.red, color: '#fff',
              padding: '9px 13px', borderRadius: 12,
              fontSize: 11.5, fontWeight: 700, textAlign: 'center',
              boxShadow: '0 10px 24px rgba(239,68,68,0.4)',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            🔒 Never share your UPI PIN
          </motion.div>

          <motion.div
            key="caller"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            transition={{ delay: 0.9, duration: 0.4 }}
            style={{
              position: 'absolute', top: 130, right: 4,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 3,
            }}
          >
            <div style={{
              width: 38, height: 38, borderRadius: '50%',
              background: '#3A4254',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: C.red, fontSize: 20, position: 'relative',
              boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
            }}>
              ☎
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 1.7, duration: 0.4, ease: 'easeOut' }}
                style={{
                  position: 'absolute', top: '50%', left: -8, right: -8,
                  height: 3.5, background: C.red, borderRadius: 3,
                  transformOrigin: 'center',
                }}
              />
            </div>
            <div style={{
              fontSize: 8.5, color: C.red, fontWeight: 800,
              letterSpacing: 0.6, fontFamily: 'system-ui, sans-serif',
            }}>
              UNKNOWN
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}