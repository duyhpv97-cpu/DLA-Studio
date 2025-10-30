import React, { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { generateFromPosesAndAngles, generateFromOutfit, generateFromStoryboard } from "./services/geminiService";
import ZoomLightbox from "./ZoomLightbox";

/* =============================================================================
   DLA Studio — Elite+ (Locked Branding) · Tabs with Vietnamese Multi‑Selects
   - Replaced 3-column layout with a more focused 2-column (Sidebar + Gallery) layout.
   - Each tab now shows only relevant multi-selects and upload controls.
   - UI Labels and descriptions are now in Vietnamese.
   - Integrated with geminiService for API calls.
============================================================================= */

/* ===================== BRANDING (LOCKED) ===================== */
const brandLogoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><defs><linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:rgb(0,212,255);stop-opacity:1" /><stop offset="100%" style="stop-color:rgb(127,0,255);stop-opacity:1" /></linearGradient></defs><rect width="100" height="100" rx="20" fill="url(#grad1)"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="40" font-weight="bold" fill="black">DLA</text></svg>`;
const BRAND_LOGO_DATA_URL = `data:image/svg+xml;base64,${typeof window !== 'undefined' ? window.btoa(brandLogoSvg) : ''}`;
const BRAND_BG_DATA_URL = ""; // Background image removed to avoid broken links.

// Watermark cố định (UI-only) — đặt ở nền trang (không dán vào ảnh)
const SHOW_UI_WATERMARK = true;
const WM_OPACITY = 0.06;

/* ===================== TOKENS (màu/độ cong/đổ bóng) ===================== */
const T = {
  radius: "rounded-3xl",
  card: "border border-white/10 bg-white/5 backdrop-blur",
  glow: "shadow-[0_20px_120px_-30px_rgba(127,0,255,.35)]",
  btn: "rounded-2xl bg-gradient-to-br from-[#00D4FF] to-[#7F00FF] text-black font-bold shadow-lg shadow-[#7F00FF44] disabled:opacity-50 disabled:cursor-not-allowed",
};

/* ===================== DỮ LIỆU (có mô tả TIẾNG VIỆT) ===================== */
const PORTRAIT_POSES = [
  { id: "P1", label: "Chính diện trung tính", desc: "Mặt chính diện, cảm xúc trung tính." },
  { id: "P2", label: "Nghiêng trái 3/4", desc: "Xoay trái ~30°, nhấn đường nét." },
  { id: "P3", label: "Nghiêng phải 3/4", desc: "Xoay phải ~30°, nhấn đường nét." },
  { id: "P4", label: "Qua vai trái", desc: "Nhìn qua vai trái, phong cách editorial." },
  { id: "P5", label: "Qua vai phải", desc: "Nhìn qua vai phải, mềm mại hơn." },
  { id: "P6", label: "Cằm hạ, mắt nhìn lên", desc: "Tạo cảm giác đáng yêu/ấn tượng." },
  { id: "P7", label: "Tựa cằm", desc: "Một tay tựa cằm, thân thiện, tập trung khuôn mặt." },
  { id: "P8", label: "Nghiêng trái 90°", desc: "Ảnh hồ sơ (profile) bên trái." },
  { id: "P9", label: "Nghiêng phải 90°", desc: "Ảnh hồ sơ (profile) bên phải." },
  { id: "P10", label: "Viền sáng tóc", desc: "Ánh sáng sau đầu tạo viền nổi bật." },
];
const FULLBODY_POSES = [
  { id: "F1", label: "Đứng vững (Power stance)", desc: "Chân bằng vai, tự tin." },
  { id: "F2", label: "Bước nhẹ", desc: "Một bước tiến tự nhiên." },
  { id: "F3", label: "Vắt chéo chân", desc: "Thanh lịch, thời trang." },
  { id: "F4", label: "Contrapposto", desc: "Trọng tâm dồn 1 chân, cơ thể lệch trục." },
  { id: "F5", label: "Đang bước", desc: "Chuyển động thời trang đường phố." },
  { id: "F6", label: "Ngồi thư thái", desc: "Tư thế ngồi tự nhiên, thoải mái." },
  { id: "F7", label: "Ngả sau", desc: "Tựa lưng, cá tính." },
  { id: "F8", label: "Xoay thân 30–45°", desc: "Tạo độ động, nổi khối." },
  { id: "F9", label: "Tay đút túi", desc: "Casual, cool." },
  { id: "F10", label: "Ngoái nhìn", desc: "Quay đầu lại nhìn, gợi chuyện." },
];
const CAMERA_ANGLES = [
  { id: "C1", label: "Tầm mắt – tự nhiên, ngang tầm người xem", desc: "Góc cơ bản, cân bằng; phù hợp hầu hết tình huống chân dung/sản phẩm." },
  { id: "C2", label: "Nhìn xuống (High angle) – thu nhỏ chủ thể", desc: "Máy cao hơn mắt; tạo cảm giác mong manh, dễ thương, hoặc bao quát bối cảnh." },
  { id: "C3", label: "Nhìn lên (Low angle) – tôn dáng/quyền lực", desc: "Máy thấp hơn mắt; kéo dài chân, tăng sự uy nghi và quyền lực." },
  { id: "C4", label: "Ba phần tư trái – tạo khối từ bên trái", desc: "Lệch trái ~30–45°; tả khối khuôn mặt/thân, giảm độ phẳng." },
  { id: "C5", label: "Ba phần tư phải – tạo khối từ bên phải", desc: "Lệch phải ~30–45°; cân đối bố cục trái/phải." },
  { id: "C6", label: "Từ trên xuống (Top-down) – nhìn trực giao", desc: "Máy gần thẳng đứng; phù hợp flatlay, sản phẩm, kiến trúc mini." },
  { id: "C12", label: "Overhead (Flycam) – Từ trên cao toàn cảnh", desc: "Góc nhìn từ flycam hoặc máy đặt rất cao, bao quát không gian; phù hợp ảnh nhóm, kiến trúc, du lịch, hoặc mô phỏng góc nhìn trên không." },
  { id: "C7", label: "Máy nghiêng (Dutch tilt) – kịch tính/chuyển động", desc: "Xoay trục máy 5–20°; thêm năng lượng, phù hợp thời trang hoặc đường phố." },
  { id: "C8", label: "Cận cảnh (Close-up) – tập trung gương mặt/chi tiết", desc: "Khung hẹp; nhấn cảm xúc, texture da, chi tiết sản phẩm." },
  { id: "C9", label: "Trung cảnh (Medium) – nửa người/nửa thân", desc: "Cân bằng chủ thể & bối cảnh; phổ biến trong lifestyle." },
  { id: "C10", label: "Rộng (Wide) – toàn cảnh/cinematic", desc: "Mở rộng bối cảnh; kể chuyện, nhấn không gian, ánh sáng." },
  { id: "C11", label: "Đặc tả (Extreme close-up/Macro) – chi tiết rất nhỏ", desc: "Rất sát vào một phần: mắt, môi, chất vải, logo; tạo ấn tượng thị giác mạnh." },
];
const RATIOS = ["9:16","1:1","16:9","4:5","3:2","21:9"] as const;
const QUALITIES = ["standard","high"] as const;

function mapResolution(aspectRatio: string, quality: "standard"|"high"){
  const table: Record<string, any> = {
    "9:16": { standard:{w:1080,h:1920}, high:{w:2160,h:3840} },
    "1:1":  { standard:{w:1080,h:1080}, high:{w:2048,h:2048} },
    "16:9": { standard:{w:1280,h:720},  high:{w:3840,h:2160} },
    "4:5":  { standard:{w:1080,h:1350}, high:{w:2048,h:2560} },
    "3:2":  { standard:{w:1440,h:960},  high:{w:3000,h:2000} },
    "21:9": { standard:{w:1920,h:820},  high:{w:3840,h:1600} },
  };
  const r = table[aspectRatio] || table["9:16"]; return r[quality];
}

const Tag = ({ children }:{ children:React.ReactNode }) => (
  <span className="px-2 py-1 rounded-full text-[10px] uppercase tracking-wide bg-white/10 border border-white/10">{children}</span>
);
function cx(...cls:(string|false|undefined)[]){ return cls.filter(Boolean).join(' '); }

/* ===================== MULTI‑SELECT (Trình thả) ===================== */
function MultiSelect({ label, options, selected, onChange }:{ label:string; options:{id:string; label:string; desc?:string;}[]; selected:string[]; onChange:(ids:string[])=>void; }){
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const filtered = options.filter(o => (o.id+o.label+(o.desc || '')).toLowerCase().includes(query.toLowerCase()));
  const toggle = (id:string)=> onChange(selected.includes(id)? selected.filter(x=>x!==id) : [...selected, id]);
  return (
    <div className={`${T.card} ${T.radius} p-3`}>
      <div className="text-[10px] uppercase tracking-widest opacity-60 mb-1">{label}</div>
      <button onClick={()=>setOpen(v=>!v)} className="w-full text-left px-3 py-2 bg-white/10 border border-white/10 rounded-xl text-sm flex items-center justify-between">
        <span>{selected.length>0 ? `${selected.length} mục đã chọn` : '— Chưa chọn —'}</span>
        <span className="opacity-60">▾</span>
      </button>
      {open && (
        <div className="mt-2 border border-white/10 rounded-2xl bg-[#0f1220] max-h-64 overflow-auto">
          <div className="p-2 border-b border-white/10 sticky top-0 bg-[#0f1220]">
            <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Tìm..." className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm"/>
          </div>
          <ul className="p-2 space-y-1">
            {filtered.map(opt=> (
              <li key={opt.id}>
                <label className="flex gap-3 items-start px-3 py-2 rounded-xl hover:bg-white/5 cursor-pointer">
                  <input type="checkbox" className="mt-1" checked={selected.includes(opt.id)} onChange={()=>toggle(opt.id)} />
                  <div>
                    <div className="text-sm font-medium">{opt.label}</div>
                    {opt.desc && <div className="text-xs opacity-70">{opt.desc}</div>}
                  </div>
                </label>
              </li>
            ))}
            {filtered.length===0 && <li className="text-xs opacity-60 px-3 py-2">Không có mục phù hợp</li>}
          </ul>
        </div>
      )}
    </div>
  );
}

const CustomPromptInput = ({
  customPrompt,
  setCustomPrompt,
  useCustomOnly,
  setUseCustomOnly,
  showUseCustomOnlyCheckbox = true,
}: {
  customPrompt: string;
  setCustomPrompt: (val: string) => void;
  useCustomOnly?: boolean;
  setUseCustomOnly?: (val: boolean) => void;
  showUseCustomOnlyCheckbox?: boolean;
}) => (
  <div className="pt-2">
    <label className="block text-xs uppercase tracking-wider opacity-70 mb-1">
      Prompt tùy chỉnh (nếu bạn muốn mô tả riêng)
    </label>
    <textarea
      placeholder="Nhập mô tả chi tiết về dáng chụp, góc máy hoặc phong cách bạn mong muốn..."
      value={customPrompt}
      onChange={(e) => setCustomPrompt(e.target.value)}
      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
      rows={3}
    />
    {showUseCustomOnlyCheckbox && setUseCustomOnly && (
      <label className="flex items-center gap-2 text-xs mt-2 text-white/70">
        <input
          type="checkbox"
          checked={useCustomOnly}
          onChange={(e) => setUseCustomOnly(e.target.checked)}
        />
        Chỉ dùng prompt tuỳ chỉnh (bỏ qua lựa chọn mặc định)
      </label>
    )}
  </div>
);


/* ===================== MAIN ===================== */
// FIX: Changed JSX.Element to React.JSX.Element to fix "Cannot find namespace 'JSX'" error.
export default function App(): React.JSX.Element {
  type Tab = "poses" | "angles" | "outfit" | "storyboard";
  const [tab, setTab] = useState<Tab>("poses");
  const [quality, setQuality] = useState<"standard"|"high">("standard");
  const [ratio, setRatio] = useState<(typeof RATIOS)[number]>("9:16");
  const { w, h } = useMemo(()=>mapResolution(ratio, quality),[ratio,quality]);

  const [images, setImages] = useState<Array<{ url:string; meta?:any }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);

  // selections & uploads
  const [pSel, setPSel] = useState<string[]>([]);
  const [fSel, setFSel] = useState<string[]>([]);
  const [aSel, setASel] = useState<string[]>([]);
  const [poseSource, setPoseSource] = useState<File|null>(null);
  const [angleSource, setAngleSource] = useState<File|null>(null);
  const [faceRef, setFaceRef] = useState<File|null>(null);
  const [outfitRef, setOutfitRef] = useState<File|null>(null);
  const [productRef, setProductRef] = useState<File | null>(null);
  const [sbFile, setSbFile] = useState<File|null>(null);
  const [sbFaceRef, setSbFaceRef] = useState<File|null>(null);
  const [sbObjRef, setSbObjRef] = useState<File|null>(null);
  const [autoExtract, setAutoExtract] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [useCustomOnly, setUseCustomOnly] = useState(false);
  
  // Outfit – product interaction states
  const [productAction, setProductAction] = useState<"hold" | "wear" | "carry" | "present" | "point" | "place">("hold");
  const [productHand, setProductHand] = useState<"auto"|"right"|"left"|"both"|"none">("auto");
  const [productPlacement, setProductPlacement] = useState<"auto" | "left" | "right" | "center" | "chest" | "shoulder" | "waist" | "table-front">("auto");
  const [productScale, setProductScale] = useState<number>(100);
  const [productRotation, setProductRotation] = useState<number>(0);
  const [productDistance, setProductDistance] = useState<"close"|"medium"|"far">("close");
  const [productOcclusion, setProductOcclusion] = useState<"auto"|"allow"|"avoid">("auto");


  // lightbox
  const [lbOpen, setLbOpen] = useState(false);
  const [lbIndex, setLbIndex] = useState(0);

  const identityInstruction = "Use the original face/subject of upload file, 100% unchanged.";
  const fileToDataURL = (file: File) => new Promise<string>((resolve,reject)=>{ const r = new FileReader(); r.onload = () => resolve(String(r.result)); r.onerror = reject; r.readAsDataURL(file); });

  async function onGenerate(payload: any) {
    try {
      setError(null); setLoading(true); setImages([]);
      let results: { url: string; meta: any }[] = [];
      switch (payload.task) {
        case 'pose_library_generation':
        case 'angle_library_generation':
          results = await generateFromPosesAndAngles(payload); break;
        case 'outfit_transfer_face_lock':
          results = await generateFromOutfit(payload); break;
        case 'storyboard_generation':
          results = await generateFromStoryboard(payload); break;
        default: throw new Error(`Unknown task: ${payload.task}`);
      }
      setImages(results);
    } catch (e: any) { setError(e.message || String(e)); } finally { setLoading(false); }
  }

  return (
    <div className="relative min-h-screen text-white overflow-hidden bg-slate-950 bg-[radial-gradient(1200px_700px_at_20%_-10%,rgba(127,0,255,.25),transparent),radial-gradient(1200px_700px_at_120%_110%,rgba(0,212,255,.25),transparent)]">
      {/* Brand intro banner */}
      <div className="relative z-20 text-center py-3 border-b border-white/10 bg-gradient-to-r from-[#7F00FF]/30 via-[#00D4FF]/20 to-[#7F00FF]/30 backdrop-blur animate-pulse">
        <p className="text-sm md:text-base font-medium tracking-wide text-white/80">
          Được tạo và bản quyền của <span className="font-semibold text-white">Duy Làm AI</span> — AI Creative
        </p>
        <p className="text-xs text-white/60 mt-0.5">
          Created and copyrighted by <span className="text-white/80">Duy Làm AI Studio</span> — AI Creative
        </p>
      </div>

      {/* Nền brand */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage:BRAND_BG_DATA_URL ? `url(${BRAND_BG_DATA_URL})` : 'none', backgroundSize:'cover', backgroundPosition:'center', filter:'saturate(1.1)' }}/>
        {SHOW_UI_WATERMARK && <div className="absolute inset-0" style={{ backgroundImage:`url(${BRAND_LOGO_DATA_URL})`, backgroundRepeat:'repeat', backgroundSize:'380px auto', opacity: WM_OPACITY, transform:'rotate(-25deg)', transformOrigin:'center' }}/>}
      </div>

      <header className="relative z-10 px-8 pt-8 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 ${T.radius} overflow-hidden border border-white/20 bg-white/10 backdrop-blur ${T.glow} grid place-items-center`}>
              <img src={BRAND_LOGO_DATA_URL} alt="DLA" className="w-full h-full object-cover"/>
            </div>
            <div>
              <div className="text-3xl font-semibold tracking-tight leading-none">DLA Studio</div>
              <div className="text-xs text-white/60 mt-1">Elite Image App · Pose · Angle · Outfit · Storyboard</div>
            </div>
          </div>
          <div className="flex items-center gap-2 border border-white/10 bg-white/5 backdrop-blur p-1 rounded-full">
            {(["poses","angles","outfit","storyboard"] as const).map(t => (
              <button key={t} onClick={()=>setTab(t)} className={cx("capitalize px-4 py-2 rounded-full text-sm transition", tab===t ? "bg-white/15 text-white shadow-[0_0_0_1px_rgba(255,255,255,.12)]" : "hover:bg-white/10 text-white/80")}>{t}</button>
            ))}
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`${T.card} ${T.radius} p-3`}>
            <div className="text-[10px] uppercase tracking-widest opacity-60">Chất lượng xuất</div>
            <select value={quality} onChange={(e)=>setQuality(e.target.value as any)} className="mt-1 w-full bg-transparent border border-white/10 rounded-xl px-3 py-2 text-sm appearance-none">
              {QUALITIES.map(q=> <option className="bg-slate-800" key={q} value={q}>{q}</option>)}
            </select>
          </div>
          <div className={`${T.card} ${T.radius} p-3`}>
            <div className="text-[10px] uppercase tracking-widest opacity-60">Tỉ lệ khung hình</div>
            <select value={ratio} onChange={(e)=>setRatio(e.target.value as any)} className="mt-1 w-full bg-transparent border border-white/10 rounded-xl px-3 py-2 text-sm appearance-none">
              {RATIOS.map(r=> <option className="bg-slate-800" key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className={`${T.card} ${T.radius} p-3 flex items-center gap-2`}>
            <Tag>{ratio}</Tag><Tag>{quality}</Tag><Tag>{w}×{h}</Tag>
          </div>
        </div>
      </header>

      <main className="relative z-10 grid grid-cols-12 gap-6 px-8 pb-10">
        <aside className="col-span-12 lg:col-span-4 space-y-6">
          {tab==="poses" && (
            <section className={`${T.card} ${T.radius} p-4 space-y-4`}>
              <div className="text-lg font-semibold">Chọn dáng chụp (Pose)</div>
              <MultiSelect label="Dáng chụp CHÂN DUNG" options={PORTRAIT_POSES} selected={pSel} onChange={setPSel} />
              <MultiSelect label="Dáng chụp TOÀN THÂN" options={FULLBODY_POSES} selected={fSel} onChange={setFSel} />
              <label className="block text-xs uppercase tracking-wider opacity-70">Ảnh nguồn (tuỳ chọn)
                <input type="file" accept="image/*" onChange={(e)=>setPoseSource(e.target.files?.[0]||null)} className="mt-2 block w-full text-sm file:rounded-xl file:border file:border-white/20 file:bg-white/10 file:px-3 file:py-2"/>
              </label>
              <CustomPromptInput customPrompt={customPrompt} setCustomPrompt={setCustomPrompt} useCustomOnly={useCustomOnly} setUseCustomOnly={setUseCustomOnly} />
              <button disabled={loading} onClick={async () => {
                const getPoseLabel = (id: string) => [...PORTRAIT_POSES, ...FULLBODY_POSES].find(p => p.id === id)?.label || id;
                const payload: any = { task: 'pose_library_generation', selected_poses: [...pSel.map(getPoseLabel), ...fSel.map(getPoseLabel)], aspect_ratio: ratio, identity_instruction: identityInstruction, source_image: poseSource ? await fileToDataURL(poseSource) : undefined };
                if (customPrompt.trim()) {
                  payload.custom_prompt = customPrompt.trim();
                  payload.use_custom_only = useCustomOnly;
                }
                await onGenerate(payload);
              }} className={`w-full py-3 ${T.btn}`}>{loading ? 'Generating...' : 'Generate Poses'}</button>
            </section>
          )}

          {tab==="angles" && (
            <section className={`${T.card} ${T.radius} p-4 space-y-4`}>
              <div className="text-lg font-semibold">Chọn góc máy (Camera Angle)</div>
              <MultiSelect label="Góc máy chụp" options={CAMERA_ANGLES} selected={aSel} onChange={setASel} />
              <label className="block text-xs uppercase tracking-wider opacity-70">Ảnh nguồn (tuỳ chọn)
                <input type="file" accept="image/*" onChange={(e)=>setAngleSource(e.target.files?.[0]||null)} className="mt-2 block w-full text-sm file:rounded-xl file:border file:border-white/20 file:bg-white/10 file:px-3 file:py-2"/>
              </label>
              <CustomPromptInput customPrompt={customPrompt} setCustomPrompt={setCustomPrompt} useCustomOnly={useCustomOnly} setUseCustomOnly={setUseCustomOnly} />
              <button disabled={loading} onClick={async () => {
                const getAngleLabel = (id: string) => CAMERA_ANGLES.find(a => a.id === id)?.label || id;
                const payload: any = { task: 'angle_library_generation', selected_angles: aSel.map(getAngleLabel), aspect_ratio: ratio, identity_instruction: identityInstruction, source_image: angleSource ? await fileToDataURL(angleSource) : undefined };
                if (customPrompt.trim()) {
                  payload.custom_prompt = customPrompt.trim();
                  payload.use_custom_only = useCustomOnly;
                }
                await onGenerate(payload);
              }} className={`w-full py-3 ${T.btn}`}>{loading ? 'Generating...' : 'Generate Angles'}</button>
            </section>
          )}

          {tab==="outfit" && (
            <section className={`${T.card} ${T.radius} p-4 space-y-5`}>
              <div className="text-lg font-semibold">Thay trang phục (Khoá khuôn mặt)</div>
              <p className="text-sm text-white/70">Giữ nguyên khuôn mặt gốc. Có thể <b>áp dụng dáng chụp & góc máy</b> tham chiếu như đã chọn.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block text-xs uppercase tracking-wider opacity-70">Ảnh tham chiếu KHUÔN MẶT (bắt buộc)
                  <input type="file" accept="image/*" onChange={(e) => setFaceRef(e.target.files?.[0] || null)} className="mt-2 block w-full text-sm file:rounded-xl file:border file:border-white/20 file:bg-white/10 file:px-3 file:py-2" />
                </label>
                <label className="block text-xs uppercase tracking-wider opacity-70">Ảnh tham chiếu TRANG PHỤC/ĐỐI TƯỢNG (bắt buộc)
                  <input type="file" accept="image/*" onChange={(e) => setOutfitRef(e.target.files?.[0] || null)} className="mt-2 block w-full text-sm file:rounded-xl file:border file:border-white/20 file:bg-white/10 file:px-3 file:py-2" />
                </label>
              </div>

              {/* Ảnh tham chiếu sản phẩm (tùy chọn) */}
              <label className="block text-xs uppercase tracking-wider opacity-70">
                Ảnh sản phẩm / vật thể (tùy chọn)
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProductRef(e.target.files?.[0] || null)}
                  className="mt-2 block w-full text-sm file:rounded-xl file:border file:border-white/20 file:bg-white/10 file:px-3 file:py-2"
                />
                <p className="text-[11px] text-white/50 mt-1 italic">
                  Tải ảnh sản phẩm bạn muốn nhân vật cầm/đeo/đặt… để AI ghép tương tác chân thực.
                </p>
              </label>

              <div className="flex items-center justify-between bg-white/5 border border-white/10 p-3 rounded-2xl">
                <div className="text-sm">
                  Ảnh trang phục có kèm mẫu?
                  <span className="block opacity-70 text-xs">Tự động tách riêng trang phục để copy.</span>
                </div>
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={autoExtract} onChange={(e) => setAutoExtract(e.target.checked)} /> Bật
                </label>
              </div>

              <div className="space-y-3 pt-2">
                <div className="text-xs uppercase tracking-widest opacity-80 font-semibold">Áp dụng Dáng & Góc (tuỳ chọn)</div>
                <MultiSelect label="Dáng chụp CHÂN DUNG" options={PORTRAIT_POSES} selected={pSel} onChange={setPSel} />
                <MultiSelect label="Dáng chụp TOÀN THÂN" options={FULLBODY_POSES} selected={fSel} onChange={setFSel} />
                <MultiSelect label="Góc máy chụp" options={CAMERA_ANGLES} selected={aSel} onChange={setASel} />
              </div>
              
              <div className="space-y-3 pt-2">
                <div className="text-xs uppercase tracking-widest opacity-80 font-semibold">Nền Studio (tuỳ chọn)</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div className={`${T.card} ${T.radius} p-3`}>
                          <div className="text-[10px] uppercase tracking-widest opacity-60">Chế độ nền</div>
                          <select id="studioBgMode" className="mt-1 w-full bg-transparent border border-white/10 rounded-xl px-3 py-2 text-sm appearance-none">
                              <option className="bg-slate-800" value="keep">Giữ nguyên nền</option>
                              <option className="bg-slate-800" value="solid">Màu đặc (solid)</option>
                              <option className="bg-slate-800" value="transparent">Trong suốt (PNG)</option>
                          </select>
                      </div>
                      <div className={`${T.card} ${T.radius} p-3`}>
                          <div className="text-[10px] uppercase tracking-widest opacity-60">Màu solid</div>
                          <select id="studioBgColor" className="mt-1 w-full bg-transparent border border-white/10 rounded-xl px-3 py-2 text-sm appearance-none">
                              <option className="bg-slate-800" value="#F5F5F5">Trắng mềm</option>
                              <option className="bg-slate-800" value="#FFFFFF">Trắng seamless</option>
                              <option className="bg-slate-800" value="#2F2F2F">Xám 18%</option>
                              <option className="bg-slate-800" value="#111827">Xám than</option>
                              <option className="bg-slate-800" value="#000000">Đen studio</option>
                              <option className="bg-slate-800" value="#00FF00">Chroma Green</option>
                          </select>
                      </div>
                      <div className={`${T.card} ${T.radius} p-3`}>
                          <div className="text-[10px] uppercase tracking-widest opacity-60">Màu tuỳ chỉnh</div>
                          <input id="studioBgHex" type="text" placeholder="#RRGGBB" className="mt-1 w-full bg-transparent border border-white/10 rounded-xl px-3 py-2 text-sm" />
                      </div>
                  </div>
              </div>

              {/* TƯƠNG TÁC VỚI SẢN PHẨM */}
              {productRef && (
                <section className={`${T.card} ${T.radius} p-4 space-y-3`}>
                  <div className="text-lg font-semibold">Tương tác với sản phẩm</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Hành động */}
                    <div>
                      <div className="text-[10px] uppercase tracking-widest opacity-60">Hành động</div>
                      <select value={productAction} onChange={(e)=>setProductAction(e.target.value as any)} className="mt-1 w-full bg-transparent border border-white/10 rounded-xl px-3 py-2 text-sm appearance-none">
                        <option className="bg-slate-800" value="hold">Cầm trên tay</option>
                        <option className="bg-slate-800" value="wear">Đeo/Mang trên người</option>
                        <option className="bg-slate-800" value="carry">Xách/Mang theo</option>
                        <option className="bg-slate-800" value="present">Giới thiệu (đưa ra trước)</option>
                        <option className="bg-slate-800" value="point">Chỉ vào sản phẩm</option>
                        <option className="bg-slate-800" value="place">Đặt trên bàn/trước người</option>
                      </select>
                    </div>
                    {/* Tay/Không tay */}
                    <div>
                      <div className="text-[10px] uppercase tracking-widest opacity-60">Bàn tay</div>
                      <select value={productHand} onChange={(e)=>setProductHand(e.target.value as any)} className="mt-1 w-full bg-transparent border border-white/10 rounded-xl px-3 py-2 text-sm appearance-none">
                        <option className="bg-slate-800" value="auto">Tự động</option>
                        <option className="bg-slate-800" value="right">Tay phải</option>
                        <option className="bg-slate-800" value="left">Tay trái</option>
                        <option className="bg-slate-800" value="both">Hai tay</option>
                        <option className="bg-slate-800" value="none">Không dùng tay</option>
                      </select>
                    </div>
                    {/* Vị trí tương đối */}
                    <div>
                      <div className="text-[10px] uppercase tracking-widest opacity-60">Vị trí tương đối</div>
                      <select value={productPlacement} onChange={(e)=>setProductPlacement(e.target.value as any)} className="mt-1 w-full bg-transparent border border-white/10 rounded-xl px-3 py-2 text-sm appearance-none">
                        <option className="bg-slate-800" value="auto">Tự động</option>
                        <option className="bg-slate-800" value="left">Bên trái người</option>
                        <option className="bg-slate-800" value="right">Bên phải người</option>
                        <option className="bg-slate-800" value="center">Chính giữa trước người</option>
                        <option className="bg-slate-800" value="chest">Trước ngực</option>
                        <option className="bg-slate-800" value="shoulder">Trên vai</option>
                        <option className="bg-slate-800" value="waist">Vị trí eo</option>
                        <option className="bg-slate-800" value="table-front">Đặt trên bàn phía trước</option>
                      </select>
                    </div>
                    {/* Khoảng cách – Quy mô – Xoay */}
                    <div className="grid grid-cols-3 gap-2 items-end">
                      <div>
                        <div className="text-[10px] uppercase tracking-widest opacity-60">Khoảng cách</div>
                        <select value={productDistance} onChange={(e)=>setProductDistance(e.target.value as any)} className="mt-1 w-full bg-transparent border border-white/10 rounded-xl px-3 py-2 text-sm appearance-none">
                          <option className="bg-slate-800" value="close">Gần</option>
                          <option className="bg-slate-800" value="medium">Vừa</option>
                          <option className="bg-slate-800" value="far">Xa</option>
                        </select>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-widest opacity-60">Tỉ lệ (%)</div>
                        <input type="number" min={30} max={200} step={5} value={productScale} onChange={(e)=>setProductScale(Number(e.target.value))} className="mt-1 w-full bg-transparent border border-white/10 rounded-xl px-2 py-2 text-sm"/>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-widest opacity-60">Xoay (°)</div>
                        <input type="number" min={-180} max={180} step={5} value={productRotation} onChange={(e)=>setProductRotation(Number(e.target.value))} className="mt-1 w-full bg-transparent border border-white/10 rounded-xl px-2 py-2 text-sm"/>
                      </div>
                    </div>
                    {/* Che khuất (occlusion) */}
                    <div>
                      <div className="text-[10px] uppercase tracking-widest opacity-60">Che khuất tay/cơ thể</div>
                      <select value={productOcclusion} onChange={(e)=>setProductOcclusion(e.target.value as any)} className="mt-1 w-full bg-transparent border border-white/10 rounded-xl px-3 py-2 text-sm appearance-none">
                        <option className="bg-slate-800" value="auto">Tự động (khuyến nghị)</option>
                        <option className="bg-slate-800" value="allow">Cho phép che khuất tự nhiên</option>
                        <option className="bg-slate-800" value="avoid">Hạn chế che khuất</option>
                      </select>
                    </div>
                  </div>
                  <p className="text-[11px] text-white/50">
                    Gợi ý: Nếu chọn “Đeo/Mang” cho mũ, kính, balo,… hãy dùng <em>Vị trí tương đối</em> phù hợp (vai/ngực/eo), và điều chỉnh <em>Tỉ lệ</em> + <em>Xoay</em> để khớp dáng/độ nghiêng.
                  </p>
                </section>
              )}


              <CustomPromptInput customPrompt={customPrompt} setCustomPrompt={setCustomPrompt} useCustomOnly={useCustomOnly} setUseCustomOnly={setUseCustomOnly} />
              
              <button disabled={loading || !faceRef || !outfitRef} onClick={async () => {
                  if (!faceRef || !outfitRef) { setError('Cần đủ 2 ảnh: Khuôn mặt & Trang phục/Đối tượng'); return; }

                  const bgMode = (document.getElementById('studioBgMode') as HTMLSelectElement)?.value || 'keep';
                  const bgColorPick = (document.getElementById('studioBgColor') as HTMLSelectElement)?.value || '#FFFFFF';
                  const bgCustom = (document.getElementById('studioBgHex') as HTMLInputElement)?.value?.trim();
                  const studioBackground = bgMode === 'solid' ? (bgCustom || bgColorPick) : undefined;

                  const getPoseLabel = (id: string) => [...PORTRAIT_POSES, ...FULLBODY_POSES].find(p => p.id === id)?.label || id;
                  const getAngleLabel = (id: string) => CAMERA_ANGLES.find(a => a.id === id)?.label || id;

                  const payload: any = { 
                      task: 'outfit_transfer_face_lock', 
                      aspect_ratio: ratio, 
                      selected_poses: [...pSel.map(getPoseLabel), ...fSel.map(getPoseLabel)], 
                      selected_angles: aSel.map(getAngleLabel), 
                      identity_instruction: identityInstruction, 
                      face_reference: await fileToDataURL(faceRef), 
                      outfit_reference: await fileToDataURL(outfitRef),
                      background_mode: bgMode,
                      studio_background: studioBackground,
                      outfit_extraction: autoExtract ? 'auto' : 'none'
                  };

                  if (productRef) {
                    payload.product_reference = await fileToDataURL(productRef);
                    payload.product_interaction = {
                      action: productAction,
                      hand: productHand,
                      placement: productPlacement,
                      distance: productDistance,
                      scale_percent: productScale,
                      rotation_deg: productRotation,
                      occlusion: productOcclusion,
                    };
                  }

                  if (customPrompt.trim()) {
                    payload.custom_prompt = customPrompt.trim();
                    payload.use_custom_only = useCustomOnly;
                  }

                  await onGenerate(payload);
              }} className={`w-full py-3 ${T.btn}`}>
                {loading ? 'Generating...' : 'Generate Outfit'}
              </button>
            </section>
          )}

          {tab==="storyboard" && (
            <section className={`${T.card} ${T.radius} p-4 space-y-4`}>
              <div className="text-lg font-semibold">Storyboard từ file</div>
              <label className="block text-xs uppercase tracking-wider opacity-70">File storyboard (JSON/CSV/TXT)
                <input type="file" accept=".json,.csv,.txt" onChange={(e)=>setSbFile(e.target.files?.[0]||null)} className="mt-2 block w-full text-sm file:rounded-xl file:border file:border-white/20 file:bg-white/10 file:px-3 file:py-2"/>
              </label>
              <label className="block text-xs uppercase tracking-wider opacity-70">Ảnh tham chiếu KHUÔN MẶT (tuỳ chọn)
                <input type="file" accept="image/*" onChange={(e)=>setSbFaceRef(e.target.files?.[0]||null)} className="mt-2 block w-full text-sm file:rounded-xl file:border file:border-white/20 file:bg-white/10 file:px-3 file:py-2"/>
              </label>
              <label className="block text-xs uppercase tracking-wider opacity-70">Ảnh tham chiếu TRANG PHỤC/ĐỐI TƯỢNG (tuỳ chọn)
                <input type="file" accept="image/*" onChange={(e)=>setSbObjRef(e.target.files?.[0]||null)} className="mt-2 block w-full text-sm file:rounded-xl file:border-white/20 file:bg-white/10 file:px-3 file:py-2"/>
              </label>
               <CustomPromptInput customPrompt={customPrompt} setCustomPrompt={setCustomPrompt} showUseCustomOnlyCheckbox={false} />
              <button disabled={loading} onClick={async () => {
                if (!sbFile) { setError('Hãy chọn file storyboard'); return; }
                const fileContent = await sbFile.text();
                const payload: any = { task: 'storyboard_generation', storyboard_file: { name: sbFile.name, content: fileContent }, aspect_ratio: ratio, identity_instruction: identityInstruction, face_reference: sbFaceRef ? await fileToDataURL(sbFaceRef) : undefined, outfit_reference: sbObjRef ? await fileToDataURL(sbObjRef) : undefined };
                if (customPrompt.trim()) {
                  payload.custom_prompt = customPrompt.trim();
                }
                await onGenerate(payload);
              }} className={`w-full py-3 ${T.btn}`}>{loading ? 'Generating...' : 'Generate Storyboard'}</button>
            </section>
          )}
          {error && <div className="bg-red-600/20 text-red-100 border border-red-400/30 px-4 py-2 rounded-xl text-sm">{error}</div>}
        </aside>

        <section className="col-span-12 lg:col-span-8">
          <div className={`${T.card} ${T.radius} p-4`}>
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold">Kết quả</div>
              <div className="flex gap-2 text-xs items-center"><Tag>{loading ? '...' : images.length}</Tag></div>
            </div>
            {loading && (
              <div className="grid place-items-center h-48 rounded-2xl bg-white/5">
                <motion.div animate={{ rotate:360 }} transition={{ repeat:Infinity, duration:1 }} className="w-12 h-12 border-4 border-t-transparent rounded-full border-white/60"/>
              </div>
            )}
            {!loading && images.length===0 && (
              <div className="p-10 text-center border-2 border-dashed border-white/10 rounded-2xl text-sm text-white/70">Chưa có kết quả</div>
            )}
            {!loading && images.length>0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-h-[62vh] overflow-auto pr-1">
                {images.map((img,i)=>(
                  <div key={i} className="relative group overflow-hidden rounded-2xl border border-white/10">
                    <img src={img.url} alt={img.meta?.label || `Result ${i+1}`} className="w-full h-56 object-cover transition-transform group-hover:scale-[1.02] cursor-zoom-in" onClick={()=>{ setLbIndex(i); setLbOpen(true); }} />
                    <div className="absolute top-2 left-2 z-20 flex items-center gap-2">
                      <img src={BRAND_LOGO_DATA_URL} alt="DLA" className="w-7 h-7 rounded-md border border-white/30 shadow"/>
                      <span className="px-2 py-0.5 rounded-md bg-black/30 border border-white/10 text-[10px] tracking-wide">DLA</span>
                    </div>
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px] opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="px-2 py-1 rounded-full bg-black/50 backdrop-blur border border-white/10 truncate pr-3">{img?.meta?.label||`Variant ${i+1}`}</div>
                      <div className="flex gap-2">
                        <a href={img.url} download={`DLA_Result_${i + 1}.png`} className="px-2 py-1 rounded-full bg-black/50 backdrop-blur border border-white/10">↓</a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="relative z-10 px-8 py-6 text-xs text-white/60 flex items-center justify-between">
        <div>© {new Date().getFullYear()} DLA Studio · Elite+ (VN labels)</div>
        <div className="flex gap-2"><Tag>Locked Branding</Tag><Tag>Multi‑Select VN</Tag><Tag>Zoom Preview</Tag></div>
      </footer>
      <ZoomLightbox items={images} index={lbIndex} open={lbOpen} onClose={()=>setLbOpen(false)} onIndexChange={setLbIndex} />
    </div>
  );
}