import { IMAPSettingsGuesser } from "../src/lib"; // Import the class to test
import { IMAPConnectionSettings } from "../src/types";
import dns from "dns";

jest.mock("dns");

describe("IMAPSettingsGuesser", () => {
  let guesser: IMAPSettingsGuesser;

  beforeEach(() => {
    guesser = new IMAPSettingsGuesser();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("detectIMAPConnectionSettings", () => {
    test("should throw an error if address is not provided", async () => {
      await expect(guesser.detectIMAPConnectionSettings("")).rejects.toThrow(
        "Address is required"
      );
    });

    test("should throw an error if email address is invalid", async () => {
      await expect(
        guesser.detectIMAPConnectionSettings("invalid.email")
      ).rejects.toThrow("Invalid email address format");
    });

    test("should return autoroute settings if MX domain is autorouted", async () => {
      (
        dns.resolve as jest.MockedFunction<typeof dns.resolve>
      ).mockImplementation((domain, _, callback) => {
        if (domain === "gmail.com") {
          callback(null, [{ exchange: "aspmx.l.google.com", priority: 10 }]);
        } else {
          callback(new Error("DNS resolution failed"), []);
        }
      });
      const settings = await guesser.detectIMAPConnectionSettings(
        "user@gmail.com"
      );
      expect(settings).toEqual([
        { host: "imap.gmail.com", port: 993, secure: true },
      ]);
    });

    test("should return list of imap settings based on the domain", async () => {
      (
        dns.resolve as jest.MockedFunction<typeof dns.resolve>
      ).mockImplementation((domain, _, callback) => {
        if (domain === "example.com") {
          callback(null, [{ exchange: "imap.example.com", priority: 10 }]);
        } else {
          callback(new Error("DNS resolution failed"), []);
        }
      });
      const settings = await guesser.detectIMAPConnectionSettings(
        "user@example.com"
      );
      expect(settings).toHaveLength(6);
      settings?.forEach((setting: IMAPConnectionSettings) => {
        expect(setting).toHaveProperty("host");
        expect(setting).toHaveProperty("port");
        expect(setting).toHaveProperty("secure");
      });
    });
  });

  describe("getMXDomain", () => {
    test("should handle DNS resolution errors gracefully", async () => {
      (
        dns.resolve as jest.MockedFunction<typeof dns.resolve>
      ).mockImplementation((_, __, callback) => {
        callback(new Error("DNS resolution failed"), []);
      });
      await expect(guesser["getMXDomain"]("user@invalid.com")).resolves.toEqual(
        null
      );
    });
  });

  describe("generateCheckMatrix", () => {
    test("should generate a matrix of IMAP settings based on checkdomains", () => {
      const checkdomains = ["example.com", "mail.example.org"];
      const extpected = [
        { host: "example.com", port: 993, secure: true },
        { host: "mail.example.org", port: 993, secure: true },
        { host: "example.com", port: 143, secure: false },
        { host: "mail.example.org", port: 143, secure: false },
      ];
      const result = guesser["generateCheckMatrix"](checkdomains);
      expect(result).toEqual(extpected);
    });
  });
});
