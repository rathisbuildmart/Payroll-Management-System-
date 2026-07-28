import React, { useState, useRef, useEffect } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Link as LinkIcon, 
  Unlink, 
  Eraser, 
  Code, 
  Eye, 
  Highlighter,
  ExternalLink,
  X,
  Check,
  Type
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  language?: 'en' | 'hi';
  minHeight?: string;
  className?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Write announcement description...',
  label,
  language = 'en',
  minHeight = '110px',
  className = ''
}) => {
  const [isCodeView, setIsCodeView] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [savedSelection, setSavedSelection] = useState<Range | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);
  const isUpdatingRef = useRef(false);

  // Sync value into contentEditable when value prop changes externally
  useEffect(() => {
    if (editorRef.current && !isUpdatingRef.current && !isCodeView) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || '';
      }
    }
  }, [value, isCodeView]);

  const handleInput = () => {
    if (editorRef.current) {
      isUpdatingRef.current = true;
      const html = editorRef.current.innerHTML;
      // Treat empty editor as empty string
      const cleanHtml = html === '<br>' || html === '<div><br></div>' ? '' : html;
      onChange(cleanHtml);
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 50);
    }
  };

  const executeCommand = (command: string, arg: string | undefined = undefined) => {
    if (isCodeView || isPreviewMode) return;
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(command, false, arg);
    handleInput();
  };

  // Save current selection range before opening link dialog
  const handleOpenLinkDialog = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      setSavedSelection(range.cloneRange());
      const selectedText = sel.toString();
      if (selectedText) {
        setLinkText(selectedText);
      }
    } else {
      setSavedSelection(null);
    }
    setShowLinkDialog(true);
  };

  const handleInsertLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrl.trim()) return;

    let targetUrl = linkUrl.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = `https://${targetUrl}`;
    }

    if (editorRef.current) {
      editorRef.current.focus();
    }

    // Restore selection if saved
    const sel = window.getSelection();
    if (sel && savedSelection) {
      sel.removeAllRanges();
      sel.addRange(savedSelection);
    }

    const labelToUse = linkText.trim() || targetUrl;

    if (sel && !sel.isCollapsed) {
      // Create link on selected text
      document.execCommand('createLink', false, targetUrl);
    } else {
      // Insert new HTML hyperlink
      const anchorHtml = `<a href="${targetUrl}" target="_blank" rel="noopener noreferrer">${labelToUse}</a>`;
      document.execCommand('insertHTML', false, anchorHtml);
    }

    handleInput();
    setShowLinkDialog(false);
    setLinkUrl('');
    setLinkText('');
    setSavedSelection(null);
  };

  const handleRemoveLink = () => {
    executeCommand('unlink');
  };

  const handleHighlight = () => {
    executeCommand('backColor', '#fef08a');
  };

  const isEn = language === 'en';

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Type className="w-3 h-3 text-[#03623c]" />
            {label}
          </label>
          <span className="text-[9px] font-mono text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200/60">
            ✨ WYSIWYG
          </span>
        </div>
      )}

      {/* Editor Main Box */}
      <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-3xs transition-all focus-within:border-[#03623c] focus-within:ring-2 focus-within:ring-[#03623c]/10">
        {/* Toolbar Header */}
        <div className="flex flex-wrap items-center justify-between gap-1 p-1.5 bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-700 select-none">
          {/* Formatting Controls */}
          <div className="flex items-center gap-0.5 flex-wrap">
            <button
              type="button"
              onClick={() => executeCommand('bold')}
              disabled={isCodeView || isPreviewMode}
              className="p-1.5 rounded text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors disabled:opacity-40 cursor-pointer"
              title={isEn ? 'Bold (Ctrl+B)' : 'बोल्ड करें'}
            >
              <Bold className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => executeCommand('italic')}
              disabled={isCodeView || isPreviewMode}
              className="p-1.5 rounded text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors disabled:opacity-40 cursor-pointer"
              title={isEn ? 'Italic (Ctrl+I)' : 'तिरछा (Italic)'}
            >
              <Italic className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => executeCommand('underline')}
              disabled={isCodeView || isPreviewMode}
              className="p-1.5 rounded text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors disabled:opacity-40 cursor-pointer"
              title={isEn ? 'Underline (Ctrl+U)' : 'रेखांकित (Underline)'}
            >
              <Underline className="w-3.5 h-3.5" />
            </button>

            <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1" />

            <button
              type="button"
              onClick={() => executeCommand('insertUnorderedList')}
              disabled={isCodeView || isPreviewMode}
              className="p-1.5 rounded text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors disabled:opacity-40 cursor-pointer"
              title={isEn ? 'Bullet List' : 'बुलेट सूची'}
            >
              <List className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => executeCommand('insertOrderedList')}
              disabled={isCodeView || isPreviewMode}
              className="p-1.5 rounded text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors disabled:opacity-40 cursor-pointer"
              title={isEn ? 'Numbered List' : 'संख्यात्मक सूची'}
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>

            <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1" />

            <button
              type="button"
              onClick={handleOpenLinkDialog}
              disabled={isCodeView || isPreviewMode}
              className="p-1.5 rounded text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors disabled:opacity-40 cursor-pointer"
              title={isEn ? 'Insert Hyperlink' : 'हाइपरलिंक जोड़ें'}
            >
              <LinkIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            </button>

            <button
              type="button"
              onClick={handleRemoveLink}
              disabled={isCodeView || isPreviewMode}
              className="p-1.5 rounded text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors disabled:opacity-40 cursor-pointer"
              title={isEn ? 'Remove Hyperlink' : 'लिंक हटाएँ'}
            >
              <Unlink className="w-3.5 h-3.5 text-rose-500" />
            </button>

            <button
              type="button"
              onClick={handleHighlight}
              disabled={isCodeView || isPreviewMode}
              className="p-1.5 rounded text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors disabled:opacity-40 cursor-pointer"
              title={isEn ? 'Highlight Text' : 'हाइलाइट करें'}
            >
              <Highlighter className="w-3.5 h-3.5 text-amber-500" />
            </button>

            <button
              type="button"
              onClick={() => executeCommand('removeFormat')}
              disabled={isCodeView || isPreviewMode}
              className="p-1.5 rounded text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors disabled:opacity-40 cursor-pointer"
              title={isEn ? 'Clear Formatting' : 'फॉर्मेटिंग साफ़ करें'}
            >
              <Eraser className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* View Toggles (Visual vs Code vs Preview) */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setIsPreviewMode(!isPreviewMode);
                setIsCodeView(false);
              }}
              className={`p-1 px-2 rounded text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                isPreviewMode 
                  ? 'bg-[#03623c] text-white' 
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700'
              }`}
              title={isEn ? 'Live Card Preview' : 'लाइव पूर्वावलोकन'}
            >
              <Eye className="w-3 h-3" />
              <span>{isEn ? 'Preview' : 'पूर्वावलोकन'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsCodeView(!isCodeView);
                setIsPreviewMode(false);
              }}
              className={`p-1 px-2 rounded text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                isCodeView 
                  ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900' 
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700'
              }`}
              title={isEn ? 'Toggle HTML Source Code' : 'एचटीएमएल कोड'}
            >
              <Code className="w-3 h-3" />
              <span>{isEn ? 'HTML' : 'कोड'}</span>
            </button>
          </div>
        </div>

        {/* Editor Body */}
        <div className="relative p-3">
          {isPreviewMode ? (
            /* Live Render Preview Mode */
            <div 
              style={{ minHeight }}
              className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 leading-relaxed font-sans"
            >
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1 flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {isEn ? 'Announcement Display Preview' : 'सूचना प्रदर्शन पूर्वावलोकन'}
              </div>
              {value ? (
                <div 
                  className="space-y-1"
                  dangerouslySetInnerHTML={{ __html: value }} 
                />
              ) : (
                <span className="text-slate-400 italic text-[11px]">
                  {isEn ? 'No description text entered yet.' : 'अभी तक कोई विवरण नहीं लिखा गया है।'}
                </span>
              )}
            </div>
          ) : isCodeView ? (
            /* HTML Source Code Mode */
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              style={{ minHeight }}
              placeholder="<h1>Heading</h1><p>Notice text...</p>"
              className="w-full font-mono text-[11px] p-2 bg-slate-900 text-emerald-400 rounded-lg focus:outline-none resize-y leading-relaxed"
            />
          ) : (
            /* Interactive WYSIWYG Editor */
            <div className="relative">
              {!value && (
                <div className="absolute top-0 left-0 text-slate-400 text-xs font-medium pointer-events-none select-none italic">
                  {placeholder}
                </div>
              )}
              <div
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                style={{ minHeight }}
                className="focus:outline-none text-xs text-slate-800 dark:text-slate-100 font-semibold leading-relaxed overflow-y-auto max-h-[220px] [&_a]:text-[#03623c] [&_a]:font-bold [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_b]:font-black [&_strong]:font-black [&_mark]:bg-amber-200 [&_mark]:px-0.5 [&_mark]:rounded"
              />
            </div>
          )}
        </div>
      </div>

      {/* Hyperlink Dialog Modal */}
      {showLinkDialog && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-[#03623c] dark:text-emerald-400" />
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                  {isEn ? 'Insert Hyperlink' : 'हाइपरलिंक संलग्न करें'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowLinkDialog(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInsertLink} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  {isEn ? 'Link Text / Label' : 'लिंक नाम / लेबल'}
                </label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder={isEn ? 'e.g. Download Guidelines PDF' : 'उदा. गाइडलाइंस डाउनलोड करें'}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#03623c]/20 focus:border-[#03623c]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  {isEn ? 'Destination URL' : 'गंतव्य URL वेब लिंक'}
                </label>
                <input
                  type="url"
                  required
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com/document.pdf"
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-semibold bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#03623c]/20 focus:border-[#03623c]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLinkDialog(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  {isEn ? 'Cancel' : 'रद्द करें'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-[#03623c] text-white hover:bg-[#024a2e] transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  {isEn ? 'Insert Link' : 'लिंक जोड़ें'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;
