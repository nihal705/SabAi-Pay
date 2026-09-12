import { motion, AnimatePresence } from 'framer-motion';
import { C } from '../constants';

export default function AgentAskOverlay({ active }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="menu"
          initial={{ opacity: 0, x: 30, scale: 0.85 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 30, scale: 0.85 }}
          transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
          style={{
            position: 'absolute', top: 60, left: -24, width: 150,
            background: '#fff', borderRadius: 14,
            padding: '11px 13px',
            boxShadow: '0 10px 28px rgba(10,14,26,0.14), 0 2px 6px rgba(10,14,26,0.05)',
            fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: 10.5,
          }}
        >
          <div style={{ fontWeight: 700, color: C.navy, marginBottom: 8, fontSize: 11.5 }}>
            Paradise Biryani
          </div>
          <motion.div
            initial={{ color: '#6B7280' }}
            animate={{ color: C.amber }}
            transition={{ delay: 1.5, duration: 0.4 }}
            style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}
          >
            <span style={{ fontWeight: 600 }}>Chicken Biryani</span>
            <span>₹250</span>
          </motion.div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9CA3AF' }}>
            <span>Mutton Biryani</span><span>₹320</span>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0, rotate: -30 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ delay: 2.3, type: 'spring', stiffness: 420, damping: 15 }}
            style={{
              position: 'absolute', right: -14, top: 34,
              width: 20, height: 20, borderRadius: '50%',
              background: C.amber, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 12, fontWeight: 800,
              boxShadow: `0 2px 8px ${C.amber}80`,
            }}
          >✓</motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}