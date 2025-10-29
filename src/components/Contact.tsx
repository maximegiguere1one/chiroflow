import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, Car } from 'lucide-react';

export default function Contact() {
  return (
    <section id="contact" className="py-24 bg-gradient-to-b from-teal-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Nous joindre</h2>
          <p className="text-xl text-gray-600">Polyclinique Ste-Foy</p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-start space-x-4">
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <MapPin className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Adresse</h3>
                <p className="text-gray-700">Polyclinique Ste-Foy</p>
                <p className="text-gray-700">990 Avenue de Bourgogne</p>
                <p className="text-gray-700">Québec, QC G1W 2L4</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-start space-x-4">
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Phone className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Téléphone</h3>
                <a href="tel:4186535551" className="text-teal-600 hover:text-teal-700 font-medium">
                  (418) 653-5551
                </a>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-start space-x-4">
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Mail className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Courriel</h3>
                <a href="mailto:info@cliniqueduplessis.com" className="text-teal-600 hover:text-teal-700 font-medium">
                  info@cliniqueduplessis.com
                </a>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-start space-x-4">
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Horaires</h3>
                <div className="text-sm text-gray-700 space-y-1">
                  <p>Lundi - Jeudi : 8h - 19h</p>
                  <p>Vendredi : 8h - 17h</p>
                  <p>Samedi : Sur rendez-vous</p>
                  <p>Dimanche : Fermé</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-start space-x-4">
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Car className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Stationnement</h3>
                <p className="text-sm text-gray-700">Stationnement gratuit disponible</p>
                <p className="text-sm text-gray-700">Accès poussette facilité</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-3xl overflow-hidden shadow-lg"
          >
            <div className="aspect-[4/3] w-full">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2732.1234567890123!2d-71.28954!3d46.77123!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDbCsDQ2JzE2LjQiTiA3McKwMTcnMjIuNCJX!5e0!3m2!1sen!2sca!4v1234567890123!5m2!1sen!2sca"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Localisation Polyclinique Ste-Foy"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
