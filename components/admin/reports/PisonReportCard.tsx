import React, { useState, useRef } from 'react';
import { 
  BookOpen, 
  Award,
  User,
  School,
  Star,
  QrCode
} from 'lucide-react';
import { PisonReportCardData } from './report-card-types';

interface PisonReportCardProps {
  reportData: PisonReportCardData
}

const PisonReportCard = ({ reportData }: PisonReportCardProps) => {
  const [isEditing] = useState(false);
  const [data, setData] = useState<PisonReportCardData>(reportData);
  const [logoError, setLogoError] = useState(false); 
  const printRef = useRef<HTMLDivElement>(null);



  const handleInputChange = (section: Exclude<keyof PisonReportCardData, 'watermarkUrl'>, field: string, value: string | number) => {
    setData(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as object),
        [field]: value
      }
    }));
  };

  const Input = ({ value, className = "", onChange }: { value: string | number; className?: string; onChange?: (value: string) => void }) => {
    if (!isEditing) return <span className={`truncate ${className}`}>{value}</span>;
    return (
      <input 
        type="text" 
        value={value} 
        onChange={(e) => onChange && onChange(e.target.value)}
        className={`bg-gray-50 border-b border-gray-400 px-1 w-full focus:outline-none focus:border-black transition-colors ${className}`} 
      />
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-sans text-gray-900 print:p-0">
      
      {/* Control Bar removed */}

      {/* Main Report Card Sheet */}
      <div className="max-w-[210mm] mx-auto bg-white shadow-xl print:shadow-none print:w-full print:max-w-full text-xs print:text-[8pt] relative min-h-[297mm]">
        
        {/* Top Border Decoration */}
        <div className="h-1 print:h-0.5 w-full bg-black print:block" />

        {/* Reduced padding from p-8/p-12 to p-4/p-6 */}
        <div className="p-2 print:p-3 flex flex-col gap-0 relative" ref={printRef}>
          
          {/* Creative Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
            {reportData.watermarkUrl && (
              <img 
                src={reportData.watermarkUrl}
                alt="Pison Academy Watermark" 
                className="w-[90%] h-auto opacity-[0.06] transform -rotate-6 grayscale"
                style={{ filter: 'grayscale(100%) contrast(1.5) brightness(1.5)' }}
                onError={(e) => e.currentTarget.style.display = 'none'}
              />
            )}
          </div>

          {/* Header */}
          <header className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 border-b-2 border-black pb-4 relative z-10">
            <div className="text-center md:text-left text-[0.65rem] md:text-[0.7rem] uppercase font-medium space-y-1">
              <p>République du Cameroun</p>
              <p>Paix - Travail - Patrie</p>
              <p>Ministère des Enseignements Secondaires</p>
              <p>Délégation Régional de Littoral</p>
              <p className="font-bold text-black mt-1">PISON ACADEMY OF EXCELLENCE</p>
            </div>
            
            <div className="flex flex-col items-center justify-center">
              {/* Custom Logo replacing education icon */}
              <div className="w-20 h-20 mb-2 relative overflow-hidden flex items-center justify-center">
                {logoError ? (
                  // Fallback icon if image fails
                  <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-gray-300 rounded-full">
                     <School size={32} className="text-gray-400" />
                  </div>
                ) : (
                  <img 
                    src="/pison.png"
                    alt="Pison Academy Logo" 
                    className="max-w-full max-h-full object-contain grayscale" 
                    onError={() => setLogoError(true)}
                  />
                )}
              </div>
              <p className="text-xs font-mono">
                ORDER Nº: <span className="text-red-600 font-bold">{data.academic.orderNo?.split('OF')[0] ?? data.academic.orderNo}</span>
              </p>
            </div>

            <div className="text-center md:text-right text-[0.65rem] md:text-[0.7rem] uppercase font-medium space-y-1">
              <p>Republic of Cameroon</p>
              <p>Peace - Work - Fatherland</p>
              <p>Ministry of Secondary Education</p>
              <p>Regional Delegation of Littoral</p>
              <p className="font-bold text-black mt-1 text-blue-800">PISON ACADEMY OF EXCELLENCE</p>
              <p className="normal-case text-red-600 text-[0.6rem]">PO Box 58 Edea Tel: 676521570</p>
            </div>
          </header>

          {/* Creative Title Banner */}
          <div className="mb-1 print:mb-0.5 relative z-10">
             <div className="flex flex-col md:flex-row items-center justify-between bg-black text-white p-0.5 print:p-0.5 mb-0.5 print:mb-0.5">
               <span className="font-mono text-[0.5rem] print:text-[6pt] uppercase tracking-widest px-1">Academic Year {data.academic.year}</span>
               <div className="flex-1 mx-2 h-px bg-white/50 hidden md:block"></div>
               <span className="font-mono text-[0.5rem] print:text-[6pt] uppercase tracking-widest px-1">Année Scolaire {data.academic.year}</span>
             </div>
             
             {/* Main Banner Box */}
             <div className="border-2 print:border border-black p-2 print:p-1 relative overflow-hidden group">
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-100 to-transparent opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
               
               {/* QR Code Placeholder - Left */}
               <div className="absolute left-2 print:left-1 top-1/2 -translate-y-1/2 hidden md:flex flex-col items-center opacity-80 z-20">
                 <div className="bg-white p-0.5 print:p-0.5 border border-black shadow-sm">
                   <QrCode size={64} className="text-black print:w-12 print:h-12" />
                 </div>
               </div>

               {/* Center Text */}
               <div className="flex flex-col items-center justify-center relative z-10 mx-auto max-w-[60%]">
                 <h2 className="font-black text-xl print:text-2xl uppercase tracking-tighter leading-none mb-0.5 print:mb-0.5 text-center">
                   <span className="text-black/80">THIRD</span> <span className="relative inline-block">TERM</span>
                 </h2>
                 <p className="font-black text-base print:text-lg uppercase tracking-[0.2em] leading-none mb-1 print:mb-0.5 text-center">
                   REPORT CARD
                 </p>
                 <div className="flex items-center gap-1 w-full justify-center">
                   <div className="h-0.5 w-6 bg-black/30"></div>
                   <p className="text-[0.5rem] print:text-[6pt] font-bold tracking-widest text-black/60 uppercase whitespace-nowrap flex items-center gap-0.5">
                     <Star size={8} className="text-black/60 fill-black/60 print:w-1 print:h-1" /> Bulletin du Troisieme Trimestre <Star size={8} className="text-black/60 fill-black/60 print:w-1 print:h-1" />
                   </p>
                   <div className="h-0.5 w-6 bg-black/30"></div>
                 </div>
               </div>

               {/* Decorative Background Icons - Hidden in print */}
               <Award size={80} className="absolute -right-8 -top-8 text-black/5 transform rotate-12 pointer-events-none print:hidden" />
               <BookOpen size={80} className="absolute -left-8 -bottom-8 text-black/5 transform -rotate-12 pointer-events-none print:hidden" />
             </div>
          </div>

          {/* Student Info Grid */}
          <div className="border border-black grid grid-cols-12 mb-1 print:mb-0.5 font-mono text-[0.65rem] print:text-[7pt] relative z-10 bg-white/90 backdrop-blur-sm">
            {/* Row 1 */}
            <div className="col-span-12 md:col-span-4 p-2 border-b md:border-r border-black border-dotted md:border-solid">
              <span className="block text-[0.6rem] text-gray-500 uppercase">Unifier No / Matricule</span>
              <Input value={data.student.id} onChange={(v) => handleInputChange('student', 'id', v)} className="font-bold" />
            </div>
            <div className="col-span-12 md:col-span-6 p-2 border-b md:border-r border-black border-dotted md:border-solid">
               <span className="block text-[0.6rem] text-gray-500 uppercase">Name & Surname / Noms et Prénoms</span>
               <Input value={data.student.name} onChange={(v) => handleInputChange('student', 'name', v)} className="font-bold text-sm" />
            </div>
            <div className="col-span-12 md:col-span-2 p-2 border-b border-black border-dotted md:border-solid">
               <span className="block text-[0.6rem] text-gray-500 uppercase">Repeater / Redoublant</span>
               <Input value="NO / NON" className="font-bold" />
            </div>

            {/* Row 2 */}
            <div className="col-span-2 p-2 border-b border-r border-black border-dotted md:border-solid">
               <span className="block text-[0.6rem] text-gray-500 uppercase">Sex</span>
               <Input value={data.student.sex} onChange={(v) => handleInputChange('student', 'sex', v)} className="font-bold" />
            </div>
            <div className="col-span-7 p-2 border-b border-r border-black border-dotted md:border-solid">
               <span className="block text-[0.6rem] text-gray-500 uppercase">Date & Place of Birth / Né le - à</span>
               <div className="flex gap-2">
                 <Input value={data.student.dob} onChange={(v) => handleInputChange('student', 'dob', v)} className="font-bold w-24" />
                 <span className="text-gray-400">|</span>
                 <Input value={data.student.pob} onChange={(v) => handleInputChange('student', 'pob', v)} className="font-bold flex-1" />
               </div>
            </div>
            
            {/* Photo Area */}
            <div className="col-span-3 row-span-2 border-b border-black flex flex-col items-center justify-center p-2 bg-gray-50">
               {data.student.photoUrl ? (
                 <img 
                   src={data.student.photoUrl} 
                   alt="Student" 
                   className="w-full h-full object-cover"
                   onError={(e) => e.currentTarget.style.display = 'none'}
                 />
               ) : (
                 <div className="text-center text-gray-400 text-[0.6rem]">
                   <User size={32} className="mx-auto mb-1 opacity-20" />
                   PHOTO
                 </div>
               )}
            </div>

            {/* Row 3 */}
            <div className="col-span-5 p-2 border-b md:border-b-0 border-r border-black border-dotted md:border-solid">
               <span className="block text-[0.6rem] text-gray-500 uppercase">Speciality</span>
               <Input value={data.student.speciality || ''} onChange={(v) => handleInputChange('student', 'speciality', v)} className="font-bold" />
            </div>
            <div className="col-span-2 p-2 border-b md:border-b-0 border-r border-black border-dotted md:border-solid">
               <span className="block text-[0.6rem] text-gray-500 uppercase">Class</span>
               <Input value={data.student.class} onChange={(v) => handleInputChange('student', 'class', v)} className="font-bold" />
            </div>
            <div className="col-span-2 p-2 border-b md:border-b-0 border-r border-black border-dotted md:border-solid">
               <span className="block text-[0.6rem] text-gray-500 uppercase">Master</span>
               <Input value={data.student.classMaster || ''} className="font-bold text-[0.65rem]" />
            </div>
             <div className="col-span-3 md:col-span-3 p-2 flex items-center justify-between bg-black text-white md:bg-transparent md:text-black md:border-none">
                <span className="text-[0.6rem] uppercase mr-2">Enrolment:</span>
                <span className="font-bold">{data.student.enrollment}</span>
             </div>

          </div>

          {/* Grades Table Component */}
          <div className="border border-black mb-1 print:mb-0.5 overflow-hidden relative z-10 bg-white/90 backdrop-blur-sm">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-100 text-[0.55rem] print:text-[7pt] uppercase font-bold border-b border-black">
                <tr>
                  <th className="p-1 print:p-0.5 border-r border-black w-12 print:w-10 text-center" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: '7pt' }}>Cat</th>
                  <th className="p-1 print:p-0.5 border-r border-black w-1/3" style={{ fontSize: '7pt' }}>Subjects</th>
                  <th className="p-1 print:p-0.5 border-r border-black text-center w-10 print:w-8" style={{ fontSize: '7pt' }}>Eval</th>
                  <th className="p-1 print:p-0.5 border-r border-black text-center w-10 print:w-8" style={{ fontSize: '7pt' }}>Coef</th>
                  <th className="p-1 print:p-0.5 border-r border-black text-center w-10 print:w-8" style={{ fontSize: '7pt' }}>Total</th>
                  <th className="p-1 print:p-0.5 border-r border-black text-center w-10 print:w-8" style={{ fontSize: '7pt' }}>Grade</th>
                  <th className="p-1 print:p-0.5 border-r border-black text-center w-10 print:w-8" style={{ fontSize: '7pt' }}>Rank</th>
                  <th className="p-1 print:p-0.5" style={{ fontSize: '7pt' }}>Remarks</th>
                </tr>
              </thead>
              <tbody className="text-[0.6rem] print:text-[7pt] font-mono">
                {Object.entries(data.subjects).map(([key, section]) => (
                  <React.Fragment key={key}>
                    {section.items.map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50 print:hover:bg-transparent">
                        {/* Category Label - Only on first row of section */}
                        {idx === 0 && (
                          <td 
                            rowSpan={section.items.length + 1} 
                            className="border-r border-black bg-gray-200 text-center font-bold text-[0.55rem] print:text-[6pt] p-0.5 print:p-0.5 uppercase whitespace-nowrap"
                            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                          >
                            {section.title}
                          </td>
                        )}
                        <td className="p-1 print:p-0.5 border-r border-gray-300 font-medium">{item.name}</td>
                        <td className="p-1 print:p-0.5 border-r border-gray-300 text-center">{item.eval}</td>
                        <td className="p-1 print:p-0.5 border-r border-gray-300 text-center">{item.coef}</td>
                        <td className="p-1 print:p-0.5 border-r border-gray-300 text-center">{item.total}</td>
                        <td className="p-1 print:p-0.5 border-r border-gray-300 text-center">{item.grade}</td>
                        <td className="p-1 print:p-0.5 border-r border-gray-300 text-center">{item.rank}</td>
                        <td className={`p-1 print:p-0.5 ${!item.remark ? 'text-gray-500' : item.remark.toLowerCase().includes('fail') ? 'text-red-600' : 'text-green-700'}`}>
                          {item.remark}
                        </td>
                      </tr>
                    ))}
                    {/* Section Summary Row */}
                    <tr className="bg-gray-300 font-bold border-b border-black">
                      <td className="p-1 print:p-0.5 border-r border-black uppercase text-[0.55rem] print:text-[6pt]">{section.title.split(' ')[0]} Summary</td>
                      <td className="p-1 print:p-0.5 border-r border-black text-center text-gray-400">/</td>
                      <td className="p-1 print:p-0.5 border-r border-black text-center">{section.summary.coef}</td>
                      <td className="p-1 print:p-0.5 border-r border-black text-center">{section.summary.total}</td>
                      <td className="p-1 print:p-0.5 border-r border-black text-center whitespace-nowrap text-[0.55rem] print:text-[6pt]">AV: {section.summary.avg}</td>
                      <td className="p-1 print:p-0.5 border-r border-black text-center">{section.summary.rank}</td>
                      <td className="p-1 print:p-0.5 uppercase text-[0.55rem] print:text-[6pt]">{section.summary.remark}</td>
                    </tr>
                  </React.Fragment>
                ))}
                
                {/* Grand Total Row */}
                <tr className="bg-black text-white font-bold text-[0.65rem] print:text-[7pt]">
                   <td colSpan={2} className="p-1 print:p-0.5 text-right uppercase border-r border-gray-600">Total Summary / Bilan Totale</td>
                   <td className="p-1 print:p-0.5 text-center border-r border-gray-600">-</td>
                   <td className="p-1 print:p-0.5 text-center border-r border-gray-600">{data.totals.coef}</td>
                   <td className="p-1 print:p-0.5 text-center border-r border-gray-600">{data.totals.score}</td>
                   <td colSpan={3} className="bg-gray-100"></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 print:gap-1 mb-2 print:mb-1 relative z-10">
            
            {/* Left Column: Term History & Discipline */}
            <div className="col-span-12 md:col-span-4 flex flex-col gap-0">
              <div className="border border-black bg-white/90 backdrop-blur-sm">
                 <div className="bg-gray-100 p-0.5 print:p-0.5 text-center text-[0.55rem] print:text-[6pt] font-bold uppercase border-b border-black">
                   Student&apos;s Evaluation Results
                 </div>
                 <table className="w-full text-[0.6rem] print:text-[7pt] text-center">
                   <thead>
                     <tr className="border-b border-gray-300">
                       <th className="p-0.5 print:p-0.5 border-r border-gray-300">TERM</th>
                       <th className="p-0.5 print:p-0.5 border-r border-gray-300">1</th>
                       <th className="p-0.5 print:p-0.5 border-r border-gray-300">2</th>
                       <th className="p-0.5 print:p-0.5">3</th>
                     </tr>
                   </thead>
                   <tbody>
                      <tr className="border-b border-gray-300 font-mono">
                        <td className="p-0.5 print:p-0.5 font-bold border-r border-gray-300 text-left pl-1">AVERAGE</td>
                        <td className="p-0.5 print:p-0.5 border-r border-gray-300">{data.history.term1}</td>
                        <td className="p-0.5 print:p-0.5 border-r border-gray-300">{data.history.term2}</td>
                        <td className="p-0.5 print:p-0.5 font-bold">{data.history.term3}</td>
                      </tr>
                      <tr className="font-mono">
                        <td className="p-0.5 print:p-0.5 font-bold border-r border-gray-300 text-left pl-1">RANK</td>
                        <td className="p-0.5 print:p-0.5 border-r border-gray-300">-</td>
                        <td className="p-0.5 print:p-0.5 border-r border-gray-300">-</td>
                        <td className="p-0.5 print:p-0.5">{data.history.rank}</td>
                      </tr>
                   </tbody>
                 </table>
              </div>

              <div className="border border-black bg-white/90 backdrop-blur-sm">
                 <div className="bg-gray-100 p-0.5 print:p-0.5 text-center text-[0.55rem] print:text-[6pt] font-bold uppercase border-b border-black">
                   Discipline And Conduct
                 </div>
                 <div className="text-[0.6rem] print:text-[7pt] p-1 print:p-0.5 space-y-1">
                    <div className="flex justify-between border-b border-gray-200 pb-0.5">
                      <span>Unjustified Absences</span>
                      <span className="font-mono font-bold">0hrs</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Suspensions / Warnings</span>
                      <span className="font-mono font-bold">-</span>
                    </div>
                 </div>
              </div>
            </div>

            <div className="col-span-12 md:col-span-4 flex items-center justify-center py-2 print:py-1">
               <div className="flex gap-2">
                 <div className="w-24 print:w-20 h-24 print:h-20 rounded-full border-2 print:border border-black flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm shadow-lg z-10">
                    <span className="text-[0.5rem] print:text-[6pt] text-gray-500 uppercase font-bold">Annual Average</span>
                    <span className="text-2xl print:text-xl font-black">{data.history.annualAvg}</span>
                    <span className="text-[0.5rem] print:text-[6pt] text-green-600 font-bold uppercase">Passed</span>
                 </div>
                 <div className="w-16 print:w-14 h-16 print:h-14 rounded-full border border-black border-dashed flex flex-col items-center justify-center bg-gray-50/90 backdrop-blur-sm z-10">
                    <span className="text-[0.5rem] print:text-[6pt] text-gray-500 uppercase font-bold">Rank</span>
                    <span className="text-lg print:text-base font-black">{data.history.rank}</span>
                 </div>
               </div>
            </div>


            {/* Right Column: Class Stats */}
            <div className="col-span-12 md:col-span-4">
              <div className="border border-black h-full bg-white/90 backdrop-blur-sm">
                 <div className="bg-gray-100 p-0.5 print:p-0.5 text-center text-[0.55rem] print:text-[6pt] font-bold uppercase border-b border-black">
                   Class Profile And Statistics
                 </div>
                 <table className="w-full text-[0.6rem] print:text-[7pt]">
                   <tbody>
                     <tr className="border-b border-gray-200">
                       <td className="p-0.5 print:p-0.5 pl-1 font-bold border-r border-gray-200">SAT</td>
                       <td className="p-0.5 print:p-0.5 border-r border-gray-200 text-center">M: 7</td>
                       <td className="p-0.5 print:p-0.5 border-r border-gray-200 text-center">F: 0</td>
                       <td className="p-0.5 print:p-0.5 text-center font-bold">7</td>
                     </tr>
                     <tr className="border-b border-gray-200">
                       <td className="p-0.5 print:p-0.5 pl-1 font-bold border-r border-gray-200">MAX AV</td>
                       <td colSpan={3} className="p-0.5 print:p-0.5 pl-1 font-mono">{data.stats.max}</td>
                     </tr>
                     <tr className="border-b border-gray-200">
                       <td className="p-0.5 print:p-0.5 pl-1 font-bold border-r border-gray-200">MIN AV</td>
                       <td colSpan={3} className="p-0.5 print:p-0.5 pl-1 font-mono">{data.stats.min}</td>
                     </tr>
                     <tr className="border-b border-gray-200">
                       <td className="p-0.5 print:p-0.5 pl-1 font-bold border-r border-gray-200">PASSED</td>
                       <td colSpan={3} className="p-0.5 print:p-0.5 pl-1 font-mono">{data.stats.passed}</td>
                     </tr>
                     <tr className="border-b border-gray-200">
                       <td className="p-0.5 print:p-0.5 pl-1 font-bold border-r border-gray-200">% PASSED</td>
                       <td colSpan={3} className="p-0.5 print:p-0.5 pl-1 font-mono">{data.stats.percent}%</td>
                     </tr>
                     <tr>
                       <td className="p-0.5 print:p-0.5 pl-1 font-bold border-r border-gray-200 bg-gray-100">CLASS AVG</td>
                       <td colSpan={3} className="p-0.5 print:p-0.5 pl-1 font-mono font-bold bg-gray-100">{data.stats.classAvg}</td>
                     </tr>
                   </tbody>
                 </table>
              </div>
            </div>
          </div>

          {/* GCE Section & Signatures */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 print:gap-1 mt-auto relative z-10">
             <div className="border border-black p-1.5 print:p-1 text-[0.6rem] print:text-[7pt] bg-white/90 backdrop-blur-sm">
                <h4 className="font-bold border-b border-gray-300 mb-1 pb-0.5">GCE SECTION</h4>
                <div className="space-y-0.5 font-mono">
                  <div className="flex justify-between"><span>Trade Subjects:</span> <span>02</span></div>
                  <div className="flex justify-between"><span>Related Trade:</span> <span>0.0</span></div>
                  <div className="flex justify-between"><span>Other Subjects:</span> <span>0.0</span></div>
                  <div className="flex justify-between font-bold pt-1 border-t border-gray-300 mt-1">
                    <span>SUBJECTS PASSED:</span> <span>02</span>
                  </div>
                </div>
             </div>
             
             <div className="border border-black p-1.5 print:p-1 text-[0.6rem] print:text-[7pt] flex flex-col justify-between bg-white/90 backdrop-blur-sm" style={{ height: '60px' }}>
               <h4 className="font-bold text-center underline">The Class Master</h4>
               <div className="text-center font-script text-sm print:text-xs opacity-70">Mr. Kome</div>
               <div className="text-[0.5rem] print:text-[6pt] text-center text-gray-400 mt-0.5 italic">Signature</div>
             </div>

             <div className="border border-black p-1.5 print:p-1 text-[0.6rem] print:text-[7pt] flex flex-col justify-between bg-white/90 backdrop-blur-sm" style={{ height: '60px' }}>
               <h4 className="font-bold text-center underline">The Principal</h4>
               <div className="text-center font-script text-sm print:text-xs opacity-70">Dr. Pison</div>
               <div className="text-[0.5rem] print:text-[6pt] text-center text-gray-400 mt-0.5 italic">Stamp & Signature</div>
             </div>
          </div>
          
          <div className="text-[0.5rem] print:text-[6pt] text-center text-gray-400 mt-1 print:mt-0.5 font-mono uppercase relative z-10">
            This document is computer generated and contains no alterations.
          </div>

        </div>
        
        {/* Bottom Border Decoration */}
        <div className="h-1 print:h-0.5 w-full bg-black print:block" />
      </div>

    </div>
  );
};

export default PisonReportCard;