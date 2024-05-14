import { XMLParser } from "fast-xml-parser";
import { AutodiscoverIMAPSettings, IMAPConnectionSettings } from "./types";

export function findAttribute<T>(data: T, attrName: string) {
  function search(obj: object): unknown {
    if (typeof obj !== "object" || obj === null) {
      return null;
    }
    if (obj.hasOwnProperty(attrName)) {
      // @ts-ignore
      return obj[attrName];
    }
    for (const key in obj) {
      // @ts-ignore
      const value = search(obj[key]);
      if (value !== undefined) {
        return value;
      }
    }
    return null;
  }

  if (typeof data !== "object" || data === null) {
    throw new TypeError("Invalid data provided. Expected an object.");
  }

  return search(data);
}

/**
 * Parses IMAP configuration from XML string
 * to extract spesific attributes.
 *
 * @param sourceString - The XML string containing configuration data.
 * @param extractAtr - A list of attributes to extract from the object. Default: ["incomingServer", "Protocol"]
 */
export function parseIMAPConfigsFromXML(
  sourceString: string,
  extractAtr = ["incomingServer", "Protocol"]
): IMAPConnectionSettings[] | null {
  const parsedData = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
  }).parse(sourceString);
  const extractedAttr = extractAtr
    ?.map((attr) => {
      const conf = findAttribute(
        parsedData,
        attr
      ) as AutodiscoverIMAPSettings | null;

      if (!conf || (conf.type ?? conf.Type) !== 'imap') {
        return null;
      }

      return {
        host: conf.hostname ?? conf.Server,
        port: conf.port ?? conf.Port,
        secure: conf.socketType === "SSL" || conf.SSL === "on",
      };
    })
    .filter(Boolean) as IMAPConnectionSettings[];

  if (extractAtr) {
    return extractedAttr.length > 0 ? extractedAttr : null;
  }

  return parsedData ?? null;
}
