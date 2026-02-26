use pulldown_cmark::{html, Options, Parser};

const GITHUB_CSS: &str = include_str!("../../static/preview.css");

#[tauri::command]
pub fn export_html(content: String, title: String) -> String {
    let mut options = Options::empty();
    options.insert(Options::ENABLE_TABLES);
    options.insert(Options::ENABLE_STRIKETHROUGH);
    options.insert(Options::ENABLE_TASKLISTS);

    let parser = Parser::new_ext(&content, options);
    let mut html_output = String::new();
    html::push_html(&mut html_output, parser);

    format!(
        r#"<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
<style>
{GITHUB_CSS}
</style>
</head>
<body>
<article class="markdown-body">
{html_output}
</article>
</body>
</html>"#
    )
}
