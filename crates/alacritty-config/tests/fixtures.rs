//! Asserts the Rust resolver against the fixtures the TypeScript side also
//! reads. If a field is renamed on one side only, one of these two suites
//! fails — which is the entire point of the fixtures existing.

use std::path::PathBuf;

use alacritty_config::options::{resolve, TerminalOptions, TerminalPalette};

fn fixtures_dir() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("..")
        .join("..")
        .join("fixtures")
}

fn fallback() -> TerminalPalette {
    let raw = std::fs::read_to_string(fixtures_dir().join("fallback.json")).unwrap();
    serde_json::from_str(&raw).unwrap()
}

fn check(name: &str) {
    let dir = fixtures_dir().join(name);
    let source = std::fs::read_to_string(dir.join("alacritty.toml")).unwrap();
    let expected_raw = std::fs::read_to_string(dir.join("expected.json")).unwrap();
    let expected: TerminalOptions = serde_json::from_str(&expected_raw).unwrap();

    let actual = resolve(&source, &fallback()).unwrap();

    assert_eq!(
        actual, expected,
        "fixture {name} did not resolve as expected"
    );
}

#[test]
fn minimal() {
    check("minimal");
}

#[test]
fn no_scrolling() {
    check("no-scrolling");
}

#[test]
fn full_theme() {
    check("full-theme");
}

#[test]
fn malformed_reports_a_parse_error() {
    let source =
        std::fs::read_to_string(fixtures_dir().join("malformed").join("alacritty.toml")).unwrap();

    let error = resolve(&source, &fallback()).unwrap_err();

    assert!(
        error.starts_with("failed to parse alacritty config"),
        "got {error}"
    );
}
