function getPos(element, settings) {
    var x = Math.ceil(Math.random() * (settings.width - element.width() * 1.5 - 80)) + 50,
        y = Math.ceil(Math.random() * (settings.height - element.height() * 1.5 - 80)) + 50;

    return [x, y];
}

function calcSpeed(curr, next) {
    var x = Math.abs(curr[0] - next[0]),
        y = Math.abs(curr[1] - next[1]),
        greater = x > y ? x : y,
        modifier = 0.05;

    return Math.ceil(greater / modifier);
}

function animateElement(element, settings) {
    var curr = element.offset(),
        next = getPos(element, settings),
        speed = calcSpeed([curr.left, curr.top], next);

    element.animate({left: next[0], top: next[1]}, speed, function () {
        animateElement(element, settings);        
    });
}

function typing(note) {
    var s = "🦌🦌——夏天来了。不知道你最近怎么样。有没有被热醒过。我记得你喜欢雨天湿润的感觉。可加州的天总是不配合。那我在这里给你造一片雨出来。想玩水的话就撩撩屏幕吧。想听点别的就使劲戳。盼你风雨过后见彩虹。🌈",
        n = s.length, i = -1, l = [6, 11, 21, 29, 43, 54, 68, 80, 90, n];

    typingTimer = setInterval(function () {
        if (++i < n) {
            if (l.includes(i)) {
                note.innerHTML = s[i];
                $("#note").fadeIn(500);
            }
            else if (l.includes(i + 1)) {
                note.innerHTML += s[i];
                $("#note").fadeOut(500);
            }
            else {
                note.innerHTML += s[i];
            }
        }
        else {
            note.remove();
            clearInterval(typingTimer);
        }
    }, 375);
}

function waterRipple(element, settings) {
    // 默认设置
    var defaults = {
        image: "",
        width: 320,
        height: 320,
        dropRadius: 4,
        attenuation: 5,
        maxAmplitude: 1024,
        sourceAmplitude: 512,
        delay: 1,
        auto: true
    };

    // 合并设置
    for (var item in defaults) {
        if (!settings.hasOwnProperty(item)) {
            settings[item] = defaults[item];
        }
    }

    // 检测背景图
    if (!settings.image.length) {
        return false;
    }

    var image,
        width = settings.width,
        height = settings.height,
        dropRadius = settings.dropRadius,
        attenuation = settings.attenuation,
        maxAmplitude = settings.maxAmplitude,
        sourceAmplitude = settings.sourceAmplitude,
        delay = settings.delay * 1000,
        half_width = width >> 1,
        half_height = height >> 1,
        amplitude_size = width * (height + 2) * 2,
        old_index = width,
        new_index = width * (height + 3),
        map_index, // 振幅数组索引
        texture, // 原始图像像素信息
        ripple, // 参数波纹的图像像素信息
        autoRepeat, // 自动产生波源的重复事件
        ripple_map = [],
        last_map = [];

    var canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    element.appendChild(canvas);

    var ctx = canvas.getContext("2d");
    ctx.fillStyle = settings.bgColor;
    ctx.fillRect(0, 0, width, height);

    window.requestAnimationFrame = (function () {
        return window.requestAnimationFrame       ||
               window.webkitRequestAnimationFrame ||
               window.mozRequestAnimationFrame    ||
               window.oRequestAnimationFrame      ||
               window.msRequestAnimationFrame     ||
               function (e) {
                   window.setTimeout(e, 1000 / 60);
               };
    }) ();

    // 加载图片
    function loadImage() {
        image = new Image();
        image.src = settings.image;
        image.onload = function () {
            init();
        }
    }

    // 保存图像的所有像素信息
    function saveImageData() {
        // 在canvas中绘制图形
        ctx.drawImage(image, 0, 0);

        // 图像的ImageData对象
        texture = ctx.getImageData(0, 0, width, height);
        ripple = ctx.getImageData(0, 0, width, height);
    }

    function init() {
        saveImageData();

        // 波幅数组初始化为0
        for (var i = 0; i < amplitude_size; i++) {
            ripple_map[i] = last_map[i] = 0;
        }

        animate();

        // 随机参数波源
        if (settings.auto) {
            autoRepeat = setInterval(function () {
                disturb(Math.random() * width, Math.random() * height);
            }, delay);
            disturb(Math.random() * width, Math.random() * height);
        }
    }

    // 动画主循环
    function animate() {
        requestAnimationFrame(animate);
        renderRipple();
    }

    // 在指定地点产生波源
    function disturb(circleX, circleY) {
        // 将值向下取整
        circleX <<= 0;
        circleY <<= 0;

        var maxDistanceX = circleX + dropRadius,
            maxDistanceY = circleY + dropRadius;

        for (var y = circleY - dropRadius; y < maxDistanceY; y++) {
            for (var x = circleX - dropRadius; x < maxDistanceX; x++) {
                ripple_map[old_index + y * width + x] += sourceAmplitude;
            }
        }
    }

    // 渲染下一帧
    function renderRipple() {
        var i = old_index,
            deviation_x, // x水平方向偏移
            deviation_y, // y竖直方向偏移
            pixel_deviation, // 偏移后的ImageData对象像素索引
            pixel_source; // 原始ImageData对象像素索引

        // 交互索引
        old_index = new_index;
        new_index = i;

        // 设置像素索引和振幅索引
        i = 0;
        map_index = old_index;

        // 使用局部变量优化全局作用域查询
        var _width = width,
            _height = height,
            _half_width = half_width,
            _half_height = half_height,
            _attenuation = attenuation,
            _maxAmplitude = maxAmplitude,
            _new_index = new_index,
            _map_index = map_index,
            _ripple_map = ripple_map,
            _last_map = last_map,
            _ripple_data = ripple.data,
            _texture_data = texture.data;

        // 渲染所有像素点
        for (var y = 0; y < _height; y++) {
            for (var x = 0; x < _width; x++) {
                var x_boundary = 0, judge = _map_index % _width;

                if (judge == 0) {
                    x_boundary = 1; // 左边边界
                }
                else if (judge == _width - 1) {
                    x_boundary = 2; // 右边边界
                }

                var top = _ripple_map[_map_index - _width], // 上边相邻点
                    bottom = _ripple_map[_map_index + _width], // 下边相邻点
                    left = x_boundary != 1 ? _ripple_map[_map_index - 1] : 0, // 左边相邻点
                    right = x_boundary != 2 ? _ripple_map[_map_index + 1] : 0; // 右边相邻点

                // 计算当前像素点下一时刻的振幅
                var amplitude = (top + bottom + left + right) >> 1;
                amplitude -= _ripple_map[_new_index + i];
                amplitude -= amplitude >> _attenuation; // 计算衰减

                // 更新振幅数组
                _ripple_map[_new_index + i] = amplitude;
                amplitude = _maxAmplitude - amplitude;

                var old_amplitude = _last_map[i];
                _last_map[i] = amplitude;

                if (old_amplitude != amplitude) {
                    deviation_x = (((x - _half_width) * amplitude / _maxAmplitude) << 0) + _half_width;
                    deviation_y = (((y - _half_height) * amplitude / _maxAmplitude) << 0) + _half_height;

                    // 检查边界
                    if (deviation_x > _width) {
                        deviation_x = _width - 1;
                    }

                    if (deviation_x < 0) {
                        deviation_x = 0;
                    }

                    if (deviation_y > _height) {
                        deviation_y = _height - 1;
                    }

                    if (deviation_y < 0) {
                        deviation_y = 0;
                    }

                    pixel_source = i * 4;
                    pixel_deviation = (deviation_x + (deviation_y * _width)) * 4;

                    // 移动像素的RGBA信息
                    _ripple_data[pixel_source] = _texture_data[pixel_deviation];
                    _ripple_data[pixel_source + 1] = _texture_data[pixel_deviation + 1];
                    _ripple_data[pixel_source + 2] = _texture_data[pixel_deviation + 2];
                }

                i++;
                _map_index++;
            }
        }

        map_index = _map_index;
        ctx.putImageData(ripple, 0, 0);
    }

    function calcAmplitude(index, old_amplitude) {
        var x_boundary = 0, judge = map_index % width;

        if (judge == 0) {
            x_boundary = 1; // 左边边界
        }
        else if (judge == width - 1) {
            x_boundary = 2; // 右边边界
        }

        var top = ripple_map[index - width], // 上边相邻点
            bottom = ripple_map[index + width], // 下边相邻点
            left = x_boundary != 1 ? ripple_map[index - 1] : 0, // 左边相邻点
            right = x_boundary != 2 ? ripple_map[index + 1] : 0; // 右边相邻点

        // 计算当前像素点下一时刻的振幅
        var amplitude = top + bottom + left + right;
        amplitude >>= 1;
        amplitude -= old_amplitude;
        amplitude -= amplitude >> attenuation; // 计算衰减

        return amplitude;
    }

    this.disturb = function (x, y) {
        disturb(x, y);
    };

    loadImage();
    return this;
}

function main() {
    // div
    var divPop = document.getElementById("pop"),
        divRain = document.getElementById("rain"),
        divSea = document.getElementById("sea"),
        divAncientry = document.getElementById("ancientry"),
        divPast = document.getElementById("past"),
        divSkyline = document.getElementById("skyline"),
        divStars = document.getElementById("stars"),
        divTravel = document.getElementById("travel"),
        divBeethoven = document.getElementById("beethoven"),
        divBubble = document.getElementById("bubble"),
        divView = document.getElementById("view"),
        divNote = document.getElementById("note");

    // params for waterRipple
    var settings = {
        image: "image/background.png",
        width: 340,
        height: 544
    };

    // init
    var playlist = [divRain, divSea, divAncientry, divPast, divSkyline, divStars, divTravel, divBeethoven],
        len = playlist.length, curr = 0, count = 0, limit = 4,
        isClicked = false, isPlayed = false,
        waterRippleEffect = new waterRipple(divView, settings);

    function playAudio(audio, next) {
        var playPromise = audio.play();

        if (playPromise !== undefined) {
            playPromise.then(_ => {
            })
            .catch(error => {
            });
        }

        audio.onended = function () {
            if (next) {
                curr = nextAudio(len, curr);
            }
        };
    }

    function stopAudio(audio) {
        audio.pause();
        audio.currentTime = 0;
    }

    function nextAudio(len, curr) {
        stopAudio(playlist[curr]);

        if (++curr >= len) {
            curr = 0;
        }

        playAudio(playlist[curr], true);
        return curr;
    }

    function shuffleAudio(len, curr) {
        var next;
        stopAudio(playlist[curr]);

        do {
            next = Math.floor(Math.random() * len);
        } while (next == curr);

        playAudio(playlist[next], true);
        return next;
    }

    animateElement($("#bubble"), settings);

    // on click
    divBubble.onclick = function () {
        explodeTimer = setInterval(function () {
            if (!isClicked) {
                isClicked = true;
                $("img").explode({
                    maxWidth: 12,
                    minWidth: 4,
                    maxAngle: 360,
                    radius: 480,
                    explodeTime: 250,
                    gravity: 10,
                    groundDistance: 4096,
                    canvas: true,
                    round: true,
                    recycle: false,
                    release: false
                });
            }
            else {
                divBubble.remove();
                clearInterval(explodeTimer);
            }
        }, 250);

        if (!isPlayed) {
            isPlayed = true;
            playAudio(divPop, false);
            playAudio(playlist[curr], true);
            typing(divNote);
        }
    };

    divView.onclick = function (e) {
        waterRippleEffect.disturb(e.layerX, e.layerY);

        if (isPlayed && ++count >= limit) {
            count = 0;
            curr = shuffleAudio(len, curr);
        }
    };

    // on mousemove
    divView.onmousemove = function (e) {
        waterRippleEffect.disturb(e.layerX, e.layerY);
    };

    // on touchmove
    divView.ontouchmove = function (e) {
        waterRippleEffect.disturb(e.layerX, e.layerY);
    };
}

main();