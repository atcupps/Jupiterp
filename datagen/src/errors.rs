// This file is part of Jupiterp. For terms of use, please see the file
// called LICENSE at the top level of the Jupiterp source tree (online at
// https://github.com/atcupps/Jupiterp/LICENSE).
// Copyright (C) 2024 Andrew Cupps

//! Custom error types used by Jupiterp.

use core::fmt;
use std::error::Error;

/// Error caused by passing an invalid term to Jupiterp datagen.
#[derive(Debug)]
pub enum TermError {
    YearOutOfBounds(u16),
    InvalidTermFormat(String),
    InvalidMonth(u8),
}

impl fmt::Display for TermError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::YearOutOfBounds(year) => write!(f, "Year '{year}' out of bounds; must be between 2000 and 2100."),
            Self::InvalidTermFormat(input) => write!(f, "'{input}' has invalid term format; must be in the form YYYYMM as is used by Testudo."),
            Self::InvalidMonth(month) => write!(f, "Month '{month}' invalid; Testudo only supports terms for spring (01), summer (05), fall (08), and winter (12) courses."),
        }
    }
}

impl Error for TermError {}
