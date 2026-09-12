import { motion } from 'framer-motion';
import { C, LOGO_SRC } from './constants';

export default function BaseRobot({ blinking, glancing, waving }) {
  const eyeW = 12;
  const eyeH = 16;
  const eyeY = 74;
  const eyeLeft = 79;
  const eyeRight = 109;
  const glanceX = glancing === 'left' ? -2.5 : glancing === 'right' ? 2.5 : 0;

  return (
    <svg
      viewBox="0 0 200 240"
      width="200"
      height="240"
      style={{
        overflow: 'visible',
        filter: 'drop-shadow(0 8px 24px rgba(21, 26, 40, 0.10))',
      }}
    >
      <defs>
        <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#FFFFFF" />
          <stop offset="100%" stopColor={C.cream} />
        </linearGradient>
        <linearGradient id="screenGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#1F2533" />
          <stop offset="100%" stopColor={C.navy} />
        </linearGradient>
        <radialGradient id="eyeGlow">
          <stop offset="0%"   stopColor={C.amberGlow} stopOpacity="1" />
          <stop offset="100%" stopColor={C.amber}     stopOpacity="1" />
        </radialGradient>
        <radialGradient id="headLight" cx="0.5" cy="0" r="0.6">
          <stop offset="0%"   stopColor={C.indigoLo} stopOpacity="0.35" />
          <stop offset="100%" stopColor={C.indigo}   stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="100" cy="52" rx="34" ry="10" fill="url(#headLight)" />

      <rect
        x="48" y="44" width="104" height="76" rx="26"
        fill="url(#bodyGrad)"
        stroke={C.outline}
        strokeWidth="1"
      />

      <rect x="62" y="58" width="76" height="46" rx="16" fill="url(#screenGrad)" />

      <rect
        x="66" y="62" width="34" height="8" rx="4"
        fill="#FFFFFF" opacity="0.08"
      />

      <g transform={`translate(${glanceX}, 0)`}>
        <motion.rect
          x={eyeLeft}
          width={eyeW}
          rx={6}
          fill="url(#eyeGlow)"
          animate={{
            y: blinking ? eyeY + eyeH / 2 - 1 : eyeY,
            height: blinking ? 2.5 : eyeH,
          }}
          transition={{ duration: 0.11, ease: 'easeInOut' }}
        />
        {!blinking && (
          <motion.circle
            cx={eyeLeft + eyeW - 3.5}
            cy={eyeY + 4}
            r={2}
            fill="#FFF8E7"
            opacity={0.9}
            animate={{ opacity: [0.75, 1, 0.75] }}
            transition={{ duration: 2.6, repeat: Infinity }}
          />
        )}
      </g>

      <g transform={`translate(${glanceX}, 0)`}>
        <motion.rect
          x={eyeRight}
          width={eyeW}
          rx={6}
          fill="url(#eyeGlow)"
          animate={{
            y: blinking ? eyeY + eyeH / 2 - 1 : eyeY,
            height: blinking ? 2.5 : eyeH,
          }}
          transition={{ duration: 0.11, ease: 'easeInOut' }}
        />
        {!blinking && (
          <motion.circle
            cx={eyeRight + eyeW - 3.5}
            cy={eyeY + 4}
            r={2}
            fill="#FFF8E7"
            opacity={0.9}
            animate={{ opacity: [0.75, 1, 0.75] }}
            transition={{ duration: 2.6, repeat: Infinity, delay: 0.3 }}
          />
        )}
      </g>

      <rect x="90" y="118" width="20" height="10" rx="3" fill={C.creamEdge} />

      <rect
        x="56" y="128" width="88" height="86" rx="28"
        fill="url(#bodyGrad)"
        stroke={C.outline}
        strokeWidth="1"
      />

      <image
        href={LOGO_SRC}
        x="86" y="156" width="28" height="28"
        preserveAspectRatio="xMidYMid meet"
      />

      <rect x="34" y="140" width="18" height="58" rx="9" fill={C.teal} />
      <rect x="37" y="150" width="12" height="36" rx="6" fill={C.tealDeep} opacity="0.35" />

      <motion.g
        style={{ transformOrigin: '155px 148px' }}
        animate={waving ? { rotate: [0, -24, -24, 0, -24, 0] } : { rotate: 0 }}
        transition={{ duration: 1.3, ease: 'easeInOut' }}
      >
        <rect x="148" y="140" width="18" height="58" rx="9" fill={C.teal} />
        <rect x="151" y="150" width="12" height="36" rx="6" fill={C.tealDeep} opacity="0.35" />
      </motion.g>
    </svg>
  );
}