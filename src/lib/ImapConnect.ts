import { ImapFlow } from "imapflow";
import { IMAPConnectionSettings } from "../types";

interface UserCredentials {
  user: string;
  password: string;
}

/**
 * Determines if the error is an authentication error (but not account disabled)
 */
function isAuthenticationError(err: unknown): boolean {
  if (
    typeof err === "object" &&
    err !== null &&
    "response" in err &&
    "authenticationFailed" in err &&
    typeof err.response === "string" &&
    typeof err.authenticationFailed === "boolean"
  ) {
    return (
      err.authenticationFailed &&
      !err.response.toLowerCase().includes("disabled")
    );
  }
  return false;
}
/**
 * Checks the IMAP connection using the provided credentials and server settings.
 * @param credentials - The user credentials for authentication.
 * @param server - The IMAP server connection settings.
 * @returns IMAP connection settings if successful, or null.
 */
async function checkIMAPConnection(
  credentials: UserCredentials,
  server: IMAPConnectionSettings,
): Promise<IMAPConnectionSettings | null> {
  const { user, password, host, port, secure } = { ...credentials, ...server };
  const client = new ImapFlow({
    host,
    port,
    secure,
    logger: false,
    verifyOnly: true,
    auth: {
      user,
      pass: password,
    },
    tls: { servername: host },
    connectionTimeout: 10000,
  });
  try {
    await client.connect();
    return server;
  } catch (err) {
    return isAuthenticationError(err) ? server : null;
  }
}

export default checkIMAPConnection;
