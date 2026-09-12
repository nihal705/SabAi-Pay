import { motion, AnimatePresence } from 'framer-motion';
import { C } from '../constants';

export default function DeliveryOverlay({ active }) {
  return (
    <AnimatePresence>
      {active && (
        <>
          <motion.div
            key="scooter"
            initial={{ x: -200, opacity: 0 }}
            animate={{ x: [-200, -20, -20, -200], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 6, times: [0, 0.22, 0.78, 1], ease: 'easeInOut' }}
            style={{ position: 'absolute', bottom: 12, left: 0 }}
          >
            <svg width="72" height="56" viewBox="0 0 72 56">
              <rect x="30" y="6" width="14" height="14" rx="3" fill={C.navy} />
              <circle cx="37" cy="4" r="2.5" fill={C.amber} />
              <rect x="14" y="18" width="42" height="22" rx="7" fill={C.teal} />
              <rect x="20" y="22" width="28" height="4" rx="2" fill={C.tealDeep} opacity="0.5" />
              <motion.circle
                cx="56" cy="24" r="2.5" fill={C.amberGlow}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.1, repeat: Infinity }}
              />
              <motion.g
                animate={{ rotate: 360 }}
                transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
                style={{ transformOrigin: '22px 44px' }}
              >
                <circle cx="22" cy="44" r="6" fill={C.navy} />
                <circle cx="22" cy="44" r="2" fill={C.creamEdge} />
              </motion.g>
              <motion.g
                animate={{ rotate: 360 }}
                transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
                style={{ transformOrigin: '50px 44px' }}
              >
                <circle cx="50" cy="44" r="6" fill={C.navy} />
                <circle cx="50" cy="44" r="2" fill={C.creamEdge} />
              </motion.g>
            </svg>
          </motion.div>

          <motion.div
            key="pkg"
            initial={{ opacity: 0, x: -80, y: 40, scale: 0.6 }}
            animate={{
              opacity: [0, 1, 1, 1, 0],
              x: [-80, -50, -10, 20, 30],
              y: [40, 0, -30, -10, -10],
              scale: [0.6, 1, 1, 1, 1],
              rotate: [0, 0, -180, -180, -180],
            }}
            transition={{ duration: 2.4, delay: 1.8, ease: [0.3, 0, 0.4, 1], times: [0, 0.15, 0.5, 0.85, 1] }}
            style={{ position: 'absolute', bottom: 100, left: '50%', marginLeft: -16 }}
          >
            <svg width="32" height="32" viewBox="0 0 32 32">
              <rect x="2" y="8" width="28" height="20" rx="3" fill={C.amber} />
              <path d="M2 14 L30 14" stroke="#A66A1F" strokeWidth="1.6" />
              <path d="M16 8 L16 28" stroke="#A66A1F" strokeWidth="1.6" />
              <rect x="12" y="4" width="8" height="6" rx="1.5" fill="#C88A2A" />
            </svg>
          </motion.div>

          {[...Array(6)].map((_, i) => {
            const angle = (i / 6) * Math.PI * 2;
            const dx = Math.cos(angle) * 36;
            const dy = Math.sin(angle) * 36;
            return (
              <motion.div
                key={`spark-${i}`}
                initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  x: [0, dx],
                  y: [0, dy],
                  scale: [0, 1, 0.3],
                }}
                transition={{ duration: 0.9, delay: 3.4, ease: 'easeOut' }}
                style={{
                  position: 'absolute', bottom: 105, left: '50%', marginLeft: -3,
                  width: 6, height: 6, borderRadius: '50%',
                  background: C.amberGlow,
                  boxShadow: `0 0 10px ${C.amberGlow}`,
                }}
              />
            );
          })}

          <motion.div
            key="rate"
            initial={{ opacity: 0, y: 30, scale: 0.5, rotate: -15 }}
            animate={{
              opacity: [0, 1, 1, 0],
              y: [30, 0, -25, -50],
              scale: [0.5, 1.1, 1, 0.9],
              rotate: [-15, 0, 0, 0],
            }}
            transition={{ duration: 2.6, delay: 3.3, ease: 'easeOut' }}
            style={{
              position: 'absolute', bottom: 130, left: '50%', marginLeft: -24,
              background: '#fff',
              padding: '5px 10px', borderRadius: 22,
              fontSize: 12, fontWeight: 700, color: C.amber,
              boxShadow: '0 6px 16px rgba(245,166,35,0.4)',
              display: 'flex', gap: 4, alignItems: 'center',
            }}
          >
            <span>⭐</span>
            <span style={{ color: C.navy }}>5.0</span>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}