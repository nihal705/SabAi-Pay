import { motion, AnimatePresence } from 'framer-motion';
import { C } from '../constants';

export default function CoinOverlay({ active }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="coin"
          initial={{ opacity: 0, y: 24, scale: 0.4 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.4 }}
          transition={{ duration: 0.55, ease: [0.2, 0.8, 0.2, 1] }}
          style={{ position: 'absolute', top: 40, right: 10 }}
        >
          <motion.div
            animate={{ rotateY: [0, 360] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'linear' }}
            style={{
              width: 46, height: 46, borderRadius: '50%',
              background: `radial-gradient(circle at 32% 30%, #FFD580, ${C.amber} 70%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#7A4E0B', fontWeight: 800, fontSize: 24,
              border: '2px solid #C88A2A',
              boxShadow: '0 6px 18px rgba(245, 166, 35, 0.45)',
            }}
          >₹</motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}