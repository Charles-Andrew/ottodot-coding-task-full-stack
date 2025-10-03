import { useMemo } from 'react';
import DOMPurify from 'dompurify';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface SafeHtmlWithMathProps {
  html: string;
  className?: string;
}

export const SafeHtmlWithMath = ({ html, className = '' }: SafeHtmlWithMathProps) => {
  const processedHtml = useMemo(() => {
    try {
      // Process display math $$...$$ first (block equations)
      let processed = html.replace(/\$\$([\s\S]*?)\$\$/g, (match, math) => {
        try {
          return katex.renderToString(math.trim(), {
            displayMode: true,
            throwOnError: false,
            errorColor: '#ff6b6b',
            fleqn: true,
            leqno: false
          });
        } catch {
          return `<span style="color: #ff6b6b;">Math error: ${math}</span>`;
        }
      });

      // Process inline math $...$
      processed = processed.replace(/\$([^$\n]+)\$/g, (match, math) => {
        try {
          return katex.renderToString(math.trim(), {
            displayMode: false,
            throwOnError: false,
            errorColor: '#ff6b6b',
            fleqn: true,
            leqno: false
          });
        } catch {
          return `<span style="color: #ff6b6b;">Math error: ${math}</span>`;
        }
      });

      // Sanitize the final HTML
      return DOMPurify.sanitize(processed, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ol', 'ul', 'li', 'span', 'div'],
        ALLOWED_ATTR: ['class', 'style']
      });
    } catch (error) {
      // Fallback: sanitize without math processing
      console.error('HTML processing error:', error);
      return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ol', 'ul', 'li', 'span'],
        ALLOWED_ATTR: []
      });
    }
  }, [html]);

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: processedHtml }}
    />
  );
};