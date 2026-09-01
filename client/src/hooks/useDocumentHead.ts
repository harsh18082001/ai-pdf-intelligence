import { useEffect } from 'react';

interface DocumentHeadOptions {
  title: string;
  description?: string;
  robots?: string;
  jsonLd?: object;
}

function setMetaTag(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function removeMetaTag(attr: 'name' | 'property', key: string) {
  document.head.querySelector(`meta[${attr}="${key}"]`)?.remove();
}

/**
 * Minimal head manager — a full library like react-helmet-async isn't worth the peer-dep
 * conflict with React 19 for two pages' worth of dynamic <title>/meta/JSON-LD.
 */
export function useDocumentHead({ title, description, robots, jsonLd }: DocumentHeadOptions) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;

    if (description) {
      setMetaTag('name', 'description', description);
      setMetaTag('property', 'og:description', description);
    }
    setMetaTag('property', 'og:title', title);

    if (robots) setMetaTag('name', 'robots', robots);

    let script: HTMLScriptElement | null = null;
    if (jsonLd) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }

    return () => {
      document.title = prevTitle;
      if (robots) removeMetaTag('name', 'robots');
      script?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, robots, jsonLd]);
}
