import Connection from "imap";
import { IMAPConnectionSettings } from "../types";
interface UserCredentials {
  user: string;
  password: string;
}

/**
 * Checks the IMAP connection using the provided credentials and server settings.
 * @param credentials - The user credentials for authentication.
 * @param server - The IMAP server connection settings.
 * @returns IMAP connection settings if successful, or null.
 */
async function checkIMAPConnection(
  credentials: UserCredentials,
  server: IMAPConnectionSettings
): Promise<IMAPConnectionSettings | null> {
  const { user, password, host, port, secure } = { ...credentials, ...server };

  const imap = new Connection({
    authTimeout: 10000,
    user,
    password,
    host,
    port,
    tls: secure,
    tlsOptions: {
      host,
      port,
      servername: host,
    },
  });

  return new Promise((resolve) => {
    imap.once("ready", () => {
      imap.end();
      resolve(server);
    });

    imap.once("error", (err: unknown) => {
      imap.end();
      if (
        err instanceof Error &&
        "source" in err &&
        err.source === "authentication" &&
        !("message" in err && err.message.toLowerCase().includes("disabled"))
      ) {
        resolve(server);
      } else {
        resolve(null);
      }
    });

    imap.connect();
  });
}

export default checkIMAPConnection;
