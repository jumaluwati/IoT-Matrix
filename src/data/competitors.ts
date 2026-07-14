import type { Competitor } from "@/lib/types";

// NOTE: Competitor product lineups summarized from public marketing materials.
// In production, refresh via the orchestrator (Public Web + Cisco Docs MCP for compete content).
export const COMPETITORS: Competitor[] = [
  {
    slug: "nokia",
    name: "Nokia",
    short: "NOK",
    tagline: "IP/MPLS routers for utilities, transport, and mission-critical networks.",
    color: "#124191",
    logoMark: "NOKIA",
    products: [
      {
        slug: "7250-ixr",
        name: "7250 IXR",
        family: "Service Routers",
        category: "Industrial Router",
        positioning: "Large utility / transmission backbone IP/MPLS router."
      },
      {
        slug: "7705-sar",
        name: "7705 SAR",
        family: "Service Aggregation Routers",
        category: "Industrial Router",
        positioning: "Aggregation router for substations and grid telecom."
      }
    ]
  },
  {
    slug: "hpe-aruba",
    name: "HPE Aruba",
    short: "ARU",
    tagline: "CX switches and Aruba Networking for industrial edges.",
    color: "#F08200",
    logoMark: "ARUBA",
    products: [
      {
        slug: "cx-4100i",
        name: "Aruba CX 4100i",
        family: "Aruba CX",
        category: "Industrial Switch",
        positioning: "Ruggedized CX series targeting industrial access."
      },
      {
        slug: "cx-6300",
        name: "Aruba CX 6300",
        family: "Aruba CX",
        category: "Industrial Switch",
        positioning: "Stackable enterprise switch sometimes proposed for OT aggregation."
      }
    ]
  },
  {
    slug: "fortinet",
    name: "Fortinet",
    short: "FTNT",
    tagline: "FortiGate Rugged and FortiSwitch Rugged — security-led OT play.",
    color: "#EE3124",
    logoMark: "FORTINET",
    products: [
      {
        slug: "fortigate-rugged-60f",
        name: "FortiGate Rugged 60F",
        family: "FortiGate Rugged",
        category: "Ruggedized Firewall",
        positioning: "Compact OT firewall + SD-WAN edge for industrial sites."
      },
      {
        slug: "fortigate-rugged-70f",
        name: "FortiGate Rugged 70F",
        family: "FortiGate Rugged",
        category: "Ruggedized Firewall",
        positioning: "Higher-throughput rugged NGFW for plant edges."
      },
      {
        slug: "fortiswitch-rugged-112d",
        name: "FortiSwitch Rugged 112D-POE",
        family: "FortiSwitch Rugged",
        category: "Industrial Switch",
        positioning: "DIN-rail PoE switch managed via FortiGate."
      }
    ]
  },
  {
    slug: "siemens",
    name: "Siemens",
    short: "SIE",
    tagline: "Scalance and Ruggedcom — incumbent in factory and substation OT.",
    color: "#009999",
    logoMark: "SIEMENS",
    products: [
      {
        slug: "scalance-xc-200",
        name: "Scalance XC-200",
        family: "Scalance XC",
        category: "Industrial Switch",
        positioning: "Managed industrial Layer 2 switch for PROFINET cells."
      },
      {
        slug: "scalance-xr-300",
        name: "Scalance XR-300",
        family: "Scalance XR",
        category: "Industrial Switch",
        positioning: "Layer 3 rack-mount industrial switch for backbone OT."
      },
      {
        slug: "ruggedcom-rx1500",
        name: "Ruggedcom RX1500",
        family: "Ruggedcom",
        category: "Industrial Router",
        positioning: "Modular multi-service router for utilities and substations."
      }
    ]
  },
  {
    slug: "hirschmann",
    name: "Hirschmann (Belden)",
    short: "HIR",
    tagline: "RSP and OWL — substation and industrial Ethernet specialist.",
    color: "#005AA0",
    logoMark: "HIRSCHMANN",
    products: [
      {
        slug: "rsp-series",
        name: "RSP Series",
        family: "RSP",
        category: "Industrial Switch",
        positioning: "Substation-rated managed switch with HiOS."
      },
      {
        slug: "owl-lte",
        name: "OWL LTE",
        family: "OWL",
        category: "Industrial Router",
        positioning: "Industrial LTE router for remote sites."
      }
    ]
  },
  {
    slug: "moxa",
    name: "Moxa",
    short: "MOX",
    tagline: "Cost-effective industrial Ethernet, serial, and wireless gateways.",
    color: "#0098D5",
    logoMark: "MOXA",
    products: [
      {
        slug: "eds-g500e",
        name: "EDS-G500E",
        family: "EDS",
        category: "Industrial Switch",
        positioning: "Entry-level gigabit managed industrial switch."
      },
      {
        slug: "iks-g6824a",
        name: "IKS-G6824A",
        family: "IKS",
        category: "Industrial Switch",
        positioning: "Rack-mount 24-port managed Layer 3 switch."
      },
      {
        slug: "awk-3252a",
        name: "AWK-3252A",
        family: "AWK",
        category: "Industrial Wireless",
        positioning: "Industrial 802.11ac AP/Client for plant wireless."
      }
    ]
  },
  {
    slug: "phoenix-contact",
    name: "Phoenix Contact",
    short: "PXC",
    tagline: "FL Switch and mGuard — German OT mainstay.",
    color: "#00A1E0",
    logoMark: "PHOENIX",
    products: [
      {
        slug: "fl-switch-2000",
        name: "FL Switch 2000",
        family: "FL Switch",
        category: "Industrial Switch",
        positioning: "Managed DIN-rail industrial switch."
      },
      {
        slug: "mguard-rs4000",
        name: "mGuard RS4000",
        family: "mGuard",
        category: "Ruggedized Firewall",
        positioning: "Industrial security router with VPN."
      }
    ]
  },
  {
    slug: "palo-alto",
    name: "Palo Alto Networks",
    short: "PANW",
    tagline: "PA-Rugged firewalls and IoT Security for OT segmentation.",
    color: "#FA582D",
    logoMark: "PALOALTO",
    products: [
      {
        slug: "pa-220r",
        name: "PA-220R",
        family: "PA-Rugged",
        category: "Ruggedized Firewall",
        positioning: "Ruggedized NGFW for substations and industrial DMZ."
      },
      {
        slug: "iot-security",
        name: "IoT Security (Zingbox)",
        family: "IoT Security",
        category: "OT Security / Visibility",
        positioning: "Cloud-delivered IoT/OT visibility on top of NGFW telemetry."
      }
    ]
  },
  {
    slug: "huawei",
    name: "Huawei",
    short: "HUA",
    tagline: "NetEngine AR industrial gateways and S-series switches — aggressive pricing, China-bloc footprint.",
    color: "#C7000B",
    logoMark: "HUAWEI",
    products: [
      {
        slug: "ar502gw",
        name: "NetEngine AR502GW-Lc-D-H",
        family: "NetEngine AR500",
        category: "Industrial Router",
        positioning: "Compact LTE/Wi-Fi industrial IoT gateway — entry-level price."
      },
      {
        slug: "ar509gw",
        name: "NetEngine AR509GW-LM4",
        family: "NetEngine AR500",
        category: "Industrial Router",
        positioning: "5G industrial IoT gateway with dual SIM and Wi-Fi 6."
      },
      {
        slug: "s5731-s",
        name: "S5731-S-S24P4X",
        family: "S5700",
        category: "Industrial Switch",
        positioning: "L3 GE access switch frequently proposed into industrial campus / OT aggregation."
      }
    ]
  },
  {
    slug: "rockwell",
    name: "Rockwell Automation",
    short: "ROK",
    tagline: "Stratix switches and Allen-Bradley OT — North American factory-floor incumbent.",
    color: "#E1251B",
    logoMark: "ROCKWELL",
    products: [
      {
        slug: "stratix-5400",
        name: "Stratix 5400",
        family: "Stratix",
        category: "Industrial Switch",
        positioning: "Layer 3 managed industrial switch for plant-floor IACS networks."
      },
      {
        slug: "stratix-5410",
        name: "Stratix 5410",
        family: "Stratix",
        category: "Industrial Switch",
        positioning: "Distribution-layer industrial switch for aggregating cell/area zones."
      },
      {
        slug: "stratix-5800",
        name: "Stratix 5800",
        family: "Stratix",
        category: "Industrial Switch",
        positioning: "Modular flagship industrial switch with advanced security and CIP support."
      }
    ]
  },
  {
    slug: "schneider",
    name: "Schneider Electric",
    short: "SCH",
    tagline: "ConneXium switches and EcoStruxure platform — utilities and energy management strongholds.",
    color: "#3DCD58",
    logoMark: "SCHNEIDER",
    products: [
      {
        slug: "connexium-tcsesm",
        name: "ConneXium TCSESM",
        family: "ConneXium",
        category: "Industrial Switch",
        positioning: "Managed industrial Ethernet switch for substations and process automation."
      },
      {
        slug: "connexium-tcsesb",
        name: "ConneXium TCSESB",
        family: "ConneXium",
        category: "Industrial Switch",
        positioning: "Unmanaged industrial switch for cost-sensitive field deployments."
      }
    ]
  }
];

export function getCompetitor(slug: string): Competitor | undefined {
  return COMPETITORS.find((c) => c.slug === slug);
}

export function getCompetitorProduct(competitor: string, product: string) {
  const c = getCompetitor(competitor);
  if (!c) return undefined;
  return c.products.find((p) => p.slug === product);
}
