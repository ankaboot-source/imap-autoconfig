import { XMLParser } from "fast-xml-parser";
import { AutodiscoverIMAPSettings, IMAPConnectionSettings } from "./types";

export function findAttribute<T>(data: T, attrName: string) {
  function search(obj: object): unknown {
    if (typeof obj !== "object" || obj === null) {
      return null;
    }
    if (Object.prototype.hasOwnProperty.call(obj, attrName)) {
      // @ts-expect-error - can't determine type
      return obj[attrName];
    }
    for (const key in obj) {
      // @ts-expect-error - can't determine type
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

function transformToIMAPSettings(
  conf: AutodiscoverIMAPSettings,
): IMAPConnectionSettings | null {
  const imapType = conf.type ?? conf.Type;
  if (imapType !== "imap") return null;

  return {
    host: conf.hostname ?? conf.Server,
    port: conf.port ?? conf.Port,
    secure: conf.socketType === "SSL" || conf.SSL === "on",
  };
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
  extractAttrs = ["incomingServer", "Protocol"],
): IMAPConnectionSettings[] | null {
  const parsedData = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
  }).parse(sourceString);

  const extractedAttrs = extractAttrs.flatMap((attr) => {
    const conf = findAttribute(parsedData, attr);
    if (!conf) return [];

    if (Array.isArray(conf)) {
      return conf
        .map(transformToIMAPSettings)
        .filter(
          (settings): settings is IMAPConnectionSettings => settings !== null,
        );
    }

    const settings = transformToIMAPSettings(conf as AutodiscoverIMAPSettings);
    return settings ? [settings] : [];
  });

  return extractedAttrs.length ? extractedAttrs : null;
}
