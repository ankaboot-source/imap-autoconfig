import { DnsDiscover } from "../src/lib/index";
import dns, { SrvRecord } from "dns";

jest.mock("dns");

describe("DnsDiscover", () => {
  describe("detectIMAPConnectionSettings", () => {
    test("should throw an error if address is not provided", async () => {
      await expect(
        DnsDiscover.detectIMAPConnectionSettings("")
      ).rejects.toThrow("Address is required");
    });

    test("should throw an error if email address is invalid", async () => {
      await expect(
        DnsDiscover.detectIMAPConnectionSettings("invalidemail")
      ).rejects.toThrow("Invalid email address format");
    });

    test("should return IMAP connection settings", async () => {
      (
        dns.resolve as jest.MockedFunction<typeof dns.resolve>
      ).mockImplementation((domain, type, callback) => {
        callback(null, [
          domain.startsWith("_imaps")
            ? { name: "imaps.example.com", port: 465, priority: 0, weight: 1 }
            : { name: "imap.example.com", port: 993, priority: 0, weight: 1 },
        ]);
      });

      const settings = await DnsDiscover.detectIMAPConnectionSettings(
        "user@example.com"
      );
      expect(settings).toEqual([
        { host: "imap.example.com", port: 993, secure: false },
        { host: "imaps.example.com", port: 465, secure: true },
      ]);
    });
  });

  describe("checkProtocol", () => {
    test("should return IMAPConnectionSettings when DNS resolution is successful", async () => {
      (
        dns.resolve as jest.MockedFunction<typeof dns.resolve>
      ).mockImplementation((domain, type, callback) => {
        callback(null, [
          { name: "mail.example.com", port: 993, priority: 0, weight: 1 },
        ]);
      });
      const result = await DnsDiscover.checkProtocol("imaps", "example.com");

      expect(result).toEqual({
        host: "mail.example.com",
        port: 993,
        secure: true,
      });
    });

    test("should return null when DNS resolution fails", async () => {
      (
        dns.resolve as jest.MockedFunction<typeof dns.resolve>
      ).mockImplementation((domain, type, callback) => {
        callback(null, []);
      });
      const result = await DnsDiscover.checkProtocol("imap", "example.com");

      expect(result).toBeNull();
    });
  });

  describe("autoDiscoverFromSRVRecords", () => {
    test("should return auto-discovery URLs", async () => {
      const mockResolvedValue: SrvRecord[] = [
        { name: "autodiscover.example.com", port: 443, priority: 1, weight: 2 },
      ];
      (
        dns.resolveSrv as jest.MockedFunction<typeof dns.resolveSrv>
      ).mockImplementation((_, callback) => {
        callback(null, mockResolvedValue);
      });

      const urls = await DnsDiscover.autoDiscoverFromSRVRecords("example.com");
      const expectedUrls: string[] = [
        "https://autodiscover.example.com:443/autodiscover/autodiscover.xml",
      ];
      expect(urls).toEqual(expectedUrls);
    });

    test("should return null if SRV records not found", async () => {
      (
        dns.resolveSrv as jest.MockedFunction<typeof dns.resolveSrv>
      ).mockImplementation((_, callback) => {
        callback(new Error("Not found"), []);
      });

      const urls = await DnsDiscover.autoDiscoverFromSRVRecords("example.com");
      expect(urls).toBeNull();
    });
  });
});
