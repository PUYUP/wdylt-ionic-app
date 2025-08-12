import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HttpService {

  constructor(
    private httpClient: HttpClient
  ) { }

  generateMCQ(topic: string): Observable<any> {
    const url = environment.mcqGenerationUrl;
    return this.httpClient.post(url, { context: topic });
  }

  transcribeAudio(gcsUri: string, mimeType: string): Observable<any> {
    const url = environment.audioTranscriptionUrl;
    return this.httpClient.post(url, { gcs_uri: gcsUri, mime_type: mimeType });
  }

}
