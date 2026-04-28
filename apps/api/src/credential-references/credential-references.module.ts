import { Module } from '@nestjs/common';
import { CredentialReferencesController } from './credential-references.controller.js';
import { CredentialReferencesService } from './credential-references.service.js';
import { StoreModule } from '../store/store.module.js';

@Module({
  imports: [StoreModule],
  controllers: [CredentialReferencesController],
  providers: [CredentialReferencesService],
  exports: [CredentialReferencesService],
})
export class CredentialReferencesModule {}
