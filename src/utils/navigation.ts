import { router, type Href } from 'expo-router';

/**
 * Goes back in history when possible, otherwise replaces with fallbackHref.
 * Needed because a web page refresh clears navigation history, leaving
 * router.back() with nowhere to go.
 */
export function goBack(fallbackHref: Href): void {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallbackHref);
  }
}
