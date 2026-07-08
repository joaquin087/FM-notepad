import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const lines = content.split('\n');

  // Utility to parse bold formatting (**text**)
  const parseFormatting = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="text-emerald-400 font-semibold">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className="space-y-3 text-slate-300 leading-relaxed text-sm">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        // Title 1
        if (trimmed.startsWith('# ')) {
          return (
            <h2 key={idx} className="text-xl font-extrabold text-white mt-6 mb-3 border-b border-emerald-900 pb-2 flex items-center gap-2">
              ⚽ {parseFormatting(trimmed.replace('# ', ''))}
            </h2>
          );
        }

        // Title 2
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={idx} className="text-lg font-bold text-emerald-300 mt-5 mb-2 border-b border-slate-800 pb-1.5 flex items-center gap-2">
              🧠 {parseFormatting(trimmed.replace('## ', ''))}
            </h3>
          );
        }

        // Title 3
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} className="text-md font-semibold text-emerald-400 mt-4 mb-2 flex items-center gap-1.5">
              • {parseFormatting(trimmed.replace('### ', ''))}
            </h4>
          );
        }

        // Bullet points
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const text = trimmed.slice(2);
          return (
            <ul key={idx} className="list-disc pl-5 my-0.5 space-y-1">
              <li className="text-slate-300">{parseFormatting(text)}</li>
            </ul>
          );
        }

        // Markdown Tables
        if (trimmed.startsWith('|')) {
          if (trimmed.includes('---')) return null; // skip separator
          const cells = trimmed
            .split('|')
            .map(c => c.trim())
            .filter((_, index, arr) => index > 0 && index < arr.length - 1);

          // Simple check for header
          const isHeader = idx < lines.length - 1 && lines[idx + 1]?.trim().includes('---');

          return (
            <div key={idx} className="overflow-x-auto my-3 rounded-lg border border-slate-800">
              <table className="min-w-full divide-y divide-slate-800 text-xs">
                <thead className={isHeader ? "bg-slate-900" : undefined}>
                  <tr className={isHeader ? "text-emerald-400 font-bold" : "hover:bg-slate-900/50"}>
                    {cells.map((cell, cidx) => (
                      <th
                        key={cidx}
                        className={`px-3 py-2 text-left ${
                          isHeader ? "font-bold text-emerald-400" : "font-normal text-slate-300 border-t border-slate-800"
                        }`}
                      >
                        {parseFormatting(cell)}
                      </th>
                    ))}
                  </tr>
                </thead>
              </table>
            </div>
          );
        }

        // Empty lines
        if (trimmed === '') {
          return <div key={idx} className="h-2" />;
        }

        // Normal paragraph
        return (
          <p key={idx} className="my-1">
            {parseFormatting(trimmed)}
          </p>
        );
      })}
    </div>
  );
}
