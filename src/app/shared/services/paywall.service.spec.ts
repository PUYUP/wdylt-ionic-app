import { TestBed } from '@angular/core/testing';

import { PaywallService } from './paywall.service';

describe('PaywallService', () => {
  let service: PaywallService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PaywallService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
