/**
 * Cisco CDETS MCP client (stub).
 *
 * Reference: https://cisco.sharepoint.com/Sites/EngNextGenCDETS/SitePages/Defect-Management-MCP.aspx
 *
 * Use cases for this app:
 *   - Surface open Sev1/Sev2 defects on Cisco products we are recommending
 *     (so we don't pitch into a known bug) — `searchCiscoDefects(productSlug)`
 *   - Optional: surface competitor PSIRT-equivalent feeds where Cisco tracks them
 */

export type CdetsSeverity = "Sev1" | "Sev2" | "Sev3" | "Sev4";

export interface CdetsDefect {
  id: string;
  severity: CdetsSeverity;
  title: string;
  product: string;
  status: string;
  openedISO: string;
}

export async function searchCiscoDefects(productSlug: string, opts?: { minSeverity?: CdetsSeverity }): Promise<CdetsDefect[]> {
  const url = process.env.CDETS_MCP_URL;
  if (!url) throw new Error("CDETS_MCP_URL is not set.");
  // TODO: invoke MCP tool
  return [];
}
