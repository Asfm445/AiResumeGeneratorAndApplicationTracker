import React from 'react';

interface ResumeData {
  name?: string;
  headline?: string;
  email?: string;
  location?: string;
  professional_summary: string;
  professional_experience: any[];
  projects: any[];
  skills: Record<string, string[]>;
}

export function ResumeDocument({ data, id, preview = false }: { data: ResumeData; id?: string; preview?: boolean }) {
  // Helper to handle both string (split by newline) and actual arrays
  const ensureArray = (input: any): string[] => {
    if (!input) return [];
    if (Array.isArray(input)) return input;
    if (typeof input === 'string') return input.split('\n');
    return [String(input)]; // Fallback
  };

  return (
    <div 
      id={id}
      className={`bg-white text-[#1a1a1a] mx-auto p-12 min-h-[1056px] font-serif leading-relaxed text-sm antialiased border border-gray-100 ${preview ? 'shadow-none w-[816px]' : 'shadow-xl w-full max-w-[816px]'}`}
      style={{ boxSizing: 'border-box', backgroundColor: '#ffffff' }}
    >
      {/* Header */}
      <header className="text-center mb-10">
        <h1 className="text-4xl font-bold uppercase tracking-widest text-[#000000] mb-2">{data.name || "Resume"}</h1>
        <div className="flex flex-wrap justify-center gap-4 text-xs text-[#4b5563] font-sans border-b border-[#e5e7eb] pb-4">
          {data.headline && <span className="uppercase tracking-wider">{data.headline}</span>}
          {data.location && <span className="text-[#9ca3af]">|</span>}
          {data.location && <span>{data.location}</span>}
          {data.email && <span className="text-[#9ca3af]">|</span>}
          {data.email && <span className="font-semibold text-[#000000]">{data.email}</span>}
        </div>
      </header>

      {/* Summary */}
      <section className="mb-8">
        <h2 className="text-md font-bold uppercase border-b border-[#000000] mb-3 font-sans pb-1 tracking-widest">Professional Summary</h2>
        <p className="text-justify leading-6 italic text-[#374151]">
          {data.professional_summary}
        </p>
      </section>

      {/* Experience */}
      <section className="mb-8">
        <h2 className="text-md font-bold uppercase border-b border-[#000000] mb-4 font-sans pb-1 tracking-widest">Professional Experience</h2>
        <div className="space-y-6">
          {data.professional_experience.map((exp, i) => (
            <div key={i}>
              <div className="flex justify-between items-baseline mb-1">
                <span className="font-bold text-md text-[#0f172a]">{exp.job_title || exp.position || exp.role_title || "Experience Entry"}</span>
                <span className="text-xs font-sans text-[#6b7280] font-bold italic uppercase">{exp.dates || `${exp.start_date || 'N/A'} - ${exp.end_date || 'Present'}`}</span>
              </div>
              <div className="font-bold text-sm text-[#1e1b4b] mb-2 font-sans tracking-tight uppercase">{exp.company || exp.company_name}</div>
              <ul className="list-disc list-outside ml-5 space-y-1.5 marker:text-[#9ca3af]">
                {ensureArray(exp.responsibilities || exp.achievements || exp.short_description || exp.description).map((line: string, j: number) => {
                  const cleaned = line.replace(/^[•\-\*]\s*/, '').trim();
                  return cleaned ? <li key={j} className="pl-1 text-[#374151]">{cleaned}</li> : null;
                })}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Projects */}
      <section className="mb-8 font-sans">
        <h2 className="text-md font-bold uppercase border-b border-[#000000] mb-4 pb-1 tracking-widest">Selected Projects</h2>
        <div className="space-y-6">
          {data.projects.map((proj, i) => (
            <div key={i}>
              <div className="flex justify-between items-baseline mb-1">
                <span className="font-bold text-sm text-[#0f172a]">{proj.project_name || proj.name}</span>
                <span className="text-xs text-[#6b7280] italic font-serif uppercase tracking-tighter">{proj.dates || "N/A"}</span>
              </div>
              <div className="text-[10px] text-[#4338ca] font-bold mb-2 uppercase tracking-widest">ROLE: {proj.role || "Lead Developer"}</div>
              
              {proj.technologies && Array.isArray(proj.technologies) && proj.technologies.length > 0 && (
                <div className="text-[10px] text-[#6b7280] mb-2 italic font-serif">
                  Stack: {proj.technologies.join(' • ')}
                </div>
              )}

              <ul className="list-disc list-outside ml-5 space-y-1 marker:text-[#9ca3af] font-serif text-sm">
                {ensureArray(proj.key_achievements || proj.achievements || proj.highlights || proj.short_description || proj.description).map((line: string, j: number) => {
                  const cleaned = line.replace(/^[•\-\*]\s*/, '').trim();
                  return cleaned ? <li key={j} className="text-[#374151]">{cleaned}</li> : null;
                })}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Skills */}
      <section className="mb-8 font-sans">
        <h2 className="text-md font-bold uppercase border-b border-[#000000] mb-4 pb-1 tracking-widest">Technical Skills</h2>
        <div className="space-y-2">
          {Object.entries(data.skills).map(([type, list]) => (
            <div key={type} className="flex items-start text-xs border-l-2 border-[#e5e7eb] pl-4 py-1">
              <span className="font-bold text-[#1e1b4b] uppercase tracking-tighter min-w-[150px] pt-0.5">{type}</span>
              <span className="font-serif text-sm text-[#374151] capitalize">
                {Array.isArray(list) ? list.join(', ') : String(list)}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto pt-10 text-[9px] text-[#9ca3af] text-center italic font-sans uppercase tracking-[0.3em]">
        AI Optimized • Built for modern careers
      </footer>
    </div>
  );
}
