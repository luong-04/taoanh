"use client";

import React from "react";
import { Lightbulb, ArrowRight, Tag, BookOpen } from "lucide-react";

interface PromptLibraryViewProps {
  onApplyConcept: (theme: string, style: string, slogan: string, audience: string) => void;
}

const DESIGN_DIRECTIONS = [
  {
    title: "Veteran Dad: Raising Freedom",
    theme: "Military Dad/Grandpa",
    style: "Vintage Distressed",
    slogan: "Proud Veteran Dad • Raising Freedom & Defending America",
    audience: "Military Dad",
    keyword: "veteran dad shirts",
    desc: "Chữ lớn, bố cục gọn, nhấn mạnh vai trò làm bố và niềm tự hào phục vụ quân ngũ."
  },
  {
    title: "Veteran Grandpa: Generations of Honor",
    theme: "Military Dad/Grandpa",
    style: "Typography Focus",
    slogan: "Some Heroes Don't Wear Capes • They're Called Grandpa",
    audience: "Military Grandpa",
    keyword: "veteran grandpa shirts",
    desc: "Typography cổ điển, tùy chỉnh năm và tên, tôn vinh người ông cựu chiến binh trong gia đình."
  },
  {
    title: "Lone Star State Defender",
    theme: "Veteran",
    style: "Bold Screen-Print",
    slogan: "Texas Built • Veteran Proud • Don't Mess With Freedom",
    audience: "Texas Patriots",
    keyword: "texas veteran shirt",
    desc: "Kết hợp Lone Star, đầu lâu sừng dài Longhorn, đại bàng đầu trắng và cờ Mỹ sắc nét."
  },
  {
    title: "Retro Tactical Morale Emblem",
    theme: "Army",
    style: "Retro Tactical",
    slogan: "This We'll Defend • Airborne All The Way",
    audience: "Active & Vet Soldiers",
    keyword: "army airborne tee",
    desc: "Phù hiệu tác chiến thập niên 80, viền thêu thô ráp, typography stencil phong cách dã chiến."
  },
  {
    title: "Silent Service Maritime Guardian",
    theme: "Navy",
    style: "Modern Minimalist",
    slogan: "Semper Fortis • Deep Water Vigilance",
    audience: "Naval Sailors & Vets",
    keyword: "navy anchor shirt",
    desc: "Mỏ neo hải quân fouled anchor cách điệu tối giản, la bàn hàng hải và tàu sân bay hiện đại."
  },
  {
    title: "Marine Corps Crucible Grit",
    theme: "Marines",
    style: "Bold Screen-Print",
    slogan: "First To Fight • Crucible Forged Leatherneck",
    audience: "USMC Marines",
    keyword: "marine corps veteran shirt",
    desc: "Huy hiệu EGA (Eagle, Globe & Anchor), gam màu đỏ thắm và vàng kim rực lửa của Thủy quân Lục chiến."
  },
  {
    title: "Backwoods Hunter & Country Patriot",
    theme: "Hunting",
    style: "Vintage Distressed",
    slogan: "Born To Roam • Master of the Wild • Land of the Free",
    audience: "Outdoorsmen & Hunters",
    keyword: "hunting veteran tee",
    desc: "Gạc hươu whitetail, súng trường săn bắt chéo, rừng thông cao nguyên và huy hiệu dã ngoại."
  },
  {
    title: "Thin Blue Line Guardian Shield",
    theme: "Police",
    style: "Retro Tactical",
    slogan: "To Protect and to Serve • Thin Blue Line Defender",
    audience: "Police Officers & Families",
    keyword: "police officer appreciation shirt",
    desc: "Cờ sọc xanh Thin Blue Line, huy hiệu lá chắn cảnh sát và đôi cánh thiên thần hộ mệnh."
  },
  {
    title: "First In Last Out: Brotherhood of Bravery",
    theme: "Firefighter",
    style: "Vintage Distressed",
    slogan: "First In, Last Out • Thin Red Line Courage",
    audience: "Firefighters & Rescuers",
    keyword: "firefighter hero shirt",
    desc: "Thập tự Maltese, rìu cứu hỏa bắt chéo, mũ bảo hộ dã chiến và ngọn lửa rực sáng."
  },
  {
    title: "1776 Constitutional Liberty",
    theme: "Patriotic",
    style: "Typography Focus",
    slogan: "One Nation Under God • 1776 Liberty or Death",
    audience: "All American Patriots",
    keyword: "1776 patriotic shirt",
    desc: "Chuông tự do Liberty Bell, dải ruy băng 13 ngôi sao và nét chữ viết tay cổ thời lập quốc."
  }
];

export const PromptLibraryView: React.FC<PromptLibraryViewProps> = ({ onApplyConcept }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-100 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-400" />
            <span>Proven POD Prompt Library & Design Formats</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            10 high-converting design directions extracted from your Veteran research spreadsheet
          </p>
        </div>

        <span className="px-3 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold">
          10 Master Formulas
        </span>
      </div>

      {/* Grid of Directions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DESIGN_DIRECTIONS.map((dir, idx) => (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 flex flex-col justify-between space-y-3.5 transition-all"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-slate-100">{dir.title}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-amber-400 border border-slate-700">
                  {dir.theme}
                </span>
              </div>
              <p className="text-xs text-amber-300 font-semibold italic">"{dir.slogan}"</p>
              <p className="text-[11px] text-slate-400 leading-relaxed">{dir.desc}</p>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-500 text-[10px]">
                <Tag className="w-3 h-3 text-amber-400" />
                <span className="font-mono">{dir.keyword}</span>
              </div>

              <button
                onClick={() => onApplyConcept(dir.theme, dir.style, dir.slogan, dir.audience)}
                className="px-3.5 py-1.5 rounded-lg font-bold text-xs text-slate-950 bg-amber-500 hover:bg-amber-400 flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20"
              >
                <span>Apply to Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

