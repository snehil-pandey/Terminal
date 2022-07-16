
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
        'iPod'];
    if (/Android/.test(userAgent)) {
        function getAndroidVersion(ua) {
            var ua = (ua || navigator.userAgent).toLowerCase();
            var match = ua.match(/android\s([0-9\.]*)/i);
            return match ? match[1]: undefined;
        }
        os_v = "Android "+ getAndroidVersion();
    } else if (iosPlatforms.indexOf(platform) !== -1) {
        os_v = getOS()+iOSversion();

        function iOSversion() {
            if (/iP(hone|od|ad)/.test(navigator.platform)) {
                var v = (navigator.appVersion).match(/OS (\d+)_(\d+)_?(\d+)?/);
                return [parseInt(v[1], 10),
                    parseInt(v[2], 10),
                    parseInt(v[3] || 0, 10)];
            }
        }
    } else if (navigator.appVersion.indexOf("Windows ")!=-1) {
        os_v = getWindowsOS();


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
}
catch {
    os_v = undefined;
}


var mat = false;

function haltmatrix() {
    var canvas = document.querySelector('canvas'),
    ctx = canvas.getContext('2d');
    canvas.width = 0;
    canvas.height = 0;
}

var conp = false;

function matrix() {
    var canvas = document.querySelector('canvas'),
    ctx = canvas.getContext('2d');
    canvas.width = document.body.clientWidth;
    canvas.height = document.body.clientHeight;
    var letters = '1010';
    letters = letters.split('');

    var fontSize = 20,
    columns = canvas.width / fontSize;

    var drops = [];
    for (var i = 0; i < columns; i++) {
        drops[i] = 1;
    }

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

    setInterval(draw, 33);

    if (conp == true) {
        document.getElementById("user-input").style.visibility = "hidden";
    } else {
        document.getElementById("user-input").style.visibility = "visible";
        document.getElementById("user-input").focus();
    }
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

var x;

function init() {
    x = "Type \'<g>list</g>\' to get all command supported.<br>";
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
    if (conp == true) {
        document.getElementById("user-input").style.visibility = "hidden";
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
        prev = prev.replace (/&/g, "&#38;");
        prev = prev.replace (/</g, "&#60;");
        prev = prev.replace (/>/g, "&#62;");
        e.preventDefault();
        text.value = d;
        document.getElementById('out').innerHTML += prev+"<br>";

        var ags = (prev.substring(b.length)).split(";");
        if (conp == true) {
            setTimeout(function() {
                return ags.forEach(command);
            }, 5000);
        } else {
            return ags.forEach(command);
        }

    }
}

function load() {
    document.getElementById('out').innerHTML = "<c>@root</c>\u2015[terminal]<br><w>"+x+"</w>";
}

function command(p, l) {
    if (conp == true) {
        document.getElementById("user-input").style.visibility = "hidden";
    }
    p = p.trim();
    //console.log(p);
    temp = p;
    if ((p.toLowerCase() == p) || (p.toUpperCase() == p)) {
        temp = p.toLowerCase();
    } else if ((((p.toLowerCase()) != p)) || ((p.toUpperCase()) != p)) {
        temp = p.toLowerCase();
    } else {
        temp = "e";
    }
    temp = temp.trim();
    var ecnt = 0;
    today = new Date();
    if (temp == "cls\\?") {
        document.getElementById('out').innerHTML += "<y>USES: </y><w>CLEARS THE TERMINAL SCREEN</w><br>";
    } else if (temp == "cls") {
        if (conp == false) {
            x = "";
            p = "";
            return load();
        } else {
            document.getElementById('out').innerHTML += "<o>ERROR: </o><w> CANNOT CLEAR SCREEN CONNECTION IN PROGRESS</w><br>";
        }
    } else if (temp == "network\\gateway") {
        if (navigator.onLine == true) {
            document.getElementById('out').innerHTML += "<y>GATEWAY ADDRESS:  </y>";
            return gip();
        } else
            document.getElementById('out').innerHTML += "<o>ERROR: </o><w>YOU ARE NOT CONNECTED TO INTERNET</w><br>";
    } else if (temp == "network\\ip") {
        if (navigator.onLine == true) {
            document.getElementById("user-input").style.visibility = "hidden";
            document.getElementById('out').innerHTML += "<y>PUBLIC IP:  </y>";
            setTimeout(function () {
                document.getElementById("user-input").style.visibility = "visible";
                document.getElementById("user-input").focus();
            }, 2500);
            return ip();
        } else
            document.getElementById('out').innerHTML += "<o>ERROR: </o><w>YOU ARE NOT CONNECTED TO INTERNET</w><br>";
    } else if (temp == "connect\\?") {
        document.getElementById('out').innerHTML += "<y>USES:</y><w> SHOWS A PROGRESS BAR UI </w><br>";
    } else if (temp == "connect") {
        con++;

        if (conp == false) {
            conp = true;
            document.getElementById('out').innerHTML += "<w>Connecting to nearest server...<br><lsk id =\"pbar"+con.toString()+"\">hi</lsk></w><br>";
            return connect(con);
        } else {
            document.getElementById('out').innerHTML += "<o>ERROR: </o><w>CONNECT IS ALREADY RUNNING</w><br>";
        }
    } else if (temp == "system\\res") {
        var sW = window.screen.width*window.devicePixelRatio;
        var sH = window.screen.height*window.devicePixelRatio;
        document.getElementById('out').innerHTML += "<y>HEIGHT :<w>" + sH.toString() + " px<br></w>WIDTH &nbsp;:</y><w>" + sW.toString() + " px<br></w>";
    } else if ((temp == "engage")) {
        if (mat == false) {
            mat = true;
            document.getElementById("user-input").style.visibility = "hidden";
            setTimeout(function () {
                return matrix();
            }, 1500);
        } else {
            document.getElementById('out').innerHTML += "<o>ERROR: </o><w>ENGAGE IS ALREADY RUNNING</w><br>";
        }
    } else if (temp == "echo\\?") {
        document.getElementById('out').innerHTML += "<y>USES: </y><w>PRINTS THE TEXT WRITTEN</w><br>";
    } else if (temp.substring(0, 4) == "echo") {
        document.getElementById('out').innerHTML += "<w>"+p.substring(4)+"</w><br>";
    } else if (temp == "system\\date") {
        document.getElementById('out').innerHTML += "<y>DATE: </y><w>"+today.getDate()+'-'+(today.getMonth()+1)+'-'+today.getFullYear()+"</w><br>";
    } else if (temp == "system\\time") {
        document.getElementById('out').innerHTML += "<y>TIME: </y><w>"+today.getHours() + ": " + today.getMinutes() + ": " + today.getSeconds()+"</w><br>";
    } else if (temp == "terminal\\v") {
        document.getElementById('out').innerHTML += "<y>TERMINAL VERSION: </y><w>"+v+"</w><br>";
    } else if (temp == "engage\\abort") {
        if (mat == true) {
            mat = false;
            return haltmatrix();
        } else
            document.getElementById('out').innerHTML += "<o>ERROR: </o><w>ENGAGE COMMAND IS NOT RUNNING</w><br>";
    } else if (temp == "network\\?") {
        document.getElementById('out').innerHTML += "<y>USES: </y><w>IT DOES THE FOLLOWING COMMANDS: <br></w>&nbsp;\\gateway :<w>TELLS YOUR GATEWAY ADDRESS</w><br>&nbsp;\\ip  &nbsp;&nbsp;&nbsp;&nbsp; :<w>TELLS YOUR PUBLIC IP</w><br>&nbsp;\\isp&nbsp;&nbsp;&nbsp;&nbsp; :<w>TELLS YOUR INTERNET SERVICE PROVIDER</w><br>";
    } else if (temp == "engage\\?") {
        document.getElementById('out').innerHTML += "<y>USES: </y><w>TRANSFORMS THE TERMINAL INTO A MATRIX-INSPIRED DISPLAY WHERE SYMBOLS ARE RAINING FROM THE TOP OF THE SCREEN IN DIFFERENT COLORS</w><br> <y>SUB-COMMANDS:</y><br>&nbsp;\\abort : <w>ABORT ENGAGE COMMAND</w><br>";
    } else if (temp == "list\\?") {
        document.getElementById('out').innerHTML += "<y>USES: </y><w>LISTS ALL THE SUPPORTED COMMANDS</w><br>";
    } else if (temp == "list") {
        document.getElementById('out').innerHTML += "<g>list &nbsp;&nbsp;&nbsp;&nbsp;:<w>LISTS ALL THE SUPPORTED COMMANDS</w><br>terminal :<w>STARTS A NEW TERMINAL</w><br>cls &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:<w>CLEARS THE TERMINAL SCREEN</w><br><g>connect &nbsp;:<w>THIS SHOWS A PROGRESS BAR UI</w><br>engage &nbsp;&nbsp;:<w>TRANSFORMS THE TERMINAL INTO A MATRIX-INSPIRED DISPLAY WHERE SYMBOLS ARE RAINING FROM THE TOP OF THE SCREEN IN DIFFERENT COLORS</w><br>network &nbsp;:<w>CONTAINS SUB COMMAND RELATED TO NETWORK</w><br>system &nbsp;&nbsp;:<w>CONTAINS SUB COMMAND RELATED TO SYSTEM</w><br>echo <w>text</w>:<w>PRINTS THE TEXT WRITTEN</w><br></g><w> <br>PUT \'<y>\\?</y>\' AFTER ANY COMMAND TO KNOW ABOUT IT</w><br>";
    } else if (temp == "system\\?") {
        document.getElementById('out').innerHTML += "<y>USES: </y><w>IT DOES THE FOLLOWING COMMANDS: <br></w>&nbsp;\\time&nbsp;&nbsp;&nbsp; : <w>TELLS SYSTEM TIME</w><br>&nbsp;\\date &nbsp&nbsp;&nbsp;: <w>TELLS SYSTEM DATE</w><br>&nbsp;\\platform: <w>TELLS YOUR DEVICE'S OPERATING SYSTEM</w><br>&nbsp;\\version&nbsp;:<w>TELLS YOUR DEVICE'S VERSION</w><br>&nbsp;\\res&nbsp;&nbsp;&nbsp;&nbsp; :<w>TELLS YOUR DEVICE'S SCREEN RESOLUTION</w><br>&nbsp;\\battery&nbsp;&nbsp;&nbsp;&nbsp; :<w>TELLS YOUR DEVICE'S BATTERY STATUS AND LEVEL</w><br>";
    } else if (temp == "terminal") {
        x = "Type \'<g>list</g>\' to get all command supported.<br>";
        load();
    } else if (temp == "system\\platform") {
        document.getElementById('out').innerHTML += "<y>DEVICE PLATFORM:</y> <w>"+os+"</y><br>";
    } else if (temp == "system\\version") {
        document.getElementById('out').innerHTML += "<y>DEVICE VERSION:</y> <w>"+os_v+"</w><br>"
    } else if (temp == "network") {
        document.getElementById('out').innerHTML += "<o>ERROR:</o><w>THIS COMMAND HAS SOME SUB COMMANDS TO LEARN ABOUT THEM TYPE '</w>network\\?<w>'</w><br>";
    } else if (temp == "system") {
        document.getElementById('out').innerHTML += "<o>ERROR:</o><w>THIS COMMAND HAS SOME SUB COMMANDS TO LEARN ABOUT THEM TYPE '</w>system\\?<w>'</w><br>";
    } else if (p == "network\\isp") {
        document.getElementById('out').innerHTML += "<y>ISP: </y>";
        document.getElementById("user-input").style.visibility = "hidden";
        setTimeout(function () {
            document.getElementById("user-input").style.visibility = "visible";
            document.getElementById("user-input").focus();
        }, 2500);
        return isp();
    } else if (p == "terminal\\?") {
        document.getElementById('out').innerHTML += "<y>USES:</y><w> STARTS A NEW TERMINAL<br><y>SUB-COMMANDS:</y><br>&nbsp;<g>\\rn</g>:TO GET TERMINAL RELEASE NOTES ON <a href=\"https://github.com/Uthando993\" style=\"text-decoration:none;color:cyan\">GitHub</a><br>&nbsp;<g>\\v</g> :TO GET TERMINAL VERSION";
    } else if (p == "system\\battery") {
        return batt();
    } else if (p == "terminal\\rn") {
        location.assign('https://github.com/Uthando993/Terminal/blob/main/release%20notes.md');
        document.getElementById('out').innerHTML += "<w>PLEASE CLICK OK IF IT ASK FOR REDIRECT MESSAGE... "
    } else if (p == "") {
        //no condition
    } else {
        if (conp == true) {
            document.getElementById("user-input").style.visibility = "hidden";
        }
        document.getElementById('out').innerHTML += "<o>ERROR: </o><w>ILLEGAL COMMAND \'</w>"+p+"<w>\' AT COMMAND POSITION "+l+"</w><br>";
    }
    if (conp == true) {
        document.getElementById("user-input").style.visibility = "hidden";
    }
}

function gip() {
    var one = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
    var two = new one({
        iceServers: []});
    var nullfn = function() {};

    two.createDataChannel("");
    two.createOffer(two.setLocalDescription.bind(two),
        nullfn);

    two.onicecandidate = function(obj) {
        var regex = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(: [a-f0-9]{1,4}){7})/;
        var candidates = obj.candidate.candidate.match(regex);

        document.querySelector("#out").innerHTML += "<w>"+candidates[1]+"</w><br>";
        two.onicecandidate = nullfn;
    }
}

function ip() {
    let ip = "";
    fetch('https://api.ipify.org?format=json')
    .then(res => res.json())
    .then(function (json) {
        var x = "";
        x = json.ip;
        document.getElementById('out').innerHTML += "<w>"+x+"</w><br>";
    });

}

function connect(y) {
    var pbar,
    bars = bar = "|||";
    var count = 0;
    var idel = "#pbar"+y.toString();

    var t = setInterval(function() {
        count = (count < 100)? count+1: 100;
        if (count == 0)
            bars = bar;
        else if ((count%5 == 0) && (count != 100))
            bars += bar;
        document.querySelector(idel). innerHTML = `<r><lsk>${bars}</r></lsk><iv>${count}%</iv>`;
        if (count == 100) {
            conp = false;
            document.querySelector(idel). innerHTML += `<w><br>Connected Successfully...</w>`;
            document.getElementById("user-input").style.visibility = "visible";
            document.getElementById("user-input").focus();
        return clearTimeout(t);
        } else
            document.getElementById("user-input").style.visibility = "hidden";
    },
        100);

}

function isp() {
    let ok = "";
    $.ajax({
        type: 'GET',
        dataType: 'json',
        url: 'http://ip-api.com/json?callback=?',
        success: function(data) {
            ok = JSON.stringify(data["isp"]);
            document.getElementById('out').innerHTML += "<w>"+ok.replace(/\"/g, "")+"</w><br>";
        },
        error: function (XMLHttpRequest, textStatus, errorThrown) {
            document.getElementById('out').innerHTML += "<w>undefined</w>"
        }
    });
}

function batt() {
   if ('getBattery' in navigator) {
  navigator.getBattery().then(function(battery) {
        document.getElementById('out').innerHTML += "<y>BATTERY LEVEL&nbsp; : </y><w>" + Math.round(battery.level* 100) + "%</w><br>";
    });
    navigator.getBattery().then(function(battery) {
        if (battery.charging) {
            document.getElementById('out').innerHTML += "<y>CHARGING STATUS: <y><w>CHARGING</w><br>";
        } else {
            document.getElementById('out').innerHTML += "<y>CHARGING STATUS: <y><w>NOT CHARGING</w><br>";
        }
    });
} else {
  document.getElementById('out').innerHTML += "<w>THIS API FUNCTION IS NOT SUPPORTED ON THIS BROWSER</w>";
} 
}

var v = "v.2.2";
