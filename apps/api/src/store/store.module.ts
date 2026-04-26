import { Module, Global } from '@nestjs/common';
import { InMemoryStore } from '../support-sessions/in-memory.store.js';

@Global()
@Module({
  providers: [InMemoryStore],
  exports: [InMemoryStore],
})
export class StoreModule {}
