import axios from "axios";
import { IMAPAutoDiscover } from "../src/lib";

jest.mock("axios");

describe("IMAPAutoDiscover", () => {
  let imapAutoDiscover: IMAPAutoDiscover;

  beforeEach(() => {
    imapAutoDiscover = new IMAPAutoDiscover();
  });

  describe("generateServiceURLs", () => {
    test("should generate service URLs for a valid email", () => {
      const email = "user@example.com";
      const expected = [
        "http://autoconfig.example.com/mail/config-v1.1.xml?emailaddress=user@example.com",
        "http://example.com/.well-known/autoconfig/mail/config-v1.1.xml",
        "https://autoconfig-live.mozillamessaging.com/autoconfig/v1.1/example.com",
        "https://live.mozillamessaging.com/autoconfig/example.com",
        "https://example.com/autodiscover/autodiscover.xml",
        "http://example.com/autodiscover/autodiscover.xml",
        "https://autodiscover.example.com/autodiscover/autodiscover.xml",
        "http://autodiscover.example.com/autodiscover/autodiscover.xml",
      ];

      expect(imapAutoDiscover["generateServiceURLs"](email)).toEqual(expected);
    });

    test("should throw an error for an invalid email", () => {
      const email = "invalid_email";
      expect(() => imapAutoDiscover["generateServiceURLs"](email)).toThrow(
        "Invalid email address provided"
      );
    });
  });

  describe("fetchConfiguration", () => {
    test("should fetch configuration from a URL", async () => {
      const dummyURL =
        "http://autodiscover.example.com/autodiscover/autodiscover.xml";
      const mockedData = `
        <config>
            <incomingServer type="imap">
                <hostname>imap.example.com</hostname>
                <port>993</port>
                <socketType>SSL</socketType>
                <username>%EMAILADDRESS%</username>
                <authentication>OAuth2</authentication>
                <authentication>password-cleartext</authentication>
            </incomingServer>
        </config>
    `;
      const expected = [
        {
          host: "imap.example.com",
          port: 993,
          secure: true,
        },
      ];
      (
        axios.get as jest.MockedFunction<typeof axios.get>
      ).mockResolvedValueOnce({ status: 200, data: mockedData });

      const result = await imapAutoDiscover["fetchConfiguration"](dummyURL);
      expect(result).toEqual(expected);
    });

    // test bad status code
    test.each([203, 400])(
      "should return null for statusCode %s auto-discover url",
      async (status) => {
        (
          axios.get as jest.MockedFunction<typeof axios.get>
        ).mockResolvedValueOnce({ status });

        const result = await imapAutoDiscover["fetchConfiguration"](
          "http://autodiscover.example.com/autodiscover/autodiscover.xml"
        );
        expect(result).toBeNull();
      }
    );
  });
});
