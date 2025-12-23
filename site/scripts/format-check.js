#!/usr/bin/env node
/**
 * This file is part of Jupiterp. For terms of use, please see the file
 * called LICENSE at the top level of the Jupiterp source tree (online at
 * https://github.com/atcupps/Jupiterp/LICENSE).
 * Copyright (C) 2024 Andrew Cupps
 *
 * @fileoverview Format checker script that validates .svelte and .ts files
 * against the project's style guide (STYLE.md). Checks for file ownership
 * comments and 80-column line limits.
 */

import fs from 'fs';
import path from 'path';

const MAX_LINE_LENGTH = 80;

// Expected ownership comment patterns
const TS_OWNERSHIP_PATTERN = /^\/\*\*\s*\n\s*\*\s*This file is part of Jupiterp/;
const SVELTE_OWNERSHIP_PATTERN = /^<!--\s*\nThis file is part of Jupiterp/;

/**
 * Recursively finds all .ts and .svelte files in a directory,
 * excluding node_modules.
 */
function findFiles(dir, files = []) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            if (entry.name === 'node_modules' || entry.name === '.svelte-kit') {
                continue;
            }
            findFiles(fullPath, files);
        } else if (entry.isFile()) {
            if (entry.name.endsWith('.ts') || entry.name.endsWith('.svelte')) {
                files.push(fullPath);
            }
        }
    }

    return files;
}

/**
 * Checks if a file has the required ownership comment at the top.
 */
function checkOwnership(content, filePath) {
    const isSvelte = filePath.endsWith('.svelte');
    const pattern = isSvelte ? SVELTE_OWNERSHIP_PATTERN : TS_OWNERSHIP_PATTERN;

    if (!pattern.test(content)) {
        const expectedFormat = isSvelte
            ? `<!--\nThis file is part of Jupiterp. For terms of use...`
            : `/**\n * This file is part of Jupiterp. For terms of use...`;
        return {
            type: 'ownership',
            message: `Missing or not formated correctly ownership comment at top of file`,
            suggestion: `Expected format:\n${expectedFormat}`
        };
    }

    return null;
}

/**
 * Checks all lines for the 80-char limit, includes indentations as per PEP-8
 */
function checkLineLength(content, filePath) {
    const lines = content.split('\n');
    const violations = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.length > MAX_LINE_LENGTH) {
            violations.push({
                type: 'line-length',
                line: i + 1,
                length: line.length,
                message: `Line ${i + 1} exceeds ${MAX_LINE_LENGTH} columns`,
                preview: line.length > 60
                    ? line.substring(0, 57) + '...'
                    : line
            });
        }
    }

    return violations;
}

/**
 * Checks a file for all formatting issues.
 */
function checkFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const errors = [];

    // Check ownership comment
    const ownershipError = checkOwnership(content, filePath);
    if (ownershipError) {
        errors.push(ownershipError);
    }

    // Check line lengths
    const lineLengthErrors = checkLineLength(content, filePath);
    errors.push(...lineLengthErrors);

    return errors;
}

/**
 * The actual format checker
 */
function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.error('Usage: format-check <directory>');
        console.error('Example: format-check ./src');
        process.exit(1);
    }

    const targetDir = path.resolve(args[0]);

    if (!fs.existsSync(targetDir)) {
        console.error(`Error: Directory does not exist: ${targetDir}`);
        process.exit(1);
    }

    if (!fs.statSync(targetDir).isDirectory()) {
        console.error(`Error: Path is not a directory: ${targetDir}`);
        process.exit(1);
    }

    console.log(`Checking format in: ${targetDir}\n`);

    const files = findFiles(targetDir);
    let totalErrors = 0;
    let filesWithErrors = 0;

    for (const file of files) {
        const errors = checkFile(file);

        if (errors.length > 0) {
            filesWithErrors++;
            const relativePath = path.relative(process.cwd(), file);
            console.log(`\x1b[31m✗\x1b[0m ${relativePath}`);

            for (const error of errors) {
                totalErrors++;
                if (error.type === 'ownership') {
                    console.log(`  \x1b[33m⚠ ${error.message}\x1b[0m`);
                    console.log(`    ${error.suggestion.split('\n')[0]}`);
                } else if (error.type === 'line-length') {
                    console.log(
                        `  \x1b[33m⚠ ${error.message}\x1b[0m ` +
                        `(${error.length} chars)`
                    );
                    console.log(`    "${error.preview}"`);
                }
            }
            console.log('');
        }
    }

    // Summary
    console.log('─'.repeat(50));
    if (totalErrors === 0) {
        console.log(
            `\x1b[32m✓ All ${files.length} files passed format checks\x1b[0m`
        );
        process.exit(0);
    } else {
        console.log(
            `\x1b[31m✗ Found ${totalErrors} error(s) in ` +
            `${filesWithErrors} file(s)\x1b[0m`
        );
        console.log(`  Checked ${files.length} files total`);
        process.exit(1);
    }
}

main();
