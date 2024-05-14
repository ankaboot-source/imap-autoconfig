import { IMAPConnectionSettings } from "./types";
import {
  IMAPAutoDiscover,
  IMAPSettingsGuesser,
  DnsDiscover,
  checkIMAPConnection,
} from "./lib";

class IMAPSettingsDetector {
  constructor(private readonly autoDiscoverURLs: string[] = []) {}

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
