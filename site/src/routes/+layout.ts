/**
 * This file is part of Jupiterp. For terms of use, please see the file
 * called LICENSE at the top level of the Jupiterp source tree (online at
 * https://github.com/atcupps/Jupiterp/LICENSE).
 * Copyright (C) 2026 Andrew Cupps
 * 
 * @fileoverview This file primarily exists to access Vercel analytics.
 */

import { dev } from '$app/environment';
import { inject } from '@vercel/analytics';
import { injectSpeedInsights } from "@vercel/speed-insights/sveltekit"
 
inject({ mode: dev ? 'development' : 'production' });
injectSpeedInsights();