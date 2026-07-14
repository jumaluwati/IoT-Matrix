export type UseCase =
  | "Substation Automation"
  | "Manufacturing / Factory"
  | "Transportation / Roadways"
  | "Mining / Heavy Industry"
  | "Oil & Gas / Utilities"
  | "Smart City"
  | "Military / Defense";

export type ProductCategory =
  | "Industrial Switch"
  | "Industrial Router"
  | "Industrial Wireless"
  | "OT Security / Visibility"
  | "Ruggedized Firewall"
  | "Management / Orchestration"
  | "Embedded Network Module";

export interface CompetitorProduct {
  slug: string;
  name: string;
  family?: string;
  category: ProductCategory;
  positioning: string;
  image?: string;
}

export interface Competitor {
  slug: string;
  name: string;
  short: string;
  tagline: string;
  color: string; // brand accent for cards
  logoMark: string; // short text mark (we don't ship real logos)
  products: CompetitorProduct[];
}

export interface CiscoProduct {
  slug: string;
  name: string;
  family: string;
  category: ProductCategory;
  oneLiner: string;
  image?: string;
  highlights: string[];
  /** Industry use cases this SKU is a strong fit for. Drives the /use-cases discovery pages. */
  useCases?: UseCase[];
  /** True for board-level / embedded modules shipped without an enclosure ("chip without the body"). */
  embedded?: boolean;
  /** One-line "lead with this when…" positioning. Single source of truth for the Cisco-vs-Cisco
   *  decision guide and the competitor compare page's lead-reason cards. */
  whenToLead?: string;
}

export interface SpecRow {
  label: string;
  competitor: string;
  cisco: string;
  winner: "cisco" | "competitor" | "tie";
}

export interface WinPillar {
  title: string;
  icon:
    | "shield"
    | "eye"
    | "cpu"
    | "leaf"
    | "globe"
    | "lock"
    | "wrench"
    | "spark"
    | "wifi"
    | "layers"
    | "compass"
    | "clock";
  body: string;
  proof?: string;
}

export interface KnownIssue {
  id: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  title: string;
  source: string; // e.g., "NVD CVE-2024-XXXX" or "Vendor PSIRT"
  url?: string;
}

export interface ReferenceWin {
  industry: string;
  region: string;
  summary: string;
}

export interface TalkTrack {
  opener: string;
  discovery: string[];
  proofPoints: string[];
  closer: string;
}

export interface Battlecard {
  competitorSlug: string;
  competitorProductSlug: string;
  competitorProductName: string;
  ciscoRecommendation: {
    primarySlug: string; // primary Cisco product
    bundleSlugs: string[]; // complementary Cisco products
    summary: string;
  };
  useCases: UseCase[];
  pillars: WinPillar[];
  specs: SpecRow[];
  knownIssues: KnownIssue[];
  references: ReferenceWin[];
  talkTrack: TalkTrack;
  tcoNote?: string;
  lastUpdatedISO: string;
  sources: Array<{ label: string; url?: string; system: "Circuit" | "Cisco Docs" | "CDETS" | "Webex" | "Public Web" }>;
  /** True when this card was synthesized live by Circuit instead of served from the authored mocks. */
  synthesized?: boolean;
}
