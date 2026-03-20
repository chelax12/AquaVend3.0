import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  iconBgColor: string;
  textColor: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  iconBgColor,
  textColor 
}) => {
  return (
    <div className="group bg-white p-4 sm:p-8 rounded-[24px] sm:rounded-[36px] border border-slate-100 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div className="flex flex-col gap-3 sm:gap-6">
        <div className="flex justify-between items-start">
          <div className={`p-2 sm:p-4 rounded-xl ${iconBgColor} bg-opacity-15 flex items-center justify-center transition-transform group-hover:scale-110`}>
            {React.cloneElement(icon as React.ReactElement<any>, { size: 20 })}
          </div>
          {subtitle && (
            <span className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border border-slate-100">
              {subtitle}
            </span>
          )}
        </div>
        <div>
          <p className="text-[9px] sm:text-xs font-black text-slate-400 uppercase tracking-[0.1em] sm:tracking-[0.2em] mb-1">{title}</p>
          <h3 className={`text-xl sm:text-4xl font-black ${textColor} tracking-tight`}>{value}</h3>
        </div>
      </div>
    </div>
  );
};