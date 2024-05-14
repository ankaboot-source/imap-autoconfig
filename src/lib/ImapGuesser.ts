import * as dns from "dns";
import { IMAPConnectionSettings } from "../types";

interface Autoroute {
  [key: string]: IMAPConnectionSettings;
}

class IMAPSettingsGuesser {
  /**
   * Array of domain patterns to check for IMAP connections.
   * @private
   */
  private domains: string[] = ["imap.%DOMAIN%", "mail.%DOMAIN%", "%DOMAIN%"];
  /**
   * Array of common IMAP ports to check.
   * @private
   */
  private ports: number[] = [993, 143];
  /**
   * Autoroute configuration for specific domains.
   * @private
   */
  private autoroute: Autoroute = {
    "aspmx.l.google.com": {
      port: 993,
      host: "imap.gmail.com",
      secure: true,
    },
    "alt1.aspmx.l.google.com": {
      port: 993,
      host: "imap.gmail.com",
      secure: true,
    },
    "alt2.aspmx.l.google.com": {
      port: 993,
      host: "imap.gmail.com",
      secure: true,
    },
  };

  /**
   * Detects possible IMAP connection settings.
   * @param address - The email address to detect IMAP settings for.
   * @returns Array of possible IMAP connection settings or null.
   */
  async detectIMAPConnectionSettings(
    address: string
  ): Promise<IMAPConnectionSettings[] | null> {
    if (!address) {
      throw new Error("Address is required");
    }

    const [user, domain] = address.split("@");

    if (!user || !domain) {
      throw new Error("Invalid email address format");
    }

    const checkdomains = new Set(
      this.domains.map((domainPattern) =>
        domainPattern.replace(/%USER%/g, user).replace(/%DOMAIN%/g, domain)
      )
    );

    const mxdomain = await this.getMXDomain(domain);

    if (mxdomain && this.autoroute[mxdomain]) {
      return [this.autoroute[mxdomain]];
    }

    if (mxdomain && !checkdomains.has(mxdomain)) {
      checkdomains.add(
        mxdomain.replace(/%USER%/g, user).replace(/%DOMAIN%/g, domain)
      );
    }

    return this.generateCheckMatrix(Array.from(checkdomains)).flat();
  }
  /**
   * Generates a matrix of possible IMAP connection settings.
   * @private
   * @param checkdomains - The domains to generate IMAP settings for.
   * @returns Possible IMAP connection settings.
   */
  private generateCheckMatrix(
    checkdomains: string[]
  ): IMAPConnectionSettings[] {
    const matrix: IMAPConnectionSettings[] = [];
    this.ports.forEach((port) => {
      checkdomains.forEach((domain) => {
        matrix.push({
          host: domain,
          port: port,
          secure: port === 993,
        });
      });
    });
    return matrix;
  }

  /**
   * Resolves the MX domain for a given domain using DNS lookup.
   * @private
   * @param domain - The domain to resolve the MX record for.
   * @returns MX domain or null if no MX record is found.
   */
  private async getMXDomain(domain: string): Promise<string | null> {
    return new Promise((resolve) => {
      dns.resolve(domain, "MX", (err, addresses) => {
        if (err) {
          return resolve(null);
        }
        if (!addresses || !addresses.length) {
          return resolve(null);
        }
        addresses.sort((a, b) => a.priority - b.priority);
        return resolve(
          (addresses[0].exchange || "").toString().toLowerCase().trim()
        );
      });
    });
  }
}

export default IMAPSettingsGuesser;
