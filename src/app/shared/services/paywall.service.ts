import { Injectable } from '@angular/core';
import { RevenueCatUI } from '@revenuecat/purchases-capacitor-ui';
import { PAYWALL_RESULT } from '@revenuecat/purchases-capacitor';

@Injectable({
  providedIn: 'root'
})
export class PaywallService {

  constructor() { }

  async presentPaywall(): Promise<any> {
    // Present a paywall with the default offering
    const result = await RevenueCatUI.presentPaywall();
    console.log('Paywall result:', result);
    return result;
  }

}
