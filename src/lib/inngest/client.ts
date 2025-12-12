import { Inngest } from 'inngest';

// Create Inngest client
export const inngest = new Inngest({
  id: 'clipforge',
  signingKey: process.env.INNGEST_SIGNING_KEY,
});

// Event types
export type ContentUploadedEvent = {
  name: 'content/uploaded';
  data: {
    contentId: string;
    userId: string;
    fileUrl: string;
    title: string;
  };
};

export type TranscriptionCompleteEvent = {
  name: 'content/transcription.complete';
  data: {
    contentId: string;
    userId: string;
    transcription: string;
    segments: Array<{
      id: string;
      start: number;
      end: number;
      text: string;
    }>;
  };
};

export type ClipGenerationRequestedEvent = {
  name: 'clip/generation.requested';
  data: {
    clipId: string;
    contentId: string;
    userId: string;
    sourceUrl: string;
    startTime: number;
    endTime: number;
    aspectRatio: '16:9' | '9:16' | '1:1' | '4:5';
  };
};

export type Events = ContentUploadedEvent | TranscriptionCompleteEvent | ClipGenerationRequestedEvent;

