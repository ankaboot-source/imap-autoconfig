import * as dns from "dns";
import { IMAPConnectionSettings } from '../types'

interface Autoroute {
  [key: string]: IMAPConnectionSettings;
}

class IMAPSettingsGuesser {
  private domains: string[] = ["imap.%DOMAIN%", "mail.%DOMAIN%", "%DOMAIN%"];

  private ports: number[] = [993, 143];

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

  async detectIMAPConnectionSettings(
    address: string,
  ): Promise<IMAPConnectionSettings[] | null> {
    if (!address) {
      throw new Error("Address is required");
    }

    const [user, domain] = address.split("@");

    if (!user || !domain) {
      throw new Error("Invalid email address format");
    }

    const checkdomains = new Set(this.domains.map((domainPattern) =>
      domainPattern.replace(/%USER%/g, user).replace(/%DOMAIN%/g, domain)
    ));

    try {
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
    } catch (e) {
      console.log(e)
      return [];
    }
  }

  private generateCheckMatrix(checkdomains: string[]): IMAPConnectionSettings[][] {
    const matrix: IMAPConnectionSettings[][] = [];
    this.ports.forEach((port) => {
      checkdomains.forEach((domain) => {
        matrix.push([
          {
            host: domain,
            port: port,
            secure: port === 993,
          },
        ]);
      });
    });
    return matrix;
  }

  private async getMXDomain(domain: string): Promise<string | null> {
    return new Promise((resolve, reject) => {
      dns.resolve(domain, "MX", (err, addresses) => {
        if (err) {
          return reject(err);
        }
        if (!addresses || !addresses.length) {
          return resolve(null);
        }
        addresses
          .sort((a, b) => a.priority - b.priority)
        return resolve((addresses[0].exchange || "").toString().toLowerCase().trim());
      });
    });
  }
}

export default IMAPSettingsGuesser;
