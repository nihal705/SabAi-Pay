import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { useFooterDetection } from './hooks/useFooterDetection';
import { useReducedMotion } from './hooks/useReducedMotion';
import { SCENES } from './constants';
import BaseRobot from './BaseRobot';
import CoinOverlay from './overlays/CoinOverlay';
import AgentPayFlowOverlay from './overlays/AgentPayFlowOverlay';
import AgentAskOverlay from './overlays/AgentAskOverlay';
import ReserveLimitOverlay from './overlays/ReserveLimitOverlay';
import ReservePayOverlay from './overlays/ReservePayOverlay';
import SecurityOverlay from './overlays/SecurityOverlay';
import DeliveryOverlay from './overlays/DeliveryOverlay';
import ScamAwareOverlay from './overlays/ScamAwareOverlay';
import './RobotCompanion.css';

export default function RobotCompanion() {
  const { isFooterVisible } = useFooterDetection();
  const reducedMotion = useReducedMotion();
  const dragControls = useDragControls();

  const [sceneIndex, setSceneIndex] = useState(0);
  const [blinking, setBlinking] = useState(false);
  const [glancing, setGlancing] = useState(null);
  const [waving, setWaving] = useState(false);

  const [offset, setOffset] = useState(() => {
    try {
      const saved = localStorage.getItem('sabai-robot-pos');
      return saved ? JSON.parse(saved) : { x: 0, y: 0 };
    } catch {
      return { x: 0, y: 0 };
    }
  });

  const currentScene = SCENES[sceneIndex];

  const sceneGlance =
    currentScene.id === 'agentPayFlow' ? 'left' :
    currentScene.id === 'agentAsk'     ? 'left' :
    currentScene.id === 'reserveLimit' ? 'left' :
    currentScene.id === 'reservePay'   ? 'right' :
    currentScene.id === 'delivery'     ? 'right' :
    null;
  const effectiveGlance = sceneGlance || glancing;

  useEffect(() => {
    if (reducedMotion || isFooterVisible) return;
    const t = setTimeout(() => {
      setSceneIndex((i) => (i + 1) % SCENES.length);
    }, currentScene.duration);
    return () => clearTimeout(t);
  }, [sceneIndex, currentScene.duration, isFooterVisible, reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return;
    let timeout;
    const schedule = () => {
      timeout = setTimeout(() => {
        setBlinking(true);
        setTimeout(() => setBlinking(false), 130);
        schedule();
      }, 2400 + Math.random() * 3200);
    };
    schedule();
    return () => clearTimeout(timeout);
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion || sceneGlance) return;
    const interval = setInterval(() => {
      const dir = Math.random() > 0.5 ? 'left' : 'right';
      setGlancing(dir);
      setTimeout(() => setGlancing(null), 900);
    }, 5500);
    return () => clearInterval(interval);
  }, [reducedMotion, sceneGlance]);

  useEffect(() => {
    if (reducedMotion) return;
    const interval = setInterval(() => {
      setWaving(true);
      setTimeout(() => setWaving(false), 1300);
    }, 11000);
    return () => clearInterval(interval);
  }, [reducedMotion]);

  const isActive = (id) => currentScene.id === id;

  return (
    <motion.div
      className={`robot-companion ${reducedMotion ? 'robot-companion-static' : ''}`}
      data-hidden={isFooterVisible}
      aria-hidden="true"
      drag={!reducedMotion}
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragElastic={0.12}
      dragConstraints={{
        left: -window.innerWidth + 220,
        right: 0,
        top: -window.innerHeight + 300,
        bottom: 0,
      }}
      onDragEnd={(_, info) => {
        const next = { x: offset.x + info.offset.x, y: offset.y + info.offset.y };
        setOffset(next);
        try { localStorage.setItem('sabai-robot-pos', JSON.stringify(next)); } catch {}
      }}
      style={{ x: offset.x, y: offset.y }}
      onPointerDown={(e) => {
        if (e.target.closest('.robot-bubble')) return;
        dragControls.start(e);
      }}
    >
      <AnimatePresence mode="wait">
        {!isFooterVisible && currentScene.bubble && (
          <motion.div
            key={currentScene.bubble}
            className="robot-bubble"
            initial={{ opacity: 0, y: 10, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.38, ease: [0.2, 0.7, 0.2, 1] }}
          >
            {currentScene.bubble}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="robot-stage">
        <motion.div
          style={{ position: 'absolute', inset: 0 }}
          animate={reducedMotion ? {} : { y: [0, -5, 0] }}
          transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <BaseRobot
            blinking={blinking}
            glancing={effectiveGlance}
            waving={waving}
          />

          <CoinOverlay active={isActive('coin') || isActive('idle')} />
          <AgentPayFlowOverlay active={isActive('agentPayFlow')} />
          <AgentAskOverlay active={isActive('agentAsk')} />
          <ReserveLimitOverlay active={isActive('reserveLimit')} />
          <ReservePayOverlay active={isActive('reservePay')} />
          <SecurityOverlay active={isActive('security')} />
          <DeliveryOverlay active={isActive('delivery')} />
          <ScamAwareOverlay active={isActive('scamAware')} />
        </motion.div>
      </div>
    </motion.div>
  );
}