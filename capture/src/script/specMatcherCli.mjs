import * as fs from 'fs';
import SpecMatcher from '../lib/SpecMatcher.mjs';


const captureName = 'deviceList'; // TODO: configure per capture test suite
const capturePath = `artifact/${captureName}.capture.json`;
const capture = JSON.parse(fs.readFileSync(capturePath, 'utf-8'));



const specPath = `artifact/${captureName}.spec.json`;
const spec = JSON.parse(fs.readFileSync(specPath, 'utf-8'));
const matcher = new SpecMatcher(spec);
if (matcher.isAMatch(capture)) {
  console.log(`BLE capture matches spec file ${specPath}`);
} else {
  console.warn(`BLE capture does NOT match spec file ${specPath}`);
}

