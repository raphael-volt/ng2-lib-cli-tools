import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { {{moduleClass}} } from '../src/{{{moduleFilename}}}';

platformBrowserDynamic().bootstrapModule({{moduleClass}});