import { Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-xl font-bold mb-4">Dre Janie Leblanc</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Chiropraticienne spécialisée en pédiatrie, obstétrique et neurologie fonctionnelle.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Cliniques</h4>
            <div className="space-y-2 text-sm text-gray-400">
              <p>Clinique Chiropratique Duplessis</p>
              <p>Polyclinique Ste-Foy</p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Liens rapides</h4>
            <div className="space-y-2 text-sm">
              <a href="#services" className="block text-gray-400 hover:text-white transition-colors">
                Services
              </a>
              <a href="#reconnexion" className="block text-gray-400 hover:text-white transition-colors">
                Programme Reconnexion
              </a>
              <a href="#about" className="block text-gray-400 hover:text-white transition-colors">
                À propos
              </a>
              <a href="#faq" className="block text-gray-400 hover:text-white transition-colors">
                FAQ
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} Dre Janie Leblanc. Tous droits réservés.
            </p>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1 text-sm text-gray-400">
                <span>Créé avec</span>
                <Heart className="w-4 h-4 text-red-500" fill="currentColor" />
                <span>pour les familles</span>
              </div>
              <a
                href="/admin"
                className="text-xs text-gray-600 hover:text-gray-400 transition-colors opacity-30 hover:opacity-100"
                title="Accès administrateur"
              >
                Admin
              </a>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-800 rounded-xl text-xs text-gray-400 leading-relaxed">
            <p className="mb-2">
              <strong className="text-gray-300">Avis important :</strong> Les résultats varient d'une personne à l'autre. Les informations sur ce site ne constituent pas un diagnostic médical et ne remplacent pas une consultation avec un professionnel de la santé. Chaque plan de soins est personnalisé selon l'évaluation clinique individuelle.
            </p>
            <p>
              <strong className="text-gray-300">Confidentialité :</strong> Vos données personnelles sont collectées avec votre consentement explicite et utilisées uniquement pour vous contacter concernant vos demandes de rendez-vous. Vous avez le droit de retirer votre consentement à tout moment.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
