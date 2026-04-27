import React from 'react';

interface ResumeData {
  name: string;
  email: string;
  headline: string;
  location?: string;
  phone?: string;
  links?: { github?: string; linkedin?: string };
  professional_summary: string;
  professional_experience: Array<{ company: string; job_title: string; dates: string; responsibilities: string[] }>;
  skills: { [key: string]: string[] };
  projects: Array<{ project_name: string; role: string; dates: string; description: string[]; technologies: string[] }>;
  education: Array<{ institution: string; degree: string; dates: string }>;
}

export const ProfessionalTemplate = ({ data }: { data: any }) => {
  return (
    <div className="p-8 bg-white text-black font-sans text-sm leading-relaxed max-w-[210mm] mx-auto min-h-[297mm]">
      {/* Header */}
      <header className="border-b-2 border-black pb-4 mb-6">
        <h1 className="text-3xl font-bold uppercase">{data.name}</h1>
        <p className="text-xl font-medium">{data.headline}</p>
        <div className="flex flex-wrap gap-4 mt-2 text-xs">
          <span>{data.email}</span>
          {data.phone && <span>| {data.phone}</span>}
          {data.location && <span>| {data.location}</span>}
        </div>
      </header>

      {/* Summary */}
      <section className="mb-6">
        <h2 className="font-bold border-b border-black mb-2 uppercase">Summary</h2>
        <p>{data.professional_summary}</p>
      </section>

      {/* Experience */}
      <section className="mb-6">
        <h2 className="font-bold border-b border-black mb-2 uppercase">Professional Experience</h2>
        {data.professional_experience?.map((exp: any, i: number) => (
          <div key={i} className="mb-4">
            <div className="flex justify-between font-bold">
              <span>{exp.job_title}, {exp.company}</span>
              <span>{exp.dates}</span>
            </div>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              {exp.responsibilities?.map((res: string, j: number) => <li key={j}>{res}</li>)}
            </ul>
          </div>
        ))}
      </section>

      {/* Two Column Section: Skills & Projects */}
      <div className="grid grid-cols-2 gap-8 mb-6">
        <section>
          <h2 className="font-bold border-b border-black mb-2 uppercase">Skills</h2>
          {Object.entries(data.skills || {}).map(([category, skills]: any, i) => (
            <div key={i} className="mb-2">
              <p className="font-bold text-xs uppercase">{category}</p>
              <p>{skills.join(', ')}</p>
            </div>
          ))}
        </section>
        
        <section>
          <h2 className="font-bold border-b border-black mb-2 uppercase">Projects</h2>
          {data.projects?.map((proj: any, i: number) => (
            <div key={i} className="mb-3">
              <p className="font-bold">{proj.project_name}</p>
              <p className="text-xs italic">{proj.technologies?.join(', ')}</p>
              <ul className="list-disc pl-5 mt-1">
                {proj.description?.map((desc: string, j: number) => <li key={j}>{desc}</li>)}
              </ul>
            </div>
          ))}
        </section>
      </div>
      
      {/* Education */}
      <section>
        <h2 className="font-bold border-b border-black mb-2 uppercase">Education</h2>
        {data.education?.map((edu: any, i: number) => (
          <div key={i} className="flex justify-between">
            <span className="font-bold">{edu.institution}</span>
            <span>{edu.dates}</span>
          </div>
        ))}
      </section>
    </div>
  );
};
