import axios, { AxiosError, AxiosResponse } from "axios";
import { parseIMAPConfigsFromXML } from "../utils";
import { IMAPConnectionSettings, WwwAuthOptions } from "../types";

class IMAPAutoDiscover {
  SOURCES = [
    "http://autoconfig.%DOMAIN%/mail/config-v1.1.xml?emailaddress=%USER%@%DOMAIN%",
    "http://%DOMAIN%/.well-known/autoconfig/mail/config-v1.1.xml",
    "https://autoconfig-live.mozillamessaging.com/autoconfig/v1.1/%DOMAIN%",
    "https://live.mozillamessaging.com/autoconfig/%DOMAIN%",
    "https://%DOMAIN%/autodiscover/autodiscover.xml",
    "http://%DOMAIN%/autodiscover/autodiscover.xml",
    "https://autodiscover.%DOMAIN%/autodiscover/autodiscover.xml",
    "http://autodiscover.%DOMAIN%/autodiscover/autodiscover.xml",
  ];

  /**
   * Creates an instance of IMAPAutoDiscovery.
   * @param autodiscoveryUrls - An optional array of custom service discovery URLs provided by the user.
   */
  constructor(private readonly autodiscoveryUrls?: string[]) {
    if (this.autodiscoveryUrls) {
      if (!Array.isArray(autodiscoveryUrls)) {
        throw new Error("autodiscoveryUrls must be an array");
      }
      this.SOURCES.push(...this.autodiscoveryUrls);
    }
  }

  /**
   * Generate service URLs for the given email.
   * @param email - The email address to search for service URLs.
   */
  private generateServiceURLs(email: string) {
    if (!email || !/@/.test(email)) {
      throw new Error("Invalid email address provided");
    }

    const [user, domain] = email.split("@");

    return [...this.SOURCES].map((url) =>
      url.replace(/%USER%/g, user).replace(/%DOMAIN%/g, domain)
    );
  }

  /**
   * Fetch IMAP configuration from an auto-discover URL.
   * @param url - The URL to fetch configurations from.
   * @param options - authentication options.
   */
  private async fetchConfiguration(
    url: string,
    options: WwwAuthOptions = {}
  ): Promise<IMAPConnectionSettings[] | null> {
    const config: WwwAuthOptions = {
      ...options,
      timeout: options.timeout || 5000,
      headers: options.headers || {},
    };

    try {
      const response: AxiosResponse = await axios.get(url, config);
      const { status, data } = response;

      if (status !== 200) {
        return null;
      }
      const imapData = parseIMAPConfigsFromXML(data, [
        "incomingServer",
        "Protocol",
      ]);

      return imapData;
    } catch (error) {
      if (
        error instanceof AxiosError &&
        error.response?.status &&
        [404, 408, 504].includes(error.response?.status)
      ) {
        return null;
      }

      if (error instanceof AxiosError && error.response?.status === 401) {
        const wwwAuthenticate =
          error.response.headers["www-authenticate"] || "";
        if (wwwAuthenticate.includes("basic")) {
          if (!options.username || !options.password) {
            throw new Error(
              "401 Authorization Required. Username or password is missing."
            );
          }

          const authorization = `Basic ${Buffer.from(
            `${options.username}:${options.password}`,
            "utf-8"
          ).toString("base64")}`;
          config.headers = { ...config.headers, Authorization: authorization };
          return this.fetchConfiguration(url, options);
        }
      }
      throw error;
    }
  }

  /**
   * Detect IMAP services for the given email.
   * @param email - The email address to detect IMAP services for.
   * @returns Array of detected IMAP services OR null.
   */
  public async detectIMAPConnectionSettings(
    email: string
  ): Promise<IMAPConnectionSettings[] | null> {
    const serviceUrls = this.generateServiceURLs(email);

    const imapConfigsPromises = serviceUrls.map(async (url) => {
      try {
        return await this.fetchConfiguration(url, {
          username: email,
        });
      } catch (error) {
        return null;
      }
    });

    const imapConfigsArray = await Promise.allSettled(imapConfigsPromises);

    const fulfilledResults = imapConfigsArray.filter(
      (result): result is PromiseFulfilledResult<IMAPConnectionSettings[]> =>
        result.status === "fulfilled" && result.value !== null
    );

    return fulfilledResults.length > 0
      ? fulfilledResults.flatMap((result) => result.value)
      : null;
  }
}

export default IMAPAutoDiscover;
