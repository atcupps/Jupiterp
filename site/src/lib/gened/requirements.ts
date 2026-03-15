/**
 * This file is part of Jupiterp. For terms of use, please see the file
 * called LICENSE at the top level of the Jupiterp source tree (online at
 * https://github.com/atcupps/Jupiterp/LICENSE).
 * Copyright (C) 2026 Andrew Cupps
 */

export type GenEdRequirementCode =
	| 'FSAW'
	| 'FSPW'
	| 'FSOC'
	| 'FSMA'
	| 'FSAR'
	| 'DSNL'
	| 'DSNS'
	| 'DSHS'
	| 'DSHU'
	| 'DSSP'
	| 'SCIS'
	| 'DVUP'
	| 'DVCC';

export type GenEdCategory =
	| 'Fundamental Studies'
	| 'Distributive Studies'
	| 'I-Series / Big Question'
	| 'Diversity';

/**
 * Single source of truth for a UMD Gen Ed requirement row shown in profile
 * progress views.
 */
export interface GenEdRequirement {
	code: GenEdRequirementCode;
	displayName: string;
	category: GenEdCategory;
	description: string;
	requiredCount: number;
	notes?: string;
}

export const GEN_ED_REQUIREMENTS: GenEdRequirement[] = [
	{
		code: 'FSAW',
		displayName: 'Academic Writing (AW)',
		category: 'Fundamental Studies',
		description: 'Academic Writing requirement.',
		requiredCount: 1
	},
	{
		code: 'FSPW',
		displayName: 'Professional Writing (PW)',
		category: 'Fundamental Studies',
		description: 'Professional Writing requirement.',
		requiredCount: 1
	},
	{
		code: 'FSOC',
		displayName: 'Oral Communication (OC)',
		category: 'Fundamental Studies',
		description: 'Oral Communication requirement.',
		requiredCount: 1
	},
	{
		code: 'FSMA',
		displayName: 'Math (MA)',
		category: 'Fundamental Studies',
		description: 'Fundamental Studies Math requirement.',
		requiredCount: 1
	},
	{
		code: 'FSAR',
		displayName: 'Analytic Reasoning (AR)',
		category: 'Fundamental Studies',
		description: 'Analytic Reasoning requirement.',
		requiredCount: 1
	},
	{
		code: 'DSNL',
		displayName: 'Natural Sciences with Lab',
		category: 'Distributive Studies',
		description: 'Natural Sciences with Lab requirement.',
		requiredCount: 1,
		notes: 'Typically a 4-credit laboratory science course.'
	},
	{
		code: 'DSNS',
		displayName: 'Natural Sciences',
		category: 'Distributive Studies',
		description: 'Natural Sciences requirement.',
		requiredCount: 1,
		notes: 'Typically a 3-credit science course.'
	},
	{
		code: 'DSHS',
		displayName: 'History and Social Sciences',
		category: 'Distributive Studies',
		description: 'History and Social Sciences requirement.',
		requiredCount: 2
	},
	{
		code: 'DSHU',
		displayName: 'Humanities',
		category: 'Distributive Studies',
		description: 'Humanities requirement.',
		requiredCount: 2
	},
	{
		code: 'DSSP',
		displayName: 'Scholarship in Practice',
		category: 'Distributive Studies',
		description: 'Scholarship in Practice requirement.',
		requiredCount: 2,
		notes: 'At least one DSSP course should be outside the major.'
	},
	{
		code: 'SCIS',
		displayName: 'I-Series / Big Question',
		category: 'I-Series / Big Question',
		description: 'I-Series (Big Question) requirement.',
		requiredCount: 2,
		notes: 'Some catalogs may refer to this as IS.'
	},
	{
		code: 'DVUP',
		displayName: 'Understanding Plural Societies (UP)',
		category: 'Diversity',
		description: 'Understanding Plural Societies requirement.',
		requiredCount: 2,
		notes: 'UI interpretation can also consider a 1 UP + 1 CC path.'
	},
	{
		code: 'DVCC',
		displayName: 'Cultural Competence (CC)',
		category: 'Diversity',
		description: 'Cultural Competence requirement.',
		requiredCount: 1,
		notes: 'Often a 1-3 credit requirement.'
	}
];

export const GEN_ED_REQUIREMENT_CODE_SET = new Set<GenEdRequirementCode>(
	GEN_ED_REQUIREMENTS.map((requirement) => requirement.code)
);
