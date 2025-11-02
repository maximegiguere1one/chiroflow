import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Zap, AlertTriangle, TrendingUp, TrendingDown, X } from 'lucide-react';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  status: 'good' | 'warning' | 'critical';
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!import.meta.env.DEV) return;

    const checkPerformance = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');

      const fcp = paint.find(p => p.name === 'first-contentful-paint');
      const lcp = paint.find(p => p.name === 'largest-contentful-paint');

      const newMetrics: PerformanceMetric[] = [
        {
          name: 'DOM Load',
          value: Math.round(navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart || 0),
          unit: 'ms',
          status: navigation?.domContentLoadedEventEnd < 500 ? 'good' : navigation?.domContentLoadedEventEnd < 1000 ? 'warning' : 'critical'
        },
        {
          name: 'FCP',
          value: Math.round(fcp?.startTime || 0),
          unit: 'ms',
          status: (fcp?.startTime || 0) < 1800 ? 'good' : (fcp?.startTime || 0) < 3000 ? 'warning' : 'critical'
        },
        {
          name: 'Memory',
          value: Math.round((performance as any).memory?.usedJSHeapSize / 1048576 || 0),
          unit: 'MB',
          status: ((performance as any).memory?.usedJSHeapSize / 1048576 || 0) < 50 ? 'good' : 'warning'
        }
      ];

      setMetrics(newMetrics);
    };

    checkPerformance();
    const interval = setInterval(checkPerformance, 5000);

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === 'P') {
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  if (!import.meta.env.DEV || !isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 300 }}
        className="fixed bottom-4 right-4 bg-white rounded-xl shadow-2xl border-2 border-gray-200 p-4 z-50 w-80"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-gray-900">Performance Monitor</h3>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="space-y-2">
          {metrics.map((metric) => {
            const Icon = metric.status === 'good' ? TrendingUp :
                        metric.status === 'warning' ? AlertTriangle : TrendingDown;
            const colorClass = metric.status === 'good' ? 'text-green-500' :
                              metric.status === 'warning' ? 'text-yellow-500' : 'text-red-500';
            const bgClass = metric.status === 'good' ? 'bg-green-50' :
                           metric.status === 'warning' ? 'bg-yellow-50' : 'bg-red-50';

            return (
              <div
                key={metric.name}
                className={`flex items-center justify-between p-2 rounded-lg ${bgClass}`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${colorClass}`} />
                  <span className="text-sm font-medium text-gray-700">
                    {metric.name}
                  </span>
                </div>
                <span className={`text-sm font-bold ${colorClass}`}>
                  {metric.value} {metric.unit}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Zap className="w-3 h-3" />
            <span>Press Shift+P to toggle</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export function withPerformanceTracking<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  return function PerformanceTrackedComponent(props: P) {
    useEffect(() => {
      const startTime = performance.now();

      return () => {
        const endTime = performance.now();
        const renderTime = endTime - startTime;

        if (renderTime > 100 && import.meta.env.DEV) {
          console.warn(`⚠️ Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
        }

        if (import.meta.env.DEV) {
          console.log(`✓ ${componentName} rendered in ${renderTime.toFixed(2)}ms`);
        }
      };
    }, []);

    return <Component {...props} />;
  };
}
