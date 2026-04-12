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

interface ResumeDocumentProps {
  data: ResumeData;
  id?: string;
  preview?: boolean;
  isEditable?: boolean;
  onUpdate?: (newData: ResumeData) => void;
}

export function ResumeDocument({ data, id, preview = false, isEditable = false, onUpdate }: ResumeDocumentProps) {
  const handleChange = (field: string, value: any) => {
    if (onUpdate) {
      onUpdate({ ...data, [field]: value });
    }
  };

  const handleListChange = (section: 'professional_experience' | 'projects', index: number, field: string, value: any) => {
    if (onUpdate) {
      const newList = [...data[section]];
      newList[index] = { ...newList[index], [field]: value };
      onUpdate({ ...data, [section]: newList });
    }
  };

  const handleSkillChange = (category: string, value: string) => {
    if (onUpdate) {
      const newSkills = { ...data.skills };
      newSkills[category] = value.split(',').map(s => s.trim());
      onUpdate({ ...data, skills: newSkills });
    }
  };

  const ensureArray = (input: any): string[] => {
    if (!input) return [];
    if (Array.isArray(input)) return input;
    if (typeof input === 'string') return input.split('\n');
    return [String(input)];
  };

  const Input = ({ value, onChange, className }: any) => (
    isEditable ? (
      <input 
        className={`bg-indigo-50/50 border-b border-indigo-200 focus:border-indigo-600 outline-none px-1 rounded ${className}`}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
      />
    ) : <span>{value}</span>
  );

  const TextArea = ({ value, onChange, className }: any) => (
    isEditable ? (
      <textarea 
        className={`w-full bg-indigo-50/50 border-b border-indigo-200 focus:border-indigo-600 outline-none px-1 rounded resize-none ${className}`}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
      />
    ) : <p className={className}>{value}</p>
  );

  return (
    <div 
      id={id}
      className={`bg-white text-[#1a1a1a] mx-auto p-12 min-h-[1056px] font-serif leading-relaxed text-sm antialiased border border-gray-100 ${preview ? 'shadow-none w-[816px]' : 'shadow-xl w-full max-w-[816px]'}`}
      style={{ boxSizing: 'border-box', backgroundColor: '#ffffff' }}
    >
      {/* Header */}
      <header className="text-center mb-10">
        <div className="mb-2">
            {isEditable ? (
                <input 
                    className="text-4xl font-bold uppercase tracking-widest text-[#000000] text-center w-full bg-indigo-50/50 border-b border-indigo-200 outline-none"
                    value={data.name || ""}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="YOUR NAME"
                />
            ) : <h1 className="text-4xl font-bold uppercase tracking-widest text-[#000000]">{data.name || "Resume"}</h1>}
        </div>
        
        <div className="flex flex-wrap justify-center gap-4 text-xs text-[#4b5563] font-sans border-b border-[#e5e7eb] pb-4">
          <Input value={data.headline} onChange={(v: string) => handleChange('headline', v)} className="uppercase tracking-wider font-semibold" />
          <span className="text-[#9ca3af]">|</span>
          <Input value={data.location} onChange={(v: string) => handleChange('location', v)} />
          <span className="text-[#9ca3af]">|</span>
          <Input value={data.email} onChange={(v: string) => handleChange('email', v)} className="font-semibold text-[#000000]" />
        </div>
      </header>

      {/* Summary */}
      <section className="mb-8">
        <h2 className="text-md font-bold uppercase border-b border-[#000000] mb-3 font-sans pb-1 tracking-widest">Professional Summary</h2>
        <TextArea 
          value={data.professional_summary} 
          onChange={(v: string) => handleChange('professional_summary', v)} 
          className="text-justify leading-6 italic text-[#374151]" 
        />
      </section>

      {/* Experience */}
      <section className="mb-8">
        <h2 className="text-md font-bold uppercase border-b border-[#000000] mb-4 font-sans pb-1 tracking-widest">Professional Experience</h2>
        <div className="space-y-6">
          {data.professional_experience.map((exp, i) => (
            <div key={i}>
              <div className="flex justify-between items-baseline mb-1">
                <Input 
                    value={exp.job_title || exp.position || exp.role_title} 
                    onChange={(v: string) => handleListChange('professional_experience', i, 'job_title', v)} 
                    className="font-bold text-md text-[#0f172a]" 
                />
                <Input 
                    value={exp.dates || `${exp.start_date || ''} - ${exp.end_date || ''}`} 
                    onChange={(v: string) => handleListChange('professional_experience', i, 'dates', v)} 
                    className="text-xs font-sans text-[#6b7280] font-bold italic uppercase" 
                />
              </div>
              <Input 
                value={exp.company || exp.company_name} 
                onChange={(v: string) => handleListChange('professional_experience', i, 'company', v)} 
                className="font-bold text-sm text-[#1e1b4b] mb-2 font-sans tracking-tight uppercase block" 
              />
              <TextArea 
                value={ensureArray(exp.responsibilities || exp.achievements || exp.short_description || exp.description).join('\n')} 
                onChange={(v: string) => handleListChange('professional_experience', i, 'responsibilities', v)} 
                className="text-[#374151] text-sm" 
              />
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
                <Input 
                    value={proj.project_name || proj.name} 
                    onChange={(v: string) => handleListChange('projects', i, 'project_name', v)} 
                    className="font-bold text-sm text-[#0f172a]" 
                />
                <Input 
                    value={proj.dates} 
                    onChange={(v: string) => handleListChange('projects', i, 'dates', v)} 
                    className="text-xs text-[#6b7280] italic font-serif uppercase tracking-tighter" 
                />
              </div>
              <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] text-[#4338ca] font-bold uppercase tracking-widest">ROLE:</span>
                  <Input 
                    value={proj.role} 
                    onChange={(v: string) => handleListChange('projects', i, 'role', v)} 
                    className="text-[10px] text-[#4338ca] font-bold uppercase tracking-widest" 
                  />
              </div>
              
              <div className="flex items-center gap-2 mb-2 italic font-serif text-[10px] text-[#6b7280]">
                  <span>Stack:</span>
                  <Input 
                    value={Array.isArray(proj.technologies) ? proj.technologies.join(' • ') : proj.technologies} 
                    onChange={(v: string) => handleListChange('projects', i, 'technologies', v.split(' • '))} 
                    className="w-full"
                  />
              </div>

              <TextArea 
                value={ensureArray(proj.key_achievements || proj.achievements || proj.highlights || proj.short_description || proj.description).join('\n')} 
                onChange={(v: string) => handleListChange('projects', i, 'description', v)} 
                className="text-[#374151] text-sm font-serif" 
              />
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
              <div className="flex-grow">
                {isEditable ? (
                    <input 
                        className="w-full bg-indigo-50/50 border-b border-indigo-200 outline-none px-1 rounded font-serif text-sm"
                        value={Array.isArray(list) ? list.join(', ') : String(list)}
                        onChange={(e) => handleSkillChange(type, e.target.value)}
                    />
                ) : (
                    <span className="font-serif text-sm text-[#374151] capitalize">
                        {Array.isArray(list) ? list.join(', ') : String(list)}
                    </span>
                )}
              </div>
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
