import os from 'node:os';
import path from 'node:path';

import { createApp } from './app';
import { JsonStore } from './repositories/store';

async function main() {
  const port = Number(process.env.PORT ?? 3000);
  const dataFile = path.resolve(process.cwd(), process.env.DATA_FILE ?? 'data/db.json');

  const store = await JsonStore.open(dataFile);
  const app = createApp(store, { logRequests: true });

  // 0.0.0.0 = reachable from other devices on the network (your phone), not only from this PC.
  app.listen(port, '0.0.0.0', () => {
    console.log(`DogalXalis API listening on port ${port}`);
    console.log(`Data file: ${dataFile}`);
    console.log('Use one of these addresses as EXPO_PUBLIC_API_URL on the phone (same Wi-Fi):');
    for (const addresses of Object.values(os.networkInterfaces())) {
      for (const address of addresses ?? []) {
        if (address.family === 'IPv4' && !address.internal) {
          console.log(`  http://${address.address}:${port}`);
        }
      }
    }
  });
}

main().catch((error) => {
  console.error('Could not start the server', error);
  process.exit(1);
});
