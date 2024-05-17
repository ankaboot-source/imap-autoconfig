import { IMAPConnectionSettings } from "./types";
import {
  IMAPAutoDiscover,
  IMAPSettingsGuesser,
  DnsDiscover,
  checkIMAPConnection,
} from "./lib";

class IMAPSettingsDetector {
  /**
   * Constructor for IMAPSettingsDetector.
   * @param {string[]} autoDiscoverURLs - Array of auto-discover URLs for IMAP settings.
   */
  constructor(private readonly autoDiscoverURLs: string[] = []) {}
  /**
   * Detects IMAP connection settings for the given email and password.
   * @param email - The email address to detect IMAP settings for.
   * @param password - The password for the email account. Default is "hello".
   * @returns IMAP connection settings or null if not found.
   */
  async detect(
    email: string,
    password: string = "hello"
  ): Promise<IMAPConnectionSettings | null> {
    const extraURLs = await DnsDiscover.autoDiscoverFromSRVRecords(email);
    const autoDiscover = new IMAPAutoDiscover([
      ...this.autoDiscoverURLs,
      ...(extraURLs ?? []),
    ]);
    const settingsGuesser = new IMAPSettingsGuesser();
    let imapConfigs: IMAPConnectionSettings[] | null =
      await autoDiscover.detectIMAPConnectionSettings(email);

    if (!imapConfigs || imapConfigs.length === 0) {
      imapConfigs = await DnsDiscover.detectIMAPConnectionSettings(email);
    }

    if (!imapConfigs || imapConfigs.length === 0) {
      imapConfigs = await settingsGuesser.detectIMAPConnectionSettings(email);
    }

    for (const server of [...imapConfigs ?? []]) {
      const status = await checkIMAPConnection(
        { user: email, password },
        server
      );
      if (status) {
        return status;
      }
    }

    return null;
  }
}

export default IMAPSettingsDetector;
