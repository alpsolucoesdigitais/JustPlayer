// Custom helper
function $(selector, parent){
    let x;
    try{
        const elements = (parent || document).querySelectorAll(selector);
        if(elements.length == 1) x = elements[0];
        else if(elements.length == 0) x = null;
        else x = elements;
    }catch(error){
        x = error;
    }
    return x;
}

// CSPlayer HTML5
var csPlayer = {
    csPlayers: {},

    preSetup: (videoTag, playerTagId, params) => {
        const theme = params.theme || null;
        const themeClass = theme ? "theme-"+theme : "";

        return new Promise((resolve) => {
            $("#"+videoTag).innerHTML = `
            <div class="csPlayer ${themeClass}">
                <div class="csPlayer-container">
                    <span>
                        <div></div>
                        <i class="ti ti-player-play-filled csPlayer-loading"></i>
                        <div></div>
                    </span>
                    <div id="${playerTagId}"></div>
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
                            <label><input type="radio" name="${videoTag}1">0.75x</label>
                            <label><input type="radio" name="${videoTag}1" checked>1x</label>
                            <label><input type="radio" name="${videoTag}1">1.25x</label>
                            <label><input type="radio" name="${videoTag}1">1.5x</label>
                            <label><input type="radio" name="${videoTag}1">1.75x</label>
                            <label><input type="radio" name="${videoTag}1">2x</label>
                        </span>
                        <p>Quality<b>auto</b><i class="ti ti-caret-right-filled"></i></p>
                        <span>
                            <label><input type="radio" name="${videoTag}2" checked>auto</label>
                        </span>
                    </div>
                </div>
            </div>`;
            resolve();
        });
    },

    Html5Setup: (videoTag, playerTagId, videoSrc) => {
        return new Promise((resolve) => {
            const parent = $("#"+playerTagId).closest(".csPlayer");

            const videoEl = document.createElement("video");
            videoEl.src = videoSrc;
            videoEl.controls = false;
            videoEl.muted = true; // necessário para autoplay mobile
            videoEl.autoplay = true;
            videoEl.playsInline = true;
            videoEl.loop = csPlayer.csPlayers[videoTag]["params"].loop || false;
            videoEl.classList.add("cs-video");
            $("#"+playerTagId).appendChild(videoEl);

            csPlayer.csPlayers[videoTag]["videoTag"] = videoEl;

            // Eventos
            videoEl.addEventListener("loadedmetadata", () => {
                parent.querySelector(".csPlayer-container span i").classList.remove("csPlayer-loading");
            });
            videoEl.addEventListener("timeupdate", () => {
                updateTextTime();
                updateTimeSlider();
            });
            videoEl.addEventListener("ended", () => {
                if (!videoEl.loop) videoEl.pause();
            });

            // Controles
            parent.querySelector(".csPlayer-controls-box main i:nth-of-type(1)").onclick = backward;
            parent.querySelector(".csPlayer-controls-box main i:nth-of-type(2)").onclick = togglePlayPause;
            parent.querySelector(".csPlayer-controls-box main i:nth-of-type(3)").onclick = forward;
            parent.querySelector(".csPlayer-controls-box .csPlayer-controls input").addEventListener("input", updateSlider);
            parent.querySelector(".csPlayer-controls-box .csPlayer-controls .fsBtn").onclick = toggleFullscreen;
            parent.querySelector(".csPlayer-controls-box .csPlayer-controls .settingsBtn").onclick = toggleSettings;

            function backward(){
                videoEl.currentTime = Math.max(0, videoEl.currentTime - 10);
            }
            function forward(){
                videoEl.currentTime += 10;
            }
            function togglePlayPause(){
                if(!videoEl.paused) videoEl.pause();
                else videoEl.play();
            }
            function formatTime(seconds){
                const h = Math.floor(seconds/3600),
                      m = Math.floor((seconds % 3600)/60),
                      s = Math.floor(seconds % 60);
                return h>0? `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
            }
            function updateTextTime(){
                const duration = videoEl.duration || 0;
                parent.querySelector(".csPlayer-controls-box .csPlayer-controls p:nth-of-type(1)").innerText = formatTime(videoEl.currentTime);
                parent.querySelector(".csPlayer-controls-box .csPlayer-controls p:nth-of-type(2)").innerText = formatTime(duration);
            }
            function updateTimeSlider(){
                const slider = parent.querySelector(".csPlayer-controls-box .csPlayer-controls input");
                const progress = (videoEl.currentTime / videoEl.duration) * 100 || 0;
                slider.value = progress;
                slider.style.background = `linear-gradient(to right, var(--sliderSeekTrackColor) ${progress}%, transparent ${progress}%)`;
            }
            function updateSlider(){
                const slider = parent.querySelector(".csPlayer-controls-box .csPlayer-controls input");
                videoEl.currentTime = (slider.value / 100) * videoEl.duration;
            }
            function toggleFullscreen(){
                if(!document.fullscreenElement) parent.requestFullscreen();
                else document.exitFullscreen();
            }
            function toggleSettings(){
                const settings = parent.querySelector(".csPlayer-settings-box");
                settings.style.display = settings.style.display=="block"?"none":"block";

                // Speed change
                settings.querySelectorAll("span:nth-of-type(1) input").forEach(inp=>{
                    inp.onchange = (e)=>{
                        videoEl.playbackRate = Number(e.target.parentElement.innerText.slice(0,-1));
                        settings.querySelector("p:nth-of-type(1) b").innerText = e.target.parentElement.innerText;
                    }
                });
            }

            resolve();
        });
    },

    init: (videoTag, params) => {
        return new Promise((resolve, reject) => {
            if(!videoTag || !params || !params.defaultSrc) return reject("Init needs videoTag and params.defaultSrc");
            if(!$("#"+videoTag)) return reject("No tag with id "+videoTag);
            if(csPlayer.csPlayers[videoTag]) return reject("Player already exists");

            csPlayer.csPlayers[videoTag] = {
                params,
                initialized: false
            };

            csPlayer.preSetup(videoTag, "csPlayer-"+videoTag, params).then(()=>{
                csPlayer.Html5Setup(videoTag, "csPlayer-"+videoTag, params.defaultSrc).then(()=>{
                    csPlayer.csPlayers[videoTag].initialized = true;
                    console.log("Player", videoTag, "initialized.");
                    resolve();
                });
            });
        });
    },

    play: (videoTag)=>{ csPlayer.csPlayers[videoTag]?.videoTag.play(); },
    pause: (videoTag)=>{ csPlayer.csPlayers[videoTag]?.videoTag.pause(); },
    getDuration: (videoTag)=> csPlayer.csPlayers[videoTag]?.videoTag.duration,
    getCurrentTime: (videoTag)=> csPlayer.csPlayers[videoTag]?.videoTag.currentTime,
    destroy: (videoTag)=>{
        if(csPlayer.csPlayers[videoTag]){
            const player = csPlayer.csPlayers[videoTag].videoTag;
            player.pause();
            player.remove();
            delete csPlayer.csPlayers[videoTag];
        }
    }
};
