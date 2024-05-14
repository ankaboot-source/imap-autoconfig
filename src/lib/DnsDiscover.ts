import * as dns from "dns";
import { IMAPConnectionSettings } from "../types";

/**
 * Class representing IMAP connection settings detector.
 */
class DnsDiscover {
  /**
   * Detects IMAP connection settings.
   * @param {string} address - Email address.
   * @param {string} [password] - Password.
   * @returns {Promise<IMAPConnectionSettings|null>} - Promise that resolves with IMAP connection settings or null.
   */
  static async detectIMAPConnectionSettings(
    address: string
  ): Promise<IMAPConnectionSettings[] | null> {
    if (!address) {
      throw new Error("Address is required");
    }

    const [user, domain] = address.split("@");

    if (!user || !domain) {
      throw new Error("Invalid email address format");
    }

    const protocols = ["imap", "imaps"];

    const promises = protocols.map((protocol) =>
      this.checkProtocol(protocol, domain)
    );

    const fulfilledResults = (await Promise.allSettled(promises)).filter(
      (result): result is PromiseFulfilledResult<IMAPConnectionSettings> =>
        result.status === "fulfilled" && result.value !== null
    );
    return fulfilledResults.map((result) => result.value) ?? null;
  }

  /**
   * Checks IMAP protocol for SRV records.
   * @param {string} protocol - Protocol to check (imap or imaps).
   * @param {string} domain - Domain to check SRV records for.
   * @returns {Promise<IMAPConnectionSettings|null>} - Promise that resolves with IMAP connection settings or null.
   */
  static async checkProtocol(
    protocol: string,
    domain: string
  ): Promise<IMAPConnectionSettings | null> {
    return new Promise<IMAPConnectionSettings | null>((resolve) => {
      dns.resolve(`_${protocol}._tcp.${domain}`, "SRV", (err, addresses) => {
        if (err) {
          resolve(null);
          return;
        }

        if (
          !addresses ||
          !addresses.length ||
          !addresses[0].name ||
          addresses[0].name === "."
        ) {
          resolve(null);
          return;
        }
        const { name, port } = addresses[0];
        const secure = protocol === "imaps";
        const data: IMAPConnectionSettings = { host: name, port, secure };

        resolve(data);
      });
    });
  }

  /**
   * Queries SRV records for auto-discovery URLs for the given domain.
   * @param domain - The domain to search for auto-discovery URLs.
   * @returns A promise resolving to an array of auto-discovery URLs.
   */
  static async autoDiscoverFromSRVRecords(
    domain: string
  ): Promise<string[] | null> {
    const srvRecords: dns.SrvRecord[] | null = await new Promise(
      (resolve, _) => {
        dns.resolveSrv(`_autodiscover._tcp.${domain}`, (err, addresses) => {
          if (err) {
            resolve(null);
          } else {
            resolve(addresses);
          }
        });
      }
    );

    return srvRecords
      ? srvRecords.map(
          ({ name, port }) =>
            `${
              port === 443 ? "https://" : "http://"
            }${name}:${port}/autodiscover/autodiscover.xml`
        )
      : null;
  }
}

export default DnsDiscover;
