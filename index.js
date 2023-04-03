const readline = require("readline");
const fs = require('fs');
var path = require('path');
var ffprobe = require('ffprobe'),
    ffprobeStatic = require('ffprobe-static');
var ffprobe_results = {
    "results": []
};
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
})
const { Telnet } = require('telnet-client');
const cliProgress = require('cli-progress');
const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
const app_path = (process.pkg) ? process.cwd() : __dirname;
var os = require('os');
console.log(__dirname)
function isWindows() {  
    return os.platform() === 'win32'
  }
const libsPath = isWindows() ? 'libs\\ivms-win.exe' : 'libs/ivms-linux'

// const spawn = require('child_process').spawn;

var question = "Vui lòng nhập tên file json chứa thông tin các luồng input (ví dụ: test.json). Gõ `q` để thoát : "
async function main() {    
    try {
        let inputData = await readlineInput();
        if (inputData) {
            let res = JSON.parse(inputData.data)
            //Write result to output file
            bar1.start(res.stream_list.length, 0);
            for (let i = 0; i < res.stream_list.length; ++i) {
                try {
                    //telnet first to see host is reachable
                    let url = new URL(res.stream_list[i]);
                    await connection.connect({
                        host:url.host,
                        port:url.port
                    })
                    let ff = await ffprobe(res.stream_list[i], { path: path.join(app_path, libsPath)});
                    ff["input"]=res.stream_list[i];
                    ffprobe_results.results.push(ff);
                } catch (error) {
                    ffprobe_results.results.push({
                        "streams":null,
                        "input": res.stream_list[i]
                    })
                }
                bar1.update(i+1);
            }
            fs.writeFileSync('result.json', JSON.stringify(ffprobe_results, null, 2));
            bar1.stop();
            console.log('***************Process Done********************')
        }
        main();
    } catch (error) {
        console.log(error)
        main();
    }

}

function readlineInput() {    
    return new Promise((resolve, reject) => {
        rl.question(question, (answer) => {
            if (answer === "q") {
                process.exit(1)
            }
            else {
                try {
                    //Read input file
                    let data = fs.readFileSync(path.join(app_path, answer), { encoding: 'utf8' });
                    console.log(data)
                    resolve({
                        data: data
                    })
                } catch (error) {
                    console.log(error)
                    reject(error)
                }
            }
        });
    });
}

// function ffprobeFromStatic(url)
// {
//     return new Promise((resolve,reject)=>{
//         let command =getArgs(url);
//         console.log(command);
//         let child = spawn('libs/ffprobe.exe', command, { shell: true });
//         child.stdout.on('data', function (data) {
//             //The image can be composed of one or multiple chunk when receiving stream data.
//             //Store all bytes into an array until we meet flag "FF D9" that mean it's the end of the image then we can send all data in order to display the full image.
//             if (data.length > 1) {
//                 buff = Buffer.concat([buff, data]);

//                 offset = data[data.length - 2].toString(16);
//                 offset2 = data[data.length - 1].toString(16);

//                 if (offset == "ff" && offset2 == "d9") {
//                     // socket.emit('onStream_' + input.streamID, buff.toString('base64'));
//                     socket.emit('onStream_' + input.streamID, buff);

//                     buff = Buffer.from('');
//                 }
//             }
//         });
//         child.stderr.on('data', function (data) {
//             // console.log('FFmpeg Error ---- ', data);
//         });
//         child.on('close', function (code) {
//             console.log('Process Killed')
//         }.bind(this));
//         child.on('error', function (err) {
//             if (err.code === 'ENOENT') {
//                 console.log('FFMpeg executable wasn\'t found. Install this package and check FFMpeg.cmd property');
//             } else {
//                 console.log(err);
//             }
//         });
//     });
// }
function getArgs(inputStream) {
    // -v quiet -print_format json -show_format -show_streams
    return [
        '-v', 'quiet',
        '-print_format', 'json',
        '-show_format', '-show_streams',
        '-i', inputStream 
    ]
}
main()
