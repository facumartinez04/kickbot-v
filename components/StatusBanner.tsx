import { Card, CardBody } from "@heroui/card";
import { Progress } from "@heroui/progress";

interface StatusBannerProps {
  status: {
    state: string;
    message: string;
    proxy_loading_progress: number;
    startup_progress: number;
  };
}

export const StatusBanner = ({ status }: StatusBannerProps) => {
  const getTextColor = () => {
    switch (status.state) {
      case "error":
        return "text-red-500";
      case "running":
        return "text-green-500";
      case "loading_proxies":
        return "text-blue-500";
      case "starting":
        return "text-blue-500";
      case "stopped":
        return "text-zinc-500";
      case "stopping":
        return "text-orange-500";
      default:
        return "";
    }
  };

  const getTranslatedState = (state: string) => {
    switch (state.toLowerCase()) {
      case "error": return "ERROR";
      case "running": return "EN EJECUCIÓN";
      case "loading_proxies": return "CARGANDO PROXIES";
      case "starting": return "INICIANDO";
      case "stopped": return "DETENIDO";
      case "stopping": return "DETENIENDO";
      case "initialized": return "INICIALIZADO";
      default: return state.toUpperCase();
    }
  };

  const getTranslatedMessage = (message: string) => {
    const msg = message.toLowerCase();
    
    // Exact or partial matches
    if (msg.includes("persistent websocket connections")) return "El bot está funcionando con conexiones seguras";
    if (msg.includes("bot has been stopped")) return "El bot ha sido detenido completamente";
    if (msg.includes("bot is now running")) return "El bot ya está funcionando";
    if (msg.includes("bot is running")) return "El bot se encuentra en ejecución";
    if (msg.includes("starting bot")) return "Iniciando ataque...";
    if (msg.includes("loading proxies")) return "Conectando bots...";
    if (msg.includes("fetching proxies")) return "Buscando conexiones...";
    if (msg.includes("proxies loaded")) return "Bots y conexiones cargadas";
    if (msg.includes("loaded") && msg.includes("proxies")) return "Bots cargados con éxito";
    if (msg.includes("initialized")) return "Sistema inicializado correctamente";
    if (msg.includes("fallback mode")) return "Usando ID de canal alternativo...";
    if (msg.includes("getting stream url")) return "Verificando el canal...";
    if (msg.includes("using cached")) return "Usando caché de conexión...";
    
    // Add fallback translation for any other common terms here
    let translated = message;
    translated = translated.replace(/Bot/gi, "Bot");
    translated = translated.replace(/proxies/gi, "bots");
    translated = translated.replace(/proxy/gi, "bot");
    translated = translated.replace(/loaded/gi, "cargados");
    translated = translated.replace(/from file/gi, "desde archivo local");

    return translated;
  };

  const getStatusIndicator = () => {
    switch (status.state) {
      case "error":
        return (
          <span className="relative flex h-3 w-3 mr-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></span>
          </span>
        );
      case "running":
        return (
          <span className="relative flex h-3 w-3 mr-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></span>
          </span>
        );
      case "loading_proxies":
      case "starting":
        return (
          <span className="relative flex h-3 w-3 mr-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></span>
          </span>
        );
      case "stopped":
        return (
          <span className="relative flex h-3 w-3 mr-2">
            <span className="relative inline-flex rounded-full h-3 w-3 bg-zinc-600"></span>
          </span>
        );
      case "stopping":
        return (
          <span className="relative flex h-3 w-3 mr-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]"></span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="w-full border-none glass-card shadow-xl hover:shadow-2xl transition-all duration-500">
      <CardBody className="p-4 relative overflow-hidden">
        {/* Background pulse effect based on status */}
        <div
          className={`absolute inset-0 opacity-10  ${status.state === "running" ? "animate-pulse-subtle" : ""
            }`}
        ></div>

        <div className="space-y-3 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {getStatusIndicator()}
              <span className={`${getTextColor()} font-medium`}>
                {getTranslatedState(status.state)}
              </span>
              <span className="ml-3 text-gray-700 dark:text-gray-300">
                {getTranslatedMessage(status.message)}
              </span>
            </div>
          </div>

          {(status.state === "loading_proxies" ||
            status.state === "starting") && (
              <div className="space-y-3 pt-2">
                {status.proxy_loading_progress > 0 && (
                  <div className="animate-fade-in">
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-medium">Cargando Proxies</span>
                      <span className="font-medium">
                        {status.proxy_loading_progress}%
                      </span>
                    </div>
                    <Progress
                      value={status.proxy_loading_progress}
                      color="primary"
                      className="h-2"
                    />
                  </div>
                )}
                {status.startup_progress > 0 && (
                  <div className="animate-fade-in">
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-medium">Iniciando Bot</span>
                      <span className="font-medium">
                        {status.startup_progress}%
                      </span>
                    </div>
                    <Progress
                      value={status.startup_progress}
                      color="success"
                      className="h-2"
                    />
                  </div>
                )}
              </div>
            )}
        </div>
      </CardBody>
    </Card>
  );
};
