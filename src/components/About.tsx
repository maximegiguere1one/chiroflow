import { motion } from 'framer-motion';

export default function About() {
  return (
    <section id="about" className="py-32 bg-muted-200 px-6 lg:px-12">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-24 items-start">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:sticky lg:top-32"
          >
            <div className="aspect-[3/4] bg-muted-300 overflow-hidden">
              <img
                src="/554742971_1340887261097972_6147460973259036497_n.jpg"
                alt="Dre Janie Leblanc"
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-12"
          >
            <div>
              <h2 className="font-heading text-5xl md:text-6xl tracking-tighter text-foreground mb-8">
                Approche
              </h2>
              <div className="space-y-6 text-lg text-foreground/70 leading-relaxed font-light">
                <p>
                  Passionnée par la chiropratique pédiatrique et la neurologie fonctionnelle depuis le début de ma carrière, j'ai toujours été fascinée par la capacité du corps humain à se guérir et à s'adapter.
                </p>
                <p>
                  Diplômée de l'UQTR en 2007, j'ai consacré ma pratique à aider les familles à retrouver un équilibre et un bien-être durables.
                </p>
                <p>
                  Mon approche combine rigueur scientifique et écoute empathique, en collaboration avec une équipe multidisciplinaire à la Polyclinique Ste-Foy depuis avril 2021.
                </p>
              </div>
            </div>

            <div className="pt-12 border-t border-foreground/10">
              <div className="grid grid-cols-2 gap-12">
                <div>
                  <div className="text-5xl font-light text-foreground tracking-tight mb-2">UQTR</div>
                  <div className="text-sm text-foreground/50 font-light">Diplômée 2007</div>
                </div>
                <div>
                  <div className="text-5xl font-light text-foreground tracking-tight mb-2">847+</div>
                  <div className="text-sm text-foreground/50 font-light">Familles aidées</div>
                </div>
              </div>
            </div>

            <div className="space-y-6 pt-12">
              <p className="text-sm text-foreground/40 uppercase tracking-widest font-light">
                Spécialisations
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  'Pédiatrie chiropratique',
                  'Obstétrique chiropratique',
                  'Neurologie fonctionnelle',
                  'Neuropédiatrie',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-1 h-1 rounded-full bg-foreground/30" />
                    <span className="text-sm text-foreground/70 font-light">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
