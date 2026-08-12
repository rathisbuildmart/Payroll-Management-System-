import React from 'react';
import { ExternalLink } from 'lucide-react';

interface RichTextRendererProps {
  content: string;
  className?: string;
  language?: 'en' | 'hi';
}

/**
 * RichTextRenderer cleanly and safely renders announcement content,
 * supporting both HTML rich-text formatting (bold, lists, hyperlinks, underline, italic)
 * and legacy plain text with automatic newline and URL detection.
 */
export const RichTextRenderer: React.FC<RichTextRendererProps> = ({
  content,
  className = '',
}) => {
  if (!content) return null;

  //Check if content contains HTML tags
  const containsHtml = /<[a-z][\s\S]*>/i.test(content);

  if (containsHtml) {
    //Basic sanitization: strip script tags or inline event handlers
    let sanitizedHtml = content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/on\w+='[^']*'/gi, '');

    //Ensure <a> links inside HTML have target="_blank" and rel="noopener noreferrer"
    sanitizedHtml = sanitizedHtml.replace(
      /<a\s+(?:[^>]*?\s+)?href="([^"]*)"([^>]*)>/gi,
      (_match, url, rest) => {
        const cleanRest = rest.replace(/target="[^"]*"/gi, '').replace(/rel="[^"]*"/gi, '');
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-[#03623c] dark:text-emerald-400 font-bold underline hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors inline-items-center gap-0.5" ${cleanRest}>`;
      }
    );

    return (
      <div
        className={`rich-text-content space-y-2 leading-relaxed text-slate-700 dark:text-slate-200 text-xs ${className}`}
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
    );
  }

  //Fallback for Plain Text: convert URLs to clickable links and preserve linebreaks
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = content.split(urlRegex);

  return (
    <div className={`whitespace-pre-line leading-relaxed text-slate-700 dark:text-slate-200 text-xs ${className}`}>
      {parts.map((part, idx) => {
        if (part.match(urlRegex)) {
          return (
            <a
              key={idx}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#03623c] dark:text-emerald-400 font-bold underline hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors inline-flex items-center gap-0.5"
            >
              {part}
              <ExternalLink className="w-2.5 h-2.5 shrink-0 inline ml-0.5" />
            </a>
          );
        }
        return <span key={idx}>{part}</span>;
      })}
    </div>
  );
};

export default RichTextRenderer;
