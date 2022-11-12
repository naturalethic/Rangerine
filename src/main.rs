use notify::FsEventWatcher;
use once_cell::sync::OnceCell;
use std::{path::Path, thread};
use tiny_http::{Request, Response, Server};
use include_dir::{include_dir, Dir};
use fsutils::{rm_r};

static WATCHER: OnceCell<FsEventWatcher> = OnceCell::new();
static WEB: Dir = include_dir!("web/src");
fn main() {
    println!("Starting server on port 7777");
    cache();
    compile();
    watch();
    let server = Server::http("127.0.0.1:7777").unwrap();
    loop {
        let request = server.recv().unwrap();
        thread::spawn(move || handle(request));
    }
}

fn cache() {
    println!("Building cache...");
    rm_r(".cache");
    WEB.extract(".cache/src").unwrap();
    let sources = glob::glob(".cache/src/**/*.ts*").unwrap();
    let output = std::process::Command::new("esbuild")
        .args(sources.map(|s| s.unwrap()))
        .arg("--outdir=.cache/src")
        .arg("--format=cjs")
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

fn handle(request: Request) {
    println!("{} {}", request.method(), request.url());
    let html = render(request.url());
    let response = Response::from_string(html).with_status_code(200);
    request.respond(response).unwrap();
}

fn render(url: &str) -> String {
    let output = std::process::Command::new("node")
        .arg(".cache/src/script/render.js")
        .arg(url)
        .output()
        .unwrap();
    let mut html = String::new();
    html.push_str("<!DOCTYPE html>");
    html.push_str(String::from_utf8_lossy(&output.stdout).as_ref());
    html
}
