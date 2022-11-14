use fsutils::{mkdir, rm_r};
use include_dir::{include_dir, Dir};
use notify::FsEventWatcher;
use once_cell::sync::OnceCell;
use rouille::websocket::Websocket;
use rouille::{extension_to_mime, websocket, Request, Response};
use std::fs::read_to_string;
use std::sync::mpsc::Receiver;
use std::sync::Mutex;
use std::{fs::File, path::Path};

static WATCHER: OnceCell<FsEventWatcher> = OnceCell::new();
static KIT: Dir = include_dir!("kit/dist");
static TAILWIND: Dir = include_dir!("node_modules/tailwindcss/lib/css");
static RECEIVERS: OnceCell<Mutex<Vec<Receiver<Websocket>>>> = OnceCell::new();
static SOCKETS: OnceCell<Mutex<Vec<Websocket>>> = OnceCell::new();

fn main() {
    println!("Starting server on port 7777");
    RECEIVERS.set(Mutex::new(Vec::new())).ok();
    SOCKETS.set(Mutex::new(Vec::new())).ok();
    cache();
    compile();
    watch();
    rouille::start_server("127.0.0.1:7777", move |request| handle(request));
}

fn cache() {
    println!("Building cache...");
    rm_r(".cache");
    KIT.extract(".cache/dist").unwrap();
    mkdir(".cache/dist/node/css");
    TAILWIND.extract(".cache/dist/node/css").unwrap();
}

fn compile() {
    println!("Building app...");
    // let sources = glob::glob("app/**/*.css").unwrap();
    // let output = std::process::Command::new("esbuild")
    //     .args(sources.map(|s| s.unwrap()))
    //     .arg("--outdir=.cache/app")
    //     .arg("--bundle")
    //     .output()
    //     .unwrap();
    // println!("{}", String::from_utf8(output.stderr).unwrap());
    let sources = glob::glob("app/**/*.ts*").unwrap();
    // XXX: This esbuild path needs to be adapted for a lib install
    match std::process::Command::new("../node_modules/esbuild/bin/esbuild")
        .args(sources.map(|s| s.unwrap()))
        .arg("--outdir=.cache/app")
        .arg("--format=esm")
        .output()
    {
        Ok(output) => {
            println!("{}", String::from_utf8(output.stderr).unwrap());
            notify();
        }
        Err(_) => println!("ERROR: There was a problem running 'esbuild'"),
    }

    // println!("{}", String::from_utf8(output.stderr).unwrap());
    // notify();
}

fn notify() {
    let mut sockets = SOCKETS.get().unwrap().lock().unwrap();
    let mut receivers = RECEIVERS.get().unwrap().lock().unwrap();
    for i in (0..receivers.len()).rev() {
        let receiver = receivers.remove(i);
        sockets.push(receiver.recv().unwrap());
    }
    for i in (0..sockets.len()).rev() {
        let socket = sockets.get_mut(i).unwrap();
        match socket.send_text("reload") {
            Ok(_) => {
                println!("Sent reload message to client");
            }
            Err(_) => {
                println!("Removing dead socket");
                sockets.remove(i);
            }
        }
    }
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
        // .arg(".cache/dist/node/render.js")
        .arg(".cache/dist/render.js")
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
        "/_socket" => {
            println!("200");
            let (response, receiver) = websocket::start::<&str>(request, None).unwrap();
            RECEIVERS.get().unwrap().lock().unwrap().push(receiver);
            response
        }
        url => {
            if request.raw_query_string() == "client" {
                println!("200");
                let code = read_to_string(format!(".cache/app{url}.js"))
                    .unwrap()
                    .replace("react/jsx-runtime", "/_runtime");
                Response::from_data("application/javascript", code)
            } else {
                if Path::new(&format!("app{url}.tsx")).exists()
                    || Path::new(&format!("app{url}/index.tsx")).exists()
                {
                    println!("200");
                    Response::html(render(url))
                } else if Path::new(&format!("app{url}")).exists() {
                    let path = format!("app{url}");
                    let extension = Path::new(&path).extension().unwrap().to_str().unwrap();
                    let mime = extension_to_mime(extension);
                    if extension == "css" {
                        let output = std::process::Command::new("node")
                            .arg(".cache/dist/postcss.js")
                            .arg(url)
                            .output()
                            .unwrap();
                        let error = String::from_utf8_lossy(&output.stderr);
                        if !error.is_empty() {
                            println!("{error}");
                        }
                        Response::from_data(mime, output.stdout)
                    } else {
                        println!("200");
                        Response::from_file(mime, File::open(format!("app{url}")).unwrap())
                    }
                } else {
                    println!("404");
                    Response::empty_404()
                }
            }
        }
    }
}
