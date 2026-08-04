import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'profile' | 'article';
  schemaData?: object;
}

export const SEO: React.FC<SEOProps> = ({
  title = "Aeirmist | Aeirmist",
  description = "Aeirmist is a high-fidelity Social Platform where Connections meets digital connection. Experience stories, messages, and calls in a unified cosmic stream.",
  canonical = "https://aeirmist.social",
  ogImage = "/og-image.jpg",
  ogType = "website",
  schemaData
}) => {
  const siteName = "Aeirmist";
  const fullTitle = title.includes("Aeirmist") ? title : `${title} | ${siteName}`;

  return (
    <Helmet>
      {/* Standard Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />

      {/* OpenGraph Tags */}
      <meta property="og:site_name" content={siteName} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Structured Data (JSON-LD) */}
      <script type="application/ld+json">
        {JSON.stringify(schemaData || {
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": siteName,
          "description": description,
          "url": canonical,
          "applicationCategory": "SocialNetworking",
          "operatingSystem": "Web",
          "author": {
            "@type": "Organization",
            "name": "Core Labs"
          }
        })}
      </script>
    </Helmet>
  );
};
