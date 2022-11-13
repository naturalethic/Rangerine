use fsutils::rm_r;
use include_dir::{include_dir, Dir};
use mime_guess::MimeGuess;
use notify::FsEventWatcher;
use once_cell::sync::OnceCell;
use rouille::{Request, Response};
use std::{fs::File, path::Path};

static WATCHER: OnceCell<FsEventWatcher> = OnceCell::new();
static WEB: Dir = include_dir!("web/dist");
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
    WEB.extract(".cache/dist").unwrap();
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
        .arg(".cache/dist/node/render.js")
        .arg(url)
        .output()
        .unwrap();
    print!("{}", String::from_utf8_lossy(&output.stderr));
    let mut html = String::new();
    html.push_str("<!DOCTYPE html>");
    html.push_str(String::from_utf8_lossy(&output.stdout).as_ref());
    html
}

fn handle(request: &Request) -> Response {
    print!("{} {} ", request.method(), request.url());
    match request.url().as_str() {
        "/_hydrate" => {
            println!("200");
            Response::from_file(
                "application/javascript",
                File::open(".cache/dist/bundle/hydrate.js").unwrap(),
            )
        }
        "/_runtime" => {
            println!("200");
            Response::from_file(
                "application/javascript",
                File::open(".cache/dist/bundle/runtime.js").unwrap(),
            )
        }
        url => {
            if request.raw_query_string() == "client" {
                let output = std::process::Command::new("esbuild")
                    .arg(format!("app{url}.tsx"))
                    .arg("--format=esm")
                    .output()
                    .unwrap();
                println!("200");
                println!("{}", String::from_utf8_lossy(&output.stderr));
                let output = String::from_utf8_lossy(&output.stdout)
                    .replace("react/jsx-runtime", "/_runtime");
                Response::from_data("application/javascript", output)
            } else {
                if Path::new(&format!("app{url}.tsx")).exists()
                    || Path::new(&format!("app{url}/index.tsx")).exists()
                {
                    println!("200");
                    Response::html(render(url))
                } else if Path::new(&format!("app{url}")).exists() {
                    let mime = MimeGuess::from_path(url)
                        .first_or_octet_stream()
                        .essence_str()
                        .to_string();
                    println!("200");
                    Response::from_file(mime, File::open(format!("app{url}")).unwrap())
                } else {
                    println!("404");
                    Response::empty_404()
                }
            }
        }
    }
}
