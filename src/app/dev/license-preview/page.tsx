import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LicenseTiers } from "@/components/license-tiers";

/**
 * Dev-only preview route for the LicenseTiers component.
 *
 * Renders the licensing UI against a canned Cisco RAG response for the IE3500
 * so you can see the design end-to-end without wiring CISCO_RAG_APP_ID /
 * CISCO_RAG_USER_ID in .env.local. Safe to delete this file once the live
 * RAG section is verified on a real compare page.
 *
 * URL: /dev/license-preview
 */

const IE3500_LICENSING_MARKDOWN = `Here are the license tiers for the Cisco Catalyst IE3500 industrial switch along with the key features included in each tier:

**1. Network Essentials (Perpetual License)**
- Layer 2 switching: IEEE 802.1Q, 802.1w, 802.1ab, 802.1s, 802.3ad, NTP, UDLD, CDP, LLDP, unicast MAC filter, PAgP, LACP, VTPv2, VTPv3, EtherChannel, Q-in-Q tunneling, voice VLAN, PVST+, MSTP, RSTP, Selective Q-in-Q, Layer 2 Tunneling
- Multicast: IGMPv1, v2, v3 snooping, filtering, querier, MLD
- Management: WebUI, MIB, SNMP, syslog, DHCP server, SPAN, RSPAN, FSPAN, FRSPAN, ERSPAN, Express setup, NETCONF, RESTCONF
- Security: Port security, 802.1x, DHCP snooping, dynamic ARP inspection, IP source guard, guest VLAN, MAC authentication bypass, 802.1x multidomain authentication, storm control, SCP, SSH, SNMPv3, TACACS+, RADIUS server/client, MAC address notification, BPDU guard, Access Lists (PACL/RACL/VACL), SUDI 2099, Full Flexible NetFlow (FNF), MACsec-128
- Quality of Service (QoS): Ingress policing, rate limit, egress queuing/shaping, auto QoS
- IPv6 support: Host support, SNMP, HTTP/HTTPS, Syslog, DHCPv6 relay, bulk lease query, stateless auto config, SCP/SSH, Radius, TACACS+, NTP over IPv6, VRF aware BGPv6, ND cache expire, DNS transport, QoS, FHS RA Guard, DHCPv6 Guard
- Layer 3 routing: Inter-VLAN routing, Static routing, OSPF, OSPFv3, RIP, Policy-Based Routing (PBR)
- Industrial Ethernet: CIP Ethernet/IP, IEEE 1588 PTP v2 (default and power), PROFINET
- Time-Sensitive Networking (TSN): Frame-Preemption (802.3br, 802.1QBu)
- Redundancy: REP ring, PROFINET-MRP, REP Fast, REP Segment ID Auto-discovery, REP ZTP Support, PRP, PTP over PRP, PTP over HSR, HSR-SAN, Device Level Ring (DLR), HSR-PRP Dual Redbox
- Utility: Dying gasp, SCADA protocol classification (GOOSE messaging, MODBUS TCP/IP)
- Automation: YANG, NETCONF, RESTCONF
- Industrial Management: Layer 2 switching with 1:1 switch Network Address Translation (L2NAT) for 1G/10G uplink ports
- IOx: Container (Native Docker), Cisco Cyber Vision, Secure Equipment Access, Cisco ThousandEyes

**2. Network Advantage (Perpetual License)**
- Includes all Network Essentials features plus:
- IP routing protocols: OSPF (IPv4 and IPv6), BGP (v4 and v6), ISIS (v4 and v6), EIGRP (v4 and v6), HSRP (v4 and v6), BFD Echo Mode for OSPFv3
- Virtualization: VRF-lite, VRF-Aware SGT
- Security: Cisco TrustSec (SGACL, SGACL logging), EAP-TLS, IEEE 802.1AE MACsec-256, SD-Access Policy Extended Node, SD-Access Fabric Edge Node, GRE
- Fabric: Cisco SDA fabric edge, BGP-EVPN leaf node
- IP Multicast: PIM sparse mode, PIM dense mode, MSDP, Multicast routing BSR, Auto RP, Embedded RP
- Industrial Management: Layer 3 Network Address Translation (L3NAT)
- Includes a 3-year limited term and 24 endpoints Advantage license of Cisco Cyber Vision and Secure Equipment Access at no extra cost

**3. Cisco DNA Essentials (Term-based License)**
- Basic network management via Cisco Catalyst Center
- Features: Discovery, topology, inventory, software image management, overall health dashboard, day-zero network bring-up automation (Cisco Network Plug-and-Play), SD-Access Extended Node (fabric overlay extension), Industrial support (MRP Monitoring, REP Configuration, REP Topology View)

**4. Cisco DNA Advantage (Term-based License)**
- Includes all Cisco DNA Essentials features plus:
- LAN Automation for error-free underlay network for SDA deployments
- SD-Access Policy Extended Node (fabric overlay extension and segmentation)
- SD-Access Fabric Edge Node (fabric device connecting wired endpoints to SDA fabric)
- Device 360, Client 360, and Network Health Insights
- Patch/SMU Lifecycle Management via Cisco Catalyst Center
- Application Visibility and Control (NBAR2)

**Additional Notes:**
- Network Essentials license is installed by default at manufacture and is perpetual.
- Network Advantage license requires a Cisco Smart Account and is perpetual.
- Cisco DNA licenses require a Cisco Smart Account and are term-based.
- The IE3500 Heavy Duty switches ordered with Network Advantage license on or after October 1, 2025, include a 3-year limited term and 24 endpoints Advantage license of Cisco Cyber Vision and Secure Equipment Access at no extra cost.

This summary provides the license tiers and key features for the Cisco Catalyst IE3500 industrial switch series, including both Rugged and Heavy Duty variants[3](https://www.cisco.com/c/en/us/products/collateral/networking/industrial-switches/ie3500-heavy-duty-series/ie3500-heavy-duty-series-ds.html)[4](https://www.cisco.com/c/en/us/products/collateral/networking/industrial-switches/ie3500-rugged-series/ie3500-rugged-series-ds.html)[5](https://www.cisco.com/c/en/us/products/collateral/switches/catalyst-ie3200-rugged-series/q-and-a-c67-741696.html).

**Reference Document Links:**
1. [Licensing on the Cisco Catalyst IE3x00 and IE3100 Rugged, IE3400 Heavy Duty, and ESS3300 Series Switches](https://www.cisco.com/c/en/us/td/docs/switches/lan/iiot/licensing/ie-licensing.html)
2. [Cisco IE3500 Heavy Duty Series Data Sheet](https://www.cisco.com/c/en/us/products/collateral/networking/industrial-switches/ie3500-heavy-duty-series/ie3500-heavy-duty-series-ds.html)
3. [Cisco IE3500 Rugged Series Data Sheet](https://www.cisco.com/c/en/us/products/collateral/networking/industrial-switches/ie3500-rugged-series/ie3500-rugged-series-ds.html)
4. [Cisco Industrial Ethernet Switches FAQ](https://www.cisco.com/c/en/us/products/collateral/switches/catalyst-ie3200-rugged-series/q-and-a-c67-741696.html)`;

export default function LicensePreviewPage() {
  return (
    <div className="container py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--fg))] transition-colors mb-8"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to home
      </Link>

      <div className="mb-8">
        <div className="text-[11px] uppercase tracking-[0.2em] text-cisco-600 dark:text-cisco-300 font-mono mb-2">
          DEV · License tier preview
        </div>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
          Licensing UI preview — Catalyst IE3500
        </h1>
        <p className="mt-3 text-sm text-[rgb(var(--fg-muted))] max-w-2xl">
          Rendered against a canned Cisco RAG response. Click any tier to see the included features.
          Once <code className="font-mono text-xs px-1 py-0.5 rounded bg-black/5 dark:bg-white/5">CISCO_RAG_APP_ID</code> and{" "}
          <code className="font-mono text-xs px-1 py-0.5 rounded bg-black/5 dark:bg-white/5">CISCO_RAG_USER_ID</code> are set in{" "}
          <code className="font-mono text-xs px-1 py-0.5 rounded bg-black/5 dark:bg-white/5">.env.local</code>, this same component renders live on every compare page.
        </p>
      </div>

      <LicenseTiers
        productName="Catalyst IE3500"
        answer={IE3500_LICENSING_MARKDOWN}
        sourceLabel="via canned Cisco RAG sample · Catalyst IE3500"
      />
    </div>
  );
}
