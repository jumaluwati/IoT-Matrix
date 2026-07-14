import type { CiscoProduct } from "@/lib/types";

// NOTE: Content is curated from publicly available Cisco datasheets for IIoT.
// In production, this catalog should be sourced from the Cisco Docs MCP server.
export const CISCO_IIOT: Record<string, CiscoProduct> = {
  "ie3100": {
    slug: "ie3100",
    name: "Catalyst IE3100",
    family: "Catalyst IE3x00",
    category: "Industrial Switch",
    oneLiner: "Compact DIN-rail switch for cost-sensitive OT edges.",
    highlights: [
      "Up to 12 GE ports, fanless, -40°C to +75°C",
      "IOS XE with TrustSec and Cyber Vision sensor",
      "Common Cisco software stack with enterprise switches"
    ],
    useCases: ["Manufacturing / Factory", "Smart City"],
    whenToLead: "Cost-sensitive OT edge where the IOS XE feature set and future-proofing matter more than port expansion."
  },
  "ie3300": {
    slug: "ie3300",
    name: "Catalyst IE3300",
    family: "Catalyst IE3x00",
    category: "Industrial Switch",
    oneLiner: "Modular DIN-rail switch for manufacturing and substation aggregation.",
    highlights: [
      "Stackable, modular GE/10GE expansion",
      "Native Cyber Vision sensor (no extra appliance)",
      "PRP/HSR, PTP, IEC 61850-3 / IEEE 1613 ready"
    ],
    useCases: ["Manufacturing / Factory", "Substation Automation"],
    whenToLead: "Modular DIN-rail aggregation where stacking and GE/10GE uplinks matter; widely available and well-stocked."
  },
  "ie3500": {
    slug: "ie3500",
    name: "Catalyst IE3500",
    family: "Catalyst IE3x00",
    category: "Industrial Switch",
    oneLiner: "Next-gen compact DIN-rail switch — IE3300 successor with TSN and on-box edge compute.",
    highlights: [
      "Time-Sensitive Networking (TSN) for deterministic OT traffic",
      "IOx app hosting + native Cyber Vision sensor",
      "PoE/PoE+ options, fanless, -40°C to +75°C, IEC 61850-3"
    ],
    useCases: ["Manufacturing / Factory", "Substation Automation", "Oil & Gas / Utilities", "Smart City"],
    whenToLead: "Greenfield or refresh deployments that want TSN and the latest IOS XE feature parity with IE3300-class compatibility."
  },
  "ie3400": {
    slug: "ie3400",
    name: "Catalyst IE3400",
    family: "Catalyst IE3x00",
    category: "Industrial Switch",
    oneLiner: "Advanced DIN-rail with on-box edge compute (IOx).",
    highlights: [
      "IOx app hosting for OT analytics at the asset",
      "Cyber Vision sensor embedded — zero-touch OT visibility",
      "TSN-ready, SD-Access for industrial macro-segmentation"
    ],
    useCases: ["Manufacturing / Factory", "Oil & Gas / Utilities", "Substation Automation"],
    whenToLead: "On-box IOx edge compute, embedded Cyber Vision sensor, or SD-Access at the access layer today."
  },
  "ie3400h": {
    slug: "ie3400h",
    name: "Catalyst IE3400 Heavy Duty",
    family: "Catalyst IE3x00",
    category: "Industrial Switch",
    oneLiner: "IP67 fully sealed switch for outdoor, mining, and roadway cabinets.",
    highlights: [
      "IP67, M12 connectors, -40°C to +75°C",
      "Same IOS XE feature set as IE3400 DIN",
      "Operates outside enclosures — eliminates field cabinets"
    ],
    useCases: ["Mining / Heavy Industry", "Transportation / Roadways", "Oil & Gas / Utilities"],
    whenToLead: "Outdoor, mining, or roadway sites with no enclosure — the IP67 housing eliminates the field cabinet."
  },
  "ie9300": {
    slug: "ie9300",
    name: "Catalyst IE9300",
    family: "Catalyst IE9300",
    category: "Industrial Switch",
    oneLiner: "Rack-mount aggregation switch for substations and process control rooms.",
    highlights: [
      "1RU, dual AC/DC PSUs, KEMA / IEC 61850-3 certified",
      "Up to 28× GE + 4× 10GE, StackWise Virtual",
      "Cyber Vision sensor + TrustSec native"
    ],
    useCases: ["Substation Automation", "Oil & Gas / Utilities"],
    whenToLead: "Rack-mount substation or control-room aggregation needing 1RU and KEMA-certified hardware."
  },
  "ie9320": {
    slug: "ie9320",
    name: "Catalyst IE9320",
    family: "Catalyst IE9300",
    category: "Industrial Switch",
    oneLiner: "Fiber-dense substation aggregator — 24× GE SFP + 4× 10GE uplinks.",
    highlights: [
      "All-fiber design for substation buses (24× SFP)",
      "PRP/HSR redundancy + PTP for IEC 61850 process bus",
      "StackWise Virtual + MACsec, KEMA-certified"
    ],
    useCases: ["Substation Automation", "Oil & Gas / Utilities"],
    whenToLead: "Fiber-dense substation aggregation (24× SFP) with PRP/HSR for the IEC 61850 process bus."
  },
  "ir1101": {
    slug: "ir1101",
    name: "IR1101",
    family: "Catalyst IR1100",
    category: "Industrial Router",
    oneLiner: "Modular LTE/5G industrial router — the most deployed Cisco IIoT router.",
    highlights: [
      "Pluggable cellular (5G Sub-6/mmWave), Wi-Fi, GNSS",
      "IOx hosting + LXC containers for edge apps",
      "SD-WAN, ZTP via IoT Operations Dashboard"
    ],
    useCases: ["Oil & Gas / Utilities", "Transportation / Roadways", "Smart City", "Military / Defense"],
    whenToLead: "LTE/5G cellular edge needing modular pluggables, IOx hosting, and SD-WAN over commercial cellular."
  },
  "ir1800": {
    slug: "ir1800",
    name: "IR1800",
    family: "Catalyst IR1800",
    category: "Industrial Router",
    oneLiner: "Vehicle-grade 5G router for transit, fleet, public safety.",
    highlights: [
      "Dual 5G modems with active-active failover",
      "CAN bus, Ignition Sense, E-Mark / vehicle certs",
      "GNSS + dead-reckoning for tunnels and yards"
    ],
    useCases: ["Transportation / Roadways", "Smart City", "Military / Defense"],
    whenToLead: "Vehicle-grade deployments (transit, fleet, public safety) needing dual 5G, CAN bus, and GNSS."
  },
  "ir8300": {
    slug: "ir8300",
    name: "IR8300",
    family: "Catalyst IR8300",
    category: "Industrial Router",
    oneLiner: "High-performance ruggedized router for substations and large sites.",
    highlights: [
      "Up to 8× GE + 4× 10GE, dual PSUs",
      "IEC 61850-3 / IEEE 1613 for substations",
      "MACsec, SD-WAN, advanced QoS at scale"
    ],
    useCases: ["Substation Automation", "Oil & Gas / Utilities", "Mining / Heavy Industry"],
    whenToLead: "High-throughput substation or large-site routing needing dual PSUs, 10GE, and IEC 61850-3."
  },
  "iw9167": {
    slug: "iw9167",
    name: "Catalyst IW9167E",
    family: "Catalyst IW9100",
    category: "Industrial Wireless",
    oneLiner: "Outdoor Wi-Fi 6E + URWB AP for mobility-critical OT.",
    highlights: [
      "Wi-Fi 6E and Ultra-Reliable Wireless Backhaul (URWB)",
      "Sub-50ms handoff for AGVs, trains, port cranes",
      "Mesh + MPLS-like deterministic backhaul"
    ],
    useCases: ["Mining / Heavy Industry", "Transportation / Roadways", "Manufacturing / Factory"],
    whenToLead: "Outdoor Wi-Fi 6E or URWB for mobility-critical OT (AGVs, cranes, trains) with sub-50ms handoff."
  },
  "iw9165": {
    slug: "iw9165",
    name: "Catalyst IW9165D/E",
    family: "Catalyst IW9100",
    category: "Industrial Wireless",
    oneLiner: "Compact URWB radio for mobile assets and dense mesh.",
    highlights: [
      "URWB sub-10ms roaming, redundancy",
      "Compact form factor for vehicles and AGVs",
      "Same management as IW9167 family"
    ],
    useCases: ["Manufacturing / Factory", "Mining / Heavy Industry", "Transportation / Roadways"],
    whenToLead: "Compact URWB radio for mobile assets and dense mesh where the form factor is tight."
  },
  "cyber-vision": {
    slug: "cyber-vision",
    name: "Cisco Cyber Vision",
    family: "Industrial Security",
    category: "OT Security / Visibility",
    oneLiner: "OT asset visibility and intrusion detection — embedded in the network.",
    highlights: [
      "Sensor runs INSIDE IE3300/3400/9300 (no SPAN, no extra appliance)",
      "Deep packet inspection for 40+ industrial protocols",
      "Native integration with ISE, Splunk, and SecureX/XDR"
    ],
    useCases: ["Manufacturing / Factory", "Oil & Gas / Utilities", "Substation Automation"],
    whenToLead: "You need OT asset visibility and intrusion detection embedded in the network — no SPAN, no extra appliance."
  },
  "secure-firewall-3100": {
    slug: "secure-firewall-3100",
    name: "Cisco Secure Firewall 3100",
    family: "Secure Firewall",
    category: "Ruggedized Firewall",
    oneLiner: "Enterprise-grade NGFW with OT/IT zoning for industrial DMZs.",
    highlights: [
      "Snort 3 IPS, OT protocol awareness",
      "Encrypted Visibility Engine — no decryption needed",
      "Unified policy with ISE + Cyber Vision tagging"
    ],
    useCases: ["Manufacturing / Factory", "Oil & Gas / Utilities", "Substation Automation"],
    whenToLead: "Enterprise NGFW for the industrial DMZ with OT protocol awareness and encrypted-traffic visibility."
  },
  "iot-ops-dashboard": {
    slug: "iot-ops-dashboard",
    name: "IoT Operations Dashboard",
    family: "Cloud Management",
    category: "Management / Orchestration",
    oneLiner: "Cloud-based ZTP, monitoring, and lifecycle for the entire IIoT fleet.",
    highlights: [
      "Zero-touch provisioning of IR/IE devices",
      "Edge Device Manager + Secure Equipment Access",
      "Single pane across routers, switches, wireless"
    ],
    useCases: ["Oil & Gas / Utilities", "Transportation / Roadways", "Smart City", "Manufacturing / Factory"],
    whenToLead: "Cloud-based zero-touch provisioning and lifecycle management across a distributed IR/IE fleet."
  },
  "catalyst-center": {
    slug: "catalyst-center",
    name: "Catalyst Center (DNA)",
    family: "On-prem Management",
    category: "Management / Orchestration",
    oneLiner: "On-prem assurance + automation for converged IT/OT networks.",
    highlights: [
      "SD-Access fabric with OT macro-segmentation",
      "AI-driven assurance and root-cause for industrial sites",
      "Closed-loop policy with ISE + Cyber Vision"
    ],
    useCases: ["Manufacturing / Factory", "Substation Automation", "Smart City"],
    whenToLead: "On-prem assurance and SD-Access automation for converged IT/OT sites that can't use cloud management."
  },
  "ess3300": {
    slug: "ess3300",
    name: "ESS3300",
    family: "Embedded Services Switch",
    category: "Embedded Network Module",
    oneLiner: "Board-level 10GE embedded switch built into defense and OEM platforms — no enclosure.",
    embedded: true,
    highlights: [
      "Conduction-cooled board — integrates inside the host system, no chassis",
      "Up to 8× 1GE + 2× 10GE, Layer 2/3 on Cisco IOS XE",
      "MIL-STD-810 / DO-160 capable, -40°C to +85°C for vehicles and aircraft"
    ],
    useCases: ["Military / Defense", "Transportation / Roadways", "Mining / Heavy Industry"],
    whenToLead: "Board-level switching embedded inside a defense or OEM platform — no enclosure, MIL-STD environments."
  },
  "esr6300": {
    slug: "esr6300",
    name: "ESR6300",
    family: "Embedded Services Router",
    category: "Embedded Network Module",
    oneLiner: "Compact board-level rugged router for unmanned, vehicle, and tactical OEM integration.",
    embedded: true,
    highlights: [
      "3.5\" × 3.5\" board module designed to embed inside OEM equipment",
      "Cisco IOS XE with SD-WAN, IPsec, and IOx edge compute",
      "-40°C to +85°C, shock/vibration rated for defense ground vehicles"
    ],
    useCases: ["Military / Defense", "Transportation / Roadways", "Oil & Gas / Utilities"],
    whenToLead: "Board-level routing embedded into unmanned, vehicle, or tactical OEM systems needing IOS XE + SD-WAN."
  }
};

export function getCisco(slug: string): CiscoProduct | undefined {
  return CISCO_IIOT[slug];
}

export const CISCO_LIST: CiscoProduct[] = Object.values(CISCO_IIOT);

/**
 * Best-guess Cisco SKU to recommend when no authored battlecard exists.
 * Used by the Quick Compare fallback so every competitor product still gets a
 * useful side-by-side, even before a battlecard is written or synthesized.
 */
export function defaultCiscoForCategory(category: string): CiscoProduct {
  const norm = category.toLowerCase();
  if (norm.includes("router")) return CISCO_IIOT["ir1101"]!;
  if (norm.includes("switch")) return CISCO_IIOT["ie3500"]!;
  if (norm.includes("wireless") || norm.includes("wi-fi") || norm.includes("ap"))
    return CISCO_IIOT["iw9167"]!;
  if (norm.includes("firewall")) return CISCO_IIOT["secure-firewall-3100"]!;
  if (norm.includes("visibility") || norm.includes("security") || norm.includes("ids"))
    return CISCO_IIOT["cyber-vision"]!;
  if (norm.includes("management") || norm.includes("orchestration") || norm.includes("dashboard"))
    return CISCO_IIOT["iot-ops-dashboard"]!;
  return CISCO_IIOT["ir1101"]!; // safe default — the most-deployed Cisco IIoT SKU
}
