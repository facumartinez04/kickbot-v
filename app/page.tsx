"use client";
import { useState, useEffect, useRef } from "react";
import { CardHeader, CardBody } from "@heroui/card";
import { Checkbox } from "@heroui/checkbox";
import { Input } from "@heroui/input";
import { ButtonGroup, Button } from "@heroui/button";
import { Slider } from "@heroui/slider";
import { Tooltip } from "@heroui/tooltip";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { StatCard } from "../components/StatCard";
import { useGetProfile, logout, useGetSubscription } from "./functions/UserAPI";
import { useViewerCount } from "../hooks/useViewerCount";
import { ViewerStatCard } from "../components/ViewerStatCard";
import { useWebSocketBot } from "@/hooks/useWebSocketBot";
import { WebSocketStatus } from "@/components/WebSocketStatus";
import { StatusBanner } from "../components/StatusBanner";
import { animate, stagger } from "animejs";
import { MotionCard } from "../components/MotionCard";
import { PatreonLinkButton } from "@/components/PatreonLinkButton";

interface MetricData {
  label: string;
  value: number;
  color: string;
  unit: string;
  history: number[];
  maxValue: number;
}

export default function ViewerBotInterface() {
  const { data: profile } = useGetProfile();
  const { data: subscription, isLoading: isSubscriptionLoading } =
    useGetSubscription();

  // Hook WebSocket
  const {
    isConnected: wsConnected,
    status: wsStatus,
    error: wsError,
    currentUrl: wsUrl,
    stats: wsStats,
    isRunning: wsBotRunning,
    startBot: wsStartBot,
    stopBot: wsStopBot,
    updateThreads: wsUpdateThreads,
    reconnect: wsReconnect,
  } = useWebSocketBot();

  const [config, setConfig] = useState({
    threads: 0,
    channelName: "",
    gameName: "",
    messagesPerMinute: 1,
    enableChat: false,
    proxyType: "http",
    timeout: 10000,
    stabilityMode: true,
  });
  const { viewerCount: currentViewers } = useViewerCount(
    config?.channelName || profile?.user?.TwitchUsername
  );

  const isDevMode = process.env.NODE_ENV === "development";

  const hasActiveSubscription = true;

  const normalizedSubscriptionStatus = "active";

  const isStabilityLocked = false;

  // DEBUG: Removed test animation that was causing the red square

  const [isLoading, setIsLoading] = useState(false);
  const [proxyFile, setProxyFile] = useState<File | null>(null);
  const [unactivated, setUnactivated] = useState(false);
  const [stats, setStats] = useState({
    totalProxies: 0,
    aliveProxies: 0,
    activeThreads: 0,
    request_count: 0,
    viewers: currentViewers, // Utilisé maintenant la valeur en direct
    targetViewers: 0,
  });

  const [channelNameModified, setChannelNameModified] = useState(false);

  // Add new state for bot status
  const [botStatus, setBotStatus] = useState({
    state: "initialized",
    message: "",
    proxy_count: 0,
    proxy_loading_progress: 0,
    startup_progress: 0,
  });

  const animatedContainerRef = useRef<HTMLDivElement | null>(null);
  const actionButtonRef = useRef<HTMLButtonElement | null>(null);
  const statsCardsRef = useRef<HTMLDivElement | null>(null);
  const inputsRef = useRef<HTMLDivElement[]>([]);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Mark component as mounted (client-side only)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Animate title with SVG path drawing effect
  useEffect(() => {
    if (!isMounted || !titleRef.current) return;

    const titleText = titleRef.current.textContent || "";
    if (!titleText) return;

    // Create SVG text with proper centering like before
    titleRef.current.innerHTML = `
      <svg viewBox="0 0 1200 160" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%; overflow: visible;">
      <defs>
        <linearGradient id="titleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#16a34a" />
        <stop offset="50%" stop-color="#22c55e" />
        <stop offset="100%" stop-color="#a3e635" />
        </linearGradient>
        <filter id="titleGlow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="8" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
        </filter>
      </defs>

      <text
        x="50%"
        y="50%"
        font-size="88"
        font-weight="900"
        text-anchor="middle"
        dominant-baseline="middle"
        fill="none"
        stroke="url(#titleGradient)"
        stroke-width="10"
        opacity="0.25"
        filter="url(#titleGlow)"
        style="font-family: 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif; letter-spacing: -0.015em;"
      >${titleText}</text>

      <text
        x="50%"
        y="50%"
        font-size="88"
        font-weight="900"
        text-anchor="middle"
        dominant-baseline="middle"
        fill="none"
        stroke="url(#titleGradient)"
        stroke-width="4"
        class="title-text"
        style="font-family: 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif; stroke-linecap: round; stroke-linejoin: round; letter-spacing: -0.015em;"
      >${titleText}</text>

      <text
        x="50%"
        y="50%"
        font-size="88"
        font-weight="900"
        text-anchor="middle"
        dominant-baseline="middle"
        fill="url(#titleGradient)"
        stroke="#052e16"
        stroke-width="1"
        paint-order="stroke fill"
        style="font-family: 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif; letter-spacing: -0.015em;"
      >${titleText}</text>
      </svg>
    `;

    const textElement = titleRef.current.querySelector(".title-text");

    if (!textElement) {
      console.warn("SVG text element not found");
      titleRef.current.innerHTML = titleText;
      return;
    }

    // Small delay to ensure DOM is ready
    setTimeout(() => {
      try {
        // Calculate approximate stroke length based on text
        // Each character is roughly 30-40 units in the font used
        const textLength = titleText.length * 40;

        // Set up stroke dasharray and offset for drawing animation
        (textElement as SVGTextElement).style.strokeDasharray = `${textLength}`;
        (textElement as SVGTextElement).style.strokeDashoffset =
          `${textLength}`;

        // Animate stroke drawing
        animate(textElement, {
          strokeDashoffset: [textLength, 0],
          duration: 4000,
          ease: "linear",
          loop: true,
        });
      } catch (e) {
        console.error("❌ SVG animation failed:", e);
        // Fallback: show text with stroke
        if (titleRef.current) {
          titleRef.current.innerHTML = `<span style="-webkit-text-stroke: 2px #10b981; -webkit-text-fill-color: transparent; font-size: 3rem; font-weight: 900;">${titleText}</span>`;
        }
      }
    }, 500);
  }, [isMounted]);

  // Animate individual stat cards inside the monitoring section
  useEffect(() => {
    if (!isMounted || !statsCardsRef.current) return;

    // Add delay to ensure cards are fully rendered after MotionCard
    const timer = setTimeout(() => {
      if (!statsCardsRef.current) return;

      const statCards =
        statsCardsRef.current.querySelectorAll(".stat-card-item");
      if (statCards.length === 0) {
        console.warn("No stat cards found for animation");
        return;
      }

      try {
        // Animate with stagger
        animate(statCards, {
          translateY: [40, 0],
          opacity: [0, 1],
          scale: [0.9, 1],
          duration: 600,
          delay: stagger(100, { start: 400 }), // Start after MotionCard animation
          ease: "outQuad",
        });
      } catch (e) {
        console.warn("Stat cards animation failed:", e);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isMounted]); // Only animate on mount

  // Animate configuration inputs with creative slide and fade
  useEffect(() => {
    if (!isMounted || !animatedContainerRef.current) return;

    // Wait a bit for DOM to be fully ready
    const timer = setTimeout(() => {
      if (!animatedContainerRef.current) return;

      const configInputs =
        animatedContainerRef.current.querySelectorAll(".config-input");

      if (configInputs.length === 0) {
        console.warn("No config inputs found");
        return;
      }

      try {
        // Set initial state with alternating directions
        configInputs.forEach((input, index) => {
          (input as HTMLElement).style.opacity = "0";
          const direction = index % 2 === 0 ? -40 : 40;
          (input as HTMLElement).style.transform =
            `translateX(${direction}px) scale(0.9)`;
        });

        // Animate with alternating directions
        setTimeout(() => {
          animate(configInputs, {
            opacity: [0, 1],
            translateX: [(_: any, i: number) => (i % 2 === 0 ? -40 : 40), 0],
            scale: [0.9, 1],
            duration: 700,
            delay: (_: any, i: number) => {
              const delayAttr = (configInputs[i] as HTMLElement).getAttribute(
                "data-delay"
              );
              return delayAttr ? parseInt(delayAttr) : i * 60;
            },
            ease: "outBack(1.7)",
          });
        }, 100);
      } catch (e) {
        console.warn("Config inputs animation failed:", e);
        // Fallback
        configInputs.forEach((input) => {
          (input as HTMLElement).style.opacity = "1";
          (input as HTMLElement).style.transform = "translateX(0) scale(1)";
        });
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [isMounted]);

  // Creative entrance animations for main sections
  useEffect(() => {
    if (!isMounted || !animatedContainerRef.current) return;
    const cards =
      animatedContainerRef.current.querySelectorAll(".anim-section");
    if (cards.length === 0) return;

    try {
      // Set initial state with perspective
      cards.forEach((card, index) => {
        (card as HTMLElement).style.opacity = "0";
        (card as HTMLElement).style.transformOrigin = "center bottom";
        (card as HTMLElement).style.transform = `perspective(1000px) rotateY(${index % 2 === 0 ? -15 : 15
          }deg) translateY(50px)`;
      });

      // Animate with 3D rotation
      setTimeout(() => {
        animate(cards, {
          opacity: [0, 1],
          translateY: [50, 0],
          rotateY: [(_: any, i: number) => (i % 2 === 0 ? -15 : 15), 0],
          duration: 900,
          delay: stagger(120, { start: 300 }),
          ease: "outExpo",
        });
      }, 50);
    } catch (e) {
      console.warn("Animation initialization failed:", e);
      // Fallback
      cards.forEach((card) => {
        (card as HTMLElement).style.opacity = "1";
        (card as HTMLElement).style.transform = "translateY(0) rotateY(0)";
      });
    }
  }, [isMounted]);

  // Button animations removed for cleaner UX

  useEffect(() => {
    if (botStatus.state.toLowerCase() === "stopping") {
      setUnactivated(true);
    } else {
      setUnactivated(false);
    }
  }, [botStatus]);

  const [systemMetrics, setSystemMetrics] = useState<{
    cpu: MetricData;
    memory: MetricData;
    network_up: MetricData;
    network_down: MetricData;
  }>({
    cpu: {
      label: "CPU Usage",
      value: 0,
      color: "#3b82f6",
      unit: "%",
      history: [],
      maxValue: 100,
    },
    memory: {
      label: "Memory Usage",
      value: 0,
      color: "#10b981",
      unit: "%",
      history: [],
      maxValue: 100,
    },
    network_up: {
      label: "Upload",
      value: 0,
      color: "#8b5cf6",
      unit: "MB/s",
      history: [],
      maxValue: 10, // Ajustez selon vos besoins
    },
    network_down: {
      label: "Download",
      value: 0,
      color: "#ef4444",
      unit: "MB/s",
      history: [],
      maxValue: 10, // Ajustez selon vos besoins
    },
  });

  // Sync WebSocket stats avec les stats locales
  useEffect(() => {
    if (!wsStats) return;

    const system_metrics = wsStats.system_metrics || {
      cpu: 0,
      memory: 0,
      network_up: 0,
      network_down: 0,
    };

    // Update system metrics
    setSystemMetrics((prevMetrics) => {
      const updateMetric = (
        metric: MetricData,
        newValue: number | undefined
      ): MetricData => ({
        ...metric,
        value: typeof newValue === "number" ? newValue : 0,
        history: [
          ...metric.history.slice(-29),
          typeof newValue === "number" ? newValue : 0,
        ],
      });
      return {
        cpu: updateMetric(prevMetrics.cpu, system_metrics.cpu),
        memory: updateMetric(prevMetrics.memory, system_metrics.memory),
        network_up: updateMetric(
          prevMetrics.network_up,
          Number(Number(system_metrics.network_up).toFixed(2))
        ),
        network_down: updateMetric(
          prevMetrics.network_down,
          Number(Number(system_metrics.network_down).toFixed(2))
        ),
      };
    });

    // Update bot stats
    setStats((prevStats) => ({
      ...prevStats,
      activeThreads: wsStats.active_threads || 0,
      totalProxies: wsStats.total_proxies || 0,
      aliveProxies: wsStats.alive_proxies || 0,
      request_count: wsStats.request_count || 0,
    }));

    // Update bot status
    if (wsStats.status) {
      setBotStatus(wsStats.status);
    }

    // Update isLoading based on bot state
    setIsLoading(wsStats.is_running || false);
  }, [wsStats]);

  useEffect(() => {
    // If profile loads and channel name is empty, set it ONLY ONCE
    if (
      profile?.user?.TwitchUsername &&
      !config.channelName &&
      !channelNameModified
    ) {
      setConfig((prev) => ({
        ...prev,
        channelName: profile.user.TwitchUsername as string,
      }));
    }
  }, [profile, channelNameModified, config.channelName]);

  // Sync config from WebSocket stats ONLY on first load
  useEffect(() => {
    if (wsStats && wsStats.config && wsStats.is_running) {
      const { threads, timeout, proxy_type, stability_mode } = wsStats.config;
      const parsedTimeout = Number.parseInt(`${timeout}`, 10);
      setConfig((prevConfig) => ({
        ...prevConfig,
        threads: threads ?? prevConfig.threads,
        timeout: Number.isNaN(parsedTimeout) ? 10000 : parsedTimeout,
        proxyType: proxy_type ?? prevConfig.proxyType,
        channelName: wsStats.channel_name || prevConfig.channelName,
        stabilityMode:
          typeof stability_mode === "boolean"
            ? stability_mode
            : prevConfig.stabilityMode,
      }));
    }
  }, [wsStats?.is_running]); // Ne sync que quand le bot change d'état

  useEffect(() => {
    if (isStabilityLocked && config.stabilityMode) {
      setConfig((prevConfig) => ({
        ...prevConfig,
        stabilityMode: false,
      }));
    }
  }, [isStabilityLocked, config.stabilityMode]);

  const handleStart = async () => {
    // Check WebSocket connection
    if (!wsConnected) {
      toast.error(
        "Servicio local no conectado. Por favor inícialo o descárgalo."
      );
      return;
    }

    // Prevent starting during transitional states
    if (
      botStatus.state.toLowerCase() === "stopping" ||
      botStatus.state.toLowerCase() === "starting"
    ) {
      return;
    }
    if (!config.channelName) {
      toast.error("El nombre del canal o URL es obligatorio");
      return;
    } else if (config.threads === 0) {
      toast.error("La cantidad de threads debe ser mayor a 0");
      return;
    }
    try {
      setIsLoading(true);
      await wsStartBot({
        channelName: config.channelName,
        threads: config.threads,
        proxyFile: proxyFile || undefined,
        timeout: config.timeout,
        proxyType: config.proxyType,
        stabilityMode: true,
        subscriptionStatus: "active",
      });
      toast.success(
        "¡Bot iniciado con éxito!🚀 Puede tomar un tiempo antes de que los viewers aparezcan en el stream."
      );
    } catch (err) {
      toast.error(
        `Error al iniciar el bot: ${err instanceof Error ? err.message : "Error desconocido"
        }`
      );
      setIsLoading(false);
    }
  };

  const handleStop = async () => {
    if (!wsConnected) {
      toast.error("Servicio local no conectado.");
      return;
    }

    if (
      botStatus.state.toLowerCase() === "stopping" ||
      botStatus.state.toLowerCase() === "starting"
    ) {
      return;
    }
    try {
      wsStopBot();
      toast.success("¡Bot detenido con éxito!");
      setIsLoading(false);
      setStats((prevStats) => ({
        ...prevStats,
        activeThreads: 0,
        request_count: 0,
      }));
    } catch (err) {
      toast.error("Error al detener el bot");
      console.error("Failed to stop bot:", err);
    }
  };

  const handleLogout = async () => {
    try {
      if (isLoading && wsConnected) {
        wsStopBot();
        setIsLoading(false);
      }
      await logout();
      toast.success("¡Sesión cerrada con éxito!");
      window.location.href = "/login";
    } catch (error) {
      toast.error("Error al cerrar sesión");
      console.error("Logout error:", error);
    }
  };

  const handleChannelNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChannelNameModified(true);
    setConfig((prev) => ({
      ...prev,
      channelName: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8" ref={animatedContainerRef}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <MotionCard
          index={0}
          className="relative text-center p-8 rounded-2xl border-none glass-card"
        >
          {profile && (
            <Button
              variant="bordered"
              onPress={handleLogout}
              className="absolute right-4 top-4 hover:scale-105 transition-transform border-white/10 hover:bg-red-500/10 hover:text-red-500 text-zinc-400"
              color="danger"
              size="sm"
            >
              Logout
            </Button>
          )}
          <h1
            ref={titleRef}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-3 text-white tracking-tighter"
          >
            KICK<span className="text-green-500">VIEWER</span>BOT
          </h1>
          <p className="text-base sm:text-lg md:text-xl font-medium text-zinc-400 tracking-wide">
            {profile
              ? `Bienvenido de nuevo, ${profile.user.username}`
              : "Monitorea y controla tu viewer bot"}
          </p>
          <div className="mt-6 flex justify-center">
            <WebSocketStatus
              status={wsStatus}
              currentUrl={wsUrl}
              onRetry={wsReconnect}
            />
          </div>
        </MotionCard>

        {/* Monitoring Section */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          <MotionCard
            index={1}
            className="h-full border-none glass-card"
          >
            <CardHeader className="pb-2 px-6 pt-6">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <span className="w-2 h-8 bg-green-500 rounded-full"></span>
                Monitoreo en vivo
              </h2>
            </CardHeader>
            <CardBody className="px-6 pb-6 pt-2">
              <div
                ref={statsCardsRef}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-full"
              >
                <div className="w-full stat-card-item">
                  <ViewerStatCard value={currentViewers} />
                </div>
                <div className="w-full stat-card-item">
                  <StatCard
                    title="Threads Activos"
                    value={stats.activeThreads}
                    total={config.threads}
                  />
                </div>
                <div className="w-full stat-card-item">
                  <StatCard
                    title="BOTS TOTALES"
                    value={botStatus.proxy_count || stats.totalProxies}
                    total={botStatus.proxy_count || stats.totalProxies}
                  />
                </div>
                <div className="w-full stat-card-item">
                  <StatCard
                    title={
                      wsStats?.config?.stability_mode
                        ? "Conexiones Activas"
                        : "Peticiones"
                    }
                    value={stats.request_count}
                  />
                </div>
              </div>
            </CardBody>
          </MotionCard>
        </div>

        {/* Control Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          <MotionCard
            index={3}
            className="border-none glass-card"
          >
            <CardHeader className="pb-2 px-6 pt-6">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <span className="w-2 h-8 bg-green-500 rounded-full"></span>
                Configuración
              </h2>
            </CardHeader>
            <CardBody className="space-y-6">
              <Input
                label="Nombre del Canal o URL"
                value={config.channelName}
                placeholder={
                  profile?.user?.TwitchUsername || "Ingresa el nombre del canal o URL"
                }
                onChange={handleChannelNameChange}
                className="config-input"
                data-delay="0"
              />
              <div
                className="flex items-center space-x-2 config-input"
                data-delay="100"
              >
                <div className="flex-1">
                  <Input
                    type="number"
                    label="Número de Viewers"
                    value={config.threads === 0 ? "" : config.threads.toString()}
                    min={0}
                    max={10000}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        threads:
                          e.target.value === ""
                            ? 0
                            : Math.min(10000, parseInt(e.target.value) || 0),
                      })
                    }
                  />
                </div>
                {wsBotRunning && (
                  <Button 
                    color="primary" 
                    variant="flat" 
                    onPress={() => {
                      if (config.threads > 0) {
                        try {
                          wsUpdateThreads(config.threads);
                          toast.success(`Actualizando cantidad de viewers a ${config.threads}...`);
                        } catch (err) {
                          toast.error("Error al actualizar viewers");
                        }
                      } else {
                        toast.error("La cantidad debe ser > 0");
                      }
                    }}
                  >
                    Actualizar
                  </Button>
                )}
                <Tooltip
                  content={
                    <div className="max-w-xs p-2">
                      <p>
                        Este valor determina cuántas conexiones simultáneas hará el bot.
                      </p>
                      <p className="mt-1">
                        Más conexiones = más viewers, pero requiere más recursos.
                      </p>
                      <p className="mt-1">
                        Recomendado: Inicia con 100-200.
                      </p>
                    </div>
                  }
                >
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-default-100 text-default-500 cursor-help">
                    ?
                  </div>
                </Tooltip>
              </div>
              <div className="config-input" data-delay="200">
                <Slider
                  value={[config.timeout]}
                  defaultValue={[10000]}
                  maxValue={20000}
                  onChange={(value) =>
                    setConfig({
                      ...config,
                      timeout: Number(Array.isArray(value) ? value[0] : value),
                    })
                  }
                  getValue={(timeout) => `${timeout}ms`}
                  label="Tiempo de espera (Timeout)"
                  step={100}
                />
              </div>
            </CardBody>
          </MotionCard>
        </div>

        {/* Status Banner with new styling */}
        <div className="transform hover:scale-[1.02] transition-transform duration-300">
          <StatusBanner status={botStatus} />
        </div>
        {/* Information Panel */}
        <MotionCard
          index={5}
          className="border-none glass-card"
        >
          <CardBody className="text-center">
            <p className="text-lg font-medium bg-gradient-to-r from-green-500 via-emerald-400 to-lime-400 bg-clip-text text-transparent">
              Por favor, ten en cuenta que los viewers pueden tardar un poco en aparecer en tu directo. 
              Esto es normal, ¡no te desesperes!
            </p>
          </CardBody>
        </MotionCard>

        <Button
          ref={actionButtonRef}
          variant="solid"
          color={isLoading ? "danger" : "primary"}
          size="lg"
          fullWidth
          onPress={isLoading ? handleStop : handleStart}
          isDisabled={
            botStatus.state.toLowerCase() === "stopping" ||
            botStatus.state.toLowerCase() === "starting" ||
            unactivated
          }
          className={`relative group overflow-hidden ${botStatus.state.toLowerCase() === "stopping" ||
            botStatus.state.toLowerCase() === "starting"
            ? "opacity-50 cursor-not-allowed pointer-events-none"
            : ""
            }`}
        >
          <span className="relative z-10">
            {botStatus.state.toLowerCase() === "stopping"
              ? "Deteniendo"
              : botStatus.state.toLowerCase() === "starting"
                ? "Iniciando"
                : isLoading
                  ? "Detener Bot"
                  : "Iniciar Bot"}
            {(botStatus.state.toLowerCase() === "stopping" ||
              botStatus.state.toLowerCase() === "starting") &&
              " (Por favor espera...)"}
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-lime-400/20 group-hover:opacity-100 opacity-0 transition-opacity duration-300" />
        </Button>
      </div>
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </div>
  );
}
