/**
 * This file is part of Jupiterp. For terms of use, please see the file
 * called LICENSE at the top level of the Jupiterp source tree (online at
 * https://github.com/atcupps/Jupiterp/LICENSE).
 * Copyright (C) 2026 Andrew Cupps
 *
 * @fileoverview Creates an API client instance for use elsewhere.
 */
import { JupiterpClientV1 } from '@jupiterp/jupiterp';

export const client = JupiterpClientV1.createDefault();
