import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { C } from '../constants';

const RIDE_IN_MS = 1400;
const DROP_MS = 500;
const HOLD_MS = 2000;
const RIDE_OUT_MS = 1400;

const BIKE_W = 84;
const STOP_X = 30;         
const EDGE_BUFFER = 60;    

const PARCEL_REST = { left: 82, y: 172 };

const BADGE_TOP = 112;

export default function DeliveryOverlay({ active, containerRef }) {
  const [step, setStep] = useState(0); 
  const [travel, setTravel] = useState({ enter: -220, exit: 260 });

  useEffect(() => {
    if (!active) { setStep(0); return; }
    if (containerRef?.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const enter = -(rect.left + BIKE_W + EDGE_BUFFER);
      const exit = (window.innerWidth - rect.left) + EDGE_BUFFER;
      setTravel({ enter, exit });
    }

    const t1 = setTimeout(() => setStep(1), RIDE_IN_MS);
    const t2 = setTimeout(() => setStep(2), RIDE_IN_MS + DROP_MS);
    const t3 = setTimeout(() => setStep(3), RIDE_IN_MS + DROP_MS + HOLD_MS);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [active, containerRef]);

  const isRiding = step === 0 || step === 3;
  const bikeX = step === 3 ? travel.exit : STOP_X;
  const bikeDuration = step === 3 ? RIDE_OUT_MS / 1000 : RIDE_IN_MS / 1000;

  const showParcel = step >= 1;
  const showBadge = step >= 2;
  const isRated = step >= 3;

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="delivery"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}
        >
          <motion.div
            initial={{ x: travel.enter, y: 0, rotate: -3 }}
            animate={{
              x: bikeX,
              y: isRiding ? [0, -2, 0, -2, 0] : 0,
              rotate: step === 0 ? [-3, 0] : step === 3 ? [0, 3] : 0,
            }}
            transition={{
              x: { duration: bikeDuration, ease: [0.3, 0.7, 0.3, 1] },
              y: { duration: 0.5, repeat: isRiding ? Infinity : 0, ease: 'easeInOut' },
              rotate: { duration: bikeDuration, ease: 'easeInOut' },
            }}
            style={{ position: 'absolute', top: 192, left: 0 }}
          >
            {/* speed lines while riding, hidden while parked */}
            {isRiding && (
              <div style={{ position: 'absolute', right: '100%', top: 14, display: 'flex', flexDirection: 'column', gap: 5, marginRight: 4 }}>
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [0, 1, 0], x: [6, -6] }}
                    transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.12 }}
                    style={{ width: 12 - i * 3, height: 2, borderRadius: 1, background: C.outline }}
                  />
                ))}
              </div>
            )}

            <svg width="84" height="46" viewBox="0 0 84 46" style={{ overflow: 'visible' }}>
              {/* wheels with spokes */}
              {[16, 62].map((cx) => (
                <g key={cx}>
                  <motion.g
                    animate={isRiding ? { rotate: 360 } : { rotate: 0 }}
                    transition={isRiding
                      ? { duration: 0.55, repeat: Infinity, ease: 'linear' }
                      : { duration: 0.25 }}
                    style={{ transformOrigin: `${cx}px 34px` }}
                  >
                    <circle cx={cx} cy="34" r="9" fill="none" stroke={C.navy} strokeWidth="3" />
                    {[0, 45, 90, 135].map((deg) => (
                      <line
                        key={deg}
                        x1={cx} y1="34" x2={cx} y2="26"
                        stroke={C.navy} strokeWidth="1.4"
                        transform={`rotate(${deg} ${cx} 34)`}
                      />
                    ))}
                  </motion.g>
                  <circle cx={cx} cy="34" r="2" fill={C.navy} />
                </g>
              ))}

              {/* frame */}
              <path
                d="M16 34 L34 16 L52 34 M34 16 L42 34 M52 34 H64 L70 22"
                stroke={C.teal} strokeWidth="3.2" fill="none"
                strokeLinecap="round" strokeLinejoin="round"
              />
              {/* seat + handlebar */}
              <rect x="30" y="13" width="9" height="4" rx="2" fill={C.tealDeep} />
              <path d="M64 22 L72 18" stroke={C.navy} strokeWidth="3" strokeLinecap="round" />
              {/* headlight */}
              <circle cx="72" cy="20" r="2.6" fill={C.amberGlow} />

              {/* rider, leaning slightly forward over the handlebar */}
              <g transform="translate(-2,-2)">
                {step === 0 && (
                  <g>
                    <rect x="14" y="10" width="16" height="18" rx="4" fill={C.amber} />
                    <rect x="14" y="16" width="16" height="3" fill="#00000018" />
                  </g>
                )}
                {/* torso, leaning toward handlebar */}
                <path d="M30 24 Q38 18 46 15" stroke={C.navy} strokeWidth="7" strokeLinecap="round" />
                {/* helmet with visor */}
                <circle cx="47" cy="10" r="6.5" fill={C.navy} />
                <path d="M42 10 A6.5 6.5 0 0 0 47 16.5" fill={C.navySoft} />
                <rect x="42.5" y="8.5" width="7" height="3" rx="1.4" fill={C.teal} opacity="0.85" />
                {/* arm to handlebar */}
                <path d="M44 16 L62 20" stroke={C.navy} strokeWidth="4.5" strokeLinecap="round" />
              </g>
            </svg>
          </motion.div>

          <AnimatePresence>
            {showParcel && (
              <motion.div
                key="parcel"
                initial={{ opacity: 0, x: -10, y: 154, rotate: -18, scale: 0.7 }}
                animate={{ opacity: 1, x: 0, y: PARCEL_REST.y, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 380, damping: 16 }}
                style={{ position: 'absolute', left: PARCEL_REST.left, top: 0 }}
              >
                <div style={{
                  width: 22, height: 18, borderRadius: 4,
                  background: C.amber,
                  boxShadow: `0 4px 10px ${C.amber}55`,
                  position: 'relative',
                }}>
                  <div style={{
                    position: 'absolute', left: '50%', top: 0, bottom: 0,
                    width: 2, background: 'rgba(0,0,0,0.15)', transform: 'translateX(-50%)',
                  }} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showBadge && (
              <motion.div
                key="badge"
                initial={{ opacity: 0, y: 6, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 400, damping: 16 }}
                style={{
                  position: 'absolute', left: 70, top: BADGE_TOP,
                  background: '#ffffff',
                  color: C.green,
                  padding: '5px 9px', borderRadius: 10,
                  fontSize: 9.5, fontWeight: 700, letterSpacing: 0.2,
                  display: 'flex', alignItems: 'center', gap: 5,
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 6px 16px rgba(10,14,26,0.10), 0 1px 3px rgba(10,14,26,0.06)',
                  border: `1px solid ${C.outline}`,
                }}
              >
                <span style={{
                  width: 14, height: 14, borderRadius: '50%', background: C.green,
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, fontWeight: 800, flexShrink: 0,
                }}>✓</span>

                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={isRated ? 'rated' : 'delivered'}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                  >
                    {isRated ? 'Delivered · ⭐ 5.0' : 'Delivered'}
                  </motion.span>
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}