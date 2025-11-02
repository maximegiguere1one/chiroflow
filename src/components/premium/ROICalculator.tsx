import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Clock } from 'lucide-react';
import { useElementInView } from '../../hooks/useScrollProgress';

export const ROICalculator: React.FC = () => {
  const { ref, isInView } = useElementInView(0.3);
  const [assistantSalary, setAssistantSalary] = useState(45000);
  const [hoursPerWeek, setHoursPerWeek] = useState(15);
  const [missedAppointments, setMissedAppointments] = useState(20);

  const chiroflowCost = 948;
  const savings = assistantSalary - chiroflowCost;
  const hoursPerYear = hoursPerWeek * 52;
  const revenueFromMissed = (missedAppointments / 100) * 0.85 * 80 * 52 * 20;

  return (
    <section
      ref={ref as any}
      id="calculateur"
      className="py-32 bg-gradient-to-b from-white to-slate-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-16"
        >
          <span className="inline-block px-6 py-2 bg-emerald-100 text-emerald-800 rounded-full text-sm font-semibold mb-6">
            Calculateur ROI
          </span>
          <h2 className="text-5xl lg:text-6xl font-bold text-slate-900 mb-6">
            Calculez vos économies
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
              en 30 secondes
            </span>
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Entrez les données de votre clinique pour voir combien vous économiserez
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl shadow-xl p-8 lg:p-12"
          >
            <h3 className="text-2xl font-bold text-slate-900 mb-8">
              Vos données actuelles
            </h3>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Salaire annuel de votre assistante
                </label>
                <div className="relative">
                  <input
                    type="range"
                    min="30000"
                    max="70000"
                    step="1000"
                    value={assistantSalary}
                    onChange={(e) => setAssistantSalary(Number(e.target.value))}
                    className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                  <div className="flex justify-between mt-2">
                    <span className="text-sm text-slate-500">30 000$</span>
                    <span className="text-lg font-bold text-emerald-600">
                      {assistantSalary.toLocaleString()}$ / an
                    </span>
                    <span className="text-sm text-slate-500">70 000$</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Heures/semaine sur tâches administratives
                </label>
                <div className="relative">
                  <input
                    type="range"
                    min="5"
                    max="30"
                    step="1"
                    value={hoursPerWeek}
                    onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                    className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                  <div className="flex justify-between mt-2">
                    <span className="text-sm text-slate-500">5h</span>
                    <span className="text-lg font-bold text-emerald-600">
                      {hoursPerWeek}h / semaine
                    </span>
                    <span className="text-sm text-slate-500">30h</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  % d'absences/annulations actuelles
                </label>
                <div className="relative">
                  <input
                    type="range"
                    min="5"
                    max="40"
                    step="1"
                    value={missedAppointments}
                    onChange={(e) => setMissedAppointments(Number(e.target.value))}
                    className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                  <div className="flex justify-between mt-2">
                    <span className="text-sm text-slate-500">5%</span>
                    <span className="text-lg font-bold text-emerald-600">
                      {missedAppointments}%
                    </span>
                    <span className="text-sm text-slate-500">40%</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.4 }}
            className="space-y-6"
          >
            <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-3xl shadow-2xl p-8 lg:p-12 text-white">
              <h3 className="text-3xl font-bold mb-8">
                Votre ROI avec ChiroFlow
              </h3>

              <div className="space-y-6">
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={isInView ? { scale: 1 } : {}}
                  transition={{ delay: 0.6 }}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-6"
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <DollarSign className="w-6 h-6 text-yellow-300" />
                    <span className="text-sm font-semibold text-emerald-100">
                      Économies annuelles
                    </span>
                  </div>
                  <div className="text-5xl font-bold">
                    {savings.toLocaleString()}$
                  </div>
                  <div className="text-sm text-emerald-100 mt-2">
                    vs salaire assistante
                  </div>
                </motion.div>

                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={isInView ? { scale: 1 } : {}}
                  transition={{ delay: 0.7 }}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-6"
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <Clock className="w-6 h-6 text-yellow-300" />
                    <span className="text-sm font-semibold text-emerald-100">
                      Temps récupéré
                    </span>
                  </div>
                  <div className="text-5xl font-bold">
                    {hoursPerYear}h
                  </div>
                  <div className="text-sm text-emerald-100 mt-2">
                    par année = {Math.floor(hoursPerYear / 8)} jours de travail
                  </div>
                </motion.div>

                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={isInView ? { scale: 1 } : {}}
                  transition={{ delay: 0.8 }}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-6"
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <TrendingUp className="w-6 h-6 text-yellow-300" />
                    <span className="text-sm font-semibold text-emerald-100">
                      Revenus additionnels
                    </span>
                  </div>
                  <div className="text-5xl font-bold">
                    {Math.floor(revenueFromMissed).toLocaleString()}$
                  </div>
                  <div className="text-sm text-emerald-100 mt-2">
                    de plages vides remplies
                  </div>
                </motion.div>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 1 }}
              className="bg-yellow-50 border-2 border-yellow-400 rounded-2xl p-6"
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center text-2xl">
                  🎉
                </div>
                <div>
                  <p className="font-bold text-slate-900 mb-1">
                    ROI total première année
                  </p>
                  <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
                    {(savings + revenueFromMissed).toLocaleString()}$
                  </p>
                  <p className="text-sm text-slate-600 mt-2">
                    Retour sur investissement de {Math.floor((savings + revenueFromMissed) / chiroflowCost)}x
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.a
              href="/admin/signup"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="block w-full px-8 py-5 bg-slate-900 text-white rounded-2xl font-bold text-xl text-center shadow-2xl hover:bg-slate-800 transition"
            >
              Commencer mon essai gratuit →
            </motion.a>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
