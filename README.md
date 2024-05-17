# IMAP AutoConfig

Detects e-mail connection settings for a given email address. 

## Installation

Install the package using NPM:

```bash
npm i @ankaboot.io/imap-autoconfig
```

## Usage

```tsx
import { IMAPSettingsDetector } from 'imap-autoconfig';

const detector = new IMAPSettingsDetector();

async function getIMAPSettings(email) {
    try {
        const settings = await detector.detect(email);
        console.log(settings);
    } catch (error) {
        console.error('Error detecting IMAP settings:', error);
    }
}

const email = 'example@example.com';
getIMAPSettings(email);
```

**Response Data Object:**

The response from the `detect` method is an object with the following properties:

- **host**: The IMAP server hostname.
- **port**: The port number to connect to the host.
- **secure**: A boolean indicating if the connection should use SSL (typically true for port 993 and false for port 143).

**Example Response:**

```json
{ 
    "host": "imap.mail.yahoo.com",
    "port": 993,
    "secure": true
}
```

## License

This project is licensed under the MIT License.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request on GitHub.

## Support

If you encounter any issues or have questions, please open an issue on GitHub.
