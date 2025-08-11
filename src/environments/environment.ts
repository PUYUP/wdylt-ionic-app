// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  GoogleOAuthClientID: "928871794567-q4o09r04it8uolkrkuln5aidh2lubgko.apps.googleusercontent.com",
  supabaseUrl: 'https://eobdvdbwtuyxgfivcjzt.supabase.co',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvYmR2ZGJ3dHV5eGdmaXZjanp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MTg3MjUsImV4cCI6MjA2OTI5NDcyNX0.eRm4cUsbknfsgFaSqXPKvLTGCk6iJjPxvYms5jnF-B4',
  oneSignalAppId: '1615a20c-4d91-4a10-8d8e-d242c108d9b6',
  mcqGenerationUrl: 'https://cloudflare-worker.pointilis-noktah-teknologi.workers.dev/api/gemini/mcq-generator',
  deepLinkRedirectUrl: 'https://deeplink.wdylt.com',
  audioTranscriptionUrl: 'https://audio-transcribe-928871794567.us-central1.run.app/transcribe',
  queryPerPage: 25,
  generatedMCQ: 20,
  generatedEssay: 5,
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
