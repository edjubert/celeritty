//! Mapping an `AlacrittyConfig` onto the options the terminal component
//! consumes.
//!
//! The JSON these structs serialize to *is* the TypeScript `TerminalOptions`.
//! The fixtures under `fixtures/` are asserted from both languages so the two
//! cannot drift.

use serde::{Deserialize, Serialize};

use crate::{parse_alacritty_source, AlacrittyConfig};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TerminalFont {
    pub family: String,
    pub size: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TerminalPalette {
    pub black: String,
    pub red: String,
    pub green: String,
    pub yellow: String,
    pub blue: String,
    pub magenta: String,
    pub cyan: String,
    pub white: String,
    pub bright_black: String,
    pub bright_red: String,
    pub bright_green: String,
    pub bright_yellow: String,
    pub bright_blue: String,
    pub bright_magenta: String,
    pub bright_cyan: String,
    pub bright_white: String,
    pub foreground: String,
    pub background: String,
    pub cursor: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TerminalCursor {
    /// `"block"`, `"beam"` or `"underline"`. Anything else in the file falls
    /// back to `"block"` rather than erroring: an unknown cursor shape is not
    /// worth refusing an otherwise valid configuration over.
    pub style: String,
    pub blink: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TerminalOptions {
    pub font: TerminalFont,
    pub colors: TerminalPalette,
    pub cursor: TerminalCursor,
    pub scrollback: u32,
}

/// Alacritty writes cursor shapes capitalized; the component's type is
/// lowercase. Unrecognized shapes become `block`.
fn cursor_style(shape: &str) -> String {
    match shape.to_ascii_lowercase().as_str() {
        "beam" => "beam".to_string(),
        "underline" => "underline".to_string(),
        _ => "block".to_string(),
    }
}

/// `blinking` is `"Off" | "On" | "Always" | "Never"`. Only the two that mean
/// "yes" produce `true`.
fn cursor_blink(blinking: &str) -> bool {
    matches!(blinking.to_ascii_lowercase().as_str(), "on" | "always")
}

fn palette_from(config: &AlacrittyConfig, fallback: &TerminalPalette) -> TerminalPalette {
    let normal = config.colors.normal.as_ref();
    let bright = config.colors.bright.as_ref();

    TerminalPalette {
        black: normal.map_or_else(|| fallback.black.clone(), |p| p.black.clone()),
        red: normal.map_or_else(|| fallback.red.clone(), |p| p.red.clone()),
        green: normal.map_or_else(|| fallback.green.clone(), |p| p.green.clone()),
        yellow: normal.map_or_else(|| fallback.yellow.clone(), |p| p.yellow.clone()),
        blue: normal.map_or_else(|| fallback.blue.clone(), |p| p.blue.clone()),
        magenta: normal.map_or_else(|| fallback.magenta.clone(), |p| p.magenta.clone()),
        cyan: normal.map_or_else(|| fallback.cyan.clone(), |p| p.cyan.clone()),
        white: normal.map_or_else(|| fallback.white.clone(), |p| p.white.clone()),
        bright_black: bright.map_or_else(|| fallback.bright_black.clone(), |p| p.black.clone()),
        bright_red: bright.map_or_else(|| fallback.bright_red.clone(), |p| p.red.clone()),
        bright_green: bright.map_or_else(|| fallback.bright_green.clone(), |p| p.green.clone()),
        bright_yellow: bright.map_or_else(|| fallback.bright_yellow.clone(), |p| p.yellow.clone()),
        bright_blue: bright.map_or_else(|| fallback.bright_blue.clone(), |p| p.blue.clone()),
        bright_magenta: bright
            .map_or_else(|| fallback.bright_magenta.clone(), |p| p.magenta.clone()),
        bright_cyan: bright.map_or_else(|| fallback.bright_cyan.clone(), |p| p.cyan.clone()),
        bright_white: bright.map_or_else(|| fallback.bright_white.clone(), |p| p.white.clone()),
        foreground: config
            .colors
            .primary
            .foreground
            .clone()
            .unwrap_or_else(|| fallback.foreground.clone()),
        background: config
            .colors
            .primary
            .background
            .clone()
            .unwrap_or_else(|| fallback.background.clone()),
        cursor: config
            .colors
            .cursor
            .cursor
            .clone()
            .unwrap_or_else(|| fallback.cursor.clone()),
    }
}

/// Resolve TOML text into the component's options.
///
/// `fallback` supplies every colour the file does not set. The crate resolves
/// the *file*, not the defaults: alacritty documents its scalar defaults
/// (size 11.25, history 10 000, `Block`, `Off`) and those are baked in, but it
/// documents no default palette, and inventing sixteen ANSI values would ship
/// a theme nobody chose.
pub fn resolve(toml_source: &str, fallback: &TerminalPalette) -> Result<TerminalOptions, String> {
    let config = parse_alacritty_source(toml_source)?;

    Ok(TerminalOptions {
        font: TerminalFont {
            family: config
                .font
                .normal
                .family
                .clone()
                .unwrap_or_else(|| "monospace".to_string()),
            size: config.font.size,
        },
        colors: palette_from(&config, fallback),
        cursor: TerminalCursor {
            style: cursor_style(&config.cursor.style.shape),
            blink: cursor_blink(&config.cursor.style.blinking),
        },
        scrollback: config.scrolling.history,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn fallback() -> TerminalPalette {
        // Each value is distinguishable, so a mis-mapped slot is obvious.
        TerminalPalette {
            black: "#f00000".into(),
            red: "#f00001".into(),
            green: "#f00002".into(),
            yellow: "#f00003".into(),
            blue: "#f00004".into(),
            magenta: "#f00005".into(),
            cyan: "#f00006".into(),
            white: "#f00007".into(),
            bright_black: "#f00008".into(),
            bright_red: "#f00009".into(),
            bright_green: "#f0000a".into(),
            bright_yellow: "#f0000b".into(),
            bright_blue: "#f0000c".into(),
            bright_magenta: "#f0000d".into(),
            bright_cyan: "#f0000e".into(),
            bright_white: "#f0000f".into(),
            foreground: "#fallbf".into(),
            background: "#fallbb".into(),
            cursor: "#fallbc".into(),
        }
    }

    #[test]
    fn an_empty_source_is_all_fallback_and_documented_defaults() {
        let options = resolve("", &fallback()).unwrap();

        assert_eq!(options.font.family, "monospace");
        assert_eq!(options.font.size, 11.25);
        assert_eq!(options.scrollback, 10_000);
        assert_eq!(options.cursor.style, "block");
        assert!(!options.cursor.blink);
        assert_eq!(options.colors.red, "#f00001");
        assert_eq!(options.colors.foreground, "#fallbf");
    }

    #[test]
    fn cursor_shapes_are_lowercased_and_unknown_ones_become_block() {
        assert_eq!(cursor_style("Beam"), "beam");
        assert_eq!(cursor_style("Underline"), "underline");
        assert_eq!(cursor_style("Block"), "block");
        assert_eq!(cursor_style("Hollow"), "block");
    }

    #[test]
    fn only_on_and_always_mean_the_cursor_blinks() {
        assert!(cursor_blink("On"));
        assert!(cursor_blink("Always"));
        assert!(!cursor_blink("Off"));
        assert!(!cursor_blink("Never"));
    }

    #[test]
    fn a_partial_palette_falls_back_slot_by_slot() {
        // Sets [colors.normal] but not [colors.bright]: the bright half must
        // come from the fallback, not from the normal half.
        let options = resolve(
            r##"
[colors.normal]
black = "#000000"
red = "#111111"
green = "#222222"
yellow = "#333333"
blue = "#444444"
magenta = "#555555"
cyan = "#666666"
white = "#777777"
"##,
            &fallback(),
        )
        .unwrap();

        assert_eq!(options.colors.red, "#111111");
        assert_eq!(options.colors.bright_red, "#f00009");
    }

    #[test]
    fn the_json_field_names_are_camel_case() {
        // This is the half of the cross-language contract Rust can assert on
        // its own. The fixtures assert the other half.
        let options = resolve("", &fallback()).unwrap();
        let json = serde_json::to_string(&options).unwrap();

        assert!(json.contains("\"brightBlack\""), "got {json}");
        assert!(!json.contains("bright_black"), "got {json}");
    }
}
