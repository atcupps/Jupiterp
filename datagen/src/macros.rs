macro_rules! panic_response_fail {
    ($response:ident) => {
        panic!(
            "Request failed with status {:?} - {}",
            $response.status(),
            $response.status().canonical_reason().unwrap_or("Unknown")
        )
    }
}

macro_rules! create_selector {
    ($selector:expr) => {
        Selector::parse(&$selector.as_str()).unwrap()
    }
}

macro_rules! select_inners {
    ($document:ident, $selector:ident) => {
        $document.select(&$selector).map(|x| x.inner_html())
    }
}