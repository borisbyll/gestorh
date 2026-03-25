export const SITE = {
  name:  'GESTORH',
  url:   import.meta.env.VITE_SITE_URL || 'https://gestorh.tg',
  desc:  "Cabinet expert en Ressources Humaines, Psychologie et Coaching au Togo. +10 ans d'expertise à Lomé.",
  image: '/og.jpg',
}

export const ORG_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  name: 'GESTORH',
  url:  SITE.url,
  telephone: '+22898912369',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Hédzranawoé, Rue N°4',
    addressLocality: 'Lomé',
    addressCountry: 'TG',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude:  6.17736,
    longitude: 1.23508,
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday'],
      opens:  '08:00',
      closes: '18:00',
    },
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Saturday'],
      opens:  '09:00',
      closes: '16:00',
    },
  ],
  sameAs: [
    'https://www.linkedin.com/company/cabinet-gestorh/',
    'https://www.facebook.com/share/1N1L3mFM6w/',
  ],
}