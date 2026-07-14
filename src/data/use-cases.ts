import { Building2, Factory, Fuel, Mountain, ShieldCheck, TrainFront, Zap, type LucideIcon } from "lucide-react";
import type { Battlecard, CiscoProduct, UseCase } from "@/lib/types";
import { CISCO_LIST } from "@/data/cisco-iiot";
import { BATTLECARDS } from "@/data/battlecards";
import { slugify } from "@/lib/utils";

/**
 * Use-case taxonomy for the /use-cases discovery pages.
 *
 * Every Cisco SKU in `cisco-iiot.ts` is tagged with the industry use cases it
 * fits (the `useCases` field). This module is the reverse index: given a use
 * case, which Cisco products and competitor battlecards are relevant. The
 * compare page renders each `card.useCases` entry as a clickable link here.
 */
export interface UseCaseMeta {
  label: UseCase;
  slug: string;
  icon: LucideIcon;
  /** Brand accent hex — used as the icon tint on cards and headers. */
  accent: string;
  blurb: string;
  /** Short sales pitch prompts a seller can open the conversation with. */
  pitch: {
    /** Questions to ask the customer first. */
    discovery: string[];
    /** How to frame the Cisco story for this environment. */
    positioning: string[];
    /** Signals that confirm this is a real, qualified opportunity. */
    qualification: string[];
  };
}

// Display order is curated (most-common first), not alphabetical.
export const USE_CASES: UseCaseMeta[] = [
  {
    label: "Manufacturing / Factory",
    slug: slugify("Manufacturing / Factory"),
    icon: Factory,
    accent: "#049fd9",
    blurb:
      "Plant floors and production cells — deterministic networking, on-box OT visibility, and edge compute right at the machine.",
    pitch: {
      discovery: [
        "How are you discovering and inventorying OT assets on the plant floor today?",
        "Do you have plans for edge analytics or MES integration at the cell?",
        "Is your IT team already standardized on Cisco in the campus or data center?"
      ],
      positioning: [
        "One IOS XE stack from the plant floor to the data center — no parallel OT skillset.",
        "Cyber Vision asset visibility is embedded in the switch, not a bolt-on appliance."
      ],
      qualification: [
        "Mixed-vendor PLC environment (Rockwell, Siemens, Schneider).",
        "Active IEC 62443 segmentation or OT security mandate."
      ]
    }
  },
  {
    label: "Substation Automation",
    slug: slugify("Substation Automation"),
    icon: Zap,
    accent: "#f59e0b",
    blurb:
      "Grid substations and IEC 61850 process bus — PRP/HSR redundancy, precise timing, and KEMA-grade ruggedization.",
    pitch: {
      discovery: [
        "How are you handling IEC 61850 process bus and timing (PTP / PRP / HSR) today?",
        "How do you report IEC 62443 zones and conduits to auditors?",
        "Does your SOC or SIEM have any visibility into substation traffic?"
      ],
      positioning: [
        "KEMA-tested IEC 61850-3 / IEEE 1613 hardware with Cyber Vision DPI for GOOSE/MMS built in.",
        "Run the substation fleet and the corporate WAN from one Catalyst Center."
      ],
      qualification: [
        "Digital-substation modernization or new-build program underway.",
        "Utility already runs Cisco in the corporate network."
      ]
    }
  },
  {
    label: "Oil & Gas / Utilities",
    slug: slugify("Oil & Gas / Utilities"),
    icon: Fuel,
    accent: "#0ea5e9",
    blurb:
      "Pipelines, wellheads, and distribution — remote cellular connectivity, hazardous-area readiness, and secure SCADA backhaul.",
    pitch: {
      discovery: [
        "How are remote sites backhauled today — cellular, MPLS, or satellite?",
        "What's your 5G upgrade path over the next 3–5 years?",
        "How are you securing SCADA / DNP3 traffic over public networks?"
      ],
      positioning: [
        "Pluggable 5G means a multi-year rollout never becomes a forklift.",
        "Zero-touch provisioning and SD-WAN policy reused straight from the IT side."
      ],
      qualification: [
        "Hundreds of distributed or remote unmanned sites.",
        "Hazardous-area or harsh-environment requirements."
      ]
    }
  },
  {
    label: "Transportation / Roadways",
    slug: slugify("Transportation / Roadways"),
    icon: TrainFront,
    accent: "#6366f1",
    blurb:
      "Roadside cabinets, rail, transit, and fleet — vehicle-grade certifications, dual 5G, and GNSS for assets on the move.",
    pitch: {
      discovery: [
        "Are the assets fixed (roadside cabinets) or mobile (fleet, rail)?",
        "Do you need vehicle certifications (E-Mark, EN 50155) or onboard GNSS?",
        "What are your handoff and latency requirements for moving assets?"
      ],
      positioning: [
        "Vehicle-grade routers with dual 5G active-active and dead-reckoning GNSS.",
        "Ultra-Reliable Wireless Backhaul (URWB) for sub-50ms handoff on moving assets."
      ],
      qualification: [
        "Transit, rail, fleet, or ITS roadway program.",
        "Mobility-critical (AGVs, trains, cranes) connectivity in scope."
      ]
    }
  },
  {
    label: "Mining / Heavy Industry",
    slug: slugify("Mining / Heavy Industry"),
    icon: Mountain,
    accent: "#b45309",
    blurb:
      "Pits, ports, and harsh outdoor sites — sealed IP67 enclosures, ultra-reliable wireless backhaul, and shock-rated gear.",
    pitch: {
      discovery: [
        "Are devices deployed outside enclosures or in harsh wet/dusty zones?",
        "How do you connect mobile equipment (haul trucks, draglines, cranes)?",
        "What temperature and ingress (IP) spec does the site demand?"
      ],
      positioning: [
        "IP67 sealed switches operate outside cabinets — eliminate field enclosures entirely.",
        "URWB delivers deterministic wireless backhaul for mobile heavy assets."
      ],
      qualification: [
        "Outdoor or sealed deployment (IP67, M12 connectors).",
        "Mobile-asset connectivity across a pit or port environment."
      ]
    }
  },
  {
    label: "Smart City",
    slug: slugify("Smart City"),
    icon: Building2,
    accent: "#10b981",
    blurb:
      "Intersections, lighting, and public infrastructure — dense connectivity and centralized fleet management at city scale.",
    pitch: {
      discovery: [
        "How many sites or intersections, and what's the management model?",
        "Who operates the network — city IT, a contractor, or a mix?",
        "Are you consolidating vendor silos (lighting, traffic, public safety)?"
      ],
      positioning: [
        "One cloud dashboard (IoT Operations) for the entire city fleet, with zero-touch provisioning.",
        "Standardize cabinet switching and routing on the same stack as city IT."
      ],
      qualification: [
        "Multi-domain rollout spanning lighting, traffic, and safety.",
        "Centralized-management mandate across thousands of endpoints."
      ]
    }
  },
  {
    label: "Military / Defense",
    slug: slugify("Military / Defense"),
    icon: ShieldCheck,
    accent: "#64748b",
    blurb:
      "Tactical, vehicle, and unmanned platforms — embedded board-level modules, MIL-STD ruggedization, and assured connectivity.",
    pitch: {
      discovery: [
        "Is this a manned platform, an unmanned system, or a fixed tactical site?",
        "Do you need board-level integration into an existing OEM platform?",
        "Which ruggedization and assurance standards apply (MIL-STD-810, DO-160, FIPS)?"
      ],
      positioning: [
        "Board-level ESS3300 / ESR6300 embed Cisco IOS XE inside the platform — no enclosure, no rack space.",
        "Same SD-WAN, IPsec, and IOx as the enterprise — assured, certifiable connectivity."
      ],
      qualification: [
        "OEM or SI integrating networking into a vehicle, aircraft, or unmanned system.",
        "MIL-STD / DO-160 environmental and security requirements."
      ]
    }
  }
];

export function useCaseSlug(label: UseCase): string {
  return slugify(label);
}

export function useCaseBySlug(slug: string): UseCaseMeta | undefined {
  return USE_CASES.find((u) => u.slug === slug);
}

export function useCaseByLabel(label: UseCase): UseCaseMeta | undefined {
  return USE_CASES.find((u) => u.label === label);
}

/** Cisco SKUs tagged for a given use case, in catalog order. */
export function ciscoProductsForUseCase(label: UseCase): CiscoProduct[] {
  return CISCO_LIST.filter((p) => (p.useCases ?? []).includes(label));
}

/** Authored competitor battlecards that target a given use case. */
export function battlecardsForUseCase(label: UseCase): Battlecard[] {
  return Object.values(BATTLECARDS).filter((c) => c.useCases.includes(label));
}

/** How many Cisco SKUs fit a use case — used for the index grid counts. */
export function useCaseProductCount(label: UseCase): number {
  return ciscoProductsForUseCase(label).length;
}
