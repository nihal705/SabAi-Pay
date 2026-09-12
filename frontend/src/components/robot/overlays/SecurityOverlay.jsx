import { motion, AnimatePresence } from 'framer-motion';
import { C } from '../constants';

export default function SecurityOverlay({ active }) {
  return (
    <AnimatePresence>
      {active && (
        <>
          <motion.div
            key="shield"
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.3 }}
            transition={{ duration: 0.55, ease: [0.2, 0.8, 0.2, 1] }}
            style={{
              position: 'absolute', inset: -12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <motion.svg
              width="240" height="240" viewBox="0 0 100 100"
              animate={{ rotate: 360 }}
              transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
            >
              <polygon
                points="50,6 88,28 88,72 50,94 12,72 12,28"
                fill={`${C.teal}14`}
                stroke={C.teal} strokeWidth="1"
                strokeLinejoin="round" opacity="0.85"
              />
              <polygon
                points="50,14 82,32 82,68 50,86 18,68 18,32"
                fill="none" stroke={C.tealDeep}
                strokeWidth="0.5" strokeLinejoin="round" opacity="0.4"
              />
            </motion.svg>
          </motion.div>

          <motion.div
            key="scam"
            initial={{ x: 120, y: 60, opacity: 0 }}
            animate={{
              x: [-120, -70, -20, -70, 120],
              y: [60, 60, 60, 60, 60],
              opacity: [0, 1, 1, 1, 0],
            }}
            transition={{ duration: 3.8, times: [0, 0.2, 0.5, 0.7, 1], ease: 'easeInOut' }}
            style={{ position: 'absolute', top: 60, right: 0 }}
          >
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 0.6, repeat: Infinity }}
              style={{
                width: 28, height: 28, borderRadius: '50%',
                background: C.red,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 900, fontSize: 16,
                boxShadow: `0 0 20px ${C.red}90, 0 0 0 3px ${C.red}22`,
              }}
            >!</motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}