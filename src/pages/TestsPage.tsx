import { useState, useCallback, useEffect } from 'react'
import { Helmet }                from 'react-helmet-async'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Clock, ArrowRight, CheckCircle, Flame, Wind, Sparkles, Brain, Target, BarChart3, Users, Compass, Heart, Shield as ShieldIcon, AlertCircle, AlertTriangle } from 'lucide-react'
import { Link }                  from 'react-router-dom'
import { supabase }              from '@/lib/supabase'
import { nanoid, cn }            from '@/lib/utils'
import Reveal                    from '@/components/ui/Reveal'
import TestLeadModal             from '@/components/tests/TestLeadModal'

interface Question { q: string; a: string[]; p: number[] }
interface Result   { min: number; max: number; name: string; level: 'danger' | 'warning' | 'success'; advice: string; actions: string[]; cta: string }
interface Test     { key: string; title: string; desc: string; cat: string; duration: number; questions: Question[]; results: Result[] }

const TESTS: Test[] = [
  {
    key: 'burnout', cat: 'Bien-être', duration: 4,
    title: 'Épuisement Professionnel',
    desc:  'Basé sur l\'inventaire clinique de Maslach (MBI). Détecte les 3 dimensions du burn-out.',
    questions: [
      { q: 'Ressentez-vous une fatigue profonde que le sommeil ne répare plus ?',            a: ['Tous les matins', 'Plusieurs fois par semaine', 'Occasionnellement', 'Rarement'],         p: [0,1,2,3] },
      { q: 'Avez-vous perdu le plaisir et la motivation dans vos tâches habituelles ?',      a: ['Totalement', 'En grande partie', 'Un peu', 'Pas du tout'],                              p: [0,1,2,3] },
      { q: 'Votre irritabilité a-t-elle augmenté avec vos proches ou collègues ?',           a: ['Oui, constamment', 'Souvent', 'Parfois', 'Non'],                                        p: [0,1,2,3] },
      { q: 'Souffrez-vous de douleurs physiques inexpliquées (dos, maux de tête, ventre) ?', a: ['Très fréquemment', 'Régulièrement', 'Occasionnellement', 'Jamais'],                     p: [0,1,2,3] },
      { q: 'Votre concentration et votre mémoire sont-elles en baisse notable ?',            a: ['Oui, fortement', 'Oui, modérément', 'Légèrement', 'Non'],                              p: [0,1,2,3] },
      { q: 'Le travail envahit-il vos soirées, week-ends et pensées ?',                      a: ['Toujours', 'Souvent', 'Parfois', 'Rarement'],                                           p: [0,1,2,3] },
      { q: 'Ressentez-vous du cynisme ou de la distance émotionnelle envers votre travail ?',a: ['Oui, profondément', 'Souvent', 'Parfois', 'Non'],                                      p: [0,1,2,3] },
      { q: 'Avez-vous l\'impression que vos efforts ne servent à rien ?',                    a: ['Oui, toujours', 'Souvent', 'Parfois', 'Non'],                                           p: [0,1,2,3] },
    ],
    results: [
      { min: 0,  max: 8,  level: 'danger',  name: 'Burn-out Sévère',       advice: 'Vos indicateurs sont au niveau critique. Votre santé mentale et physique est en danger immédiat. Une intervention professionnelle est indispensable sans délai.',    actions: ['Consultez un médecin ou psychologue immédiatement', 'Envisagez un arrêt de travail temporaire', 'Éliminez toute source de stress non essentielle', 'Contactez GESTORH pour un accompagnement d\'urgence'], cta: 'Consultation urgente' },
      { min: 9,  max: 16, level: 'warning', name: 'Risque Élevé',          advice: 'Vous êtes en zone de danger. Sans intervention, le burn-out complet est imminent.',                                                                                   actions: ['Posez des limites claires entre vie pro et personnelle', 'Déléguez et apprenez à dire non', 'Pratiquez une activité physique régulière', 'Consultez un professionnel GESTORH'],                           cta: 'Prendre RDV maintenant' },
      { min: 17, max: 24, level: 'warning', name: 'Vigilance Requise',     advice: 'Vous montrez des signes d\'épuisement précoce. C\'est le moment idéal pour agir.',                                                                                    actions: ['Identifiez et réduisez vos principales sources de stress', 'Rééquilibrez votre charge de travail', 'Développez des rituels de récupération', 'Un bilan de compétences peut vous aider'],                   cta: 'Explorer nos solutions' },
      { min: 25, max: 32, level: 'success', name: 'Équilibre Préservé',    advice: 'Vous gérez bien votre équilibre pour l\'instant. Continuez à prendre soin de vous.',                                                                                  actions: ['Maintenez vos bonnes habitudes', 'Prévenez en développant votre résilience', 'Partagez vos bonnes pratiques', 'Découvrez nos ateliers bien-être'],                                                          cta: 'Optimiser mon bien-être' },
    ],
  },
  {
    key: 'anxiety', cat: 'Bien-être', duration: 4,
    title: 'Niveau d\'Anxiété',
    desc:  'Inspiré du GAD-7. Évalue votre niveau d\'anxiété et son impact sur votre quotidien.',
    questions: [
      { q: 'Vous sentez-vous nerveux(se), anxieux(se) ou à bout ?',                 a: ['Presque tous les jours', 'Plus de la moitié du temps', 'Quelques jours', 'Jamais'], p: [0,1,2,3] },
      { q: 'Êtes-vous incapable d\'arrêter de vous faire du souci ?',               a: ['Presque tous les jours', 'Souvent', 'Parfois', 'Rarement'],                        p: [0,1,2,3] },
      { q: 'Avez-vous du mal à vous détendre ?',                                    a: ['Presque tous les jours', 'Souvent', 'Parfois', 'Rarement'],                        p: [0,1,2,3] },
      { q: 'Êtes-vous tellement agité(e) qu\'il est difficile de rester assis(e) ?',a: ['Presque tous les jours', 'Souvent', 'Parfois', 'Jamais'],                         p: [0,1,2,3] },
      { q: 'Vous sentez-vous facilement contrarié(e) ou irritable ?',               a: ['Presque tous les jours', 'Souvent', 'Parfois', 'Rarement'],                        p: [0,1,2,3] },
      { q: 'Avez-vous peur que quelque chose de grave puisse arriver ?',            a: ['Presque tous les jours', 'Souvent', 'Parfois', 'Rarement'],                        p: [0,1,2,3] },
      { q: 'Avez-vous des troubles du sommeil liés à des pensées envahissantes ?',  a: ['Presque tous les jours', 'Souvent', 'Parfois', 'Rarement'],                        p: [0,1,2,3] },
      { q: 'Ces difficultés impactent-elles votre travail ou vos relations ?',      a: ['Très fortement', 'Fortement', 'Un peu', 'Pas du tout'],                           p: [0,1,2,3] },
    ],
    results: [
      { min: 0,  max: 8,  level: 'danger',  name: 'Anxiété Sévère',    advice: 'Votre niveau d\'anxiété est élevé et perturbe significativement votre vie.',             actions: ['Consultez un psychologue ou psychiatre', 'Apprenez des techniques de respiration', 'Évitez la caféine et l\'alcool', 'Contactez GESTORH pour un suivi thérapeutique'], cta: 'Consulter un spécialiste' },
      { min: 9,  max: 16, level: 'warning', name: 'Anxiété Modérée',   advice: 'Vous présentez un niveau d\'anxiété modéré. Un accompagnement vous aidera.',            actions: ['Pratiquez la méditation ou le yoga régulièrement', 'Limitez l\'exposition aux informations anxiogènes', 'Parlez de vos inquiétudes à un professionnel', 'Explorez la thérapie cognitive'], cta: 'Prendre RDV' },
      { min: 17, max: 24, level: 'warning', name: 'Anxiété Légère',    advice: 'Quelques signes d\'anxiété sont présents. Des techniques simples peuvent vous aider.',   actions: ['Développez une routine de relaxation quotidienne', 'Pratiquez le sport régulièrement', 'Cultivez des relations sociales positives', 'Découvrez nos ateliers gestion du stress'], cta: 'Explorer nos ressources' },
      { min: 25, max: 32, level: 'success', name: 'Niveau Minimal',    advice: 'Votre niveau d\'anxiété est faible. Vous gérez bien votre stress.',                      actions: ['Continuez vos pratiques bien-être', 'Partagez vos techniques', 'Restez attentif aux signaux précoces', 'Explorez nos programmes de développement'], cta: 'Maintenir cet équilibre' },
    ],
  },
  {
    key: 'selfesteem', cat: 'Bien-être', duration: 4,
    title: 'Estime de Soi',
    desc:  'Basé sur l\'échelle de Rosenberg. Mesure votre rapport à vous-même.',
    questions: [
      { q: 'Globalement, êtes-vous satisfait(e) de vous-même ?',                          a: ['Pas du tout', 'Peu', 'Assez', 'Tout à fait'],                                p: [0,1,2,3] },
      { q: 'Pensez-vous avoir un certain nombre de qualités ?',                            a: ['Non, très peu', 'Quelques-unes', 'Oui, plusieurs', 'Oui, beaucoup'],         p: [0,1,2,3] },
      { q: 'Êtes-vous capable de faire les choses aussi bien que la plupart des gens ?',  a: ['Non, bien moins', 'Moins bien', 'Aussi bien', 'Mieux'],                      p: [0,1,2,3] },
      { q: 'Avez-vous une attitude positive envers vous-même ?',                          a: ['Rarement', 'Parfois', 'Souvent', 'Toujours'],                                p: [0,1,2,3] },
      { q: 'Êtes-vous enclin(e) à penser que vous êtes un(e) raté(e) ?',                 a: ['Souvent', 'Parfois', 'Rarement', 'Jamais'],                                  p: [0,1,2,3] },
      { q: 'Pensez-vous que vous n\'avez pas grand chose dont être fier(e) ?',            a: ['Oui, souvent', 'Parfois', 'Rarement', 'Non, jamais'],                        p: [0,1,2,3] },
      { q: 'Souhaiteriez-vous avoir plus de respect pour vous-même ?',                    a: ['Beaucoup plus', 'Un peu plus', 'Légèrement', 'Non'],                         p: [0,1,2,3] },
      { q: 'Vous sentez-vous inutile par moments ?',                                      a: ['Très souvent', 'Souvent', 'Rarement', 'Jamais'],                             p: [0,1,2,3] },
    ],
    results: [
      { min: 0,  max: 10, level: 'danger',  name: 'Estime Très Faible', advice: 'Votre estime de soi est très basse et affecte probablement tous les aspects de votre vie.', actions: ['Consultez un psychologue spécialisé', 'Tenez un journal de vos réussites', 'Entourez-vous de personnes bienveillantes', 'Commencez une thérapie cognitive avec GESTORH'], cta: 'Accompagnement urgent' },
      { min: 11, max: 18, level: 'warning', name: 'Estime Fragile',     advice: 'Votre estime de soi est instable. Un coaching personnel peut transformer votre regard.',    actions: ['Identifiez vos croyances limitantes', 'Fixez-vous des objectifs atteignables', 'Célébrez chaque petite victoire', 'Découvrez notre coaching personnel'],                 cta: 'Renforcer ma confiance' },
      { min: 19, max: 24, level: 'warning', name: 'Estime Moyenne',     advice: 'Vous avez une estime correcte mais perfectible.',                                             actions: ['Sortez de votre zone de confort', 'Pratiquez l\'auto-compassion', 'Apprenez à recevoir les compliments', 'Explorez nos ateliers développement'],                       cta: 'Développer ma confiance' },
      { min: 25, max: 32, level: 'success', name: 'Estime Solide',      advice: 'Vous avez une bonne estime de vous-même.',                                                    actions: ['Continuez à vous challenger', 'Aidez les autres à développer leur confiance', 'Explorez de nouveaux domaines', 'Découvrez nos programmes de leadership'],               cta: 'Aller encore plus loin' },
    ],
  },
  {
    key: 'eq', cat: 'Carrière', duration: 5,
    title: 'Intelligence Émotionnelle',
    desc:  'Basé sur le modèle de Goleman. Évalue conscience de soi, maîtrise, empathie et relations.',
    questions: [
      { q: 'Identifiez-vous précisément vos émotions au moment où vous les ressentez ?',   a: ['Rarement', 'Parfois', 'Souvent', 'Toujours'],          p: [0,1,2,3] },
      { q: 'Restez-vous calme et maître de vous en situation de stress intense ?',          a: ['Rarement', 'Parfois', 'Souvent', 'Presque toujours'],  p: [0,1,2,3] },
      { q: 'Comprenez-vous facilement ce que ressentent les personnes autour de vous ?',   a: ['Rarement', 'Parfois', 'Souvent', 'Toujours'],          p: [0,1,2,3] },
      { q: 'Adaptez-vous votre communication selon l\'état émotionnel de l\'interlocuteur ?', a: ['Rarement', 'Parfois', 'Souvent', 'Toujours'],       p: [0,1,2,3] },
      { q: 'Utilisez-vous vos émotions pour vous motiver et atteindre vos objectifs ?',    a: ['Rarement', 'Parfois', 'Souvent', 'Toujours'],          p: [0,1,2,3] },
      { q: 'Gérez-vous bien les conflits interpersonnels de façon constructive ?',          a: ['Rarement', 'Parfois', 'Souvent', 'Toujours'],          p: [0,1,2,3] },
      { q: 'Prenez-vous du recul avant de réagir face à une situation frustrante ?',       a: ['Rarement', 'Parfois', 'Souvent', 'Toujours'],          p: [0,1,2,3] },
      { q: 'Vos relations professionnelles sont-elles harmonieuses et productives ?',       a: ['Rarement', 'Parfois', 'Souvent', 'Toujours'],          p: [0,1,2,3] },
    ],
    results: [
      { min: 0,  max: 8,  level: 'danger',  name: 'IE à Développer',      advice: 'Votre intelligence émotionnelle nécessite un travail approfondi.',           actions: ['Tenez un journal émotionnel quotidien', 'Pratiquez l\'écoute active', 'Consultez un coach GESTORH', 'Lisez "L\'Intelligence Émotionnelle" de Goleman'], cta: 'Développer mon IE' },
      { min: 9,  max: 16, level: 'warning', name: 'IE en Construction',    advice: 'Vous avez des bases mais votre IE est encore instable.',                     actions: ['Pratiquez la pleine conscience chaque jour', 'Demandez du feedback régulier', 'Rejoignez un groupe de développement', 'Découvrez notre programme IE'],     cta: 'Renforcer mon IE' },
      { min: 17, max: 24, level: 'warning', name: 'IE Intermédiaire',      advice: 'Votre IE est correcte. Quelques ajustements peuvent vous propulser.',        actions: ['Approfondissez votre empathie', 'Travaillez votre communication non-verbale', 'Développez votre gestion de l\'ambiguïté', 'Explorez notre coaching'], cta: 'Affiner mon IE' },
      { min: 25, max: 32, level: 'success', name: 'IE Élevée',             advice: 'Vous possédez une intelligence émotionnelle remarquable.',                   actions: ['Devenez mentor pour développer les autres', 'Explorez le coaching comme métier', 'Construisez des équipes performantes', 'Découvrez nos formations avancées'], cta: 'Transmettre mon savoir' },
    ],
  },
  {
    key: 'leadership', cat: 'Carrière', duration: 4,
    title: 'Style de Leadership',
    desc:  'Grille de Blake & Mouton. Identifie votre style dominant et votre potentiel.',
    questions: [
      { q: 'Comment définissez-vous votre rôle principal en tant que manager ?',         a: ['Contrôler et diriger', 'Coordonner et planifier', 'Coacher et développer', 'Inspirer et transformer'], p: [0,1,2,3] },
      { q: 'Face à un collaborateur en difficulté, quelle est votre première réaction ?',a: ['Je fixe des objectifs stricts', 'Je surveille de plus près', 'Je propose du soutien', 'Je cherche la cause profonde'], p: [0,1,2,3] },
      { q: 'Comment prenez-vous vos décisions importantes ?',                            a: ['Seul(e), rapidement', 'Après analyse des données', 'En consultant l\'équipe', 'En co-construisant'], p: [0,1,2,3] },
      { q: 'Quelle est votre approche du feedback ?',                                    a: ['Uniquement sur les erreurs', 'Annuel lors des évaluations', 'Régulier et constructif', 'Continu et bienveillant'], p: [0,1,2,3] },
      { q: 'Comment gérez-vous les résistances au changement ?',                         a: ['Par l\'autorité', 'Par la persuasion logique', 'Par l\'écoute et le dialogue', 'Par la co-création'], p: [0,1,2,3] },
      { q: 'Quelle place accordez-vous au développement de vos collaborateurs ?',        a: ['Ce n\'est pas mon rôle', 'Si j\'ai du temps', 'C\'est important', 'C\'est ma priorité'], p: [0,1,2,3] },
      { q: 'Comment créez-vous la motivation dans votre équipe ?',                       a: ['Par la pression', 'Par les primes', 'Par la reconnaissance', 'Par le sens et la vision'], p: [0,1,2,3] },
      { q: 'Votre équipe oserait-elle vous challenger ou vous contredire ?',             a: ['Non, jamais', 'Très rarement', 'Parfois', 'Oui, régulièrement'], p: [0,1,2,3] },
    ],
    results: [
      { min: 0,  max: 8,  level: 'danger',  name: 'Leadership Autoritaire',      advice: 'Votre style autoritaire génère de l\'anxiété et bride la créativité.',  actions: ['Pratiquez l\'écoute active', 'Demandez l\'avis de votre équipe', 'Rejoignez le programme Leadership GESTORH', 'Lisez "Le Manager Minute"'], cta: 'Transformer mon leadership' },
      { min: 9,  max: 16, level: 'warning', name: 'Leadership Transactionnel',   advice: 'Vous managez par les règles. Stable mais insuffisant pour l\'engagement.',actions: ['Investissez dans le développement de vos collaborateurs', 'Partagez votre vision', 'Développez votre intelligence émotionnelle', 'Découvrez notre coaching'], cta: 'Évoluer vers plus d\'impact' },
      { min: 17, max: 24, level: 'warning', name: 'Leadership Participatif',     advice: 'Vous impliquez bien votre équipe mais pouvez encore amplifier votre impact.', actions: ['Formulez une vision plus claire', 'Développez votre charisme', 'Déléguez avec plus de confiance', 'Explorez le leadership transformationnel'], cta: 'Amplifier mon impact' },
      { min: 25, max: 32, level: 'success', name: 'Leadership Transformationnel',advice: 'Vous êtes un leader inspirant qui transforme les individus.',             actions: ['Devenez mentor de futurs leaders', 'Documentez votre approche', 'Explorez des responsabilités stratégiques', 'Rejoignez notre réseau de leaders'], cta: 'Partager votre excellence' },
    ],
  },
  {
    key: 'org_performance', cat: 'Organisation', duration: 5,
    title: 'Performance Organisationnelle',
    desc:  'Audit stratégique de la maturité de votre organisation.',
    questions: [
      { q: 'Vos objectifs stratégiques sont-ils traduits en KPI mesurés régulièrement ?',    a: ['Non, pas de suivi', 'Informellement', 'Pour certains', 'Oui, pour tous'], p: [0,1,2,3] },
      { q: 'Vos processus clés sont-ils documentés et maîtrisés par les équipes ?',          a: ['Non, tout est oral', 'Partiellement', 'Pour les postes clés', 'Entièrement'], p: [0,1,2,3] },
      { q: 'Le dirigeant peut-il s\'absenter 3 semaines sans impact majeur ?',               a: ['Impossible', 'Très difficile', 'Possible avec effort', 'Oui, l\'équipe est autonome'], p: [0,1,2,3] },
      { q: 'Votre politique de recrutement est-elle basée sur des fiches de poste claires ?',a: ['Non, au feeling', 'Parfois', 'Souvent', 'Toujours'], p: [0,1,2,3] },
      { q: 'Avez-vous un plan de développement des compétences pour vos collaborateurs ?',   a: ['Non', 'Informellement', 'En cours', 'Oui, formalisé'], p: [0,1,2,3] },
      { q: 'Votre culture d\'entreprise est-elle clairement définie et vécue ?',             a: ['Non définie', 'Vaguement', 'Partiellement', 'Oui, pleinement'], p: [0,1,2,3] },
      { q: 'Utilisez-vous des outils digitaux adaptés à votre croissance ?',                 a: ['Non, outils obsolètes', 'Basiques', 'Corrects', 'Oui, optimisés'], p: [0,1,2,3] },
      { q: 'Mesurez-vous régulièrement la satisfaction de vos équipes ?',                    a: ['Jamais', 'Rarement', 'Annuellement', 'Régulièrement'], p: [0,1,2,3] },
    ],
    results: [
      { min: 0,  max: 8,  level: 'danger',  name: 'Organisation Fragile',      advice: 'Votre organisation manque de fondations solides. Les risques de crise sont élevés.', actions: ['Réalisez un audit complet avec GESTORH', 'Documentez vos processus', 'Définissez des rôles clairs', 'Mettez en place des indicateurs'], cta: 'Audit d\'urgence' },
      { min: 9,  max: 16, level: 'warning', name: 'Organisation en Transition', advice: 'Des bases existent mais la structure est insuffisante pour une vraie croissance.',   actions: ['Formalisez votre gouvernance', 'Investissez dans la formation', 'Développez votre culture', 'Consultez GESTORH'], cta: 'Structurer mon organisation' },
      { min: 17, max: 24, level: 'warning', name: 'Organisation Structurée',    advice: 'Votre organisation est solide mais peut encore gagner en efficacité.',               actions: ['Optimisez vos processus', 'Renforcez votre culture d\'innovation', 'Développez vos managers', 'Explorez les solutions RH digitales'], cta: 'Optimiser ma performance' },
      { min: 25, max: 32, level: 'success', name: 'Organisation Performante',   advice: 'Votre organisation est mature. Vous avez les bases pour une croissance ambitieuse.', actions: ['Visez la certification de vos pratiques', 'Développez votre attractivité employeur', 'Innovez dans vos pratiques', 'Partagez vos bonnes pratiques'], cta: 'Viser l\'excellence' },
    ],
  },
  {
    key: 'team', cat: 'Organisation', duration: 4,
    title: 'Cohésion d\'Équipe',
    desc:  'Basé sur le modèle Lencioni. Analyse confiance, conflits, engagement et résultats.',
    questions: [
      { q: 'Les membres de votre équipe se font-ils mutuellement confiance ?',               a: ['Non, méfiance générale', 'Peu', 'Assez', 'Oui, profondément'], p: [0,1,2,3] },
      { q: 'Les désaccords sont-ils exprimés ouvertement et résolus constructivement ?',     a: ['Jamais, tout est tu', 'Rarement', 'Parfois', 'Oui, régulièrement'], p: [0,1,2,3] },
      { q: 'Chacun comprend-il clairement son rôle et ses responsabilités ?',               a: ['Non, c\'est flou', 'Approximativement', 'Assez bien', 'Oui, clairement'], p: [0,1,2,3] },
      { q: 'L\'équipe tient-elle ses engagements et respecte-t-elle les délais ?',          a: ['Rarement', 'Parfois', 'Souvent', 'Presque toujours'], p: [0,1,2,3] },
      { q: 'Les résultats collectifs priment-ils sur les intérêts individuels ?',           a: ['Non, chacun pour soi', 'Rarement', 'Souvent', 'Toujours'], p: [0,1,2,3] },
      { q: 'Le feedback est-il donné et reçu de manière constructive ?',                    a: ['Non, c\'est tabou', 'Rarement', 'Parfois', 'Oui, culture établie'], p: [0,1,2,3] },
      { q: 'Les réunions sont-elles productives et mènent-elles à des décisions claires ?', a: ['Non, inefficaces', 'Peu', 'Assez', 'Oui, très efficaces'], p: [0,1,2,3] },
      { q: 'Y a-t-il une vision commune qui fédère toute l\'équipe ?',                     a: ['Non, aucune', 'Vague', 'Partagée', 'Forte et inspirante'], p: [0,1,2,3] },
    ],
    results: [
      { min: 0,  max: 8,  level: 'danger',  name: 'Équipe Dysfonctionnelle', advice: 'Votre équipe souffre de dysfonctionnements profonds qui paralysent la performance.', actions: ['Organisez un séminaire de cohésion', 'Clarifiez les rôles', 'Établissez des règles de communication', 'Envisagez une médiation'], cta: 'Intervention d\'urgence' },
      { min: 9,  max: 16, level: 'warning', name: 'Équipe en Tension',       advice: 'Des tensions freinent votre équipe. Des ateliers ciblés peuvent améliorer la dynamique.', actions: ['Organisez des ateliers de team building', 'Instaurez des réunions de feedback', 'Clarifiez la vision commune', 'Consultez GESTORH'], cta: 'Reconstruire la cohésion' },
      { min: 17, max: 24, level: 'warning', name: 'Équipe en Progression',   advice: 'Votre équipe fonctionne correctement mais peut atteindre un niveau supérieur.', actions: ['Renforcez les rituels d\'équipe', 'Développez une culture du feedback', 'Célébrez les succès collectifs', 'Explorez nos programmes haute performance'], cta: 'Consolider la cohésion' },
      { min: 25, max: 32, level: 'success', name: 'Équipe Haute Performance', advice: 'Votre équipe est soudée, engagée et performante.', actions: ['Documentez votre culture', 'Devenez une équipe apprenante', 'Partagez vos pratiques', 'Explorez des défis plus ambitieux'], cta: 'Maintenir l\'excellence' },
    ],
  },
  {
    key: 'ikigai', cat: 'Carrière', duration: 4,
    title: 'Alignement Professionnel',
    desc:  'Concept Ikigai. Mesure l\'adéquation entre talents, valeurs, mission et rémunération.',
    questions: [
      { q: 'Votre travail actuel vous passionne-t-il profondément ?',                   a: ['Non, c\'est une corvée', 'Peu', 'Assez', 'Oui, profondément'], p: [0,1,2,3] },
      { q: 'Êtes-vous reconnu(e) et valorisé(e) pour vos compétences spécifiques ?',   a: ['Non, sous-exploité(e)', 'Peu', 'Assez', 'Oui, pleinement'], p: [0,1,2,3] },
      { q: 'Votre travail contribue-t-il à quelque chose qui a du sens pour vous ?',    a: ['Non, aucun sens', 'Peu', 'Assez', 'Oui, profondément'], p: [0,1,2,3] },
      { q: 'Perdez-vous la notion du temps lors de certaines tâches (état de flow) ?',  a: ['Jamais', 'Rarement', 'Parfois', 'Souvent'], p: [0,1,2,3] },
      { q: 'Votre rémunération correspond-elle à votre valeur sur le marché ?',         a: ['Non, largement sous-payé(e)', 'Peu', 'Correctement', 'Oui, bien rémunéré(e)'], p: [0,1,2,3] },
      { q: 'Êtes-vous fier(e) d\'annoncer votre métier en public ?',                   a: ['Non', 'Peu', 'Assez', 'Oui, très fier(e)'], p: [0,1,2,3] },
      { q: 'Vos valeurs personnelles sont-elles alignées avec celles de votre organisation ?', a: ['Non, contradiction', 'Peu', 'Assez', 'Oui, parfaitement'], p: [0,1,2,3] },
      { q: 'Vous voyez-vous encore dans ce poste dans 3 ans avec enthousiasme ?',       a: ['Non, je veux partir', 'Avec réserves', 'Probablement', 'Oui, avec enthousiasme'], p: [0,1,2,3] },
    ],
    results: [
      { min: 0,  max: 8,  level: 'danger',  name: 'Désalignement Profond',      advice: 'Vous êtes profondément désaligné(e). Ce décalage est une source majeure de souffrance.', actions: ['Réalisez un bilan de compétences', 'Explorez vos valeurs profondes', 'Rencontrez des professionnels', 'Envisagez une reconversion'], cta: 'Reconversion urgente' },
      { min: 9,  max: 16, level: 'warning', name: 'Alignement Partiel',          advice: 'Votre travail répond partiellement à vos besoins. Une réorientation ciblée peut tout changer.', actions: ['Identifiez ce qui vous manque', 'Discutez d\'une évolution', 'Explorez des formations', 'Consultez un coach GESTORH'], cta: 'Trouver mon ikigai' },
      { min: 17, max: 24, level: 'warning', name: 'En Quête d\'Excellence',      advice: 'Vous êtes globalement bien aligné(e) mais l\'excellence est encore accessible.', actions: ['Négociez des missions plus alignées', 'Développez vos compétences signature', 'Construisez votre marque personnelle', 'Explorez nos programmes'], cta: 'Optimiser mon alignement' },
      { min: 25, max: 32, level: 'success', name: 'Ikigai Atteint',              advice: 'Vous avez trouvé votre ikigai ! Votre travail est une source d\'épanouissement.', actions: ['Documentez votre parcours', 'Mentoriser des personnes en quête de sens', 'Amplifiez votre impact', 'Rejoignez notre réseau'], cta: 'Partager votre succès' },
    ],
  },
  {
    key: 'couple', cat: 'Relations', duration: 5,
    title: 'Harmonie de Couple',
    desc:  'Basé sur la théorie de Gottman. Évalue les piliers d\'une relation durable.',
    questions: [
      { q: 'Partagez-vous une vision de vie commune claire à 5 ans ?',                  a: ['Non, visions opposées', 'Vague', 'Partiellement', 'Oui, clairement'], p: [0,1,2,3] },
      { q: 'Comment se terminent généralement vos désaccords ?',                        a: ['Avec rancœur', 'Sans vraie résolution', 'Par compromis', 'Par compréhension mutuelle'], p: [0,1,2,3] },
      { q: 'Exprimez-vous mutuellement de l\'admiration et de la gratitude ?',          a: ['Jamais', 'Rarement', 'Parfois', 'Régulièrement'], p: [0,1,2,3] },
      { q: 'Passez-vous du temps de qualité ensemble (sans écrans) ?',                  a: ['Jamais', 'Rarement', 'Parfois', 'Régulièrement'], p: [0,1,2,3] },
      { q: 'Votre niveau de soutien mutuel lors des crises est-il ?',                   a: ['Absent', 'Insuffisant', 'Correct', 'Indéfectible'], p: [0,1,2,3] },
      { q: 'Vos valeurs fondamentales sont-elles alignées ?',                           a: ['Opposées', 'Souvent en conflit', 'Globalement alignées', 'Parfaitement alignées'], p: [0,1,2,3] },
      { q: 'Parlez-vous ouvertement de vos besoins et de vos limites ?',               a: ['Jamais', 'Rarement', 'Parfois', 'Oui, librement'], p: [0,1,2,3] },
      { q: 'Votre relation vous apporte-t-elle plus de joie que de souffrance ?',       a: ['Plus de souffrance', 'Équilibre difficile', 'Plutôt de la joie', 'Beaucoup de joie'], p: [0,1,2,3] },
    ],
    results: [
      { min: 0,  max: 8,  level: 'danger',  name: 'Relation en Crise',        advice: 'Votre relation traverse une crise profonde. Une thérapie peut encore reconstruire.', actions: ['Consultez un thérapeute GESTORH rapidement', 'Évitez les décisions irréversibles', 'Pratiquez l\'écoute sans jugement', 'Lisez "Les 7 Principes" de Gottman'], cta: 'Thérapie de couple' },
      { min: 9,  max: 16, level: 'warning', name: 'Relation Fragilisée',      advice: 'Des fissures importantes sont apparues. Un accompagnement peut reconstruire la confiance.', actions: ['Organisez des "dates" régulières', 'Pratiquez la communication non-violente', 'Consultez un thérapeute GESTORH', 'Travaillez vos croyances sur le couple'], cta: 'Reconstruire notre couple' },
      { min: 17, max: 24, level: 'warning', name: 'Relation Stable',          advice: 'Votre relation est stable mais peut s\'enrichir davantage.', actions: ['Planifiez des activités nouvelles', 'Apprenez le langage amoureux', 'Pratiquez la gratitude quotidienne', 'Découvrez nos ateliers de couple'], cta: 'Enrichir notre relation' },
      { min: 25, max: 32, level: 'success', name: 'Relation Épanouissante',   advice: 'Votre relation est solide, équilibrée et épanouissante.', actions: ['Continuez à nourrir votre complicité', 'Partagez vos secrets de couple', 'Soutenez d\'autres couples', 'Explorez nos ateliers d\'approfondissement'], cta: 'Célébrer votre amour' },
    ],
  },
  {
    key: 'resilience', cat: 'Bien-être', duration: 4,
    title: 'Résilience Psychologique',
    desc:  'Basé sur l\'échelle Connor-Davidson. Mesure votre capacité à rebondir.',
    questions: [
      { q: 'Face à un échec difficile, quelle est votre réaction habituelle ?', a: ['Je m\'effondre longuement', 'Je lutte beaucoup', 'Je me relève lentement', 'Je rebondis rapidement'], p: [0,1,2,3] },
      { q: 'Croyez-vous en votre capacité à surmonter les défis ?',            a: ['Rarement', 'Parfois', 'Souvent', 'Toujours'], p: [0,1,2,3] },
      { q: 'Avez-vous un réseau de soutien solide sur lequel compter ?',       a: ['Non, je suis seul(e)', 'Peu de personnes', 'Quelques personnes fiables', 'Un réseau solide'], p: [0,1,2,3] },
      { q: 'Trouvez-vous du sens même dans les situations difficiles ?',        a: ['Non, jamais', 'Rarement', 'Parfois', 'Oui, souvent'], p: [0,1,2,3] },
      { q: 'Prenez-vous soin de votre santé physique et mentale régulièrement ?',a: ['Non, pas du tout', 'Peu', 'Assez bien', 'Oui, activement'], p: [0,1,2,3] },
      { q: 'Avez-vous des stratégies d\'adaptation efficaces face au stress ?', a: ['Non, je subis', 'Quelques-unes', 'Plusieurs', 'Oui, une boîte à outils complète'], p: [0,1,2,3] },
      { q: 'Votre passé difficile vous a-t-il rendu(e) plus fort(e) ?',        a: ['Non, il me freine', 'Peu', 'Assez', 'Oui, profondément'], p: [0,1,2,3] },
      { q: 'Restez-vous optimiste et voyez-vous des opportunités dans les crises ?',a: ['Non, jamais', 'Rarement', 'Parfois', 'Oui, naturellement'], p: [0,1,2,3] },
    ],
    results: [
      { min: 0,  max: 8,  level: 'danger',  name: 'Résilience Faible',    advice: 'Votre capacité de résilience est limitée et vous rend vulnérable face aux épreuves.', actions: ['Consultez un psychologue GESTORH', 'Commencez une pratique de méditation', 'Développez votre réseau de soutien', 'Identifiez vos blessures passées'], cta: 'Renforcer ma résilience' },
      { min: 9,  max: 16, level: 'warning', name: 'Résilience Fragile',   advice: 'Vous avez quelques ressources mais votre résilience reste fragile.', actions: ['Pratiquez la pleine conscience', 'Renforcez vos relations de soutien', 'Apprenez des techniques de régulation', 'Rejoignez un groupe de développement'], cta: 'Développer ma résilience' },
      { min: 17, max: 24, level: 'warning', name: 'Résilience Modérée',   advice: 'Vous avez de bonnes capacités mais des situations intenses peuvent vous déstabiliser.', actions: ['Développez la gratitude', 'Renforcez votre sens du but', 'Approfondissez votre réseau', 'Explorez nos ateliers'], cta: 'Renforcer mes ressources' },
      { min: 25, max: 32, level: 'success', name: 'Résilience Élevée',    advice: 'Vous êtes remarquablement résilient(e). Vous transformez les épreuves en opportunités.', actions: ['Partagez votre expérience', 'Devenez mentor', 'Utilisez votre résilience professionnellement', 'Rejoignez notre réseau'], cta: 'Partager votre force' },
    ],
  },
]

const ICON_MAP: Record<string, React.ElementType> = {
  burnout:         Flame,
  anxiety:         Wind,
  selfesteem:      Sparkles,
  eq:              Brain,
  leadership:      Target,
  org_performance: BarChart3,
  team:            Users,
  ikigai:          Compass,
  couple:          Heart,
  resilience:      ShieldIcon,
}

const CATS = ['Tous', 'Bien-être', 'Carrière', 'Organisation', 'Relations']

interface RunState { test: Test; idx: number; score: number }
interface ModalResult {
  pct:       number
  testKey:   string
  testTitle: string
  testCat:   string
  testIcon:  string   // kept for email templates (uses testKey value)
  resName:   string
  resLevel:  'danger' | 'warning' | 'success'
  advice:    string
  actions:   string[]
  cta:       string
  score:     number
  maxScore:  number
}

const LEVEL_STYLES = {
  danger:  { border: 'border-red-300',   bg: 'bg-red-50',   text: 'text-red-700',   badge: 'bg-red-100 text-red-700',   bar: 'bg-red-500',   Icon: AlertCircle  },
  warning: { border: 'border-amber-300', bg: 'bg-amber-50', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700', bar: 'bg-amber-500', Icon: AlertTriangle },
  success: { border: 'border-green-300', bg: 'bg-green-50', text: 'text-green-700', badge: 'bg-green-100 text-green-700', bar: 'bg-green-500', Icon: CheckCircle   },
}

const CAT_COLORS: Record<string, string> = {
  'Bien-être':    'bg-emerald-100 text-emerald-700',
  'Carrière':     'bg-blue-100 text-blue-700',
  'Organisation': 'bg-purple-100 text-purple-700',
  'Relations':    'bg-pink-100 text-pink-700',
}

export default function TestsPage() {
  const [cat,         setCat]        = useState('Tous')
  const [run,         setRun]        = useState<RunState | null>(null)
  const [modalResult, setModalResult]= useState<ModalResult | null>(null)
  const [answered,    setAnswered]   = useState(false)
  const [leadEmail,   setLeadEmail]  = useState<string | null>(null)

  // Restaurer un résultat en attente après connexion (sessionStorage → TestLeadModal)
  useEffect(() => {
    const raw = sessionStorage.getItem('pending_test_result')
    if (!raw) return
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session?.user) return
      sessionStorage.removeItem('pending_test_result')
      try {
        const result = JSON.parse(raw) as ModalResult
        const email  = data.session.user.email || ''
        try {
          const { data: profile } = await supabase
            .from('user_profiles').select('nom, phone, profession')
            .eq('id', data.session.user.id).single()
          await supabase.from('test_leads').insert({
            nom: profile?.nom || email, email,
            phone: profile?.phone || '', profession: profile?.profession || '',
            test_key: result.testKey, test_title: result.testTitle,
            score: result.score, max_score: result.maxScore, percent: result.pct,
            result_name: result.resName, result_level: result.resLevel,
            advice: result.advice, cta: result.cta,
            rdv_offered: result.resLevel === 'danger',
          })
          await supabase.functions.invoke('email-proxy', {
            body: JSON.stringify({
              type: 'test_results', to: email,
              data: { nom: profile?.nom || email, testTitle: result.testTitle,
                testIcon: result.testIcon, score: String(result.pct),
                resName: result.resName, resLevel: result.resLevel,
                advice: result.advice, actions: result.actions.join('||'),
                cta: result.cta, rdvOffered: result.resLevel === 'danger' ? 'true' : 'false' },
            }),
          })
          if (result.resLevel === 'danger') {
            await supabase.functions.invoke('email-proxy', {
              body: JSON.stringify({
                type: 'test_alert_admin', to: 'contact@gestorh.tg',
                data: { nom: profile?.nom || '', email, phone: profile?.phone || '-',
                  profession: profile?.profession || '-', testTitle: result.testTitle,
                  score: String(result.pct), resName: result.resName },
              }),
            })
          }
        } catch (e) { console.error(e) }
        setModalResult(result)
        setLeadEmail(email)
      } catch (e) {
        console.error(e)
      }
    })
  }, [])

  const filtered = TESTS.filter(t => cat === 'Tous' || t.cat === cat)

  const startTest = (test: Test) => {
    setRun({ test, idx: 0, score: 0 })
    setModalResult(null)
    setAnswered(false)
    setLeadEmail(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const answer = useCallback(async (points: number) => {
    if (!run || answered) return
    setAnswered(true)
    const newScore = run.score + points

    setTimeout(async () => {
      const next = run.idx + 1
      if (next < run.test.questions.length) {
        setRun({ ...run, idx: next, score: newScore })
        setAnswered(false)
      } else {
        const maxScore = run.test.questions.length * 3
        const pct = Math.round((newScore / maxScore) * 100)
        const res = run.test.results.find(r => newScore >= r.min && newScore <= r.max)
          ?? run.test.results[run.test.results.length - 1]

        const resultData: ModalResult = {
          pct,
          testKey:   run.test.key,
          testTitle: run.test.title,
          testCat:   run.test.cat,
          testIcon:  run.test.key,
          resName:   res.name,
          resLevel:  res.level,
          advice:    res.advice,
          actions:   res.actions,
          cta:       res.cta,
          score:     newScore,
          maxScore,
        }

        // Sauvegarder anonymement
        supabase.from('test_results').insert({
          test_key:    run.test.key,
          score:       newScore,
          max_score:   maxScore,
          percent:     pct,
          result_name: res.name,
          session_id:  nanoid(),
        }).then(() => {})

        // Vérifier si connecté
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
          // Connecté → débloquer directement sans modal
          try {
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('nom, phone, profession')
              .eq('id', session.user.id)
              .single()

            await supabase.from('test_leads').insert({
              nom:          profile?.nom        || session.user.email || '',
              email:        session.user.email  || '',
              phone:        profile?.phone      || '',
              profession:   profile?.profession || '',
              test_key:     run.test.key,
              test_title:   run.test.title,
              score:        newScore,
              max_score:    maxScore,
              percent:      pct,
              result_name:  res.name,
              result_level: res.level,
              advice:       res.advice,
              cta:          res.cta,
              rdv_offered:  res.level === 'danger',
            })

            await supabase.functions.invoke('email-proxy', {
              body: JSON.stringify({
                type: 'test_results',
                to:   session.user.email,
                data: {
                  nom:        profile?.nom || session.user.email || '',
                  testTitle:  run.test.title,
                  testIcon:   run.test.key,
                  score:      String(pct),
                  resName:    res.name,
                  resLevel:   res.level,
                  advice:     res.advice,
                  actions:    res.actions.join('||'),
                  cta:        res.cta,
                  rdvOffered: res.level === 'danger' ? 'true' : 'false',
                },
              }),
            })

            if (res.level === 'danger') {
              await supabase.functions.invoke('email-proxy', {
                body: JSON.stringify({
                  type: 'test_alert_admin',
                  to:   'contact@gestorh.tg',
                  data: {
                    nom:        profile?.nom        || '',
                    email:      session.user.email  || '',
                    phone:      profile?.phone      || '-',
                    profession: profile?.profession || '-',
                    testTitle:  run.test.title,
                    score:      String(pct),
                    resName:    res.name,
                  },
                }),
              })
            }

            setLeadEmail(session.user.email || '')
          } catch (e) {
            console.error(e)
            setLeadEmail(session.user.email || '')
          }
          setModalResult(resultData)
          setRun(null)
          setAnswered(false)
        } else {
          // Non connecté → afficher modal
          setModalResult(resultData)
          setRun(null)
          setAnswered(false)
        }
      }
    }, 350)
  }, [run, answered])

  const back = () => {
    setRun(null)
    setModalResult(null)
    setAnswered(false)
    setLeadEmail(null)
  }

  /* ══ RUNNER ══ */
  if (run) {
    const { test, idx } = run
    const q   = test.questions[idx]
    const pct = Math.round(((idx + 1) / test.questions.length) * 100)

    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="wrap max-w-2xl">
          <button onClick={back}
            className="flex items-center gap-2 text-blue text-sm font-bold mb-8 bg-blue-soft px-4 py-2 rounded-xl hover:bg-blue/20 transition-colors">
            <ArrowLeft size={16}/> Quitter le test
          </button>

          <div className="card p-8 md:p-10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{test.title}</span>
              <span className="text-xs font-bold text-gray-500">{idx + 1} / {test.questions.length}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-8">
              <motion.div className="h-full bg-gradient-to-r from-navy to-brand rounded-full"
                animate={{ width: `${pct}%` }} transition={{ duration: .4 }}/>
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={idx}
                initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                transition={{ duration: .25 }}>
                <h2 className="text-lg md:text-xl font-black text-gray-900 mb-8 leading-snug">{q.q}</h2>
                <div className="space-y-3">
                  {q.a.map((opt, i) => (
                    <button key={i} onClick={() => answer(q.p[i])} disabled={answered}
                      className={cn(
                        'w-full flex items-center gap-4 p-4 md:p-5 rounded-2xl border-2 border-gray-200 text-left',
                        'font-semibold text-sm text-gray-900 transition-all duration-200',
                        'hover:border-navy hover:bg-blue-soft hover:translate-x-1.5',
                        'disabled:pointer-events-none'
                      )}>
                      <span className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-xs font-extrabold text-gray-500 flex-shrink-0">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span>{opt}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    )
  }

  /* ══ RÉSULTAT (après modal ou utilisateur connecté) ══ */
  if (modalResult && leadEmail) {
    const s = LEVEL_STYLES[modalResult.resLevel]
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="wrap max-w-2xl">
          <button onClick={back}
            className="flex items-center gap-2 text-blue text-sm font-bold mb-8 bg-blue-soft px-4 py-2 rounded-xl hover:bg-blue/20 transition-colors">
            <ArrowLeft size={16}/> Retour aux tests
          </button>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className={`card p-8 border-2 ${s.border}`}>
              <div className="text-center mb-6">
                <div className="mb-3"><s.Icon size={48} className={s.text}/></div>
                <div className={`inline-block text-xs font-extrabold tracking-widest uppercase px-4 py-1.5 rounded-full mb-3 ${s.badge}`}>
                  {modalResult.testTitle}
                </div>
                <div className={`text-6xl font-black mb-2 ${s.text}`}>{modalResult.pct}%</div>
                <h2 className="text-2xl font-black text-gray-900 mb-4">{modalResult.resName}</h2>
                <div className="h-3 bg-gray-100 rounded-full max-w-xs mx-auto overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${modalResult.pct}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className={`h-full rounded-full ${s.bar}`}/>
                </div>
              </div>

              <div className={`p-5 rounded-2xl mb-6 ${s.bg} border-l-4 ${s.border}`}>
                <p className={`text-xs font-extrabold tracking-widest uppercase mb-2 ${s.text}`}>Analyse experte GESTORH</p>
                <p className="text-gray-800 leading-relaxed text-sm">{modalResult.advice}</p>
              </div>

              <div className="mb-6">
                <p className="text-xs font-extrabold tracking-widest uppercase text-gray-400 mb-3">Recommandations personnalisées</p>
                <div className="space-y-2">
                  {modalResult.actions.map((action, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: .1 + i * .1 }}
                      className="flex items-start gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                      <CheckCircle size={16} className={`flex-shrink-0 mt-0.5 ${s.text}`}/>
                      <span className="text-sm text-gray-700 font-medium">{action}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="bg-green-50 rounded-2xl p-4 mb-6 text-center">
                <p className="text-green-700 text-sm font-bold">✓ Analyse complète envoyée à {leadEmail}</p>
                <p className="text-green-600 text-xs mt-1">Vous recevrez des conseils personnalisés dans les prochains jours</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/rendez-vous" className="btn-navy flex-1 justify-center">
                  {modalResult.cta} <ArrowRight size={15}/>
                </Link>
                <button onClick={back} className="btn-outline flex-1 justify-center">
                  Faire un autre test
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  /* ══ SÉLECTEUR ══ */
  return (
    <>
      <Helmet>
        <title>Tests & Bilans Psychologiques Gratuits | GESTORH</title>
        <meta name="description" content="10 tests psychologiques certifiés. Résultats et recommandations personnalisées immédiats."/>
      </Helmet>

      <AnimatePresence>
        {modalResult && !leadEmail && (
          <TestLeadModal
            result={modalResult}
            onClose={back}
            onDone={(email) => setLeadEmail(email)}
          />
        )}
      </AnimatePresence>

      <div className="bg-gradient-to-br from-navy-deep to-navy-mid py-10 md:py-14 px-5 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-blue/20 blur-3xl"/>
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-brand/10 blur-3xl"/>
        </div>
        <div className="relative z-10 max-w-2xl mx-auto">
          <span className="badge mb-5">10 diagnostics gratuits</span>
          <h1 className="h1 text-white mb-4">Centre de <span className="text-gradient">Diagnostics</span><br/>Psychologiques</h1>
          <p className="text-white/55 text-base max-w-xl mx-auto leading-relaxed">
            Tests validés scientifiquement · Résultats immédiats · Recommandations personnalisées
          </p>
          <div className="flex flex-wrap justify-center gap-6 mt-8 text-white/40 text-xs font-semibold">
            <span>✓ Basés sur des modèles cliniques</span>
            <span>✓ Anonymes & confidentiels</span>
            <span>✓ 3 à 5 minutes par test</span>
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200 sticky top-[72px] z-10">
        <div className="wrap py-3 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {CATS.map(c => (
            <button key={c} onClick={() => setCat(c)}
              className={`flex-shrink-0 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                cat === c ? 'bg-navy text-white shadow-sm' : 'text-gray-500 hover:text-navy hover:bg-blue-soft'
              }`}>
              {c} {c !== 'Tous' && <span className="ml-1 text-xs opacity-50">({TESTS.filter(t => t.cat === c).length})</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="wrap py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((t, i) => (
            <Reveal key={t.key} delay={i * .06}>
              <button onClick={() => startTest(t)}
                className="card group p-7 text-left w-full transition-all duration-300 hover:-translate-y-2 hover:shadow-hover hover:border-transparent relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand to-blue scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300 rounded-t-3xl"/>
                <div className="flex items-start justify-between mb-4">
                  {(() => { const TIcon = ICON_MAP[t.key]; return TIcon ? <TIcon size={32} className="text-navy/70"/> : null })()}
                  <span className={`text-[.65rem] font-extrabold tracking-widest uppercase px-3 py-1 rounded-full ${CAT_COLORS[t.cat] || 'bg-gray-100 text-gray-700'}`}>
                    {t.cat}
                  </span>
                </div>
                <h3 className="text-base font-black text-gray-900 mb-2 leading-snug">{t.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-5 line-clamp-3">{t.desc}</p>
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-3 text-xs text-gray-400 font-semibold">
                    <span className="flex items-center gap-1"><Clock size={11}/> {t.duration} min</span>
                    <span className="text-gray-300">·</span>
                    <span>{t.questions.length} questions</span>
                  </div>
                  <span className="w-8 h-8 rounded-xl bg-blue-soft flex items-center justify-center text-navy group-hover:bg-navy group-hover:text-white transition-all duration-200">
                    <ArrowRight size={14}/>
                  </span>
                </div>
              </button>
            </Reveal>
          ))}
        </div>

        <div className="mt-16 p-6 bg-gray-50 rounded-2xl border border-gray-200 max-w-2xl mx-auto text-center">
          <p className="text-xs text-gray-400 leading-relaxed">
            <strong className="text-gray-600">Note :</strong> Ces tests sont des outils d'auto-évaluation indicatifs. Ils ne remplacent pas un diagnostic médical ou psychologique professionnel.
          </p>
        </div>
      </div>
    </>
  )
}