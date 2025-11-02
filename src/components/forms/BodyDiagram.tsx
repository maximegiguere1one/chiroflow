import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Point {
  x: number;
  y: number;
  id: string;
}

interface BodyDiagramProps {
  selectedAreas: Point[];
  onChange: (areas: Point[]) => void;
  label?: string;
}

export function BodyDiagram({ selectedAreas, onChange, label }: BodyDiagramProps) {
  const [points, setPoints] = useState<Point[]>(selectedAreas);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    setPoints(selectedAreas);
  }, [selectedAreas]);

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newPoint: Point = {
      x,
      y,
      id: `point-${Date.now()}`
    };

    const updatedPoints = [...points, newPoint];
    setPoints(updatedPoints);
    onChange(updatedPoints);
  };

  const removePoint = (id: string) => {
    const updatedPoints = points.filter(p => p.id !== id);
    setPoints(updatedPoints);
    onChange(updatedPoints);
  };

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-neutral-700 mb-3">
          {label}
        </label>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="text-xs text-neutral-600 font-medium">Vue Antérieure</p>
          <div className="relative bg-neutral-50 border-2 border-neutral-200 rounded-xl overflow-hidden">
            <svg
              ref={svgRef}
              viewBox="0 0 100 200"
              className="w-full cursor-crosshair"
              onClick={handleClick}
            >
              <g stroke="#94a3b8" strokeWidth="0.5" fill="none">
                <ellipse cx="50" cy="15" rx="8" ry="10" />
                <rect x="42" y="25" width="16" height="20" rx="2" />
                <rect x="44" y="45" width="12" height="30" rx="1" />
                <rect x="46" y="75" width="8" height="35" rx="1" />
                <rect x="42" y="110" width="6" height="40" />
                <rect x="52" y="110" width="6" height="40" />
                <rect x="43" y="150" width="5" height="45" />
                <rect x="52" y="150" width="5" height="45" />
                <line x1="36" y1="30" x2="26" y2="65" />
                <line x1="64" y1="30" x2="74" y2="65" />
              </g>

              {points.map((point) => (
                <g key={point.id}>
                  <motion.circle
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    cx={point.x}
                    cy={point.y}
                    r="3"
                    fill="#ef4444"
                    stroke="#dc2626"
                    strokeWidth="0.5"
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      removePoint(point.id);
                    }}
                  />
                  <motion.circle
                    initial={{ scale: 0, opacity: 0.6 }}
                    animate={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 1, repeat: Infinity }}
                    cx={point.x}
                    cy={point.y}
                    r="3"
                    fill="#ef4444"
                  />
                </g>
              ))}
            </svg>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-neutral-600 font-medium">Vue Postérieure</p>
          <div className="relative bg-neutral-50 border-2 border-neutral-200 rounded-xl overflow-hidden">
            <svg viewBox="0 0 100 200" className="w-full cursor-crosshair">
              <g stroke="#94a3b8" strokeWidth="0.5" fill="none">
                <ellipse cx="50" cy="15" rx="8" ry="10" />
                <rect x="42" y="25" width="16" height="20" rx="2" />
                <rect x="44" y="45" width="12" height="30" rx="1" />
                <rect x="46" y="75" width="8" height="35" rx="1" />
                <rect x="42" y="110" width="6" height="40" />
                <rect x="52" y="110" width="6" height="40" />
                <rect x="43" y="150" width="5" height="45" />
                <rect x="52" y="150" width="5" height="45" />
                <line x1="36" y1="30" x2="26" y2="65" />
                <line x1="64" y1="30" x2="74" y2="65" />
              </g>
            </svg>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span className="text-xs text-neutral-600">Zones douloureuses</span>
        </div>
        {points.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setPoints([]);
              onChange([]);
            }}
            className="text-xs text-red-600 hover:text-red-700 font-medium"
          >
            Effacer tout
          </button>
        )}
      </div>

      <p className="text-xs text-neutral-500 mt-2">
        Cliquez sur le diagramme pour marquer les zones de douleur. Cliquez sur un point rouge pour le retirer.
      </p>
    </div>
  );
}
