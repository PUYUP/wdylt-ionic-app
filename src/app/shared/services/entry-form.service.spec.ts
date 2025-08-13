import { TestBed } from '@angular/core/testing';

import { EntryFormService } from './entry-form.service';

describe('EntryFormService', () => {
  let service: EntryFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EntryFormService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
