import { parseIMAPConfigsFromXML, findAttribute } from "../src/utils";

describe("findAttribute", () => {
  it("should find attribute in a nested object", () => {
    const data = {
      a: {
        b: {
          c: "value",
        },
      },
    };

    expect(findAttribute(data, "c")).toBe("value");
  });

  it("should return null if attribute is not found", () => {
    const data = {
      a: {
        b: {
          c: "value",
        },
      },
    };

    expect(findAttribute(data, "d")).toBeNull();
  });

  it("should throw TypeError for non-object data", () => {
    expect(() => {
      findAttribute("not an object", "attr");
    }).toThrow(TypeError);
  });
});

describe("parseIMAPConfigsFromXML", () => {
  it("should parse XML and extract specific imap attributes", () => {
    const xml = `
      <config>
        <incomingServer>
          <hostname>imap-incoming-server.example.com</hostname>
          <port>993</port>
          <socketType>SSL</socketType>
          <username>user@example.com</username>
          <authentication>password</authentication>
          <type>imap</type>
        </incomingServer>
        <Protocol>
            <Server>imap-protocol.example.com</Server>
            <Port>993</Port>
            <SSL>on</SSL>
            <Type>imap</Type>
        </Protocol>
      </config>
    `;

    const expected = [
      {
        host: "imap-incoming-server.example.com",
        port: 993,
        secure: true,
      },
      {
        host: "imap-protocol.example.com",
        port: 993,
        secure: true,
      },
    ];

    expect(parseIMAPConfigsFromXML(xml)).toEqual(expected);
  });

  it("should filter out non-IMAP configurations", () => {
    const xml = `
      <config>
        <incomingServer>
          <hostname>imap.example.com</hostname>
          <port>993</port>
          <socketType>SSL</socketType>
          <username>user@example.com</username>
          <authentication>password</authentication>
          <type>smtp</type>
        </incomingServer>
        <Protocol>SMTP</Protocol>
      </config>
    `;

    expect(parseIMAPConfigsFromXML(xml)).toBeNull();
  });

  it("should accept specifying attributes to extract", () => {
    const xml = `
      <config>
        <incomingServer1>
          <hostname>imap-incomingServer1.example.com</hostname>
          <port>993</port>
          <socketType>SSL</socketType>
          <type>imap</type>
        </incomingServer1>
        <Protocol>IMAP</Protocol>
      </config>
    `;

    const expected = [
      {
        host: "imap-incomingServer1.example.com",
        port: 993,
        secure: true,
      },
    ];

    expect(parseIMAPConfigsFromXML(xml, ["incomingServer1"])).toEqual(expected);
  });

  it("should return null for invalid XML", () => {
    const xml = "<invalid-xml>";
    expect(parseIMAPConfigsFromXML(xml)).toBeNull();
  });
});
