import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EntryFormService {

  private readonly _state = new BehaviorSubject<{
    content: string;
    recordedData: any;
    uploadedRecordedData: any;
  }>({ content: '', recordedData: null, uploadedRecordedData: null });

  public readonly state$ = this._state.asObservable();

  constructor() { }

  private updateState(partialState: any): void {
    const currentState = this._state.value;
    const newState = { ...currentState, ...partialState };
    this._state.next(newState);
  }

  updateContent({ content }: { content: string }): void {
    this.updateState({ content });
  }

  updateRecordedData({ recordedData }: { recordedData: any }): void {
    this.updateState({ recordedData });
  }

  updateUploadedRecordedData({ uploadedRecordedData }: { uploadedRecordedData: any }): void {
    this.updateState({ uploadedRecordedData });
  }

  resetState(): void {
    this._state.next({ content: '', recordedData: null, uploadedRecordedData: null });
  }

}
