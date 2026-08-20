import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  noIndex?: boolean;
}

const BASE_TITLE = 'Sehrimin Uzmani';
const BASE_DESCRIPTION =
  'Turkiye genelinde guvenilir yerel hizmet uzmanlarini bulun. Temizlik, tamirat, nakliyat, saglik ve daha fazlasi — 81 ilde hizmetinizde.';
const BASE_URL = 'https://sehriminuzmani.com';
const DEFAULT_OG_IMAGE = ${BASE_URL}/og-image.jpg;

const SEO: React.FC<SEOProps> = ({
  title,
  description = BASE_DESCRIPTION,
  canonical,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  noIndex = false,
}) => {
  const fullTitle = title ? ${title} |  : ${BASE_TITLE} - Yerel Hizmet Uzmanlari;
  const canonicalUrl = canonical ? ${BASE_URL} : BASE_URL;

  return (
    <Helmet>
      {/* Temel */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={BASE_TITLE} />
      <meta property="og:locale" content="tr_TR" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
};

export default SEO;
