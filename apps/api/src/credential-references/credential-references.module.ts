import { Module } from '@nestjs/common';
import { CredentialReferencesController } from './credential-references.controller.js';
import { CredentialReferencesService } from './credential-references.service.js';
import { CredentialResolverService } from './credential-resolver.service.js';
import { StoreModule } from '../store/store.module.js';

@Module({
  imports: [StoreModule],
  controllers: [CredentialReferencesController],
  providers: [CredentialReferencesService, CredentialResolverService],
  exports: [CredentialReferencesService, CredentialResolverService],
})
export class CredentialReferencesModule {}
