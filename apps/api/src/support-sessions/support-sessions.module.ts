import { Module } from '@nestjs/common';
import { SupportSessionsController } from './support-sessions.controller.js';
import { SupportSessionsService } from './support-sessions.service.js';
import { ConnectorsModule } from '../connectors/connectors.module.js';
import { StoreModule } from '../store/store.module.js';
import { CredentialReferencesModule } from '../credential-references/credential-references.module.js';
import { AiChatService } from '../ai-chat/ai-chat.service.js';

@Module({
  imports: [ConnectorsModule, StoreModule, CredentialReferencesModule],
  controllers: [SupportSessionsController],
  providers: [SupportSessionsService, AiChatService],
})
export class SupportSessionsModule {}
