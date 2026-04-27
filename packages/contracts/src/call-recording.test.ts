import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CallRecording,
  CallRecordingStatus,
  CallRecordingSource,
  CallRecordingStorageType,
  CallRecordingAttachmentRequest,
  CallRecordingAttachmentResponse,
  CallRecordingPlaybackState,
  CallRecordingReviewEvent,
  CallRecordingEvidenceSummary,
} from './call-recording.js';

describe('call-recording contracts', () => {
  it('CallRecording validates minimal mock recording', () => {
    const now = new Date().toISOString();
    const rec = CallRecording.parse({
      id: 'rec-1',
      tenantId: 'tenant-a',
      callEventId: 'call-1',
      source: 'mock_generated',
      status: 'available',
      storageType: 'mock_inline',
      createdAt: now,
    });
    assert.strictEqual(rec.tenantId, 'tenant-a');
    assert.strictEqual(rec.noRealAudio, true);
    assert.strictEqual(rec.mockDevOnly, true);
  });

  it('CallRecordingStatus accepts all enum values', () => {
    assert.deepStrictEqual(CallRecordingStatus.options, [
      'available',
      'unavailable',
      'redacted',
      'deleted',
      'mock_only',
    ]);
  });

  it('CallRecordingSource accepts all enum values', () => {
    assert.deepStrictEqual(CallRecordingSource.options, [
      'mock_generated',
      'provider_placeholder',
    ]);
  });

  it('CallRecordingStorageType accepts all enum values', () => {
    assert.deepStrictEqual(CallRecordingStorageType.options, [
      'none',
      'mock_inline',
      'future_object_storage',
    ]);
  });

  it('CallRecordingAttachmentRequest validates with defaults', () => {
    const req = CallRecordingAttachmentRequest.parse({});
    assert.strictEqual(req.source, 'mock_generated');
  });

  it('CallRecordingAttachmentResponse validates', () => {
    const now = new Date().toISOString();
    const res = CallRecordingAttachmentResponse.parse({
      recording: {
        id: 'rec-1',
        tenantId: 'tenant-a',
        callEventId: 'call-1',
        source: 'mock_generated',
        status: 'available',
        storageType: 'mock_inline',
        createdAt: now,
      },
      mockDevOnly: true,
      attachedAt: now,
    });
    assert.strictEqual(res.mockDevOnly, true);
  });

  it('CallRecordingPlaybackState validates placeholder state', () => {
    const now = new Date().toISOString();
    const state = CallRecordingPlaybackState.parse({
      recordingId: 'rec-1',
      callEventId: 'call-1',
      openedAt: now,
      openedBy: 'user-1',
      mockDevOnly: true,
      noRealAudio: true,
      placeholderOnly: true,
    });
    assert.strictEqual(state.placeholderOnly, true);
  });

  it('CallRecordingReviewEvent validates review transition', () => {
    const now = new Date().toISOString();
    const evt = CallRecordingReviewEvent.parse({
      recordingId: 'rec-1',
      callEventId: 'call-1',
      reviewedAt: now,
      reviewedBy: 'user-1',
      previousStatus: 'available',
      newStatus: 'mock_only',
      mockDevOnly: true,
    });
    assert.strictEqual(evt.newStatus, 'mock_only');
  });

  it('CallRecordingEvidenceSummary validates', () => {
    const summary = CallRecordingEvidenceSummary.parse({
      recordingId: 'rec-1',
      callEventId: 'call-1',
      status: 'available',
      source: 'mock_generated',
      storageType: 'mock_inline',
      mockDevOnly: true,
      noRealAudio: true,
    });
    assert.strictEqual(summary.noRealAudio, true);
  });
});
