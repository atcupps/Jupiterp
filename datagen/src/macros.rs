// This file is part of Jupiterp: https://github.com/atcupps/Jupiterp

//! Helpful macros for HTTP requests and parsing in Jupiterp Datagen.

/// Given a `response` to a failed HTTP request, panic with the response's
/// status and reason for failure.
macro_rules! panic_response_fail {
    ($response:ident) => {
        panic!(
            "Request failed with status {:?} - {}",
            $response.status(),
            $response.status().canonical_reason().unwrap_or("Unknown")
        )
    };
}

/// Create an HTML document selector based off a CSS `selector` expression
macro_rules! create_selector {
    ($selector:expr) => {
        Selector::parse(&$selector.as_str()).unwrap()
    };
}

/// Given an HTML `document` and `selector`, apply the `selector` to the
/// `document` and return an iterator over selected HTML text as a String.
macro_rules! select_inners {
    ($document:ident, $selector:ident) => {
        $document.select(&$selector).map(|x| x.inner_html())
    };
}
