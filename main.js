// import { HttpsProxyAgent } from 'https-proxy-agent'; rotating proxy for later
import { DOMParser } from "https://esm.sh/linkedom";
import { magnetDecode } from 'npm:@ctrl/magnet-link';
import { v4 as uuidv4 } from 'npm:uuid';
import { Hono } from 'npm:hono'
import { html, raw } from 'npm:hono/html'

const app = new Hono();

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
                    <h3>Just paste a magnet link and start downloading as a ZIP-archive!</h3>
                    <form action="/downloads" method="GET">
                        <p>
                            <label>Magnet Link</label>
                            <figure>
                            <input type="text" style="width: 45em;" placeholder="magnet:?xt=urn:" name="magnetLink" required>
                            </figure>
                        </p>

                        <button>Go</button>
                    </form>
                    <p class="notice">Zips do not contain valid CRC32 checksums. Extraction tools may complain.</p>
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
                        <a href="/about">About</a>
                    </nav>
                </header>
                <main>
                    <h3>Welcome</h3>
                    <p>This website has been built using <a href="https://github.com/kevquirk/simple.css">Simple.css</a> and a serverless <a href="https://hono.dev/">Hono</a> backend. If you'd like to see or make improvements to the shoddy put together here, feel free to open an <a href="https://github.com/lebestnoob/webtorio-ddl/issues">issue</a> or submit a <a href="https://github.com/lebestnoob/webtorio-ddl/pulls">pull request</a>; the code is <a href="https://github.com/lebestnoob/webtorio-ddl/">open source</a>. I do not accept any form of monetary compensation for this service. </p>
                    <h3>What is Webtor.io DDL?</h3>
                    <p>Webtor.io Direct Download Link (DDL) creates a zip file of a torrent through Webtor.io's hidden API.</p>
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
        // const proxyHost = '127.0.0.1'; 
    // const proxyPort = 8080;
    // const proxyUrl = `http://${proxyHost}:${proxyPort}`;
    // const proxyAgent = new HttpsProxyAgent(proxyUrl);
    const infoHash = magnetDecode(magnetLink).infoHash; // we can only reliably obtain the info hash from a magnet link. The name is truncated on longer file names, causing a download failures
    const apiKey = "8acbcf1e-732c-4574-a3bf-27e6a85b86f1"; // website default
    const api = "brilliant-bittern.buzz"
    
    try {
        // parse website to obtain first token
        const obtainToken  = await fetch(`https://webtor.io/show?id=${uuidv4()}&mode=video&version=0.2.12&lang=null&i18n=%5Bobject+Object%5D&features=%5Bobject+Object%5D HTTP/2.0`, { headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0' }
        // , agent: proxyAgent
    });
        const cookie = obtainToken.headers.get('set-cookie').split(';')[0] // save  the cookie set by the first request to use in all other requests
        const root = new DOMParser().parseFromString(await obtainToken.text()); 
        const window = {
            __TOKEN__: ""
        };
        const siteEnv = root.querySelector("script").textContent;
        const regex = "window\.__[A-Za-z]+__ = '[^']*';";
        const found = siteEnv.match(regex);
        for (let token of found) {
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
    //   , agent: proxyAgent 
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
    
    // query torrent from api to obtain file name
    let queryTorrent = await fetch(`https://api.${api}/store/TorrentStore/Pull`, {
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
    }).then((res)=>res.text()); // yes, we're really parsing a binary as text and using a regex to get the file name. It works.
    const expression = new RegExp(/name(?:\d+)([:])(.*?)(?=12:piece)/gm); // i suck at regex, i asked gemini to create this section for me. This binary seems to contain a string that goes "name###:TORRENT 12:piece" on all torrents
    let torrent_name; // gemini
    let final;
    while ((torrent_name = expression.exec(queryTorrent)) !== null) { // gemini
        final = torrent_name[2]; // Access group 2 (content after colon) // gemini
    } // gemini
    if(!final)
     return c.notFound() // file wont download if name is undefined. It's not on Webtor's trackers
    const NEEDS_PARSE = "null" // works for the time being, userid and downloadid are optional

    let mirrorList = ""; // Creating the html to embed later using template literals
    for(let i in subdomainList) {
        mirrorList+=html`<p><a class="button" rel="noreferrer" href="https://${subdomainList[i]}.api.${api}/${infoHash}/${encodeURI(final)}~arch/${final}.zip/?user-id=${NEEDS_PARSE}&download-id=${NEEDS_PARSE}&token=${window.__TOKEN__}&api-key=${apiKey}">Mirror ${Number(i)+1}</a></p>`
    }

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
                        <h3>Download <i>${final}</i> as a ZIP-archive!</h3>
                        <center>
                        ${raw(mirrorList)}
                        </center>
                        <p class="notice">Zips do not contain valid CRC32 checksums. Extraction tools may complain.</p>
                    </main>
                <footer>
                    This service utilizes Webtor.io's <i>hidden</i> API. It is not associated or affiliated with <a href="https://webtor.io">Webtor.io</a> in any way.
                </footer>
            </body>
        </html>`  )
    } catch(e) { // needs better error handling
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
