// Ionicons, o mesmo conjunto de ícones do intermedi-app (@expo/vector-icons).
// Só os ícones listados aqui entram no bundle (SVG inline, sem fonte de ícones).
const SVGS = import.meta.glob(
  "/node_modules/ionicons/dist/svg/{add-circle-outline,add-circle,bandage-outline,bandage,home-outline,home,chatbubble-ellipses-outline,chatbubble-ellipses,heart-outline,heart,person-outline,person,search-outline,options-outline,location-outline,chevron-down,notifications-outline,chevron-forward,chevron-back,chevron-up,map-outline,thermometer-outline,rainy-outline,flower-outline,water-outline,nutrition-outline,shield-checkmark-outline,body-outline,leaf-outline,medkit-outline,ellipse-outline,cube-outline,business-outline,checkmark,time-outline,alarm-outline,information-circle-outline,trash-outline,refresh,send,bulb-outline,storefront-outline,close,checkmark-circle,document-text-outline,walk-outline,car-outline,navigate-outline,alert-circle-outline}.svg",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const POR_NOME: Record<string, string> = Object.fromEntries(
  Object.entries(SVGS).map(([caminho, svg]) => [
    caminho.split("/").pop()!.replace(".svg", ""),
    // tira o tamanho fixo e a classe; a cor vem de currentColor
    svg.replace(/^<svg[^>]*?viewBox="([^"]+)"[^>]*>/, '<svg viewBox="$1" width="100%" height="100%" aria-hidden="true" focusable="false">'),
  ]),
);

export type NomeIonicon = string;

export function Ionicon({ name, size = 22, color, className = "" }: { name: NomeIonicon; size?: number; color?: string; className?: string }) {
  const svg = POR_NOME[name] ?? POR_NOME["ellipse-outline"];
  return (
    <span
      className={`ion ${className}`}
      style={{ width: size, height: size, color }}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
