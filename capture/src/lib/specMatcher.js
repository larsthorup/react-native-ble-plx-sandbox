export default class SpecMatcher {
  spec;
  constructor(spec /* : spec, which is a variant of messageList */) {
    this.spec = spec;
  }

  isAMatch(actual/* : messageList */) {
    let actualIndex = 0;
    let specIndex = 0;
    while (true) {
      if (actualIndex === actual.length) {
        if (specIndex === this.spec.length) {
          return true;
        } else {
          console.error(`Actual is too short: still ${this.spec.length - specIndex} messages in spec`);
          return false;
        }
      }
      if (specIndex === this.spec.length) {
        console.error(`Actual is too long: still ${actual.length - actualIndex} messages in actual`);
        return false;
      }
      const actualItem = actual[actualIndex];
      const specItem = this.spec[specIndex];
      if (this.itemMatch(actualItem, specItem)) {
        specIndex++;
        actualIndex++;
      } else if (specItem.optional) {
        specIndex++;
      } else {
        console.error('Unexpected', actualItem, 'not matching', specItem, 'actual index', actualIndex, 'specIndex', specIndex);
        return false;
      }
    }
  }

  itemMatch(actualItem, specItem) {
    return JSON.stringify({ ...actualItem, optional: true }) === JSON.stringify({ ...specItem, optional: true });
  }
}
