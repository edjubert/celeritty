//! Reads an `alacritty.toml` — the user's `~/.config/alacritty/alacritty.toml`
//! by default. Read-only: nothing here ever writes to the file.
//!
//! A missing file is normal — most users do not have one — and produces
//! Alacritty's own documented defaults, field by field. A *malformed* file is
//! a real condition the caller should surface, because it means the user's
//! actual settings are silently not being honored.

pub mod options;

use std::path::PathBuf;

use serde::Deserialize;

/// Alacritty's own documented default: `font.size`.
const DEFAULT_FONT_SIZE: f64 = 11.25;
/// Alacritty's own documented default: `scrolling.history`.
const DEFAULT_SCROLLBACK_HISTORY: u32 = 10_000;
/// Alacritty's own documented default: `cursor.style.shape`.
const DEFAULT_CURSOR_SHAPE: &str = "Block";
/// Alacritty's own documented default: `cursor.style.blinking`.
const DEFAULT_CURSOR_BLINKING: &str = "Off";

#[derive(Debug, Deserialize, PartialEq)]
#[serde(default)]
pub struct AlacrittyConfig {
    pub font: FontConfig,
    pub colors: ColorsConfig,
    pub cursor: CursorConfig,
    pub scrolling: ScrollingConfig,
}

impl Default for AlacrittyConfig {
    fn default() -> Self {
        Self {
            font: FontConfig::default(),
            colors: ColorsConfig::default(),
            cursor: CursorConfig::default(),
            scrolling: ScrollingConfig::default(),
        }
    }
}

#[derive(Debug, Deserialize, PartialEq, Default)]
#[serde(default)]
pub struct FontFace {
    pub family: Option<String>,
    pub style: Option<String>,
}

#[derive(Debug, Deserialize, PartialEq)]
#[serde(default)]
pub struct FontConfig {
    /// Only `[font.normal]` is parsed. The glyph atlas rasterizes a single
    /// face, so bold and italic would be read and then ignored.
    pub normal: FontFace,
    pub size: f64,
}

impl Default for FontConfig {
    fn default() -> Self {
        Self {
            normal: FontFace::default(),
            size: DEFAULT_FONT_SIZE,
        }
    }
}

#[derive(Debug, Deserialize, PartialEq, Default)]
#[serde(default)]
pub struct PrimaryColors {
    pub foreground: Option<String>,
    pub background: Option<String>,
}

#[derive(Debug, Deserialize, PartialEq, Default)]
#[serde(default)]
pub struct CursorColors {
    /// Verbatim from the file: either a hex colour or the sentinel strings
    /// `"CellBackground"` / `"CellForeground"`. Not validated or resolved
    /// here — the component has no concept for the sentinels.
    pub text: Option<String>,
    pub cursor: Option<String>,
}

#[derive(Debug, Deserialize, PartialEq, Clone)]
pub struct AnsiPalette {
    pub black: String,
    pub red: String,
    pub green: String,
    pub yellow: String,
    pub blue: String,
    pub magenta: String,
    pub cyan: String,
    pub white: String,
}

#[derive(Debug, Deserialize, PartialEq, Default)]
#[serde(default)]
pub struct ColorsConfig {
    pub primary: PrimaryColors,
    pub cursor: CursorColors,
    /// `None` when the file does not override the eight ANSI colours at all.
    /// Unlike the scalar fields, there is no documented default palette to
    /// fill in here — the caller supplies a fallback. See `options::resolve`.
    pub normal: Option<AnsiPalette>,
    pub bright: Option<AnsiPalette>,
}

#[derive(Debug, Deserialize, PartialEq, Clone)]
#[serde(default)]
pub struct CursorStyle {
    pub shape: String,
    pub blinking: String,
}

impl Default for CursorStyle {
    fn default() -> Self {
        Self {
            shape: DEFAULT_CURSOR_SHAPE.to_string(),
            blinking: DEFAULT_CURSOR_BLINKING.to_string(),
        }
    }
}

#[derive(Debug, Deserialize, PartialEq)]
#[serde(default)]
pub struct CursorConfig {
    pub style: CursorStyle,
}

impl Default for CursorConfig {
    fn default() -> Self {
        Self {
            style: CursorStyle::default(),
        }
    }
}

#[derive(Debug, Deserialize, PartialEq)]
#[serde(default)]
pub struct ScrollingConfig {
    pub history: u32,
}

impl Default for ScrollingConfig {
    fn default() -> Self {
        Self {
            history: DEFAULT_SCROLLBACK_HISTORY,
        }
    }
}

/// `~/.config/alacritty/alacritty.toml`. `None` only when the home directory
/// itself cannot be resolved — no `$HOME`, no passwd entry.
pub fn default_config_path() -> Option<PathBuf> {
    dirs::home_dir()
        .map(|home| home.join(".config").join("alacritty").join("alacritty.toml"))
}

/// Parse TOML text. The browser path uses this — there is no file to read.
pub fn parse_alacritty_source(source: &str) -> Result<AlacrittyConfig, String> {
    toml::from_str(source).map_err(|e| format!("failed to parse alacritty config: {e}"))
}

/// Parse a file. `Ok(None)` when it does not exist: that is the common case,
/// not an error. `Err` only when it exists and fails to parse, because then
/// the user's real settings are silently not being honored.
pub fn parse_alacritty_config(
    path: &std::path::Path,
) -> Result<Option<AlacrittyConfig>, String> {
    let raw = match std::fs::read_to_string(path) {
        Ok(raw) => raw,
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(None),
        Err(e) => return Err(format!("failed to read {}: {e}", path.display())),
    };
    parse_alacritty_source(&raw).map(Some)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn write_temp_toml(contents: &str) -> tempfile::TempPath {
        let mut file = tempfile::NamedTempFile::new().unwrap();
        std::io::Write::write_all(&mut file, contents.as_bytes()).unwrap();
        file.into_temp_path()
    }

    #[test]
    fn missing_file_is_not_an_error() {
        let path = std::env::temp_dir().join("definitely-does-not-exist-alacritty.toml");
        assert_eq!(parse_alacritty_config(&path), Ok(None));
    }

    #[test]
    fn malformed_file_is_an_error_not_a_panic() {
        let path = write_temp_toml("this is not [ valid");
        let result = parse_alacritty_config(&path);
        assert!(result.is_err(), "expected an error, got {result:?}");
    }

    #[test]
    fn empty_file_gets_alacrittys_real_documented_defaults() {
        let path = write_temp_toml("");
        let config = parse_alacritty_config(&path).unwrap().unwrap();
        assert_eq!(config.scrolling.history, 10_000);
        assert_eq!(config.cursor.style.shape, "Block");
        assert_eq!(config.cursor.style.blinking, "Off");
        assert_eq!(config.font.size, 11.25);
    }

    #[test]
    fn a_missing_table_still_gets_its_defaults() {
        // The regression this whole `#[serde(default)]` + `impl Default`
        // pattern exists for: with no [scrolling] table at all, a derived
        // Default would give 0, not 10_000.
        let path = write_temp_toml("[font]\nsize = 14.0\n");
        let config = parse_alacritty_config(&path).unwrap().unwrap();
        assert_eq!(config.scrolling.history, 10_000);
        assert_eq!(config.font.size, 14.0);
    }

    #[test]
    fn a_full_file_is_parsed_field_for_field() {
        // Note the r##"..."## delimiter: a plain r#"..."# terminates at the
        // first `"#`, and this TOML is full of `"#rrggbb"`.
        let path = write_temp_toml(
            r##"
[font]
size = 13.0

[font.normal]
family = "JetBrains Mono"

[colors.primary]
foreground = "#c0caf5"
background = "#1a1b26"

[colors.normal]
black = "#15161e"
red = "#f7768e"
green = "#9ece6a"
yellow = "#e0af68"
blue = "#7aa2f7"
magenta = "#bb9af7"
cyan = "#7dcfff"
white = "#a9b1d6"

[cursor.style]
shape = "Beam"
blinking = "On"

[scrolling]
history = 50000
"##,
        );
        let config = parse_alacritty_config(&path).unwrap().unwrap();

        assert_eq!(config.font.size, 13.0);
        assert_eq!(
            config.font.normal.family.as_deref(),
            Some("JetBrains Mono")
        );
        assert_eq!(
            config.colors.primary.background.as_deref(),
            Some("#1a1b26")
        );
        assert_eq!(
            config.colors.normal.as_ref().map(|p| p.red.as_str()),
            Some("#f7768e")
        );
        assert_eq!(config.cursor.style.shape, "Beam");
        assert_eq!(config.cursor.style.blinking, "On");
        assert_eq!(config.scrolling.history, 50_000);
    }
}
