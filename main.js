import parseTorrent from 'parse-torrent'
import { prettyBytes } from "https://deno.land/std@0.126.0/fmt/bytes.ts";
import { Hono } from 'hono'
import { etag } from 'hono/etag'
import { cache } from 'hono/cache'
import { compress } from 'hono/compress'
import { html, raw } from 'hono/html'
// import toTree from "./utils/toTree.js" for future use in download screen

const app = new Hono();

app.use('*', compress(), cache({
    cacheName: 'webtor-ddl',
    cacheControl: 'max-age=3600',
    wait: true,
  }), etag())

app.get("/", (c) => {
  return c.html(
    html`<html>
      <head>
        <title>Webtor.io DDL</title>
        <link rel="stylesheet" href="https://cdn.simplecss.org/simple.css">
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            :root {
                --accent: red;
            }
            input {
                width: 45vw;
            }
            input, button {
                vertical-align: middle;
            }
            div.center {
                display: flex;
                align-items: center;
                justify-content: center;
            }
        </style>
      </head>
        <body>
              <header>
                    <h1>Webtor.io DDL</h1>
                    <p>Download Torrents for FREE!</p>
                    <nav>
                        <a href="/" class="current">Home</a>
                        <a href="/about">About</a>
                    </nav>
                </header>
                <main>
                    <h3>Just paste a magnet link and start downloading as a ZIP-archive!</h3>
                    <form action="/downloads" method="GET">
                        <label style="text-align: center;">Magnet Link</label>
                        <div class="center">
                            <input type="text" placeholder="magnet:?xt=urn:" name="magnetLink" required>
                            <button>Go</button>
                        </div>
                    </form>
                    <p class="notice">⚠️ Zips do not contain valid CRC32 checksums. Extraction tools may complain.</p>
                </main>
            <footer>
                This service utilizes Webtor.io's <i>hidden</i> API. It is not associated or affiliated with <a href="https://webtor.io">Webtor.io</a> in any way.
            </footer>
        </body>
    </html>`
  )
})

app.get("/about", (c) => {
  return c.html(
    html`<html>
      <head>
        <title>About - Webtor.io DDL</title>
        <link rel="stylesheet" href="https://cdn.simplecss.org/simple.css">
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            :root {
                --accent: red;
            }
        </style>
      </head>
        <body>
              <header>
                    <h1>Webtor.io DDL</h1>
                    <p>Download Torrents for FREE!</p>
                    <nav>
                        <a href="/">Home</a>
                        <a href="/about" class="current">About</a>
                    </nav>
                </header>
                <main>
                    <h3>Welcome</h3>
                    <p>This website has been built using <a href="https://github.com/kevquirk/simple.css">Simple.css</a> and a serverless <a href="https://hono.dev/">Hono</a> backend. If you'd like to see or make improvements to the shoddy put together here, feel free to open an <a href="https://github.com/lebestnoob/webtorio-ddl/issues">issue</a> or submit a <a href="https://github.com/lebestnoob/webtorio-ddl/pulls">pull request</a>; the code is <a href="https://github.com/lebestnoob/webtorio-ddl/">open source</a>. I do not accept any form of monetary compensation for this service. </p>
                    <h3>What is and why Webtor.io DDL?</h3>
                    <p>Webtor.io Direct Download Link (DDL) creates a zip file of a torrent through Webtor.io's hidden API. Why? The original website does not work well on mobile.</p>
                    <h3>I'm unable to extract the zip!</h3>
                    <p>Try extracting the archive using <a href="https://www.7-zip.org/">7-Zip</a>. It may complain about it, but it'll still extract the file. If this does not work, try re-downloading the file. </p>
                    <h3>File is not found!</h3>
                    <p>This message usually occurs when a torrent is not available in one of Webtor.io's trackers. However, it can also occur when downloading a file with a long name or several special characters. If you have a solution to this, don't hesitate to create a <a href="https://github.com/lebestnoob/webtorio-ddl/pulls">pull request</a>. </p>
                </main>
            <footer>
                This service utilizes Webtor.io's <i>hidden</i> API. It is not associated or affiliated with <a href="https://webtor.io">Webtor.io</a> in any way.
            </footer>
        </body>
    </html>`
  )
})

app.get("/downloads", async (c) => {
    const magnetLink = decodeURIComponent(c.req.query().magnetLink);
    const check = new RegExp(/magnet:\?xt=urn:[a-z0-9]+:[a-z0-9]{32}/i)
    if(!check.test(magnetLink) || !magnetLink)
        return c.notFound();
    const infoHash = (await parseTorrent(magnetLink)).infoHash; // we can only reliably obtain the info hash from a magnet link. The name is truncated on longer file names, causing a download failures
    const apiKey = "8acbcf1e-732c-4574-a3bf-27e6a85b86f1"; // website default
    const api = "brilliant-bittern.buzz"
    
    try {
        // parse website to obtain first token
        const obtainToken  = await fetch(`https://webtor.io/show?id=${crypto.randomUUID()}&mode=video&version=0.2.12&lang=null&i18n=%5Bobject+Object%5D&features=%5Bobject+Object%5D HTTP/2.0`, { headers: {
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0' }
        });
        const cookie = obtainToken.headers.get('set-cookie').split(';')[0] // save  the cookie set by the first request to use in all other requests
        const window = {
            __TOKEN__: ""
        };
        const siteHTML = await obtainToken.text();
        const regex = "window\.__[A-Za-z]+__ = '[^']*';";
        const found = siteHTML.match(regex);
        for (const token of found) {
            eval(token) // BAD IDEA!!! I'm too lazy to make it into a json
        }

        // refresh token from api, this token is used in subsequent requests
        const tokenUpdate = await fetch('https://webtor.io/token/', {
        headers: {
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
            'accept': '*/*',
            'accept-language': 'en-US,en;q=0.5',
            'referer': 'https://webtor.io/',
            'cookie': cookie,
            'token': window.__TOKEN__,
            'dnt': '1',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin',
            'te': 'trailers'
        }
        }).then((res)=>res.text());
        window.__TOKEN__ = tokenUpdate;

    // obtain list of valid subdomains from api
        const subdomainList = await fetch(`https://api.${api}/subdomains.json?infohash=${infoHash}&use-bandwidth=false&use-cpu=true&skip-active-job-search=false&pool=seeder&token=${window.__TOKEN__}&api-key=${apiKey}`, {
        headers: {
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
            'accept': '*/*',
            'accept-language': 'en-US,en;q=0.5',
            'referer': 'https://webtor.io/',
            'origin': 'https://webtor.io',
            'dnt': '1',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'cross-site',
            'te': 'trailers'
        }
        }).then((res)=>res.json());
        
        // upload torrent to webtor 
        const sendTorrent = await fetch("https://api.brilliant-bittern.buzz/store/TorrentStore/Touch", {
            "headers": {
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
                "accept": "*/*",
                "accept-language": "en-US,en;q=0.9",
                "api-key": apiKey,
                "cache-control": "no-cache",
                "content-type": "application/grpc-web+proto",
                "pragma": "no-cache",
                "priority": "u=1, i",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "cross-site",
                "sec-gpc": "1",
                "token": window.__TOKEN__,
                "user-id": "null",
                "x-grpc-web": "1"
            },
            "referrer": "https://webtor.io/",
            "referrerPolicy": "strict-origin-when-cross-origin",
            "body": `\u0000\u0000\u0000\u0000*\n(${infoHash}`,
            "method": "POST",
            "mode": "cors",
            "credentials": "omit"
        });

        // Assume something really bad happened if status isn't ok
        if (!sendTorrent.ok) return c.text("500 Internal Server Error", 500)

        // pull torrent from api to obtain information
        const queryTorrent = await fetch(`https://api.${api}/store/TorrentStore/Pull`, {
        headers: {
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
            "accept": "*/*",
            "accept-language": "en-US,en;q=0.9",
            "api-key": apiKey,
            "cache-control": "no-cache",
            "content-type": "application/grpc-web+proto",
            "pragma": "no-cache",
            "priority": "u=1, i",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "cross-site",
            "sec-gpc": "1",
            "token": window.__TOKEN__,
            "user-id": "null",
            "x-grpc-web": "1"
        },
        "referrer": "https://webtor.io/",
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": `\u0000\u0000\u0000\u0000*\n(${infoHash}`,
        "method": "POST",
        "mode": "cors",
        "credentials": "omit"
        }).then((res)=>res.arrayBuffer()); 

        if (new TextDecoder().decode(queryTorrent).match(`grpc-message: Unable to find torrent for infoHash=${infoHash}`)) return c.notFound(); // before attempting to parse data, check response
        
        const uint8array = new Uint8Array(queryTorrent);
        const index = uint8array.indexOf(100); // find the "d" character
        if(index == -1) return c.notFound(); // If cannot find the letter "d", error
        const fixedTorrent = uint8array.slice(index);
        if(fixedTorrent[2] != 58) return c.notFound() // If ":" is not the 3rd character, error
        const parsedTorrent = await parseTorrent(fixedTorrent); 
        
        if(!parsedTorrent)
            return c.notFound()
        
        const torrentName = parsedTorrent.name;
        const torrentSize = prettyBytes(parsedTorrent.length, { binary: true });
        const torrentFiles = parsedTorrent.files;
        const NEEDS_PARSE = "null"

        // create html for torrent file contents 
        let filesList = html``;
        for (const file of torrentFiles) {
            let mirrorList = html``
            for(const i in subdomainList)
                mirrorList += html`<a rel="noreferrer noopener" target="_blank" href="https://${subdomainList[i]}.api.${api}/${infoHash}/${encodeURIComponent(file.path.replaceAll("\\", "/"))}?user-id=${NEEDS_PARSE}&download=true&download-id=${NEEDS_PARSE}&token=${window.__TOKEN__}&api-key=${apiKey}">Mirror ${Number(i)+1}</a> `
            filesList+=html`
                <details>
                    <summary>${file.name}</summary>
                    <p>File Size: <code>${prettyBytes(file.length, { binary: true })}</code></p>
                    <p>Path: <code>${file.path.replaceAll("\\", "/")}</code></p>
                    ${raw(mirrorList)}
                </details>`
        }
        
        let mirrorList = html``; // Creating the html to embed later using template literals
        for(const i in subdomainList) {
            mirrorList+=html`<a class="button" rel="noreferrer noopener" target="_blank" href="https://${subdomainList[i]}.api.${api}/${infoHash}/${encodeURIComponent(torrentName)}~arch/${decodeURIComponent(torrentName)}.zip?user-id=${NEEDS_PARSE}&download-id=${NEEDS_PARSE}&token=${window.__TOKEN__}&api-key=${apiKey}">Mirror ${Number(i)+1}</a> `
        }

        return c.html(
            html`<html>
            <head>
                <title>${decodeURIComponent(torrentName)} - Webtor.io DDL</title>
                <link rel="stylesheet" href="https://cdn.simplecss.org/simple.css">
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    :root {
                        --accent: red;
                    }
                </style>
            </head>
                <body>
                    <header>
                            <h1>Webtor.io DDL</h1>
                            <p>Download Torrents for FREE!</p>
                            <nav>
                                <a href="/">Home</a>
                                <a href="/about">About</a>
                            </nav>
                        </header>
                        <main>
                            <h4>Download <code>${decodeURIComponent(torrentName)}</code> as a ZIP!</h4>
                                ${torrentFiles.length > 1 ? html`                            <aside>
                                <p>Scroll down or <a href="#content">click here</a> to view/download individual files from the torrent</p>
                            </aside>` : ""}
                            <strong><blockquote>File Size: <code>${torrentSize}</code>, <code>${torrentFiles.length}</code> file(s)</blockquote></strong>
                            <center>
                                ${raw(mirrorList)}
                            </center>
                            <p class="notice">⚠️ Zips do not contain valid CRC32 checksums. Extraction tools may complain.</p>
                            <h4 id="content"> Contents: </h4>
                            ${raw(filesList)}
                        </main>
                    <footer>
                        This service utilizes Webtor.io's <i>hidden</i> API. It is not associated or affiliated with <a href="https://webtor.io">Webtor.io</a> in any way.
                    </footer>
                </body>
            </html>`  )
    } catch(_e) { // needs better error handling
        // console.error(e)
        c.text("500 Internal Server Error", 500);
    }
})

app.notFound((c) => {
  return c.html(
        html`<html>
        <head>
            <title>Not Found - Webtor.io DDL</title>
            <link rel="stylesheet" href="https://cdn.simplecss.org/simple.css">
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                :root {
                    --accent: red;
                }
            </style>
        </head>
            <body>
                <header>
                        <h1>Webtor.io DDL</h1>
                        <p>Download Torrents for FREE!</p>
                        <nav>
                            <a href="/">Home</a>
                            <a href="/about">About</a>
                        </nav>
                    </header>
                    <main>
                        <h3>Oops... the resource was not found</h3>
                        <p>Go <a href="/">home</a>?</p>
                    </main>
                <footer>
                    This service utilizes Webtor.io's <i>hidden</i> API. It is not associated or affiliated with <a href="https://webtor.io">Webtor.io</a> in any way.
                </footer>
            </body>
        </html>`  )
})

Deno.serve(app.fetch)
