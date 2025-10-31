// CSPlayer v2 – Mobile-ready
function $(selector,parent){
    var x;
    try{
        const elements = document.querySelectorAll(selector);
        if(elements.length == 1){x = elements[0]}
        else if(elements.length == 0){x = null}
        else{x = elements}
    }catch(error){ x = error; }
    return x;
}

var csPlayer = {
    csPlayers : {},

    preSetup: (videoTag,playerTagId,defaultId)=>{
        var theme =("theme" in csPlayer.csPlayers[videoTag]["params"]) ? csPlayer.csPlayers[videoTag]["params"]["theme"] : null;
        var themeClass = theme ? "theme-"+theme : "";
        return new Promise((resolve, reject) => {
            $("#"+videoTag).innerHTML =`
            <div class="csPlayer ${themeClass}">
                <div class="csPlayer-container">
                    <span><div></div>
                    <i class="ti ti-player-play-filled csPlayer-loading"></i>
                    <div></div></span>
                    <div id=${playerTagId}></div>
                </div>
                <div class="csPlayer-controls-box">
                    <main>
                        <i class="ti ti-rewind-backward-10"></i>
                        <i class="ti csPlayer-play-pause-btn ti-player-play-filled"></i>
                        <i class="ti ti-rewind-forward-10"></i>
                    </main>
                    <div class="csPlayer-controls">
                        <p>00:00</p>
                        <div><span></span>
                        <input type="range" min="0" max="100" value="0" step="1"></div>
                        <p>00:00</p>
                        <i class="ti ti-settings settingsBtn"></i>
                        <i class="ti ti-maximize fsBtn"></i>
                    </div>
                    <div class="csPlayer-settings-box">
                        <p>Speed<b>1x</b><i class="ti ti-caret-right-filled"></i></p>
                        <span>     
                            <label><input type="radio" name=${videoTag}1>0.75x</label>
                            <label><input type="radio" name=${videoTag}1 checked>1x</label>
                            <label><input type="radio" name=${videoTag}1>1.25x</label>
                            <label><input type="radio" name=${videoTag}1>1.5x</label>
                            <label><input type="radio" name=${videoTag}1>1.75x</label>
                            <label><input type="radio" name=${videoTag}1>2x</label>
                        </span>
                        <p>Quality<b>auto</b><i class="ti ti-caret-right-filled"></i></p>
                        <span>
                            <label><input type="radio" name=${videoTag}2 checked>auto</label>
                        </span>
                    </div>
                </div>
            </div>`;    
            resolve();
        });
    },

    setupVideoElement: (videoTag, videoSrc)=>{
        const parent = $("#"+videoTag+" .csPlayer-container");
        if(!parent) return;

        // Cria o vídeo
        const videoEl = document.createElement("video");
        videoEl.src = videoSrc;
        videoEl.controls = false;
        videoEl.muted = true;
        videoEl.autoplay = true;
        videoEl.playsInline = true;
        videoEl.style.width = "100%";
        videoEl.style.height = "100%";
        parent.appendChild(videoEl);

        // Overlay para capturar toque inicial
        const overlay = document.createElement("div");
        overlay.style.position = "absolute";
        overlay.style.top = 0;
        overlay.style.left = 0;
        overlay.style.width = "100%";
        overlay.style.height = "100%";
        overlay.style.zIndex = 10;
        overlay.style.cursor = "pointer";
        overlay.style.background = "transparent";
        parent.style.position = "relative";
        parent.appendChild(overlay);

        overlay.addEventListener("click", ()=>{
            videoEl.muted = false;
            videoEl.play();
            overlay.remove();
        });

        // Tenta autoplay
        videoEl.play().catch(()=>console.log("Autoplay bloqueado, aguardando interação"));

        return videoEl;
    },

    init: (videoTag, params)=>{
        return new Promise((resolve, reject)=>{
            if(videoTag && params && params.defaultSrc){
                if($("#"+videoTag) != null){
                    if(!(videoTag in csPlayer.csPlayers)){
                        csPlayer.csPlayers[videoTag] = {};
                        csPlayer.csPlayers[videoTag]["videoTag"] = videoTag;
                        csPlayer.csPlayers[videoTag]["params"] = params;
                        csPlayer.csPlayers[videoTag]["isPlaying"] = false;
                        csPlayer.csPlayers[videoTag]["playerState"] = "paused";
                        csPlayer.csPlayers[videoTag]["initialized"] = false;

                        csPlayer.preSetup(videoTag,"csPlayer-"+videoTag,params.defaultSrc).then(()=>{
                            const videoEl = csPlayer.setupVideoElement(videoTag, params.defaultSrc);
                            csPlayer.csPlayers[videoTag]["videoEl"] = videoEl;

                            // Controles
                            const parent = $("#csPlayer-"+videoTag).closest(".csPlayer");
                            const playBtn = parent.querySelector(".csPlayer-play-pause-btn");
                            const forwardBtn = parent.querySelector(".ti-rewind-forward-10");
                            const backwardBtn = parent.querySelector(".ti-rewind-backward-10");
                            const slider = parent.querySelector(".csPlayer-controls input[type=range]");
                            const fsBtn = parent.querySelector(".fsBtn");

                            // Play/Pause
                            playBtn.addEventListener("click", ()=>{
                                if(videoEl.paused){
                                    videoEl.play();
                                }else{
                                    videoEl.pause();
                                }
                            });

                            // Forward/Backward
                            forwardBtn.addEventListener("click", ()=> videoEl.currentTime += 10);
                            backwardBtn.addEventListener("click", ()=> videoEl.currentTime -= 10);

                            // Slider
                            setInterval(()=>{
                                const progress = (videoEl.currentTime/videoEl.duration)*100;
                                slider.value = progress;
                                slider.style.background = `linear-gradient(to right, var(--sliderSeekTrackColor) ${progress}%, transparent ${progress}%)`;
                            }, 500);

                            slider.addEventListener("input", ()=>{
                                videoEl.currentTime = (slider.value/100)*videoEl.duration;
                            });

                            // Fullscreen
                            fsBtn.addEventListener("click", ()=>{
                                const elem = parent;
                                if(!document.fullscreenElement){
                                    elem.requestFullscreen?.() || elem.webkitRequestFullscreen?.() || elem.msRequestFullscreen?.();
                                }else{
                                    document.exitFullscreen?.() || document.webkitExitFullscreen?.() || document.msExitFullscreen?.();
                                }
                            });

                            csPlayer.csPlayers[videoTag]["initialized"] = true;
                            console.log("CSPlayer", videoTag, "initialized");
                            resolve();
                        });
                    }else reject("Player "+videoTag+" already exists.");
                }else reject("No tag with id "+videoTag);
            }else reject("Init requires videoTag and params.defaultSrc");
        });
    },

    play: (videoTag)=>{ csPlayer.csPlayers[videoTag]?.videoEl?.play(); },
    pause: (videoTag)=>{ csPlayer.csPlayers[videoTag]?.videoEl?.pause(); },
    getCurrentTime: (videoTag)=> csPlayer.csPlayers[videoTag]?.videoEl?.currentTime,
    getDuration: (videoTag)=> csPlayer.csPlayers[videoTag]?.videoEl?.duration,
    changeVideo: (videoTag, src)=>{
        const v = csPlayer.csPlayers[videoTag]?.videoEl;
        if(v){
            v.pause();
            v.src = src;
            v.muted = true;
            v.play().catch(()=>console.log("Autoplay blocked"));
        }
    },
    destroy: (videoTag)=>{
        const v = csPlayer.csPlayers[videoTag]?.videoEl;
        if(v){
            v.pause();
            v.remove();
            delete csPlayer.csPlayers[videoTag];
            $("#"+videoTag+" .csPlayer")?.remove();
        }
    }
};
