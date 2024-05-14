import Connection from 'imap';
import { IMAPConnectionSettings } from "../types";

interface UserCredentials {
  user: string;
  password: string;
}

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
      servername: host
    }
  });

  return new Promise((resolve) => {
    imap.once("ready", () => {
      imap.end();
      resolve(server);
    });

    imap.once("error", (err: any) => {
      imap.end();
      if (
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

export default checkIMAPConnection 