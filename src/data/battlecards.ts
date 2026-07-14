import type { Battlecard } from "@/lib/types";

const NOW = "2026-06-06T00:00:00Z";

/**
 * Mocked battlecard registry.
 *
 * Key: `${competitorSlug}:${competitorProductSlug}`
 *
 * In production these will be generated on demand by `lib/orchestrator.ts`
 * by calling Cisco Circuit, the Cisco Docs MCP, CDETS MCP, Webex MCP, and
 * a public-web fetcher. The shape returned must match `Battlecard`.
 */
export const BATTLECARDS: Record<string, Battlecard> = {
  "fortinet:fortigate-rugged-60f": {
    competitorSlug: "fortinet",
    competitorProductSlug: "fortigate-rugged-60f",
    competitorProductName: "FortiGate Rugged 60F",
    ciscoRecommendation: {
      primarySlug: "ir1101",
      bundleSlugs: ["cyber-vision", "iot-ops-dashboard"],
      summary:
        "Lead with IR1101 + Cyber Vision. Customers buying FGR-60F want security at the edge — Cisco delivers OT visibility AND connectivity in one device, with cellular options Fortinet can't match."
    },
    useCases: ["Manufacturing / Factory", "Oil & Gas / Utilities"],
    pillars: [
      {
        title: "OT visibility is built-in, not bolted on",
        icon: "eye",
        body:
          "The IR1101 hosts the Cyber Vision sensor natively via IOx — no SPAN port, no extra appliance. Fortinet requires FortiGate + a separate FortiSIEM/FortiSwitch deployment to approach the same OT context.",
        proof: "Cyber Vision identifies assets via DPI of 40+ industrial protocols (Modbus, S7, EtherNet/IP, IEC 61850)."
      },
      {
        title: "Cellular + 5G as a first-class citizen",
        icon: "wifi",
        body:
          "IR1101 supports dual modular 5G modems with carrier aggregation. FGR-60F is single LTE only; 5G requires the much larger FGR-70G.",
        proof: "Field-replaceable Pluggable Module Interface Modules (PIMs) for 5G Sub-6 and mmWave."
      },
      {
        title: "One control plane, IT and OT",
        icon: "layers",
        body:
          "IOS XE + Catalyst Center + ISE = same policy fabric the customer's IT team already runs. Fortinet asks the OT team to learn a separate FortiOS + FortiManager stack.",
        proof: "TrustSec SGT segmentation propagates from data center to the factory floor."
      },
      {
        title: "Lower TCO at the cell",
        icon: "spark",
        body:
          "IR1101 replaces a separate router, switch, security sensor, and edge compute box. FGR-60F still needs a separate switch and visibility platform.",
        proof: "Average customer reports 30–40% fewer SKUs per cell when consolidating onto IR1101."
      }
    ],
    specs: [
      { label: "Form factor", competitor: "DIN-rail, fanless", cisco: "DIN-rail, fanless", winner: "tie" },
      { label: "Operating temperature", competitor: "-40°C to +60°C", cisco: "-40°C to +75°C", winner: "cisco" },
      { label: "Cellular", competitor: "Single LTE Cat 6", cisco: "Dual 5G Sub-6 / mmWave (modular)", winner: "cisco" },
      { label: "Edge compute", competitor: "None on box", cisco: "IOx app hosting (Docker/LXC)", winner: "cisco" },
      { label: "OT protocol DPI", competitor: "App control + IPS signatures", cisco: "Cyber Vision sensor on-box (40+ protocols)", winner: "cisco" },
      { label: "Throughput (FW)", competitor: "~10 Gbps (claimed)", cisco: "Pair with Secure Firewall 3110 (17 Gbps) for high-throughput OT DMZ", winner: "tie" },
      { label: "Management", competitor: "FortiManager", cisco: "IoT Ops Dashboard + Catalyst Center", winner: "cisco" }
    ],
    knownIssues: [
      {
        id: "FG-IR-23-XXX",
        severity: "High",
        title: "FortiOS SSL-VPN heap overflow — multiple advisories across 2023-2024",
        source: "Fortinet PSIRT",
        url: "https://www.fortiguard.com/psirt"
      },
      {
        id: "CISA-AA23-250A",
        severity: "Critical",
        title: "CISA advisory on actively-exploited FortiOS vulnerabilities",
        source: "CISA",
        url: "https://www.cisa.gov/news-events/cybersecurity-advisories"
      }
    ],
    references: [
      {
        industry: "Automotive Manufacturing",
        region: "EMEA",
        summary:
          "Tier-1 supplier replaced 120 FGR-60F sites with IR1101 + Cyber Vision; consolidated 4 SKUs into 1 and gained asset-level visibility their FortiGates never provided."
      },
      {
        industry: "Water Utility",
        region: "North America",
        summary:
          "Municipal water authority chose IR1101 over FGR-60F citing native 5G upgrade path and IEC 62443 compliance roadmap."
      }
    ],
    talkTrack: {
      opener:
        "Fortinet is a great firewall company — but they're asking you to layer security on top of an OT network they don't see into. Let me show you what 'security-by-design' looks like.",
      discovery: [
        "How are you discovering OT assets today — manually, or via DPI?",
        "Will you need 5G at any site in the next 36 months?",
        "Who owns OT policy — your IT security team or your controls engineers?",
        "Are you tracking IEC 62443 zone/conduit compliance?"
      ],
      proofPoints: [
        "IR1101 hosts the Cyber Vision sensor — no SPAN, no extra box, no extra license tier.",
        "Same TrustSec policy you run in the DC extends to PLCs and HMIs via SGT.",
        "Pluggable 5G means a 4-year deployment doesn't become a forklift in year 2."
      ],
      closer:
        "Let's pilot a single line: IR1101 + Cyber Vision + IoT Ops Dashboard. You'll have an inventory of every PLC, drive, and HMI on that line within 24 hours — and a Fortinet-free roadmap to scale it."
    },
    tcoNote:
      "Indicative 5-year TCO is ~22% lower on IR1101 vs. FGR-60F when you include the FortiSIEM and additional FortiSwitch licenses needed to match Cyber Vision's OT context.",
    lastUpdatedISO: NOW,
    sources: [
      { label: "Cisco IR1101 Datasheet", system: "Cisco Docs" },
      { label: "Cyber Vision solution overview", system: "Cisco Docs" },
      { label: "FortiGate Rugged 60F Datasheet (public)", system: "Public Web" },
      { label: "Fortinet PSIRT 2023-2024 advisories", system: "Public Web" },
      { label: "Compete-IIoT Webex space, Q1 2026 win wires", system: "Webex" }
    ]
  },

  "siemens:scalance-xc-200": {
    competitorSlug: "siemens",
    competitorProductSlug: "scalance-xc-200",
    competitorProductName: "Siemens Scalance XC-200",
    ciscoRecommendation: {
      primarySlug: "ie3500",
      bundleSlugs: ["cyber-vision", "catalyst-center"],
      summary:
        "Counter Scalance with IE3500 — Cisco's next-gen DIN-rail switch. Same PROFINET-aware form factor, plus TSN, IOx edge compute, embedded Cyber Vision, and the broader Cisco ecosystem the customer's IT team already runs. (IE3400 remains a drop-in alternative when standardizing on an existing IE3400 fleet.)"
      },
    useCases: ["Manufacturing / Factory", "Substation Automation"],
    pillars: [
      {
        title: "Break Siemens lock-in",
        icon: "compass",
        body:
          "Scalance is optimized for TIA Portal + Siemens PLCs. IE3500 is multi-vendor — manage Rockwell, Schneider, Mitsubishi, Beckhoff, and Siemens from a single fabric.",
        proof: "Customers running mixed PLC vendors report 50% faster troubleshooting on a unified Catalyst Center vs. TIA + third-party tools."
      },
      {
        title: "Embedded OT visibility",
        icon: "eye",
        body:
          "IE3500 runs the Cyber Vision sensor on-switch. Scalance XC-200 requires a separate Siemens RUGGEDCOM APE or third-party span+collector to approach the same insight.",
        proof: "Cyber Vision baselines normal PROFINET flows and detects anomalies in minutes."
      },
      {
        title: "Edge compute via IOx",
        icon: "cpu",
        body:
          "Run containers at the cell — vibration analytics, MES sync, asset twin agents — on the same switch that's already there. Scalance has no app hosting.",
        proof: "Cisco IOx supports Docker and signed LXC containers with full lifecycle from Catalyst Center."
      },
      {
        title: "Common stack with IT",
        icon: "layers",
        body:
          "IOS XE on the plant floor is identical to the IOS XE in the data center — same CLI, same automation (NETCONF/YANG), same SD-Access. Scalance lives on its own island.",
        proof: "Day-2 ops handled by existing NetOps team; no specialist OT NMS skillset required."
      }
    ],
    specs: [
      { label: "Ring redundancy", competitor: "MRP / HRP", cisco: "MRP, PRP, HSR, REP, STP", winner: "cisco" },
      { label: "PROFINET conformance", competitor: "Conformance Class B", cisco: "Conformance Class B (with PTP)", winner: "tie" },
      { label: "Time sync", competitor: "PTPv2", cisco: "PTPv2 + IEEE 1588 default profile + Power profile", winner: "cisco" },
      { label: "Edge compute", competitor: "None", cisco: "IOx (Docker / LXC)", winner: "cisco" },
      { label: "OT visibility", competitor: "Third-party / Ruggedcom APE", cisco: "Embedded Cyber Vision sensor", winner: "cisco" },
      { label: "Segmentation", competitor: "VLAN + static ACL", cisco: "TrustSec SGTs end-to-end", winner: "cisco" },
      { label: "Management", competitor: "SINEC NMS / TIA", cisco: "Catalyst Center + IoT Ops Dashboard", winner: "cisco" }
    ],
    knownIssues: [
      {
        id: "SSA-XXXXXX",
        severity: "High",
        title: "Multiple Scalance firmware advisories (2024-2025) — TCP/IP and web UI issues",
        source: "Siemens ProductCERT",
        url: "https://cert-portal.siemens.com/productcert/"
      }
    ],
    references: [
      {
        industry: "Discrete Manufacturing",
        region: "DACH",
        summary:
          "Automotive Tier-1 standardized on IE3500 over Scalance to enable a multi-vendor PLC strategy and gain Cyber Vision visibility across 18 plants."
      }
    ],
    talkTrack: {
      opener:
        "Scalance is a great choice if you only run Siemens — but it locks you into one PLC vendor's ecosystem. IE3500 keeps your options open while adding visibility Scalance doesn't have.",
      discovery: [
        "Do you have any non-Siemens PLCs today or in your 3-year roadmap?",
        "How does your IT NetOps team see into the OT network today?",
        "Do you have plans for edge analytics (vibration, MES, AI)?",
        "What's your current TIA + SINEC license footprint?"
      ],
      proofPoints: [
        "Same DIN-rail PROFINET switch capabilities — and IOx edge compute on top.",
        "Cyber Vision = embedded asset inventory in week 1.",
        "Catalyst Center automation = the same playbook your campus team already uses."
      ],
      closer:
        "Let's pilot one cell with IE3500 + Cyber Vision. You'll see every device, every flow, and every anomaly — and your IT team won't need a SINEC license to do it."
    },
    tcoNote:
      "When you include SINEC NMS, RUGGEDCOM APE for visibility, and TIA engineering hours, IE3500 + Cyber Vision is typically 15–20% lower TCO over 5 years.",
    lastUpdatedISO: NOW,
    sources: [
      { label: "Cisco Catalyst IE3500 Datasheet", system: "Cisco Docs" },
      { label: "Cyber Vision protocol support matrix", system: "Cisco Docs" },
      { label: "Scalance XC-200 datasheet (public)", system: "Public Web" },
      { label: "Siemens ProductCERT advisories", system: "Public Web" }
    ]
  },

  "moxa:eds-g500e": {
    competitorSlug: "moxa",
    competitorProductSlug: "eds-g500e",
    competitorProductName: "Moxa EDS-G500E",
    ciscoRecommendation: {
      primarySlug: "ie3100",
      bundleSlugs: ["cyber-vision"],
      summary:
        "When the deal is price-led, IE3100 closes the gap. Customer gets Cisco-grade software stack and Cyber Vision-ready hardware at a Moxa-competitive price point."
    },
    useCases: ["Manufacturing / Factory", "Smart City"],
    pillars: [
      {
        title: "Buy the network you'll need in 3 years",
        icon: "clock",
        body:
          "Moxa is cheap day 1. IE3100 keeps you on IOS XE — meaning the same switch upgrades into SD-Access, TrustSec, MACsec, and Cyber Vision as needs grow.",
        proof: "Common image with IE3200/3300/3400 — no rip-and-replace as the site matures."
      },
      {
        title: "Real software lifecycle",
        icon: "shield",
        body:
          "Cisco publishes a 7+ year hardware lifecycle and predictable IOS XE release cadence. Moxa EDS software is feature-stable but not engineered for active threat response.",
        proof: "Cisco PSIRT publishes monthly advisories with patched releases; CVSS scored and tracked."
      },
      {
        title: "Visibility-ready from day one",
        icon: "eye",
        body:
          "Even at the price-led tier, IE3100 sends NetFlow + IPFIX into Cyber Vision Center. Moxa offers basic SNMP/syslog only.",
        proof: "Cyber Vision Center accepts flow exports from any IE3x00 switch."
      },
      {
        title: "Single pane of glass with the rest of the network",
        icon: "layers",
        body:
          "IE3100 is managed by Catalyst Center / IoT Ops Dashboard — the same tools as Cisco campus switches. Moxa requires MX-View as a separate NMS.",
        proof: "Zero-touch provisioning of IE3100 via IoT Ops Dashboard in minutes."
      }
    ],
    specs: [
      { label: "Port density", competitor: "5x GE", cisco: "8x GE (IE3100-8T)", winner: "cisco" },
      { label: "Operating temperature", competitor: "-40°C to +75°C", cisco: "-40°C to +75°C", winner: "tie" },
      { label: "PoE", competitor: "No", cisco: "Up to 240W PoE+ (IE3100 PoE variant)", winner: "cisco" },
      { label: "Software stack", competitor: "Moxa EDS firmware", cisco: "IOS XE", winner: "cisco" },
      { label: "Visibility", competitor: "SNMP / syslog", cisco: "NetFlow + Cyber Vision-ready", winner: "cisco" },
      { label: "Management", competitor: "MX-View", cisco: "Catalyst Center + IoT Ops Dashboard", winner: "cisco" },
      { label: "List price (street)", competitor: "$", cisco: "$ (IE3100 is the Cisco entry tier)", winner: "tie" }
    ],
    knownIssues: [
      {
        id: "MPSA-XXXX",
        severity: "Medium",
        title: "Moxa EDS-series firmware advisories — periodic auth and HTTP issues",
        source: "Moxa PSIRT",
        url: "https://www.moxa.com/en/support/product-support/security-advisory"
      }
    ],
    references: [
      {
        industry: "Smart City Lighting",
        region: "APAC",
        summary:
          "City of 1.2M streetlights migrated cabinet switches from Moxa to IE3100 to standardize on a single NMS with the rest of the city network."
      }
    ],
    talkTrack: {
      opener:
        "Moxa wins on price-per-port — but the second a customer needs visibility, segmentation, or a security update, the cost equation flips. IE3100 hits Moxa's price band with Cisco's lifecycle.",
      discovery: [
        "How many NMS tools is your team logging into today?",
        "What's your security update SLA for OT devices?",
        "Do you need PoE for cameras, APs, or sensors at the edge?",
        "Is there an enterprise Cisco footprint in this organization already?"
      ],
      proofPoints: [
        "IE3100 = entry tier IOS XE switch, priced to compete with Moxa.",
        "Same management as Cisco campus switches.",
        "Cyber Vision flow export works on IE3100 — visibility built in for the price-led tier."
      ],
      closer:
        "Quote IE3100 next to the Moxa BOM. You'll be within a few percentage points on hardware — and miles ahead on software lifecycle and visibility."
    },
    lastUpdatedISO: NOW,
    sources: [
      { label: "Catalyst IE3100 Datasheet", system: "Cisco Docs" },
      { label: "Moxa EDS-G500E datasheet (public)", system: "Public Web" }
    ]
  },

  "nokia:7250-ixr": {
    competitorSlug: "nokia",
    competitorProductSlug: "7250-ixr",
    competitorProductName: "Nokia 7250 IXR",
    ciscoRecommendation: {
      primarySlug: "ir8300",
      bundleSlugs: ["ie9300", "cyber-vision", "catalyst-center"],
      summary:
        "For utility teleprotection and substation backbones, lead with IR8300 + IE9300. Cisco brings comparable IP/MPLS, plus a far stronger industrial security story (Cyber Vision + ISE) and one ecosystem for IT and OT."
    },
    useCases: ["Substation Automation", "Oil & Gas / Utilities", "Transportation / Roadways"],
    pillars: [
      {
        title: "MPLS, segment routing, and SD-WAN — without the OSS lift",
        icon: "globe",
        body:
          "IR8300 supports MPLS-TE, SR-MPLS, EVPN, and SD-WAN concurrently. Nokia's SR OS is excellent but typically requires NSP/NFM-P — a heavy OSS commitment.",
        proof: "Customers operate IR8300 fabrics from Catalyst Center with the same automation as their core."
      },
      {
        title: "Substation security as one fabric",
        icon: "shield",
        body:
          "IR8300 + IE9300 + Cyber Vision delivers IEC 62443 zone/conduit segmentation, asset visibility, and MACsec. Nokia routers segment well but rely on third parties for OT visibility.",
        proof: "Cyber Vision discovers IEC 61850 GOOSE, MMS, and DNP3 flows automatically."
      },
      {
        title: "Common stack with the rest of the utility",
        icon: "layers",
        body:
          "Run the substation fleet with the same Catalyst Center, ISE, and DNAC playbooks as the corporate WAN. Nokia is a parallel skillset.",
        proof: "Single NOC tooling reduces MTTR by 30–50% in utility benchmarks."
      },
      {
        title: "Field-proven IEC 61850-3 / IEEE 1613",
        icon: "wrench",
        body:
          "IE9300 + IR8300 are both rated for high-voltage substation environments with the certifications utility GIS auditors expect.",
        proof: "KEMA-tested, deployed in 100+ ISO/RTO and IOU networks."
      }
    ],
    specs: [
      { label: "Routing protocols", competitor: "ISIS, OSPF, BGP, SR-MPLS, EVPN", cisco: "ISIS, OSPF, BGP, SR-MPLS, EVPN, SD-WAN", winner: "tie" },
      { label: "MACsec at scale", competitor: "Yes", cisco: "Yes (AES-256, 256-bit GCM)", winner: "tie" },
      { label: "OT protocol visibility", competitor: "Telemetry export only", cisco: "Embedded Cyber Vision sensor (GOOSE, MMS, DNP3, IEC 60870)", winner: "cisco" },
      { label: "Substation cert", competitor: "IEC 61850-3 / IEEE 1613", cisco: "IEC 61850-3 / IEEE 1613", winner: "tie" },
      { label: "Operating temp", competitor: "-40°C to +65°C", cisco: "-40°C to +75°C", winner: "cisco" },
      { label: "Management", competitor: "Nokia NSP / NFM-P", cisco: "Catalyst Center + IoT Ops Dashboard", winner: "cisco" },
      { label: "IT/OT convergence", competitor: "Separate OSS for IT and OT", cisco: "One fabric, one policy, one tool", winner: "cisco" }
    ],
    knownIssues: [
      {
        id: "Nokia-SA-XXXX",
        severity: "Medium",
        title: "Nokia SR OS periodic security advisories — review feed for 2024-2025",
        source: "Nokia PSIRT",
        url: "https://www.nokia.com/networks/security-advisories/"
      }
    ],
    references: [
      {
        industry: "Investor-owned Utility",
        region: "North America",
        summary:
          "Replaced 60-substation Nokia 7705 SAR footprint with IR8300 + IE9300 to unify with the utility's existing Catalyst-based WAN, gaining Cyber Vision visibility across all 60 substations."
      }
    ],
    talkTrack: {
      opener:
        "Nokia builds great service provider routers — but utilities aren't service providers. You need IP/MPLS AND IEC 62443 OT visibility in one fabric. Cisco delivers both.",
      discovery: [
        "How are you doing IEC 62443 zone/conduit reporting today?",
        "Do you have an NSP or NFM-P deployment funded for the substation fleet?",
        "How is your DC and WAN built? Is the OT team aligned with that vendor?",
        "What's the OT visibility plan — and who pays for it?"
      ],
      proofPoints: [
        "IR8300 + IE9300 do MPLS / SR-MPLS at substation grade.",
        "Cyber Vision sensor lives IN the switch — no extra appliance per substation.",
        "Catalyst Center is one tool for IT and OT engineers — no NSP duopoly."
      ],
      closer:
        "Let's compare a single substation BOM: IR8300 + IE9300 + Cyber Vision vs. 7705 SAR + 3rd-party visibility. The Cisco BOM is lower and the OT story is dramatically stronger."
    },
    tcoNote:
      "Eliminating a parallel OSS (NSP/NFM-P) typically saves 15–25% over 5 years on substation modernization programs.",
    lastUpdatedISO: NOW,
    sources: [
      { label: "Cisco IR8300 Datasheet", system: "Cisco Docs" },
      { label: "Cisco Catalyst IE9300 Datasheet", system: "Cisco Docs" },
      { label: "Cyber Vision IEC 61850 protocol guide", system: "Cisco Docs" },
      { label: "Nokia 7250 IXR public datasheet", system: "Public Web" }
    ]
  },

  "hpe-aruba:cx-4100i": {
    competitorSlug: "hpe-aruba",
    competitorProductSlug: "cx-4100i",
    competitorProductName: "Aruba CX 4100i",
    ciscoRecommendation: {
      primarySlug: "ie3500",
      bundleSlugs: ["cyber-vision", "catalyst-center"],
      summary:
        "Aruba CX 4100i is HPE's first real industrial play and lacks the OT depth Cisco has built over a decade. Lead IE3500 + Cyber Vision — Cisco's newest-generation DIN-rail switch. (IE3400 is an equally valid lead for customers extending an existing IE3400 footprint.)"
    },
    useCases: ["Manufacturing / Factory", "Smart City"],
    pillars: [
      {
        title: "Decade-long IIoT product line",
        icon: "clock",
        body:
          "IE3500 is the newest generation of Cisco's industrial DIN-rail line. CX 4100i is HPE's first attempt — limited feature parity with their AOS-CX campus line.",
        proof: "Cisco has shipped >2M industrial switches globally; HPE Aruba is still building installed base."
      },
      {
        title: "Native OT visibility",
        icon: "eye",
        body:
          "IE3500 hosts Cyber Vision. Aruba's OT story is ClearPass + Aruba IoT — useful for IoT onboarding, but not deep PROFINET/EtherNet/IP DPI.",
        proof: "Cyber Vision DPI vs. ClearPass profiling — different problem, different depth."
      },
      {
        title: "Edge compute (IOx)",
        icon: "cpu",
        body:
          "IE3500 hosts containers for OT analytics. CX 4100i has no equivalent.",
        proof: "Cisco IOx: production Docker hosting on the switch, lifecycle-managed."
      },
      {
        title: "Field-proven hardware",
        icon: "wrench",
        body:
          "IE3500 ships with PRP/HSR, REP, MRP and is certified to substation grade (IEC 61850-3). CX 4100i is hardened for industrial but lacks the substation cert depth.",
        proof: "Cisco IE3500 has the broadest ring/redundancy protocol support in the industry."
      }
    ],
    specs: [
      { label: "Ring protocols", competitor: "STP / MSTP", cisco: "MRP, PRP, HSR, REP, STP, MSTP", winner: "cisco" },
      { label: "Edge compute", competitor: "None", cisco: "IOx (Docker / LXC)", winner: "cisco" },
      { label: "OT visibility", competitor: "ClearPass profiling", cisco: "Embedded Cyber Vision sensor", winner: "cisco" },
      { label: "Substation cert", competitor: "Industrial hardened", cisco: "IEC 61850-3 / IEEE 1613", winner: "cisco" },
      { label: "Management", competitor: "Aruba Central", cisco: "Catalyst Center + IoT Ops Dashboard", winner: "tie" },
      { label: "Segmentation", competitor: "Dynamic Segmentation + UPoE", cisco: "TrustSec SGTs", winner: "tie" }
    ],
    knownIssues: [
      {
        id: "ARUBA-PSA-XXXX",
        severity: "Medium",
        title: "Aruba AOS-CX security advisories — review for relevant CVEs",
        source: "Aruba Security",
        url: "https://www.arubanetworks.com/support-services/security-bulletins/"
      }
    ],
    references: [
      {
        industry: "Food & Beverage",
        region: "North America",
        summary:
          "Migrated a 22-plant HPE Procurve / early CX deployment to IE3500 + Cyber Vision; gained PROFINET DPI and unified policy with the campus."
      }
    ],
    talkTrack: {
      opener:
        "Aruba's CX 4100i is a good campus switch wearing an industrial jacket. IE3500 is purpose-built — and it's the only DIN-rail switch with Cyber Vision baked in.",
      discovery: [
        "What's your existing OT visibility approach — ClearPass, span+SIEM, or nothing?",
        "Do you have substation or any IEC 61850 use cases?",
        "Are you planning edge analytics or MES integrations?",
        "What's the IT side of the house standardized on?"
      ],
      proofPoints: [
        "Cyber Vision on-switch = no parallel collector infrastructure.",
        "MRP/PRP/HSR support for high-availability rings.",
        "IOx app hosting for OT edge compute."
      ],
      closer:
        "Let's compare a single line BOM: IE3500 + Cyber Vision vs. CX 4100i + ClearPass + Aruba IoT. The Cisco BOM is leaner and the OT context is far deeper."
    },
    lastUpdatedISO: NOW,
    sources: [
      { label: "Catalyst IE3500 Datasheet", system: "Cisco Docs" },
      { label: "Aruba CX 4100i datasheet (public)", system: "Public Web" }
    ]
  },

  "hirschmann:rsp-series": {
    competitorSlug: "hirschmann",
    competitorProductSlug: "rsp-series",
    competitorProductName: "Hirschmann RSP",
    ciscoRecommendation: {
      primarySlug: "ie9300",
      bundleSlugs: ["cyber-vision"],
      summary:
        "Hirschmann RSP is the substation incumbent for European utilities. IE9300 matches the certifications and adds Cyber Vision plus the broader Cisco ecosystem."
    },
    useCases: ["Substation Automation", "Oil & Gas / Utilities"],
    pillars: [
      {
        title: "Substation-grade certification parity",
        icon: "wrench",
        body:
          "IE9300 meets IEC 61850-3, IEEE 1613, and KEMA — the same bar RSP customers expect. Hirschmann's edge has historically been certifications; Cisco closed that gap.",
        proof: "IE9300 KEMA-tested and deployed in multiple European TSOs."
      },
      {
        title: "Cyber Vision changes the conversation",
        icon: "eye",
        body:
          "Hirschmann customers usually pair RSP with a separate IDS appliance. IE9300 has Cyber Vision built in — IEC 61850 GOOSE/MMS DPI included.",
        proof: "Reduces substation network kit by one to two units per bay."
      },
      {
        title: "One vendor, IT and OT",
        icon: "layers",
        body:
          "Utility IT teams almost universally run Cisco in the corporate network. IE9300 unifies the operational tooling.",
        proof: "Catalyst Center automates substation + corporate fabric from one console."
      },
      {
        title: "Lifecycle and supply confidence",
        icon: "shield",
        body:
          "Cisco's industrial supply chain, lifecycle, and PSIRT cadence is industry-leading and aligned to utility procurement risk controls.",
        proof: "Cisco publishes ISO 27001-aligned secure development lifecycle for IIoT products."
      }
    ],
    specs: [
      { label: "Substation cert", competitor: "IEC 61850-3 / IEEE 1613", cisco: "IEC 61850-3 / IEEE 1613 (KEMA tested)", winner: "tie" },
      { label: "Ring protocols", competitor: "HiPER-Ring / MRP / PRP / HSR", cisco: "MRP / PRP / HSR / REP", winner: "tie" },
      { label: "OT visibility", competitor: "External IDS", cisco: "Embedded Cyber Vision", winner: "cisco" },
      { label: "Segmentation", competitor: "VLAN + ACL", cisco: "TrustSec SGT", winner: "cisco" },
      { label: "Software lifecycle", competitor: "HiOS", cisco: "IOS XE (shared with enterprise)", winner: "cisco" }
    ],
    knownIssues: [
      {
        id: "BSECV-XXXX",
        severity: "Medium",
        title: "Belden / Hirschmann HiOS advisories — periodic firmware updates",
        source: "Belden Security",
        url: "https://www.belden.com/support/security-assurance"
      }
    ],
    references: [
      {
        industry: "TSO (Transmission)",
        region: "EMEA",
        summary:
          "European TSO standardized on IE9300 for new digital substations citing Cyber Vision integration as the deciding factor over Hirschmann RSP."
      }
    ],
    talkTrack: {
      opener:
        "Hirschmann owned substation Ethernet for two decades, but the game has changed. Visibility and segmentation matter as much as ring redundancy now — and that's where IE9300 wins.",
      discovery: [
        "How are you reporting IEC 62443 zones today?",
        "Do you have a SOC view into substation traffic?",
        "What's your existing IT vendor for the corporate WAN?",
        "How are you planning for the digital substation modernization?"
      ],
      proofPoints: [
        "IEC 61850-3 + IEEE 1613 with KEMA testing — parity with RSP.",
        "Cyber Vision on-switch — RSP needs an extra appliance per substation.",
        "Catalyst Center automation across IT and OT."
      ],
      closer:
        "Run a single substation pilot: IE9300 + Cyber Vision. The visibility you get on day one is what's missing from your RSP fleet today."
    },
    lastUpdatedISO: NOW,
    sources: [
      { label: "Catalyst IE9300 Datasheet", system: "Cisco Docs" },
      { label: "Cyber Vision for substations", system: "Cisco Docs" },
      { label: "Hirschmann RSP datasheet (public)", system: "Public Web" }
    ]
  },

  "phoenix-contact:fl-switch-2000": {
    competitorSlug: "phoenix-contact",
    competitorProductSlug: "fl-switch-2000",
    competitorProductName: "Phoenix Contact FL Switch 2000",
    ciscoRecommendation: {
      primarySlug: "ie3200",
      bundleSlugs: ["cyber-vision"],
      summary:
        "FL Switch 2000 competes at the entry managed tier. Counter with IE3200 — same DIN-rail form factor, IOS XE, and Cyber Vision-ready."
    },
    useCases: ["Manufacturing / Factory"],
    pillars: [
      {
        title: "Same hardware tier — better software",
        icon: "spark",
        body:
          "IE3200 is the entry managed IOS XE switch. Same DIN-rail footprint and price band as FL Switch 2000, but with IOS XE features (NETCONF, gRPC telemetry, automation).",
        proof: "Shared image with IE3300/3400 — easy upgrade path within the same software family."
      },
      {
        title: "Cyber Vision-ready out of the box",
        icon: "eye",
        body:
          "IE3200 streams flow data to Cyber Vision Center for OT context. FL Switch is SNMP/syslog only.",
        proof: "Cyber Vision Center accepts NetFlow from any IE3x00 switch in the fleet."
      },
      {
        title: "One management plane",
        icon: "layers",
        body:
          "IE3200 lives in Catalyst Center and IoT Ops Dashboard. FL Switch needs FL Network Manager — a separate skillset.",
        proof: "Zero-touch provisioning of IE3200 via IoT Ops Dashboard."
      },
      {
        title: "Cisco lifecycle",
        icon: "shield",
        body:
          "Predictable IOS XE release cadence, PSIRT advisories, and 7-year hardware lifecycle.",
        proof: "Cisco PSIRT publishes monthly advisories with patched releases."
      }
    ],
    specs: [
      { label: "Port count", competitor: "8-port GE", cisco: "8-port GE (IE3200-8T)", winner: "tie" },
      { label: "Form factor", competitor: "DIN-rail, fanless", cisco: "DIN-rail, fanless", winner: "tie" },
      { label: "Software stack", competitor: "FL Switch firmware", cisco: "IOS XE", winner: "cisco" },
      { label: "OT visibility", competitor: "SNMP", cisco: "NetFlow + Cyber Vision-ready", winner: "cisco" },
      { label: "Automation", competitor: "Limited", cisco: "NETCONF / YANG / gRPC telemetry", winner: "cisco" },
      { label: "Management", competitor: "FL Network Manager", cisco: "Catalyst Center + IoT Ops Dashboard", winner: "cisco" }
    ],
    knownIssues: [
      {
        id: "VDE-XXXX",
        severity: "Medium",
        title: "Phoenix Contact periodic advisories via CERT@VDE",
        source: "CERT@VDE",
        url: "https://cert.vde.com/en/advisories/"
      }
    ],
    references: [
      {
        industry: "Plastics Manufacturing",
        region: "EMEA",
        summary:
          "Replaced FL Switch 2000 footprint with IE3200 to unify with the corporate Cisco network and prepare for Cyber Vision rollout."
      }
    ],
    talkTrack: {
      opener:
        "Phoenix Contact has loyal German customers but it lives in a silo. IE3200 gives you the same DIN-rail switch — with IOS XE and a visibility roadmap that lives with the rest of your network.",
      discovery: [
        "Is the IT side of your network already Cisco?",
        "Do you have any plan for OT visibility?",
        "How many NMS tools is your team logging into?",
        "Are you running any automation (Ansible, NETCONF)?"
      ],
      proofPoints: [
        "Same DIN-rail price/perf, with IOS XE.",
        "Cyber Vision-ready — visibility roadmap built in.",
        "Catalyst Center automation."
      ],
      closer:
        "Quote IE3200 next to the FL Switch BOM — you'll be price-competitive and dramatically ahead on software lifecycle."
    },
    lastUpdatedISO: NOW,
    sources: [
      { label: "Catalyst IE3200 Datasheet", system: "Cisco Docs" },
      { label: "FL Switch 2000 datasheet (public)", system: "Public Web" }
    ]
  },

  "palo-alto:pa-220r": {
    competitorSlug: "palo-alto",
    competitorProductSlug: "pa-220r",
    competitorProductName: "Palo Alto PA-220R",
    ciscoRecommendation: {
      primarySlug: "secure-firewall-3100",
      bundleSlugs: ["cyber-vision", "ir1101"],
      summary:
        "Palo Alto leads with NGFW + IoT Security (Zingbox). Counter with Secure Firewall 3100 + Cyber Vision + IR1101 — same NGFW depth, plus visibility embedded in the network (not bolted on as a SaaS upsell)."
    },
    useCases: ["Substation Automation", "Oil & Gas / Utilities", "Manufacturing / Factory"],
    pillars: [
      {
        title: "OT visibility without a SaaS license per device",
        icon: "eye",
        body:
          "Cyber Vision is licensed per sensor (the switch/router) and gives full DPI inventory. Palo Alto IoT Security charges per device — costs balloon at scale.",
        proof: "Cyber Vision discovers all OT assets from the network, no per-device subscription."
      },
      {
        title: "NGFW peer",
        icon: "shield",
        body:
          "Secure Firewall 3100 with Snort 3 + Encrypted Visibility Engine is a peer to PA-Series for OT DMZ duty. Talos and Unit 42 are both world-class — but Cisco's segmentation story integrates with the access layer in a way Palo Alto cannot match.",
        proof: "TrustSec SGTs from access switch to firewall = consistent enforcement."
      },
      {
        title: "One vendor for connectivity AND security",
        icon: "layers",
        body:
          "Cisco delivers the router (IR1101), switch (IE3x00), firewall (3100), and visibility (Cyber Vision) as one stack with one policy. Palo Alto is firewall-only — you'll still need a switching vendor.",
        proof: "Unified policy from ISE, applied at switch and firewall consistently."
      },
      {
        title: "Field-proven OT integration",
        icon: "wrench",
        body:
          "Cyber Vision asset tags flow directly into ISE and Secure Firewall policy. PA-220R requires IoT Security stitching to do the same.",
        proof: "OT asset tags become firewall policy objects automatically."
      }
    ],
    specs: [
      { label: "Form factor", competitor: "DIN-rail rugged firewall", cisco: "1RU rack firewall + network-embedded visibility", winner: "tie" },
      { label: "OT visibility", competitor: "IoT Security (per-device SaaS)", cisco: "Cyber Vision (per-sensor license)", winner: "cisco" },
      { label: "Segmentation", competitor: "App-ID + User-ID", cisco: "TrustSec SGT + Cyber Vision tags", winner: "cisco" },
      { label: "Threat intel", competitor: "Unit 42 / WildFire", cisco: "Talos + Encrypted Visibility Engine", winner: "tie" },
      { label: "Industrial protocols", competitor: "App-ID for major OT protocols", cisco: "Cyber Vision DPI for 40+ industrial protocols", winner: "cisco" },
      { label: "Connectivity", competitor: "Firewall only", cisco: "Full stack: router, switch, FW, visibility", winner: "cisco" }
    ],
    knownIssues: [
      {
        id: "PAN-SA-XXXX",
        severity: "High",
        title: "PAN-OS critical advisories — review CVE feed for 2024-2025 (multiple SSL/GP issues)",
        source: "Palo Alto Security",
        url: "https://security.paloaltonetworks.com/"
      }
    ],
    references: [
      {
        industry: "Pharmaceutical",
        region: "North America",
        summary:
          "Replaced PA-220R + IoT Security at 14 plants with Secure Firewall 3100 + Cyber Vision; consolidated licensing and eliminated per-device IoT Security charges."
      }
    ],
    talkTrack: {
      opener:
        "Palo Alto is excellent at NGFW. But OT visibility shouldn't be a per-device SaaS bill. Cisco gives you the firewall, the network, and the visibility — without the cumulative subscription.",
      discovery: [
        "How are you licensing IoT Security today — per device?",
        "How many OT assets will you have in 2-3 years?",
        "What's the relationship between your firewall and access layer policy?",
        "Are you operating Palo Alto and a third-party switching vendor?"
      ],
      proofPoints: [
        "Cyber Vision = per-sensor licensing, full OT DPI.",
        "TrustSec SGTs unify enforcement from access switch to firewall.",
        "Single vendor for the entire OT network."
      ],
      closer:
        "Let's compare 3-year TCO: Palo Alto PA-220R + IoT Security on N devices vs. Secure Firewall 3100 + Cyber Vision + Cisco access layer. The Cisco TCO is materially lower above ~500 OT devices."
    },
    tcoNote:
      "Per-device IoT Security subscription is a long-term TCO killer at OT scale. Cyber Vision's per-sensor (per switch/router) model scales linearly with the network, not the asset count.",
    lastUpdatedISO: NOW,
    sources: [
      { label: "Cisco Secure Firewall 3100 Datasheet", system: "Cisco Docs" },
      { label: "Cyber Vision licensing guide", system: "Cisco Docs" },
      { label: "PA-220R datasheet (public)", system: "Public Web" },
      { label: "Palo Alto Security advisories", system: "Public Web" }
    ]
  },
  "huawei:ar502gw": {
    competitorSlug: "huawei",
    competitorProductSlug: "ar502gw",
    competitorProductName: "Huawei NetEngine AR502GW-Lc-D-H",
    ciscoRecommendation: {
      primarySlug: "ir1101",
      bundleSlugs: ["cyber-vision", "iot-ops-dashboard"],
      summary:
        "Lead with IR1101 + Cyber Vision + IoT Operations Dashboard. Yes, AR502GW lists cheaper — but the customer is buying a 7-to-10 year asset. Frame the conversation around supply-chain risk (FCC/NDAA), IT/OT integration with the stack the IT team already runs, and a true 5G upgrade path. The 'cheaper sticker' evaporates once compliance, integration, and Huawei's spotty firmware cadence in industrial verticals are in the TCO."
    },
    useCases: ["Manufacturing / Factory", "Transportation / Roadways", "Oil & Gas / Utilities"],
    pillars: [
      {
        title: "Supply chain and regulatory risk are real costs",
        icon: "shield",
        body:
          "Huawei is on the FCC Covered List and prohibited from US federal-funded projects under NDAA §889. Many enterprise customers extend the same restriction by policy. Procuring Huawei into a 10-year industrial network creates a rip-and-replace exposure the day a regulator, insurer, or parent company changes posture.",
        proof: "FCC Public Notice DA 22-1234 and CISA guidance on covered telecom equipment in industrial control systems."
      },
      {
        title: "OT visibility is in the network, not a separate purchase",
        icon: "eye",
        body:
          "IR1101 hosts the Cyber Vision sensor natively via IOx. AR502GW offers no equivalent — Huawei's OT visibility story is iMaster NCE-Campus or a third-party tap, both of which add SKUs, integrators, and latency.",
        proof: "Cyber Vision DPI covers 40+ industrial protocols (Modbus, S7, EtherNet/IP, IEC 61850) directly on the gateway."
      },
      {
        title: "Same software, IT to OT",
        icon: "layers",
        body:
          "IOS XE on the IR1101 is the same kernel and CLI the customer's IT team already runs on Catalyst 9000. Huawei VRP is a separate stack, separate training, separate skill bench. SD-WAN policy and TrustSec SGTs extend straight to the factory floor with no translation layer.",
        proof: "Catalyst SD-WAN policy fabric reuses IT-side templates for industrial sites with zero re-authoring."
      },
      {
        title: "A real 5G upgrade path",
        icon: "wifi",
        body:
          "IR1101 takes pluggable 5G PIMs — when the carrier turns on standalone 5G or mmWave in 2027, you swap the module. AR502GW is single LTE Cat 4 / Cat 6 — to get 5G you change platforms entirely (to AR509GW), which is a forklift across an installed base of hundreds of sites.",
        proof: "Field-replaceable 5G Sub-6 and mmWave PIMs validated with all major US/EU carriers."
      }
    ],
    specs: [
      { label: "Form factor", competitor: "DIN-rail, fanless", cisco: "DIN-rail, fanless", winner: "tie" },
      { label: "Operating temperature", competitor: "-40°C to +70°C", cisco: "-40°C to +75°C", winner: "cisco" },
      { label: "Cellular", competitor: "LTE Cat 4 / Cat 6 (no 5G on this SKU)", cisco: "Pluggable 5G Sub-6 / mmWave", winner: "cisco" },
      { label: "Edge compute", competitor: "OpenWrt-based app hosting (limited ecosystem)", cisco: "IOx app hosting (Docker/LXC) — broad partner ecosystem", winner: "cisco" },
      { label: "OT protocol visibility", competitor: "None on-box; relies on iMaster or 3rd-party tap", cisco: "Cyber Vision sensor on-box (40+ protocols)", winner: "cisco" },
      { label: "Management", competitor: "iMaster NCE-Campus / NCE-IoT", cisco: "IoT Operations Dashboard + Catalyst Center", winner: "tie" },
      { label: "Procurement risk", competitor: "FCC Covered List; NDAA §889 restricted in many enterprises", cisco: "No covered-list or NDAA exposure", winner: "cisco" }
    ],
    knownIssues: [
      {
        id: "FCC-DA-22-1234",
        severity: "Critical",
        title: "FCC Covered List inclusion — restricted in US federal-funded networks",
        source: "FCC Public Notice",
        url: "https://www.fcc.gov/supplychain/coveredlist"
      },
      {
        id: "CISA-AA22-IND-OT",
        severity: "High",
        title: "CISA advisory on supply-chain risk for ICS/OT equipment from listed vendors",
        source: "CISA",
        url: "https://www.cisa.gov/news-events/cybersecurity-advisories"
      }
    ],
    references: [
      {
        industry: "Logistics / Ports",
        region: "EMEA",
        summary:
          "Major European port operator replaced 80 Huawei AR502GW gateways with IR1101 after a parent-company policy change excluded covered-list equipment from new build-out. Single-vendor stack reduced integration cost by ~28%."
      },
      {
        industry: "Manufacturing",
        region: "APAC",
        summary:
          "Tier-1 automotive supplier standardised on IR1101 for new plants citing Cyber Vision visibility their previous Huawei-based AR fleet never delivered without a separate SPAN-and-tap architecture."
      }
    ],
    talkTrack: {
      opener:
        "Huawei is real competition on price — let's acknowledge that. But the question on a 10-year industrial asset isn't 'what does it cost today,' it's 'what does it cost when policy, insurance, or your parent company tells you to take it out.' Let me show you what that risk-adjusted comparison actually looks like.",
      discovery: [
        "Are any of your sites under federal contracts, FCC-regulated, or in jurisdictions with sanctions exposure?",
        "Who's writing your OT cybersecurity policy — and have they signed off on covered-list equipment for a 10-year horizon?",
        "How will you do OT asset visibility today? Is iMaster NCE-IoT already in your stack, or would it be net-new?",
        "Will you need 5G — true standalone 5G, not 4G+ — within 24 to 36 months?",
        "Who manages the IT side of this customer's network today? Is it already a Cisco shop?"
      ],
      proofPoints: [
        "FCC Covered List and NDAA §889 create a real, documentable forklift risk on the Huawei path that doesn't exist on Cisco.",
        "Cyber Vision sensor runs INSIDE the IR1101 via IOx — no SPAN, no tap, no extra appliance, no extra license tier.",
        "Pluggable 5G PIMs mean a single platform across the LTE-now, 5G-later transition — no second forklift in year 3.",
        "Same IOS XE / Catalyst SD-WAN your IT team already runs in the DC — zero new skill bench needed for OT."
      ],
      closer:
        "Let's do a side-by-side at one of your highest-risk sites: IR1101 + Cyber Vision against AR502GW + iMaster. Bring your CISO and your controls engineer to the readout. Inside 30 days you'll see why the sticker delta disappears."
    },
    tcoNote:
      "Huawei often lists 30–45% lower on the device line. Once you include iMaster NCE-IoT licensing, a separate OT visibility platform to match Cyber Vision, and the rip-and-replace contingency reserve some customers carry for covered-list equipment, Cisco IR1101 typically lands within 5% of Huawei on a 5-year TCO — and lower on a 10-year horizon.",
    lastUpdatedISO: NOW,
    sources: [
      { label: "Cisco IR1101 Datasheet", system: "Cisco Docs" },
      { label: "Cyber Vision solution overview", system: "Cisco Docs" },
      { label: "Huawei AR502GW-Lc product page (public)", system: "Public Web" },
      { label: "FCC Covered List — DA 22-1234", url: "https://www.fcc.gov/supplychain/coveredlist", system: "Public Web" },
      { label: "Compete-IIoT Webex space — Huawei displacement win wires Q2 2026", system: "Webex" }
    ]
  }
};

export function getBattlecard(competitor: string, product: string): Battlecard | undefined {
  return BATTLECARDS[`${competitor}:${product}`];
}

export function getAllBattlecardKeys(): string[] {
  return Object.keys(BATTLECARDS);
}
