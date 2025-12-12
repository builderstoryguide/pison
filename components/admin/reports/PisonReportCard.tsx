import React, { useState, useRef } from 'react';
import { 
  Printer, 
  Edit2, 
  Save, 
  GraduationCap, 
  BookOpen, 
  Award,
  User,
  School,
  Star,
  QrCode,
  Barcode
} from 'lucide-react';
import { PisonReportCardData } from './report-card-types';

interface PisonReportCardProps {
  reportData: PisonReportCardData
}

const PisonReportCard = ({ reportData }: PisonReportCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [data, setData] = useState<PisonReportCardData>(reportData);
  const [logoError, setLogoError] = useState(false); 
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleInputChange = (section: keyof PisonReportCardData, field: string, value: string | number) => {
    setData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof PisonReportCardData],
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
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-sans text-gray-900">
      
      {/* Control Bar removed */}

      {/* Main Report Card Sheet */}
      <div className="max-w-[210mm] mx-auto bg-white shadow-xl print:shadow-none print:w-full overflow-hidden text-xs md:text-sm print:text-[10pt] relative">
        
        {/* Top Border Decoration */}
        <div className="h-2 w-full bg-black print:block" />

        {/* Reduced padding from p-8/p-12 to p-4/p-6 */}
        <div className="p-4 md:p-6 print:p-2 flex flex-col gap-4 relative" ref={printRef}>
          
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
                ORDER Nº: <span className="text-red-600 font-bold">{data.academic.orderNo.split('OF')[0]}</span>
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
          <div className="mb-6 relative z-10">
             <div className="flex flex-col md:flex-row items-center justify-between bg-black text-white p-1 mb-1">
               <span className="font-mono text-[0.6rem] uppercase tracking-widest px-2">Academic Year {data.academic.year}</span>
               <div className="flex-1 mx-4 h-px bg-white/50 hidden md:block"></div>
               <span className="font-mono text-[0.6rem] uppercase tracking-widest px-2">Année Scolaire {data.academic.year}</span>
             </div>
             
             {/* Main Banner Box */}
             <div className="border-4 border-black p-4 relative overflow-hidden group">
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-100 to-transparent opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
               
               {/* QR Code Placeholder - Left */}
               <div className="absolute left-4 top-1/2 -translate-y-1/2 hidden md:flex flex-col items-center opacity-80 z-20">
                 <div className="bg-white p-1 border-2 border-black shadow-sm">
                   <QrCode size={42} className="text-black" />
                 </div>
                 <span className="text-[0.5rem] font-mono font-bold mt-1 tracking-wider bg-white px-1">SCAN ME</span>
               </div>

               {/* Center Text */}
               <div className="flex flex-col items-center justify-center relative z-10 mx-auto max-w-[60%]">
                 <h2 className="font-black text-3xl md:text-5xl uppercase tracking-tighter leading-none mb-1 text-center">
                   <span className="text-black/80">THIRD</span> <span className="relative inline-block">TERM <span className="absolute -bottom-1 md:-bottom-2 left-0 w-full h-1 md:h-2 bg-black"></span></span>
                 </h2>
                 <p className="font-black text-xl md:text-3xl uppercase tracking-[0.2em] leading-none mb-3 text-center">
                   REPORT CARD
                 </p>
                 <div className="flex items-center gap-2 w-full justify-center">
                   <div className="h-0.5 w-8 bg-black/30"></div>
                   <p className="text-[0.6rem] font-bold tracking-widest text-black/60 uppercase whitespace-nowrap flex items-center gap-1">
                     <Star size={10} className="text-black/60 fill-black/60" /> Bulletin du Troisieme Trimestre <Star size={10} className="text-black/60 fill-black/60" />
                   </p>
                   <div className="h-0.5 w-8 bg-black/30"></div>
                 </div>
               </div>

               {/* Barcode Placeholder - Right */}
               <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:flex flex-col items-center opacity-80 z-20">
                 <div className="bg-white p-2 border-2 border-black shadow-sm">
                   <Barcode size={42} className="text-black" />
                 </div>
                 <span className="text-[0.5rem] font-mono font-bold mt-1 tracking-wider bg-white px-1">{data.student.id}</span>
               </div>

               {/* Decorative Background Icons */}
               <Award size={120} className="absolute -right-10 -top-10 text-black/5 transform rotate-12 pointer-events-none" />
               <BookOpen size={120} className="absolute -left-10 -bottom-10 text-black/5 transform -rotate-12 pointer-events-none" />
             </div>
          </div>

          {/* Student Info Grid */}
          <div className="border-2 border-black grid grid-cols-12 mb-6 font-mono text-xs relative z-10 bg-white/90 backdrop-blur-sm">
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
                 <img src={data.student.photoUrl} alt="Student" className="w-full h-full object-cover" />
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
               <Input value={data.student.speciality} onChange={(v) => handleInputChange('student', 'speciality', v)} className="font-bold" />
            </div>
            <div className="col-span-2 p-2 border-b md:border-b-0 border-r border-black border-dotted md:border-solid">
               <span className="block text-[0.6rem] text-gray-500 uppercase">Class</span>
               <Input value={data.student.class} onChange={(v) => handleInputChange('student', 'class', v)} className="font-bold" />
            </div>
            <div className="col-span-2 p-2 border-b md:border-b-0 border-r border-black border-dotted md:border-solid">
               <span className="block text-[0.6rem] text-gray-500 uppercase">Master</span>
               <Input value={data.student.classMaster} className="font-bold text-[0.65rem]" />
            </div>
             <div className="col-span-3 md:col-span-3 p-2 flex items-center justify-between bg-black text-white md:bg-transparent md:text-black md:border-none">
                <span className="text-[0.6rem] uppercase mr-2">Enrolment:</span>
                <span className="font-bold">{data.student.enrollment}</span>
             </div>

          </div>

          {/* Grades Table Component */}
          <div className="border-2 border-black mb-6 overflow-hidden relative z-10 bg-white/90 backdrop-blur-sm">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-100 text-[0.65rem] uppercase font-bold border-b-2 border-black">
                <tr>
                  <th className="p-2 border-r border-black w-8 text-center rotate-180 md:rotate-0 writing-vertical md:writing-horizontal">Cat</th>
                  <th className="p-2 border-r border-black w-1/3">Subjects</th>
                  <th className="p-2 border-r border-black text-center w-12">Eval</th>
                  <th className="p-2 border-r border-black text-center w-12">Coef</th>
                  <th className="p-2 border-r border-black text-center w-12">Total</th>
                  <th className="p-2 border-r border-black text-center w-12">Grade</th>
                  <th className="p-2 border-r border-black text-center w-12">Rank</th>
                  <th className="p-2">Remarks</th>
                </tr>
              </thead>
              <tbody className="text-[0.7rem] font-mono">
                {Object.entries(data.subjects).map(([key, section], sectionIdx) => (
                  <React.Fragment key={key}>
                    {section.items.map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                        {/* Category Label - Only on first row of section */}
                        {idx === 0 && (
                          <td 
                            rowSpan={section.items.length + 1} 
                            className="border-r border-black bg-gray-200 text-center font-bold text-xs p-1 uppercase whitespace-nowrap"
                            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                          >
                            {section.title}
                          </td>
                        )}
                        <td className="p-2 border-r border-gray-300 font-medium">{item.name}</td>
                        <td className="p-2 border-r border-gray-300 text-center">{item.eval}</td>
                        <td className="p-2 border-r border-gray-300 text-center">{item.coef}</td>
                        <td className="p-2 border-r border-gray-300 text-center">{item.total}</td>
                        <td className={`p-2 border-r border-gray-300 text-center font-bold ${item.grade === 'F' || item.grade === 'U' ? 'text-red-600' : ''}`}>
                          {item.grade}
                        </td>
                        <td className="p-2 border-r border-gray-300 text-center">{item.rank}</td>
                        <td className={`p-2 ${item.remark.toLowerCase().includes('fail') ? 'text-red-600' : 'text-green-700'}`}>
                          {item.remark}
                        </td>
                      </tr>
                    ))}
                    {/* Section Summary Row */}
                    <tr className="bg-gray-300 font-bold border-b-2 border-black">
                      <td className="p-2 border-r border-black uppercase text-[0.65rem]">{section.title.split(' ')[0]} Summary</td>
                      <td className="p-2 border-r border-black text-center text-gray-400">/</td>
                      <td className="p-2 border-r border-black text-center">{section.summary.coef}</td>
                      <td className="p-2 border-r border-black text-center">{section.summary.total}</td>
                      <td className="p-2 border-r border-black text-center whitespace-nowrap text-[0.65rem]">AV: {section.summary.avg}</td>
                      <td className="p-2 border-r border-black text-center">{section.summary.rank}</td>
                      <td className="p-2 uppercase text-[0.65rem]">{section.summary.remark}</td>
                    </tr>
                  </React.Fragment>
                ))}
                
                {/* Grand Total Row */}
                <tr className="bg-black text-white font-bold text-sm">
                   <td colSpan={2} className="p-3 text-right uppercase border-r border-gray-600">Total Summary / Bilan Totale</td>
                   <td className="p-3 text-center border-r border-gray-600">-</td>
                   <td className="p-3 text-center border-r border-gray-600">{data.totals.coef}</td>
                   <td className="p-3 text-center border-r border-gray-600">{data.totals.score}</td>
                   <td colSpan={3} className="bg-gray-100"></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4 relative z-10">
            
            {/* Left Column: Term History & Discipline */}
            <div className="col-span-12 md:col-span-4 flex flex-col gap-4">
              <div className="border border-black bg-white/90 backdrop-blur-sm">
                 <div className="bg-gray-100 p-1 text-center text-[0.65rem] font-bold uppercase border-b border-black">
                   Student's Evaluation Results
                 </div>
                 <table className="w-full text-[0.7rem] text-center">
                   <thead>
                     <tr className="border-b border-gray-300">
                       <th className="p-1 border-r border-gray-300">TERM</th>
                       <th className="p-1 border-r border-gray-300">1</th>
                       <th className="p-1 border-r border-gray-300">2</th>
                       <th className="p-1">3</th>
                     </tr>
                   </thead>
                   <tbody>
                      <tr className="border-b border-gray-300 font-mono">
                        <td className="p-1 font-bold border-r border-gray-300 text-left pl-2">AVERAGE</td>
                        <td className="p-1 border-r border-gray-300">{data.history.term1}</td>
                        <td className="p-1 border-r border-gray-300">{data.history.term2}</td>
                        <td className="p-1 font-bold">{data.history.term3}</td>
                      </tr>
                      <tr className="font-mono">
                        <td className="p-1 font-bold border-r border-gray-300 text-left pl-2">RANK</td>
                        <td className="p-1 border-r border-gray-300">-</td>
                        <td className="p-1 border-r border-gray-300">-</td>
                        <td className="p-1">{data.history.rank}</td>
                      </tr>
                   </tbody>
                 </table>
              </div>

              <div className="border border-black bg-white/90 backdrop-blur-sm">
                 <div className="bg-gray-100 p-1 text-center text-[0.65rem] font-bold uppercase border-b border-black">
                   Discipline And Conduct
                 </div>
                 <div className="text-[0.7rem] p-2 space-y-2">
                    <div className="flex justify-between border-b border-gray-200 pb-1">
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

            {/* Middle Column: Annual Average Circle */}
            <div className="col-span-12 md:col-span-4 flex items-center justify-center py-4 md:py-0">
               <div className="flex gap-4">
                 <div className="w-32 h-32 rounded-full border-4 border-black flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm shadow-lg z-10">
                    <span className="text-[0.6rem] text-gray-500 uppercase font-bold">Annual Average</span>
                    <span className="text-4xl font-black">{data.history.annualAvg}</span>
                    <span className="text-[0.6rem] text-green-600 font-bold uppercase">Passed</span>
                 </div>
                 <div className="w-24 h-24 rounded-full border-2 border-black border-dashed flex flex-col items-center justify-center bg-gray-50/90 backdrop-blur-sm z-10">
                    <span className="text-[0.6rem] text-gray-500 uppercase font-bold">Rank</span>
                    <span className="text-2xl font-black">{data.history.rank}</span>
                 </div>
               </div>
            </div>

            {/* Right Column: Class Stats */}
            <div className="col-span-12 md:col-span-4">
              <div className="border border-black h-full bg-white/90 backdrop-blur-sm">
                 <div className="bg-gray-100 p-1 text-center text-[0.65rem] font-bold uppercase border-b border-black">
                   Class Profile And Statistics
                 </div>
                 <table className="w-full text-[0.7rem]">
                   <tbody>
                     <tr className="border-b border-gray-200">
                       <td className="p-1 pl-2 font-bold border-r border-gray-200">SAT</td>
                       <td className="p-1 border-r border-gray-200 text-center">M: 7</td>
                       <td className="p-1 border-r border-gray-200 text-center">F: 0</td>
                       <td className="p-1 text-center font-bold">7</td>
                     </tr>
                     <tr className="border-b border-gray-200">
                       <td className="p-1 pl-2 font-bold border-r border-gray-200">MAX AV</td>
                       <td colSpan={3} className="p-1 pl-2 font-mono">{data.stats.max}</td>
                     </tr>
                     <tr className="border-b border-gray-200">
                       <td className="p-1 pl-2 font-bold border-r border-gray-200">MIN AV</td>
                       <td colSpan={3} className="p-1 pl-2 font-mono">{data.stats.min}</td>
                     </tr>
                     <tr className="border-b border-gray-200">
                       <td className="p-1 pl-2 font-bold border-r border-gray-200">PASSED</td>
                       <td colSpan={3} className="p-1 pl-2 font-mono">{data.stats.passed}</td>
                     </tr>
                     <tr className="border-b border-gray-200">
                       <td className="p-1 pl-2 font-bold border-r border-gray-200">% PASSED</td>
                       <td colSpan={3} className="p-1 pl-2 font-mono">{data.stats.percent}%</td>
                     </tr>
                     <tr>
                       <td className="p-1 pl-2 font-bold border-r border-gray-200 bg-gray-100">CLASS AVG</td>
                       <td colSpan={3} className="p-1 pl-2 font-mono font-bold bg-gray-100">{data.stats.classAvg}</td>
                     </tr>
                   </tbody>
                 </table>
              </div>
            </div>
          </div>

          {/* GCE Section & Signatures */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-auto h-32 relative z-10">
             <div className="border border-black p-3 text-[0.7rem] bg-white/90 backdrop-blur-sm">
                <h4 className="font-bold border-b border-gray-300 mb-2 pb-1">GCE SECTION</h4>
                <div className="space-y-1 font-mono">
                  <div className="flex justify-between"><span>Trade Subjects:</span> <span>02</span></div>
                  <div className="flex justify-between"><span>Related Trade:</span> <span>0.0</span></div>
                  <div className="flex justify-between"><span>Other Subjects:</span> <span>0.0</span></div>
                  <div className="flex justify-between font-bold pt-2 border-t border-gray-300 mt-2">
                    <span>SUBJECTS PASSED:</span> <span>02</span>
                  </div>
                </div>
             </div>
             
             <div className="border border-black p-3 text-[0.7rem] flex flex-col justify-between bg-white/90 backdrop-blur-sm">
               <h4 className="font-bold text-center underline">The Class Master</h4>
               <div className="text-center font-script text-lg opacity-70">Mr. Kome</div>
               <div className="text-xs text-center text-gray-400 mt-2 italic">Signature</div>
             </div>

             <div className="border border-black p-3 text-[0.7rem] flex flex-col justify-between bg-white/90 backdrop-blur-sm">
               <h4 className="font-bold text-center underline">The Principal</h4>
               <div className="text-center font-script text-lg opacity-70">Dr. Pison</div>
               <div className="text-xs text-center text-gray-400 mt-2 italic">Stamp & Signature</div>
             </div>
          </div>
          
          <div className="text-[0.6rem] text-center text-gray-400 mt-2 font-mono uppercase relative z-10">
            This document is computer generated and contains no alterations.
          </div>

        </div>
        
        {/* Bottom Border Decoration */}
        <div className="h-2 w-full bg-black print:block" />
      </div>

    </div>
  );
};

export default PisonReportCard;