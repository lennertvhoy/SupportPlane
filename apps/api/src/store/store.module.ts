import { Module, Global } from '@nestjs/common';
import { InMemoryStore } from '../support-sessions/in-memory.store.js';
import { PrismaStore } from './prisma.store.js';
import type { Store } from './store.interface.js';

const storeProvider = {
  provide: InMemoryStore,
  useFactory: (): Store => {
    const mode = process.env['SUPPORTPLANE_STORE'] ?? 'memory';
    if (mode === 'postgres') {
      return new PrismaStore();
    }
    return new InMemoryStore();
  },
};

@Global()
@Module({
  providers: [storeProvider],
  exports: [InMemoryStore],
})
export class StoreModule {}
