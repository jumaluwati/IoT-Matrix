import type { ProductCategory, CiscoProduct } from "@/lib/types";

/**
 * Which Cisco product categories actually have the classic
 * Network Essentials / Network Advantage / Cisco DNA Essentials / Cisco DNA Advantage
 * license tiering that the LicenseTiers component is designed to render.
 *
 * Switches and routers (Catalyst IE / IR families) use this model. Wireless APs,
 * Cyber Vision, Catalyst Center, IoT Operations Dashboard, and Secure Firewall
 * each have a DIFFERENT licensing model — asking RAG about "Network Essentials
 * vs Advantage tiers" for those products produces hallucinated, structurally
 * misleading output. We gate the section on category and render an accurate
 * per-category model card for the rest.
 */
const TIER_ELIGIBLE: ReadonlySet<ProductCategory> = new Set([
  "Industrial Switch",
  "Industrial Router"
]);

export function supportsLicenseTiers(category: ProductCategory): boolean {
  return TIER_ELIGIBLE.has(category);
}

/**
 * Concrete, hand-curated licensing models for product categories that do NOT
 * fit the Network Essentials / Advantage tier pattern. These are rendered as a
 * static info card on the portfolio detail page — much more honest than letting
 * Cisco RAG hallucinate switch-tier data for an access point or a piece of
 * software.
 *
 * Sources cited per product family from publicly documented Cisco licensing
 * pages (see comments). Update when Cisco changes commercial model.
 */
export interface LicensingModel {
  /** Compact title shown in the section header pill. */
  modelLabel: string;
  /** 1-sentence description of how the product is licensed. */
  description: string;
  /** Bulleted facts the seller needs in a customer conversation. */
  facts: string[];
  /** Optional disclaimer line rendered under the facts list. Use this when the
   *  details vary by SKU / region / current ordering guide and you want the
   *  seller to verify before committing to a quote. */
  factsNote?: string;
  /** Optional "what you get included" + "what is an add-on" split. */
  included?: string[];
  addOns?: string[];
  /** Optional purchase-flow note (e.g. "Sold per device", "Per endpoint"). */
  unit?: string;
  /** Optional verified Cisco documentation URLs. ONLY include URLs we've manually
   *  verified — leave empty if unsure. The UI hides the row when this is empty. */
  references?: { label: string; url: string }[];
}

/**
 * Per-slug overrides. Anything not listed here falls back to a category default
 * via `licensingModelFor()`.
 */
const PER_SLUG: Record<string, LicensingModel> = {
  "cyber-vision": {
    modelLabel: "Per-endpoint subscription",
    description:
      "Cisco Cyber Vision is sold as a software subscription priced by the number of monitored OT endpoints, not by feature tier.",
    facts: [
      "Two SKU tiers: Cyber Vision Essentials (asset inventory, basic OT visibility) and Cyber Vision Advantage (full vulnerability management, baselines, posture).",
      "Term-based: 1, 3, or 5-year subscriptions. No perpetual option.",
      "Includes the Center (management) plus the right to deploy sensors on supported Catalyst IE / IR hardware at no additional sensor license cost.",
      "IE3500, IE3500H, and IE9300 ordered with Network Advantage include a 3-year, 24-endpoint Cyber Vision Advantage license at no additional cost."
    ],
    included: [
      "Cyber Vision Center (on-prem or SaaS)",
      "Sensor software running natively in IOx on IE/IR hardware",
      "DPI for 40+ industrial protocols (Modbus, S7, EtherNet/IP, IEC 61850, etc.)"
    ],
    addOns: [
      "Additional endpoints beyond the bundled count",
      "Tier upgrade Essentials \u2192 Advantage",
      "Term extension"
    ],
    unit: "Per monitored OT endpoint"
  },
  "catalyst-center": {
    modelLabel: "Appliance + per-device subscription",
    description:
      "Catalyst Center (formerly DNA Center) is an on-prem appliance. Software entitlement is per device that Catalyst Center manages, matched to that device's network tier.",
    facts: [
      "Appliance SKUs (44/56/112-core) sized to the number of managed devices and concurrent users.",
      "Per-device subscription matches the network license tier of each managed switch/router: Catalyst Center Essentials for Network Essentials devices, Catalyst Center Advantage for Network Advantage devices.",
      "Subscriptions are term-based (3, 5, or 7-year). No perpetual option.",
      "Includes assurance, SD-Access automation, ITSM integrations, and AI Endpoint Analytics."
    ],
    included: [
      "Appliance hardware + base platform software",
      "Initial 90-day trial of Catalyst Center Advantage features"
    ],
    addOns: [
      "Per-device subscription tier (Essentials or Advantage)",
      "AI Endpoint Analytics add-on",
      "High-availability cluster sizing"
    ],
    unit: "Per managed device"
  },
  "iot-ops-dashboard": {
    modelLabel: "Per-device cloud subscription",
    description:
      "Cisco IoT Operations Dashboard is a cloud-managed service. Pricing is per managed IR/IE device per year — no on-prem appliance, no perpetual model.",
    facts: [
      "Single subscription unlocks Edge Device Manager (EDM), Industrial Asset Vision, Secure Equipment Access (SEA), and Cyber Vision Sensor management.",
      "Term-based: 1, 3, or 5-year subscriptions.",
      "Includes zero-touch provisioning (ZTP) and ongoing config/firmware management for all enrolled devices.",
      "Secure Equipment Access is the remote-access workflow that replaced traditional jump-host VPNs for OT."
    ],
    included: [
      "Cloud management plane (no infrastructure to run)",
      "Edge Device Manager",
      "Industrial Asset Vision",
      "Secure Equipment Access (SEA)"
    ],
    unit: "Per managed device"
  },
  "secure-firewall-3100": {
    modelLabel: "Hardware + Threat Defense subscription",
    description:
      "Cisco Secure Firewall hardware ships with a base platform. Threat Defense software, URL filtering, malware, and IPS each carry their own subscription.",
    facts: [
      "Hardware SKU (3105 / 3110 / 3120 / 3130 / 3140) sets the throughput ceiling.",
      "Threat Defense (FTD) subscription bundles: Essentials (Snort 3 IPS), Advantage (+ URL filtering), Premier (+ Malware Defense).",
      "Cisco Security Cloud Control adds centralized policy management across firewalls, SSE, and ZTNA.",
      "Term-based subscriptions: 1, 3, or 5-year."
    ],
    included: [
      "ASA or Threat Defense base OS",
      "Site-to-site VPN, NAT, basic firewall, EVE (Encrypted Visibility Engine)"
    ],
    addOns: [
      "Threat Defense subscription tier (Essentials / Advantage / Premier)",
      "Cisco Security Cloud Control management",
      "RA VPN seat licensing"
    ],
    unit: "Per appliance + per subscription bundle"
  }
};

/**
 * Category-level fallbacks for slugs not in PER_SLUG (e.g. wireless APs without
 * a slug override). Keep these high-level and accurate.
 */
const PER_CATEGORY: Partial<Record<ProductCategory, LicensingModel>> = {
  "Industrial Wireless": {
    modelLabel: "Per-AP licensing (check ordering guide)",
    description:
      "Cisco Industrial Wireless APs are licensed per access point. Exact tier names and what's included depend on the AP family, mode (URWB vs Wi-Fi), and Catalyst Center pairing — confirm with the current Cisco ordering guide before quoting.",
    facts: [
      "Licensing model differs from Catalyst IE switches \u2014 do NOT assume Network Essentials / Network Advantage tiering applies to APs.",
      "URWB (Ultra-Reliable Wireless Backhaul) and Wi-Fi modes can have different entitlement and add-on requirements; verify per AP family.",
      "Catalyst Center wireless assurance, RRM, and policy automation are typically a separate term-based subscription priced per managed AP.",
      "Cisco Spaces (location services) is a separate cloud SaaS license, sold independently."
    ],
    factsNote:
      "This summary is intentionally conservative. Confirm specific tier names, included features, and pricing with the Cisco IW ordering guide or your Cisco wireless specialist before committing to a quote.",
    unit: "Per access point",
    references: [
      {
        label: "Cisco Catalyst IW9167E Series — product page",
        url: "https://www.cisco.com/site/us/en/products/networking/industrial-wireless/catalyst-iw9167-series/index.html"
      }
    ]
  },
  "OT Security / Visibility": {
    modelLabel: "Term-based subscription",
    description: "Per-endpoint or per-feature subscription, not the Network license tiers.",
    facts: [
      "Sold via Cisco Smart Account; term-based with multi-year discounts.",
      "Includes the management plane plus the right to deploy sensors on supported Catalyst IE / IR hardware."
    ],
    unit: "Per monitored endpoint"
  },
  "Ruggedized Firewall": {
    modelLabel: "Hardware + Threat Defense subscription",
    description: "Hardware platform plus a Threat Defense software subscription tier.",
    facts: [
      "Hardware SKU determines throughput ceiling.",
      "Threat Defense subscription tier (Essentials / Advantage / Premier) determines feature set."
    ],
    unit: "Per appliance"
  },
  "Management / Orchestration": {
    modelLabel: "Appliance or cloud + per-device subscription",
    description:
      "Management products are sold as an appliance (Catalyst Center) or cloud service (IoT OPS Dashboard) plus a per-device subscription that matches the managed device's network license tier.",
    facts: [
      "On-prem appliances sized to managed-device count and concurrent users.",
      "Cloud option (IoT OPS) eliminates appliance sizing; per-device pricing."
    ],
    unit: "Per managed device"
  }
};

export function licensingModelFor(product: CiscoProduct): LicensingModel | null {
  if (PER_SLUG[product.slug]) return PER_SLUG[product.slug];
  if (PER_CATEGORY[product.category]) return PER_CATEGORY[product.category] ?? null;
  return null;
}
