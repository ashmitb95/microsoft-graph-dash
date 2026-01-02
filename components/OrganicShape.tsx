import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import './OrganicShape.css';

interface OrganicShapeProps {
  value: number | null;
}

const OrganicShape = ({ value }: OrganicShapeProps) => {
  const [displayValue, setDisplayValue] = useState<number>(0);
  const [morphValue, setMorphValue] = useState(0);

  useEffect(() => {
    if (value !== null) {
      setDisplayValue(value);
      // Generate a morph value based on the number for shape variation
      setMorphValue(value % 100);
    }
  }, [value]);

  // Calculate shape properties based on value
  const normalizedValue = value !== null ? Math.max(0, Math.min(100, value)) : 0;
  const size = 200 + (normalizedValue * 3); // Base 200px, scales with value
  const borderRadius = 30 + (morphValue * 0.5); // Dynamic border radius
  const rotation = normalizedValue * 3.6; // 360 degrees max

  // Generate dynamic border radius values for organic blob effect
  const getBorderRadius = () => {
    const base = 30;
    const variation = morphValue;
    return `${base + variation * 0.3}% ${base + variation * 0.5}% ${base + variation * 0.2}% ${base + variation * 0.4}% / ${base + variation * 0.4}% ${base + variation * 0.3}% ${base + variation * 0.5}% ${base + variation * 0.2}%`;
  };

  // Color gradient based on value
  const getColor = () => {
    const hue = (normalizedValue * 2.4) % 360;
    return `hsl(${hue}, 70%, 60%)`;
  };

  return (
    <div className="organic-shape-container">
      <motion.div
        className="organic-shape"
        style={{
          width: size,
          height: size,
          borderRadius: getBorderRadius(),
          background: `linear-gradient(135deg, ${getColor()}, ${getColor()}dd)`,
        }}
        animate={{
          rotate: rotation,
          scale: [1, 1.05, 1],
        }}
        transition={{
          rotate: {
            duration: 2,
            repeat: Infinity,
            ease: 'linear',
          },
          scale: {
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        }}
      >
        <motion.div
          className="organic-shape-inner"
          animate={{
            borderRadius: getBorderRadius(),
            rotate: -rotation * 0.5,
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </motion.div>
      
      {value !== null && (
        <motion.div
          className="organic-shape-value"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {displayValue.toFixed(1)}
        </motion.div>
      )}
      
      {value === null && (
        <div className="organic-shape-placeholder">
          Enter a value to visualize
        </div>
      )}
    </div>
  );
};

export default OrganicShape;

