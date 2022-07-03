var v = "v.1.5";

var con = 0;

function getOS() {
    var userAgent = window.navigator.userAgent,
    platform = window.navigator.platform,
    macosPlatforms = ['Macintosh',
        'MacIntel',
        'MacPPC',
        'Mac68K'],
    windowsPlatforms = ['Win32',
        'Win64',
        'Windows',
        'WinCE'],
    iosPlatforms = ['iPhone',
        'iPad',
        'iPod'],
    os = null;

    if (macosPlatforms.indexOf(platform) !== -1) {
        os = 'Mac OS';
    } else if (iosPlatforms.indexOf(platform) !== -1) {
        os = 'iOS';
    } else if (windowsPlatforms.indexOf(platform) !== -1) {
        os = 'Windows';
    } else if (/Android/.test(userAgent)) {
        os = 'Android';
    } else if (!os && /Linux/.test(platform)) {
        os = 'Linux';
    }

    return os;
}

os = getOS();

var os, os_v;

try {
    function getAndroidVersion(ua) {
        var ua = (ua || navigator.userAgent).toLowerCase();
        var match = ua.match(/android\s([0-9\.]*)/i);
        return match ? match[1]: undefined;
    }
    os_v = "Android "+ getAndroidVersion();
}
catch {
    try {
        if (navigator.appVersion.indexOf("Windows ")!=-1) {
            os_v = getWindowsOS();
        } else {
            os_v = navigator.userAgent;
        }

        function getWindowsOS() {
            if (navigator.appVersion.indexOf("Windows NT 10.")!=-1) {
                return 'Windows 10';
            } else if (navigator.appVersion.indexOf("Windows NT 6.3")!=-1) {
                return "Windows 8.1";
            } else if (navigator.appVersion.indexOf("Windows NT 6.2")!=-1) {
                return "Windows 8";
            } else if (navigator.appVersion.indexOf("Windows NT 6.1")!=-1) {
                return "Windows 7";
            } else if (navigator.appVersion.indexOf("Windows NT 6.0")!=-1) {
                return "Windows Vista";
            } else if (navigator.appVersion.indexOf("Windows NT 5.2")!=-1) {
                return "Windows Server 2003; Windows XP x64 Edition";
            } else if (navigator.appVersion.indexOf("Windows NT 5.1")!=-1) {
                return "Windows XP";
            } else if (navigator.appVersion.indexOf("Windows NT 5.01")!=-1) {
                return "Windows 2000, Service Pack 1 (SP1)";
            } else if (navigator.appVersion.indexOf("Windows NT 5.0")!=-1) {
                return "Windows 2000";
            } else if (navigator.appVersion.indexOf("Windows NT 4.0")!=-1) {
                return "Windows NT 4.0";
            } else if (navigator.appVersion.indexOf("Windows 98; Win 9x 4.90")!=-1) {
                return "Windows Millennium Edition (Windows Me)";
            } else if (navigator.appVersion.indexOf("Windows 98")!=-1) {
                return "Windows 98";
            } else if (navigator.appVersion.indexOf("Windows 95")!=-1) {
                return "Windows 95";
            } else if (navigator.appVersion.indexOf("Windows CE")!=-1) {
                return "Windows CE";
            } else {
                return "Windows OS, Version:Unknown";
            }
        }
    }
    catch {
        os_v = navigator.appVersion;
    }

}

var mat = false;

function haltmatrix() {
    var canvas = document.querySelector('canvas'),
    ctx = canvas.getContext('2d');
    canvas.width = 0;
    canvas.height = 0;
}

function matrix() {
    var canvas = document.querySelector('canvas'),
    ctx = canvas.getContext('2d');
    canvas.width = document.body.clientWidth;
    canvas.height = document.body.clientHeight;
    var letters = '1010';
    letters = letters.split('');
    //Glitch Management
    if (document.getElementById("user-input").style.visibility == "hidden") {
        document.getElementById("user-input").style.visibility = "hidden";
    }
    // Setting up the columns
    var fontSize = 20,
    columns = canvas.width / fontSize;

    // Setting up the drops
    var drops = [];
    for (var i = 0; i < columns; i++) {
        drops[i] = 1;
    }

    // Setting up the draw function
    function draw() {
        ctx.fillStyle = 'rgba(0, 0, 0, .1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        for (var i = 0; i < drops.length; i++) {
            var text = letters[Math.floor(Math.random() * letters.length)];
            ctx.fillStyle = color();
            ctx.fillText(text, (i)* fontSize, drops[i] * fontSize);
            drops[i]++;
            if (drops[i] * fontSize > canvas.height && Math.random() > .95) {
                drops[i] = 0;
            }
        }
    }

    function color() {
        var colors = ['#ff6666',
            '#ff8c66',
            '#ffb366',
            '#ffd966',
            '#ffff66',
            '#d9ff66',
            '#b3ff66',
            '#66ff66',
            '#66ff8c',
            '#66b3ff',
            '#66ffd9',
            '#66ffff',
            '#66d9ff',
            '#668cff',
            '#6666ff',
            '#8c66ff',
            '#b366ff',
            '#d966ff',
            '#ff66ff',
            '#ff66d9',
            '#ff66b3',
            '#ff668c',
            '#ff6666'];
        return (colors[Math.floor(Math.random() * colors.length)]);
    }

    // Loop the animation
    setInterval(draw, 33);
}

var text,
prev,
temp,
c,
d,
b;
prev = "";
c = 0;
var name = "[snehil]~";

d = name+ "$ ";
b = d.toLowerCase();

function init() {
    alert("Type \'list\' to get all command supported.")
    text = document.getElementById("user-input");
    text.value = d;
    text.addEventListener('keypress',
        count);
    text.addEventListener('keyup',
        whenPressed);
    text.addEventListener('keydown',
        whenDown);
    
    if (text.value != d) {
        document.querySelector('body').innerHTML = "<o><b>ERROR</b></o>"
    }
}

function count(e) {
    c++;
}


function whenPressed(e) {

    if (e.keyCode == 8) {
        c--;
        if (c < 0) {
            text.value = d;
        }
    }
    if (text.value == "") {
        text.value = d;
    }
}

function whenDown(e) {
    temp = text.value;
    if (e.keyCode == 13) {
        while (true) {
            if (temp != d) {
                if ((temp.substring(temp.length - 1) == " ") && (temp != d+"echo ")) {
                    prev = temp.substring(0, (temp.length-1));
                    temp = prev;
                } else {
                    prev = text.value;
                    temp = prev;
                }
                if ((temp.substring(temp.length - 1) == " ") && (temp != d+"echo ")) {
                    continue;
                } else
                    break;
            } else
                prev = text.value;
            break;
        }
        e.preventDefault();
        text.value = d;
        document.getElementById('out').innerHTML += prev+"<br>";

        return command();
    }
}

function load() {
    document.getElementById('out').innerHTML = "<c>@root</c>\u2015[bash]<br>";
    document.getElementById('content').style.fontSize = document.getElementById('user-input').style.fontSize;
}

function command() {
    if ((prev.substring(10)).toLowerCase() == prev.substring(10) || (prev.substring(10)).toUpperCase() == prev.substring(10)) {
        temp = prev.toLowerCase();
    } else if (((prev.substring(10, 15)).toLowerCase()) == prev.substring(10, 15) || ((prev.substring(10, 15)).toUpperCase()) == prev.substring(10, 15)) {
        temp = prev.toLowerCase();
    } else {
        temp = "e";
    }
    today = new Date();
    if (temp == b+"cls") {
        prev = "";
        return load();
    } else if (temp == b+"network\\gateway") {
        if (navigator.onLine == true) {
            document.getElementById('out').innerHTML += "<y>GATEWAY ADDRESS:  </y>";
            return gip();
        } else
            document.getElementById('out').innerHTML += "<o>ERROR: </o><w>YOU ARE NOT CONNECTED TO INTERNET</w><br>";
    } else if (temp == b+"network\\ip") {
        if (navigator.onLine == true) {
            document.getElementById('out').innerHTML += "<y>PUBLIC IP:  </y>";
            return ip();
        } else
            document.getElementById('out').innerHTML += "<o>ERROR: </o><w>YOU ARE NOT CONNECTED TO INTERNET</w><br>";
    } else if (temp == b+"cls\\?") {
        document.getElementById('out').innerHTML += "<y>USES: </y><w>CLEARS THE BASH SCREEN</w><br>";
    } else if (temp == b+"connect\\?") {
        document.getElementById('out').innerHTML += "<y>USES:</y><w> SHOWS A PROGRESS BAR UI </w><br>";
    } else if (temp == b+"connect") {
        con++;
        document.getElementById('out').innerHTML += "<w>Connecting to nearest server...<br><lsk id =\"pbar"+con.toString()+"\">hi</lsk></w><br>";
        return connect(con);
    } else if ((temp == b+"engage")) {
        if (mat == false) {
            mat = true;
            return matrix();
        } else {
            document.getElementById('out').innerHTML += "<o>ERROR: </o><w>ENGAGE IS ALREADY RUNNING</w><br>";
        }
    } else if (temp.substring(0, 16) == b+"echo ") {
        document.getElementById('out').innerHTML += "<w>"+prev.substring(16)+"</w><br>";
    } else if (temp == b+"system\\date") {
        document.getElementById('out').innerHTML += "<y>DATE: </y><w>"+today.getDate()+'-'+(today.getMonth()+1)+'-'+today.getFullYear()+"</w><br>";
    } else if (temp == b+"system\\time") {
        document.getElementById('out').innerHTML += "<y>TIME: </y><w>"+today.getHours() + ": " + today.getMinutes() + ": " + today.getSeconds()+"</w><br>";
    } else if (temp == b+"bash-v") {
        document.getElementById('out').innerHTML += "<y>BASH VERSION: </y><w>"+v+"</w><br>";
    } else if (temp == b+"engage\\abort") {
        if (mat == true) {
            mat = false;
            return haltmatrix();
        } else
            document.getElementById('out').innerHTML += "<o>ERROR: </o><w>ENGAGE COMMAND IS NOT RUNNING</w><br>";
    } else if (temp == b+"network\\?") {
        document.getElementById('out').innerHTML += "<y>USES: </y><w>IT DOES THE FOLLOWING COMMANDS: <br></w>&nbsp;\\gateway :<w>TELLS YOUR GATEWAY ADDRESS</w><br>&nbsp;\\ip  &nbsp;&nbsp; :<w>TELLS YOUR PUBLIC IP</w><br>";
    } else if (temp == b+"engage\\?") {
        document.getElementById('out').innerHTML += "<y>USES: </y><w>TRANSFORMS THE TERMINAL INTO A MATRIX-INSPIRED DISPLAY WHERE SYMBOLS ARE RAINING FROM THE TOP OF THE SCREEN IN DIFFERENT COLORS</w><br> <y>DOES FOLLOWING SUB COMMANDS:</y><br>&nbsp;\\abort : <w>ABORT ENGAGE COMMAND</w><br>";
    } else if (temp == b+"list\\?") {
        document.getElementById('out').innerHTML += "<y>USES: </y><w>LISTS ALL THE SUPPORTED COMMANDS</w><br>";
    } else if (temp == d+"echo\\?") {
        document.getElementById('out').innerHTML += "<y>USES: </y><w>PRINTS THE TEXT WRITTEN</w>";
    } else if (temp == d+"list") {
        document.getElementById('out').innerHTML += "<y>list &nbsp;&nbsp;&nbsp;&nbsp;:<w>LISTS ALL THE SUPPORTED COMMANDS</w><br>cls &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:<w>CLEARS THE BASH SCREEN</w><br><y>connect &nbsp;:<w>THIS SHOWS A PROGRESS BAR UI</w><br>engage &nbsp;&nbsp;:<w>TRANSFORMS THE TERMINAL INTO A MATRIX-INSPIRED DISPLAY WHERE SYMBOLS ARE RAINING FROM THE TOP OF THE SCREEN IN DIFFERENT COLORS</w><br>network &nbsp;:<w>CONTAINS SUB COMMAND RELATED TO NETWORK</w><br>system &nbsp;&nbsp;:<w>CONTAINS SUB COMMAND RELATED TO SYSTEM</w><br>echo <w>text</w>:<w>PRINTS THE TEXT WRITTEN</w><br></y><w> <br>PUT \'<y>\\?</y>\' AFTER ANY COMMAND TO KNOW ABOUT IT</w><br>";
    } else if (temp == b+"system\\?") {
        document.getElementById('out').innerHTML += "<y>USES: </y><w>IT DOES THE FOLLOWING COMMANDS: <br></w>&nbsp;\\time&nbsp;&nbsp;&nbsp; : <w>TELLS SYSTEM TIME</w><br>&nbsp;\\date &nbsp&nbsp;&nbsp;: <w>TELLS SYSTEM DATE</w><br>&nbsp;\\platform: <w>TELLS YOUR DEVICE OPERATING SYSTEM</w><br>&nbsp;\\version&nbsp;:<w>TELLS YOUR DEVICE VERSION</w><br>";
    } else if (temp == b+"system\\platform") {
        document.getElementById('out').innerHTML += "<y>DEVICE PLATFORM:</y> <w>"+os+"</y><br>";
    } else if (temp == b+"system\\version") {
        document.getElementById('out').innerHTML += "<y>DEVICE VERSION:</y> <w>"+os_v+"</w><br>"
    } else if (temp == b+"network") {
        document.getElementById('out').innerHTML += "<o>ERROR:</o><w>THIS COMMAND HAS SOME SUB COMMANDS TO LEARN ABOUT THEM TYPE '</w>network\\?<w>'</w><br>";
    } else if (temp == b+"system") {
        document.getElementById('out').innerHTML += "<o>ERROR:</o><w>THIS COMMAND HAS SOME SUB COMMANDS TO LEARN ABOUT THEM TYPE '</w>system\\?<w>'</w><br>";
    } else if (temp == b+"") {
        //no condition
    } else {
        var zb = b.length;
        document.getElementById('out').innerHTML += "<o>ERROR: </o><w>ILLEGAL COMMAND \'</w>"+prev.substring(zb)+"<w>\'</w><br>";
    }
}

function gip() {
    var one = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
    var two = new one({
        iceServers: []});
    var nullfn = function() {};

    // Looks like Promise system
    two.createDataChannel("");
    two.createOffer(two.setLocalDescription.bind(two),
        nullfn);

    two.onicecandidate = function(obj) {
        var regex = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(: [a-f0-9]{1,4}){7})/;
        var candidates = obj.candidate.candidate.match(regex); // not the only location

        document.querySelector("#out").innerHTML += "<w>"+candidates[1]+"</w><br>";
        two.onicecandidate = nullfn;
    }
}

function ip() {
    let ip = "";
    fetch('https://api.ipify.org?format=json')
    .then(res => res.json())
    .then(function (json) {
        document.getElementById('out').innerHTML += "<w>"+json.ip+"</w><br>";
    });
}

function connect(y) {
    var pbar,
    bars = bar = "|||";
    var count = 0;
    var idel = "#pbar"+y.toString();

    setInterval(function() {
        count = (count < 100)? count+1: 100;
        if (count == 0)
            bars = bar;
        else if ((count%5 == 0) && (count != 100))
            bars += bar;
        document.querySelector(idel). innerHTML = `<r><lsk>${bars}</r></lsk><iv>${count}%</iv>`;
        if (count == 100) {
            document.querySelector(idel). innerHTML += `<w><br>Connected Successfully...</w>`;
            document.getElementById("user-input").style.visibility = "visible";
            document.getElementById("user-input").focus();
        } else
            document.getElementById("user-input").style.visibility = "hidden";
    },
        100);
}

function netcon() {
    if (navigator.onLine == false) {
        alert("You are offline.");
    }
}