import React, { useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';

export default function SafeRenderer({ content, mode = 'VULNERABLE', className = '' }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !content) return;

    if (mode === 'VULNERABLE') {
      // VULNERABLE MODE: Insert raw HTML directly and execute any embedded script tags
      containerRef.current.innerHTML = content;
      
      // Execute any script elements present in the payload (simulating unneutralized browser execution)
      const scripts = containerRef.current.querySelectorAll('script');
      scripts.forEach(oldScript => {
        const newScript = document.createElement('script');
        Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
        newScript.appendChild(document.createTextNode(oldScript.innerHTML));
        oldScript.parentNode.replaceChild(newScript, oldScript);
      });
    } else {
      // SECURE MODE: Neutralize all executable scripts and event handlers with DOMPurify
      const sanitized = DOMPurify.sanitize(content, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'p', 'br', 'code', 'pre', 'ul', 'ol', 'li', 'blockquote', 'span'],
        ALLOWED_ATTR: ['class']
      });
      containerRef.current.innerHTML = sanitized;
    }
  }, [content, mode]);

  return <div ref={containerRef} className={className} />;
}
