import React, { useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';

export default function ContentRenderer({ content, className = '' }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !content) return;

    // Defense: Neutralize dangerous scripts, event handlers, and javascript: URLs using DOMPurify
    const cleanHtml = DOMPurify.sanitize(content, {
      ALLOWED_TAGS: [
        'b', 'i', 'em', 'strong', 'u', 'p', 'br',
        'code', 'pre', 'ul', 'ol', 'li', 'blockquote',
        'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
      ],
      ALLOWED_ATTR: ['class', 'style'],
      FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'link', 'style'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'src']
    });

    // Safely insert sanitized HTML
    containerRef.current.innerHTML = cleanHtml;
  }, [content]);

  return <div ref={containerRef} className={className} />;
}
