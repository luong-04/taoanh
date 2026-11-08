"use client";

import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { 
  fetchStates, 
  suggestSlogans, 
  fetchCreativeConcepts,
  buildPromptPreview, 
  generateArtworkApi,
  generateMockupApi,
  adjustMockupPlacementApi,
  fetchHistory 
} from "@/lib/api";
import { USState, Artwork, Mockup, CreativeConcept } from "@/lib/types";
import { Sidebar, StudioTab } from "@/components/Sidebar";
import { SettingsModal } from "@/components/SettingsModal";
import { ArtworkConfigPanel } from "@/components/artwork/ArtworkConfigPanel";
import { PromptInspector } from "@/components/artwork/PromptInspector";
import { CanvasPreview } from "@/components/artwork/CanvasPreview";
import { ArtworkExtractorModal } from "@/components/artwork/ArtworkExtractorModal";
import { DpiModal } from "@/components/dpi/DpiModal";
import { MockupConfigPanel } from "@/components/mockup/MockupConfigPanel";
import { MockupCanvasPreview } from "@/components/mockup/MockupCanvasPreview";
import { Gauge } from "lucide-react";

// Views
import { DashboardView } from "@/components/views/DashboardView";
import { StateDatabaseView } from "@/components/views/StateDatabaseView";
import { PromptLibraryView } from "@/components/views/PromptLibraryView";
import { MyDesignsView } from "@/components/views/MyDesignsView";
import { MyMockupsView } from "@/components/views/MyMockupsView";

export default function StudioApp() {
  // Navigation & Layout
  const [activeTab, setActiveTab] = useState<StudioTab>("dashboard");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // States & Intelligence
  const [states, setStates] = useState<USState[]>([]);
  const [selectedStateCode, setSelectedStateCode] = useState<string>("TX"); // Default Texas
  const [selectedState, setSelectedState] = useState<USState | undefined>(undefined);

  // Module 1: Create Design
  const [theme, setTheme] = useState<string>("Veteran");
  const [niche, setNiche] = useState<string>("Vietnam Veteran");
  const [audience, setAudience] = useState<string>("All Veterans");
  const [designLayout, setDesignLayout] = useState<string>("open_silhouette");
  const [designStyle, setDesignStyle] = useState<string>("Vintage Distressed");
  const [productType, setProductType] = useState<string>("T-shirt");
  const [slogan, setSlogan] = useState<string>("TEXAS BUILT · VETERAN PROUD");
  const [slogansList, setSlogansList] = useState<string[]>([]);
  const [isLoadingSlogans, setIsLoadingSlogans] = useState<boolean>(false);
  const [productColor, setProductColor] = useState<string>("Black");
  const [batchSize, setBatchSize] = useState<number>(1);
  const [workingMode, setWorkingMode] = useState<"guided" | "manual">("guided");
  const [provider, setProvider] = useState<string>("shopapi");

  // Concepts & Prompt
  const [concepts, setConcepts] = useState<CreativeConcept[]>([]);
  const [selectedConceptId, setSelectedConceptId] = useState<string>("");
  const [isLoadingConcepts, setIsLoadingConcepts] = useState<boolean>(false);
  const [prompt, setPrompt] = useState<string>("");
  const [negativePrompt, setNegativePrompt] = useState<string>("");
  const [isGeneratingArtwork, setIsGeneratingArtwork] = useState<boolean>(false);
  const [currentArtwork, setCurrentArtwork] = useState<Artwork | null>(null);

  // Module 2: Mockup Studio
  const [artworksHistory, setArtworksHistory] = useState<Artwork[]>([]);
  const [mockupsHistory, setMockupsHistory] = useState<Mockup[]>([]);
  const [selectedArtworkId, setSelectedArtworkId] = useState<string>("");
  const [mockupGarmentColor, setMockupGarmentColor] = useState<string>("Black");
  const [mockupType, setMockupType] = useState<"lifestyle" | "flatlay" | "custom_mockup">("lifestyle");
  const [lifestyleScene, setLifestyleScene] = useState<string>("outdoor_lifestyle");
  const [productStyle, setProductStyle] = useState<string>("flatlay_wood");
  const [printPlacement, setPrintPlacement] = useState<string>("center_chest");
  const [modelGender, setModelGender] = useState<string>("Random");
  const [modelAge, setModelAge] = useState<string>("Random");
  const [modelBodyType, setModelBodyType] = useState<string>("Athletic");
  const [modelEthnicity, setModelEthnicity] = useState<string>("Random");
  const [cameraStyle, setCameraStyle] = useState<string>("Lifestyle");
  const [pose, setPose] = useState<string>("Standing");
  const [aspectRatio, setAspectRatio] = useState<string>("3:4");
  const [customGarmentUrl, setCustomGarmentUrl] = useState<string | null>(null);
  const [uploadedMockupUrl, setUploadedMockupUrl] = useState<string | null>(null);
  const [customMockupPrompt, setCustomMockupPrompt] = useState<string>("");
  const [isExtractorModalOpen, setIsExtractorModalOpen] = useState<boolean>(false);
  const [isDpiModalOpen, setIsDpiModalOpen] = useState<boolean>(false);
  const [dpiTargetArtwork, setDpiTargetArtwork] = useState<Artwork | null>(null);
  const [mockupProvider, setMockupProvider] = useState<string>("shopapi");
  const [isGeneratingMockup, setIsGeneratingMockup] = useState<boolean>(false);
  const [currentMockup, setCurrentMockup] = useState<Mockup | null>(null);

  // Freeform placement & blending controls
  const [customXPct, setCustomXPct] = useState<number>(0.50);
  const [customYPct, setCustomYPct] = useState<number>(0.58);
  const [customScale, setCustomScale] = useState<number>(0.25);
  const [customRotation, setCustomRotation] = useState<number>(0);
  const [blendMode, setBlendMode] = useState<string>("natural_dtg");
  const [opacity, setOpacity] = useState<number>(0.96);
  const [isAdjustingPlacement, setIsAdjustingPlacement] = useState<boolean>(false);

  // Sync placement controls when active mockup changes
  useEffect(() => {
    if (currentMockup?.metadata) {
      const meta = currentMockup.metadata;
      if (meta.custom_x_pct !== undefined) setCustomXPct(meta.custom_x_pct);
      if (meta.custom_y_pct !== undefined) setCustomYPct(meta.custom_y_pct);
      if (meta.custom_scale !== undefined) setCustomScale(meta.custom_scale);
      if (meta.custom_rotation !== undefined) setCustomRotation(meta.custom_rotation);
      if (meta.blend_mode) setBlendMode(meta.blend_mode);
      if (meta.opacity !== undefined) setOpacity(meta.opacity);
      if (meta.print_placement) setPrintPlacement(meta.print_placement);
    }
  }, [currentMockup?.id]);

  // Load States & Studio History on startup
  const loadStudioData = async () => {
    try {
      const loadedStates = await fetchStates();
      setStates(loadedStates);

      const target = loadedStates.find((s) => s.code === selectedStateCode) || loadedStates[0];
      if (target) {
        setSelectedState(target);
        setSelectedStateCode(target.code);
      }

      const hist = await fetchHistory();
      setArtworksHistory(hist.artworks);
      setMockupsHistory(hist.mockups);

      if (hist.artworks.length > 0 && !currentArtwork) {
        setCurrentArtwork(hist.artworks[0]);
        setSelectedArtworkId(hist.artworks[0].id);
      }
      if (hist.mockups.length > 0 && !currentMockup) {
        setCurrentMockup(hist.mockups[0]);
      }
    } catch (e) {
      console.error("Studio initialization error:", e);
    }
  };

  useEffect(() => {
    loadStudioData();
  }, []);

  // Update selected state object
  useEffect(() => {
    if (states.length > 0) {
      const found = states.find((s) => s.code === selectedStateCode);
      if (found) setSelectedState(found);
    }
  }, [selectedStateCode, states]);

  // Load AI Concepts & Slogans
  useEffect(() => {
    let isCancelled = false;
    async function loadConceptsAndSlogans() {
      if (!selectedStateCode) return;
      setIsLoadingSlogans(true);
      setIsLoadingConcepts(true);
      try {
        const [loadedConcepts, loadedSlogans] = await Promise.all([
          fetchCreativeConcepts(selectedStateCode, theme, audience, designLayout, 0, niche),
          suggestSlogans(selectedStateCode, theme, audience, 0, niche)
        ]);
        if (!isCancelled) {
          setConcepts(loadedConcepts);
          setSlogansList(loadedSlogans);
          if (loadedSlogans.length > 0) {
            setSlogan(loadedSlogans[0]);
            setSelectedConceptId(loadedConcepts.length > 0 ? loadedConcepts[0].id : "");
          }
        }
      } catch (e) {
        console.error("Error loading concepts:", e);
      } finally {
        if (!isCancelled) {
          setIsLoadingSlogans(false);
          setIsLoadingConcepts(false);
        }
      }
    }
    loadConceptsAndSlogans();
    return () => { isCancelled = true; };
  }, [selectedStateCode, theme, niche, audience, designLayout]);

  // Handle Dynamic Concept Refresh (strictly grounded in state data)
  const handleRefreshConcepts = async () => {
    setIsLoadingConcepts(true);
    try {
      const seed = Math.floor(Math.random() * 100000) + 1;
      const loaded = await fetchCreativeConcepts(selectedStateCode, theme, audience, designLayout, seed, niche);
      if (loaded && loaded.length > 0) {
        setConcepts(loaded);
        setSelectedConceptId(loaded[0].id);
        setSlogan(loaded[0].slogan);
      }
    } catch (e) {
      console.error("Failed to refresh concepts:", e);
    } finally {
      setIsLoadingConcepts(false);
    }
  };

  // Debounced real-time prompt update (eliminates input lag & server flooding)
  useEffect(() => {
    let isCancelled = false;
    const timer = setTimeout(async () => {
      try {
        const preview = await buildPromptPreview({
          state_code: selectedStateCode,
          theme,
          niche,
          design_style: designStyle,
          design_layout: designLayout,
          slogan: slogan || "Land of the Free",
          product_color: productColor,
          audience,
          product_type: productType
        });
        if (!isCancelled) {
          setPrompt(preview.prompt);
          setNegativePrompt(preview.negative_prompt);
        }
      } catch (e) {
        console.error("Error building prompt:", e);
      }
    }, 200);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [selectedStateCode, theme, niche, designStyle, designLayout, slogan, productColor, audience, productType]);

  // Handle Dynamic Slogan Refresh with random rotation
  const handleRefreshSlogans = async () => {
    setIsLoadingSlogans(true);
    try {
      const seed = Math.floor(Math.random() * 100000) + 1;
      const loaded = await suggestSlogans(selectedStateCode, theme, audience, seed, niche);
      if (loaded && loaded.length > 0) {
        setSlogansList(loaded);
        setSlogan(loaded[0]);
        setSelectedConceptId("");
      }
    } catch (e) {
      console.error("Failed to refresh slogans:", e);
    } finally {
      setIsLoadingSlogans(false);
    }
  };

  // Select a creative concept from AI suggestions
  const handleSelectConcept = (concept: CreativeConcept) => {
    setSelectedConceptId(concept.id);
    setSlogan(concept.slogan);
  };

  // Generate Artwork (Module 1)
  const handleGenerateArtwork = async () => {
    setIsGeneratingArtwork(true);
    try {
      const result = await generateArtworkApi({
        state_code: selectedStateCode,
        theme,
        niche,
        design_style: designStyle,
        design_layout: designLayout,
        slogan: slogan || "Land of the Free",
        product_color: productColor,
        audience,
        product_type: productType,
        provider,
        custom_prompt: prompt,
        custom_negative_prompt: negativePrompt,
        batch_size: batchSize
      });

      setCurrentArtwork(result.artwork);
      setSelectedArtworkId(result.artwork.id);
      setArtworksHistory((prev) => [...result.batch, ...prev]);

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#f59e0b", "#10b981", "#3b82f6"]
      });
    } catch (e: any) {
      alert("Artwork generation failed: " + (e.message || "Unknown error"));
    } finally {
      setIsGeneratingArtwork(false);
    }
  };

  const handleArtworkExtracted = (newArtwork: Artwork, autoNavigateToMockup: boolean = false) => {
    setArtworksHistory((prev) => [newArtwork, ...prev]);
    setCurrentArtwork(newArtwork);
    setSelectedArtworkId(newArtwork.id);
    if (autoNavigateToMockup) {
      setActiveTab("mockup");
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    }
  };

  // Generate Mockup (Module 2)
  const handleGenerateMockup = async () => {
    if (!selectedArtworkId) {
      alert("Please select or generate an artwork first!");
      return;
    }
    setIsGeneratingMockup(true);
    try {
      const result = await generateMockupApi({
        artwork_id: selectedArtworkId,
        target_state: selectedStateCode,
        garment_color: mockupGarmentColor,
        mockup_type: mockupType,
        lifestyle_scene: lifestyleScene,
        product_style: productStyle,
        print_placement: printPlacement,
        model_gender: modelGender,
        model_age: modelAge,
        model_body_type: modelBodyType,
        model_ethnicity: modelEthnicity,
        camera_style: cameraStyle,
        pose,
        aspect_ratio: aspectRatio,
        custom_garment_url: customGarmentUrl || undefined,
        uploaded_mockup_url: uploadedMockupUrl || undefined,
        custom_mockup_prompt: customMockupPrompt || undefined,
        provider: mockupProvider,
        custom_x_pct: customXPct,
        custom_y_pct: customYPct,
        custom_scale: customScale,
        custom_rotation: customRotation,
        blend_mode: blendMode,
        opacity: opacity
      });

      setCurrentMockup(result);
      setMockupsHistory((prev) => [result, ...prev]);

      confetti({
        particleCount: 65,
        spread: 50,
        origin: { y: 0.7 },
        colors: ["#f59e0b", "#10b981"]
      });
    } catch (e: any) {
      alert("Mockup generation failed: " + (e.message || "Unknown error"));
    } finally {
      setIsGeneratingMockup(false);
    }
  };

  // Instant Re-Composite for Fine-Tuned Placement
  const handleAdjustPlacement = async () => {
    if (!currentMockup) {
      alert("Chưa có ảnh mockup nào để điều chỉnh vị trí.");
      return;
    }
    setIsAdjustingPlacement(true);
    try {
      const updated = await adjustMockupPlacementApi({
        mockup_id: currentMockup.id,
        artwork_id: selectedArtworkId || currentMockup.artwork_id,
        x_pct: customXPct,
        y_pct: customYPct,
        scale: customScale,
        rotation: customRotation,
        blend_mode: blendMode,
        opacity: opacity
      });
      setCurrentMockup(updated);
      setMockupsHistory((prev) => prev.map((m) => m.id === updated.id ? updated : m));
      confetti({
        particleCount: 40,
        spread: 40,
        origin: { y: 0.8 },
        colors: ["#10b981", "#3b82f6"]
      });
    } catch (e: any) {
      alert("Điều chỉnh vị trí thất bại: " + (e.message || "Unknown error"));
    } finally {
      setIsAdjustingPlacement(false);
    }
  };

  // Transition from Artwork to Mockup Studio
  const handleSendToMockup = (art: Artwork) => {
    setSelectedArtworkId(art.id);
    setMockupGarmentColor(art.product_color || "Black");
    setActiveTab("mockup");
  };

  // Open DPI Inspector & 300 DPI Upscaler
  const handleOpenDpiModal = (art?: Artwork) => {
    setDpiTargetArtwork(art || currentArtwork || null);
    setIsDpiModalOpen(true);
  };

  // Apply Prompt Library direction
  const handleApplyLibraryConcept = (th: string, st: string, sl: string, aud: string) => {
    setTheme(th);
    setDesignStyle(st);
    setSlogan(sl);
    setAudience(aud);
    setActiveTab("artwork");
  };

  const activeArtworkForMockup = artworksHistory.find((a) => a.id === selectedArtworkId) || currentArtwork || undefined;

  return (
    <div className="flex h-screen bg-[#060a12] text-slate-100 overflow-hidden font-sans">
      {/* SaaS Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === "settings") {
            setIsSettingsOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        designsCount={artworksHistory.length}
        mockupsCount={mockupsHistory.length}
        selectedStateCode={selectedStateCode}
      />

      {/* Main Studio Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="px-6 py-3 border-b border-slate-800 bg-[#090d16]/90 backdrop-blur sticky top-0 z-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Module:
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-500/10 text-amber-400 border border-amber-500/20 capitalize">
              {activeTab.replace("_", " ")}
            </span>
            <span className="hidden sm:inline text-xs text-slate-500">&bull;</span>
            <span className="hidden sm:inline text-xs text-slate-400">
              State: <strong className="text-slate-200">{selectedState?.name} ({selectedStateCode})</strong>
            </span>
          </div>

          <div className="flex items-center gap-2.5 text-xs">
            <button
              onClick={() => handleOpenDpiModal()}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/15 via-amber-600/15 to-amber-500/15 border border-amber-500/40 hover:border-amber-400 text-amber-300 font-bold flex items-center gap-1.5 transition-all shadow-sm"
              title="Xác định DPI & Nâng cấp chất lượng lên 300 DPI chuẩn in POD DTG"
            >
              <Gauge className="w-3.5 h-3.5 text-amber-400" />
              <span>Đo &amp; Nâng Cấp 300 DPI</span>
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-300 font-semibold transition-colors"
            >
              Settings & BYOK Keys
            </button>
          </div>
        </header>

        {/* Dynamic Content Views */}
        <main className="p-4 lg:p-6 flex-1">
          {/* DASHBOARD VIEW */}
          {activeTab === "dashboard" && (
            <DashboardView
              onNavigate={setActiveTab}
              selectedState={selectedState}
              artworks={artworksHistory}
              mockups={mockupsHistory}
              onSelectArtwork={(art) => {
                setCurrentArtwork(art);
                setSelectedArtworkId(art.id);
              }}
              onOpenSettings={() => setIsSettingsOpen(true)}
            />
          )}

          {/* MODULE 1: CREATE DESIGN (3-COLUMN STUDIO LAYOUT) */}
          {activeTab === "artwork" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Col 1: Config Form (3.5 cols) */}
              <div className="lg:col-span-4 xl:col-span-3.5">
                <div className="bg-[#0b101c] border border-slate-800 rounded-2xl p-4 shadow-xl">
                  <ArtworkConfigPanel
                    states={states}
                    selectedStateCode={selectedStateCode}
                    onSelectState={setSelectedStateCode}
                    selectedState={selectedState}
                    theme={theme}
                    setTheme={setTheme}
                    niche={niche}
                    setNiche={setNiche}
                    audience={audience}
                    setAudience={setAudience}
                    designLayout={designLayout}
                    setDesignLayout={setDesignLayout}
                    designStyle={designStyle}
                    setDesignStyle={setDesignStyle}
                    productType={productType}
                    setProductType={setProductType}
                    slogan={slogan}
                    setSlogan={(newSlogan) => {
                      setSlogan(newSlogan);
                      setSelectedConceptId("");
                    }}
                    slogansList={slogansList}
                    isLoadingSlogans={isLoadingSlogans}
                    onRefreshSlogans={handleRefreshSlogans}
                    productColor={productColor}
                    setProductColor={setProductColor}
                    batchSize={batchSize}
                    setBatchSize={setBatchSize}
                    workingMode={workingMode}
                    setWorkingMode={setWorkingMode}
                    provider={provider}
                    setProvider={setProvider}
                    onOpenSettings={() => setIsSettingsOpen(true)}
                    onOpenExtractorModal={() => setIsExtractorModalOpen(true)}
                  />
                </div>
              </div>

              {/* Col 2: AI State-Aware Concepts & Prompt Inspector (4.5 cols) */}
              <div className="lg:col-span-4 xl:col-span-4.5">
                <div className="bg-[#0b101c] border border-slate-800 rounded-2xl p-4 shadow-xl min-h-[640px] flex flex-col">
                  <PromptInspector
                    prompt={prompt}
                    setPrompt={setPrompt}
                    negativePrompt={negativePrompt}
                    setNegativePrompt={setNegativePrompt}
                    isGenerating={isGeneratingArtwork}
                    onGenerate={handleGenerateArtwork}
                    onResetPrompt={() => {
                      if (concepts.length > 0) handleSelectConcept(concepts[0]);
                    }}
                    state={selectedState}
                    designStyle={designStyle}
                    concepts={concepts}
                    onSelectConcept={handleSelectConcept}
                    selectedConceptId={selectedConceptId}
                    workingMode={workingMode}
                    batchSize={batchSize}
                    onRefreshConcepts={handleRefreshConcepts}
                    isLoadingConcepts={isLoadingConcepts}
                  />
                </div>
              </div>

              {/* Col 3: Live Output Canvas & DTG Master Download (4 cols) */}
              <div className="lg:col-span-4 xl:col-span-4">
                <div className="bg-[#0b101c] border border-slate-800 rounded-2xl p-4 shadow-xl min-h-[640px] flex flex-col">
                  <CanvasPreview
                    artwork={currentArtwork}
                    onSendToMockup={handleSendToMockup}
                    isGenerating={isGeneratingArtwork}
                    onOpenDpiModal={() => handleOpenDpiModal(currentArtwork || undefined)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* MODULE 2: MOCKUP STUDIO (FASHN.AI STYLE REALISTIC MOCKUP GENERATOR) */}
          {activeTab === "mockup" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-4">
                <div className="bg-[#0b101c] border border-slate-800 rounded-2xl p-4 shadow-xl">
                  <MockupConfigPanel
                    artworks={artworksHistory}
                    selectedArtworkId={selectedArtworkId}
                    onSelectArtworkId={setSelectedArtworkId}
                    states={states}
                    targetStateCode={selectedStateCode}
                    setTargetStateCode={setSelectedStateCode}
                    garmentColor={mockupGarmentColor}
                    setGarmentColor={setMockupGarmentColor}
                    mockupType={mockupType}
                    setMockupType={setMockupType}
                    lifestyleScene={lifestyleScene}
                    setLifestyleScene={setLifestyleScene}
                    productStyle={productStyle}
                    setProductStyle={setProductStyle}
                    printPlacement={printPlacement}
                    setPrintPlacement={setPrintPlacement}
                    modelGender={modelGender}
                    setModelGender={setModelGender}
                    modelAge={modelAge}
                    setModelAge={setModelAge}
                    modelBodyType={modelBodyType}
                    setModelBodyType={setModelBodyType}
                    modelEthnicity={modelEthnicity}
                    setModelEthnicity={setModelEthnicity}
                    cameraStyle={cameraStyle}
                    setCameraStyle={setCameraStyle}
                    pose={pose}
                    setPose={setPose}
                    aspectRatio={aspectRatio}
                    setAspectRatio={setAspectRatio}
                    customGarmentUrl={customGarmentUrl}
                    setCustomGarmentUrl={setCustomGarmentUrl}
                    uploadedMockupUrl={uploadedMockupUrl}
                    setUploadedMockupUrl={setUploadedMockupUrl}
                    customMockupPrompt={customMockupPrompt}
                    setCustomMockupPrompt={setCustomMockupPrompt}
                    provider={mockupProvider}
                    setProvider={setMockupProvider}
                    isGenerating={isGeneratingMockup}
                    onGenerateMockup={handleGenerateMockup}
                    customXPct={customXPct}
                    setCustomXPct={setCustomXPct}
                    customYPct={customYPct}
                    setCustomYPct={setCustomYPct}
                    customScale={customScale}
                    setCustomScale={setCustomScale}
                    customRotation={customRotation}
                    setCustomRotation={setCustomRotation}
                    blendMode={blendMode}
                    setBlendMode={setBlendMode}
                    opacity={opacity}
                    setOpacity={setOpacity}
                    onApplyPlacement={handleAdjustPlacement}
                    isApplyingPlacement={isAdjustingPlacement}
                    hasActiveMockup={!!currentMockup}
                  />
                </div>
              </div>

              <div className="lg:col-span-8">
                <div className="bg-[#0b101c] border border-slate-800 rounded-2xl p-5 shadow-xl min-h-[680px]">
                  <MockupCanvasPreview
                    mockup={currentMockup}
                    activeArtwork={activeArtworkForMockup}
                    isGenerating={isGeneratingMockup}
                    onGenerate={handleGenerateMockup}
                    targetStateCode={selectedStateCode}
                    garmentColor={mockupGarmentColor}
                    mockupType={mockupType}
                    lifestyleScene={lifestyleScene}
                    printPlacement={printPlacement}
                    aspectRatio={aspectRatio}
                    customXPct={customXPct}
                    setCustomXPct={setCustomXPct}
                    customYPct={customYPct}
                    setCustomYPct={setCustomYPct}
                    customScale={customScale}
                    setCustomScale={setCustomScale}
                    customRotation={customRotation}
                    setCustomRotation={setCustomRotation}
                    blendMode={blendMode}
                    setBlendMode={setBlendMode}
                    opacity={opacity}
                    setOpacity={setOpacity}
                    onApplyPlacement={handleAdjustPlacement}
                    isApplyingPlacement={isAdjustingPlacement}
                    onSelectPreset={(pId) => setPrintPlacement(pId)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* MY DESIGNS GALLERY */}
          {activeTab === "my_designs" && (
            <MyDesignsView
              artworks={artworksHistory}
              onSelectArtworkForMockup={handleSendToMockup}
              onRefresh={loadStudioData}
              onInspectDpi={(art) => handleOpenDpiModal(art)}
            />
          )}

          {/* MY MOCKUPS GALLERY */}
          {activeTab === "my_mockups" && (
            <MyMockupsView
              mockups={mockupsHistory}
              onRefresh={loadStudioData}
            />
          )}

          {/* STATE DATABASE EXPLORER & GOOGLE SHEETS SYNC */}
          {activeTab === "state_database" && (
            <StateDatabaseView
              states={states}
              selectedStateCode={selectedStateCode}
              onSelectState={setSelectedStateCode}
              onNavigateToArtwork={(code) => {
                setSelectedStateCode(code);
                setActiveTab("artwork");
              }}
              onRefreshStates={loadStudioData}
            />
          )}

          {/* PROMPT LIBRARY (10 PROVEN FORMULAS) */}
          {activeTab === "prompt_library" && (
            <PromptLibraryView
              onApplyConcept={handleApplyLibraryConcept}
            />
          )}
        </main>
      </div>

      {/* BYOK Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* 4K Artwork Extractor Modal */}
      <ArtworkExtractorModal
        isOpen={isExtractorModalOpen}
        onClose={() => setIsExtractorModalOpen(false)}
        states={states}
        selectedStateCode={selectedStateCode}
        onArtworkExtracted={handleArtworkExtracted}
      />

      {/* 300 DPI Inspector & Upscaler Modal */}
      <DpiModal
        isOpen={isDpiModalOpen}
        onClose={() => setIsDpiModalOpen(false)}
        currentArtwork={dpiTargetArtwork || currentArtwork}
        onArtworkUpscaled={(newArt, autoNavigate) => {
          setCurrentArtwork(newArt);
          setArtworksHistory((prev) => [newArt, ...prev]);
          if (autoNavigate) {
            setSelectedArtworkId(newArt.id);
            setMockupGarmentColor(newArt.product_color || "Black");
            setActiveTab("mockup");
          }
        }}
      />
    </div>
  );
}
