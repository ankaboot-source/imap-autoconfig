import { IMAPConnectionSettings } from "./types";
import {
  checkIMAPConnection,
  DnsDiscover,
  IMAPAutoDiscover,
  IMAPSettingsGuesser,
} from "./lib";

class IMAPSettingsDetector {
  /**
   * Constructor for IMAPSettingsDetector.
   * @param {string[]} autoDiscoverURLs - Array of auto-discover URLs for IMAP settings.
   */
  constructor(private readonly autoDiscoverURLs: string[] = []) {}

  /**
   * Generates all possible IMAP configurations for the given email
   */
  async generateImapConnectionSettings(
    email: string,
  ): Promise<IMAPConnectionSettings[]> {
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
    return imapConfigs ?? [];
  }

  /**
   * Detects IMAP connection settings for the given email and password.
   * @param email - The email address to detect IMAP settings for.
   * @param password - The password for the email account. Default is "hello".
   * @returns IMAP connection settings or null if not found.
   */
  async detect(
    email: string,
    password: string = "hello",
  ): Promise<IMAPConnectionSettings | null> {
    const connectionSettings: IMAPConnectionSettings[] =
      await this.generateImapConnectionSettings(email);

    for (const server of connectionSettings) {
      const status = await checkIMAPConnection(
        { user: email, password },
        server,
      );
      if (status) {
        return status;
      }
    }

    return null;
  }
}

export default IMAPSettingsDetector;
