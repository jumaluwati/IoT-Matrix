import {
  Shield,
  Eye,
  Cpu,
  Leaf,
  Globe,
  Lock,
  Wrench,
  Sparkles,
  Wifi,
  Layers,
  Compass,
  Clock,
  type LucideIcon
} from "lucide-react";
import type { WinPillar } from "@/lib/types";

const ICONS: Record<WinPillar["icon"], LucideIcon> = {
  shield: Shield,
  eye: Eye,
  cpu: Cpu,
  leaf: Leaf,
  globe: Globe,
  lock: Lock,
  wrench: Wrench,
  spark: Sparkles,
  wifi: Wifi,
  layers: Layers,
  compass: Compass,
  clock: Clock
};

export function PillarIcon({ name, className }: { name: WinPillar["icon"]; className?: string }) {
  const I = ICONS[name] ?? Sparkles;
  return <I className={className} />;
}
