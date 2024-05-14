import { IMAPSettingsGuesser } from '../src/lib'; // Import the class to test
import { IMAPConnectionSettings } from '../src/types';

// Mocking DNS resolver for testing purposes
jest.mock('dns', () => ({
  resolve: jest.fn((domain, type, callback) => {
    if (domain === 'example.com') {
      callback(null, [{ exchange: 'imap.example.com', priority: 10 }]);
    } else {
      callback(new Error('DNS resolution failed'));
    }
  }),
}));

describe('IMAPSettingsGuesser', () => {
  let guesser: IMAPSettingsGuesser;

  beforeEach(() => {
    guesser = new IMAPSettingsGuesser();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('detectIMAPConnectionSettings', () => {
    test('should throw an error if address is not provided', async () => {
      await expect(guesser.detectIMAPConnectionSettings('')).rejects.toThrow('Address is required');
    });

    test('should throw an error if email address is invalid', async () => {
      await expect(guesser.detectIMAPConnectionSettings('invalid.email')).rejects.toThrow('Invalid email address format');
    });

    test('should return autoroute settings if MX domain is autorouted', async () => {
      const settings = await guesser.detectIMAPConnectionSettings('user@gmail.com');
      expect(settings).toEqual([{ host: 'imap.gmail.com', port: 993, secure: true }]);
    });

    test('should generate check matrix for MX domain and provided domains', async () => {
      const settings = await guesser.detectIMAPConnectionSettings('user@example.com');
      expect(settings).toHaveLength(4);
      settings?.forEach((setting: IMAPConnectionSettings) => {
        expect(setting).toHaveProperty('host');
        expect(setting).toHaveProperty('port');
        expect(setting).toHaveProperty('secure');
      });
    });

    test('should handle DNS resolution errors gracefully', async () => {
      await expect(guesser.detectIMAPConnectionSettings('user@invalid.com')).resolves.toEqual([]);
    });
  });

  describe('generateCheckMatrix', () => {
    test('should generate correct check matrix', () => {
      const checkdomains = ['example.com'];
      const matrix = guesser['generateCheckMatrix'](checkdomains);
      expect(matrix).toHaveLength(2); // Assuming 2 ports
      matrix.forEach((row: IMAPConnectionSettings[]) => {
        expect(row).toHaveLength(1);
        expect(row[0]).toHaveProperty('host', 'example.com');
        expect(row[0]).toHaveProperty('port');
        expect(row[0]).toHaveProperty('secure');
      });
    });
  });

  describe('getMXDomain', () => {
    test('should resolve MX domain correctly', async () => {
      const mxdomain = await guesser['getMXDomain']('example.com');
      expect(mxdomain).toBe('imap.example.com');
    });

    test('should handle DNS resolution errors gracefully', async () => {
      await expect(guesser['getMXDomain']('invalid.com')).resolves.toBeNull();
    });
  });
});
