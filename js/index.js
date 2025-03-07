

let currentSong = new Audio();
let songs;
let currFolder;

// fucntion to convert seconds into MM:SS format which is used in songs minutes:seconds
function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}

async function getSongs(folder) {
    currFolder = folder;
    let a = await fetch(`/${folder}/`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let as = div.getElementsByTagName("a");
    songs = [];
    
    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {
            songs.push(decodeURIComponent(element.href.split(`/${folder}/`)[1]));
        }
    }

    // Show all the songs in the playlist
    let songUL = document.querySelector(".songslist ul");
    songUL.innerHTML = "";
    for (const song of songs) {
        songUL.innerHTML += `
            <li>
                <img class="fix2" width="34" src="img/music.svg" alt="">
                <div class="info">
                    <div>${song.replaceAll("%20", " ")}</div>
                    
                </div>
                <div class="playnow">
                    <span>Play Now</span>
                    <img class="fix" src="img/play.svg" alt="">
                </div>
            </li>`
    }

    // Attach event listener to each song
    Array.from(document.querySelectorAll(".songslist li")).forEach(e => {
        e.addEventListener("click", () => {
            playMusic(e.querySelector(".info div").textContent.trim());
        });
    });

    return songs;
}

const playMusic = (track, pause = false) => {
    currentSong.src = `/${currFolder}/` + track;
    if (!pause) {
        currentSong.play();
        document.getElementById("play").src = "img/pause.svg";
    }
    document.querySelector(".songinfo").innerHTML = decodeURI(track);
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
}

async function displayAlbums() {
 

  let a = await fetch(`/songs/`);
  let response = await a.text();

  let div = document.createElement("div");
  div.innerHTML = response;
  let anchors = div.getElementsByTagName("a");

  let cardContainer = document.querySelector(".card-container");
  let array = Array.from(anchors);

  for (let index = 0; index < array.length; index++) {
      const e = array[index];

      if (e.href.includes("/songs") && !e.href.includes(".htaccess")) {
          // Convert absolute URL to relative path and decode spaces
          let path = new URL(e.href, location.origin).pathname;
          let parts = path.split("/").filter(p => p !== ""); // Remove empty spaces
          let folder = parts.length > 1 ? decodeURIComponent(parts[parts.length - 1]) : null; 

          if (!folder || folder === "songs") continue; // Skip invalid folders (optional recommednded by ai)

          try {
              let AlbumData = await fetch(`/songs/${encodeURIComponent(folder)}/info.json`);
              if (!AlbumData.ok) {
                  console.error(`info.json not found for ${folder}`);
                  continue;
              }

              let data = await AlbumData.json();

              cardContainer.innerHTML += `
              <div data-folder="${folder}" class="card">
                  <div class="play">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5" stroke-linejoin="round"/>
                      </svg>
                  </div>
                  <img src="/songs/${encodeURIComponent(folder)}/cover.jpg" alt="">
                  <h2>${data.Name}</h2>
                  <p>${data.description}</p>
              </div>`;
          } catch (error) {
              console.error(`Error fetching info.json for ${folder}:`, error);
          }
      }
  }

  let cards = document.querySelectorAll(".card");
 
  cards.forEach(e => {
      e.addEventListener("click", async (event) => {
          let folder = event.currentTarget.dataset.folder;
          
          songs = await getSongs(`songs/${encodeURIComponent(folder)}`);
          playMusic(songs[0]);
      });
  });
}


async function main() {
    // Get the list of all the songs
    await getSongs("songs/naat");
    playMusic(songs[0], true);

    // Display all the albums
    await displayAlbums();

    // Attach event listeners
    document.getElementById("play").addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            document.getElementById("play").src = "img/pause.svg";
        } else {
            currentSong.pause();
            document.getElementById("play").src = "img/play.svg";
        }
    });

    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
    });

    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = ((currentSong.duration) * percent) / 100;
    });

    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    document.querySelector(".cross").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    document.getElementById("previous").addEventListener("click", () => {
      currentSong.pause();
      let index = songs.indexOf(decodeURIComponent(currentSong.src.split("/").slice(-1)[0]));
  
      // If at the first song, go to the last song
      let newIndex = (index - 1) >= 0 ? index - 1 : songs.length - 1;
  
      playMusic(songs[newIndex]);
  });
  
  document.getElementById("next").addEventListener("click", () => {
      currentSong.pause();
      let index = songs.indexOf(decodeURIComponent(currentSong.src.split("/").slice(-1)[0]));
  
      // If at the last song, go to the first song
      let newIndex = (index + 1) < songs.length ? index + 1 : 0;
  
      playMusic(songs[newIndex]);
  });
  

    document.querySelector(".rangevol input").addEventListener("change", (e) => {
        currentSong.volume = parseInt(e.target.value) / 100;
        document.querySelector(".volume").src = currentSong.volume > 0 ? "img/volume.svg" : "img/mute.svg";
    });

    document.querySelector(".volume").addEventListener("click", e => {
        if (e.target.src.includes("volume.svg")) {
            e.target.src = "img/mute.svg";
            currentSong.volume = 0;
            document.querySelector(".rangevol input").value = 0;
        } else {
            e.target.src = "img/volume.svg";
            currentSong.volume = 0.1;
            document.querySelector(".rangevol input").value = 10;
        }
    });
}

main();
