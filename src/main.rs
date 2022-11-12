use fsutils::rm_r;
use include_dir::{include_dir, Dir};
use notify::FsEventWatcher;
use once_cell::sync::OnceCell;
use rouille::{Request, Response};
use std::{fs::File, path::Path};

static WATCHER: OnceCell<FsEventWatcher> = OnceCell::new();
static WEB: Dir = include_dir!("web/src");
fn main() {
    println!("Starting server on port 7777");
    cache();
    compile();
    watch();
    rouille::start_server("127.0.0.1:7777", move |request| handle(request));
}

fn cache() {
    println!("Building cache...");
    rm_r(".cache");
    println!("{:?}", WEB.entries());
    WEB.extract(".cache/src").unwrap();
    let sources = glob::glob(".cache/src/**/*.ts*")
        .unwrap()
        .map(|path| path.unwrap())
        .filter(|path| !path.ends_with("hydrate.tsx"));
    let output = std::process::Command::new("esbuild")
        .args(sources)
        .arg("--outdir=.cache/src/server")
        .arg("--format=cjs")
        .output()
        .unwrap();
    println!("{}", String::from_utf8_lossy(&output.stderr));
    let output = std::process::Command::new("esbuild")
        .arg(Path::new(".cache/src/server/hydrate.tsx"))
        .arg("--outdir=.cache/src/server")
        .arg("--bundle")
        // .arg("--define:process.env.NODE_ENV=\"production\"")
        // .arg("--minify")
        .output()
        .unwrap();
    println!("{}", String::from_utf8_lossy(&output.stderr));
}

fn compile() {
    println!("Building app...");
    let sources = glob::glob("app/**/*.ts*").unwrap();
    let output = std::process::Command::new("esbuild")
        .args(sources.map(|s| s.unwrap()))
        .arg("--outdir=.cache/app")
        .arg("--format=cjs")
        .output()
        .unwrap();
    println!("{}", String::from_utf8_lossy(&output.stderr));
}

fn watch() {
    use notify::Watcher;
    let mut watcher = notify::recommended_watcher(|_| {
        compile();
    })
    .unwrap();
    watcher
        .watch(Path::new("app"), notify::RecursiveMode::Recursive)
        .unwrap();
    WATCHER.set(watcher).unwrap();
}

fn render(url: &str) -> String {
    let output = std::process::Command::new("node")
        .arg(".cache/src/server/render.js")
        .arg(url)
        .output()
        .unwrap();
    let mut html = String::new();
    // html.push_str("<!DOCTYPE html>");
    html.push_str(String::from_utf8_lossy(&output.stdout).as_ref());
    html
}

fn handle(request: &Request) -> Response {
    println!("{} {}", request.method(), request.url());
    match request.url().as_str() {
        "/_hydrate" => Response::from_file(
            "application/javascript",
            File::open(".cache/src/server/hydrate.js").unwrap(),
        ),
        url => Response::html(render(url)),
    }
}
