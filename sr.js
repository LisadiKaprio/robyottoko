const fn = require('./fn.js')
const opts = require('./config.js')
const fetch = require('node-fetch')

const save = (r) => fn.save('sr', {
  youtubeData: r.data.youtubeData,
  playlist: r.data.playlist.map(item => ({
    id: item.id,
    yt: item.yt,
    title: item.title || '',
    time: item.time || new Date().getTime(),
    user: item.user || '',
    plays: item.plays || 0,
    skips: item.skips || 0, // hard skips
    goods: item.goods || 0,
    bads: item.bads || 0,
  })),
  cur: r.data.cur,
})

const fetchYoutubeData = async (youtubeId) => {
  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${youtubeId}&fields=items(id%2Csnippet)&key=${opts.google.api_key}`
  return fetch(url)
    .then(r => r.json())
    .then(j => j.items[0] || null)
}

const extractYoutubeId = (youtubeUrl) => {
  const patterns = [
    /youtu\.be\/(.*?)(?:\?|"|$)/i,
    /\.youtube\.com\/(?:watch\?v=|v\/|embed\/)([^&"'#]*)/i,
  ]
  for (const pattern of patterns) {
    let m = youtubeUrl.match(pattern)
    if (m) {
      return m[1]
    }
  }
  // https://stackoverflow.com/questions/6180138/whats-the-maximum-length-of-a-youtube-video-id
  if (youtubeUrl.match(/^[a-z0-9_-]{11}$/i)) {
    return youtubeUrl
  }
  return null
}

const sr = {
  data: fn.load('sr', {
    youtubeData: {},
    playlist: [],
    cur: -1,
  }),
  wss: null,
  onPlay: (id) => {
    const idx = sr.data.playlist.findIndex(item => item.id === id)
    if (idx < 0) {
      return
    }
    sr.data.cur = idx
    sr.incStat('plays')
    save(sr)
    sr.updateClients('onPlay')
  },
  resetStats: () => {
    sr.data.playlist = sr.data.playlist.map(item => {
      item.plays = 0
      item.skips = 0
      item.goods = 0
      item.bads = 0
      return item
    })
    save(sr)
    sr.updateClients('resetStats')
  },
  incStat: (stat) => {
    if (sr.data.cur === -1 || sr.data.cur >= sr.data.playlist.length) {
      return
    }
    sr.data.playlist[sr.data.cur][stat]++
  },
  like: () => {
    sr.incStat('goods')
    save(sr)
    sr.updateClients('like')
  },
  dislike: () => {
    sr.incStat('bads')
    save(sr)
    sr.updateClients('dislike')
  },
  skip: () => {
    if (sr.data.playlist.length === 0) {
      return
    }

    sr.incStat('skips')

    if (sr.data.cur + 1 >= sr.data.playlist.length) {
      // rotate
      sr.data.playlist.push(sr.data.playlist.shift())
    } else {
      sr.data.cur++
    }
    save(sr)
    sr.updateClients('skip')
  },
  clear: () => {
    sr.data.playlist = []
    sr.data.cur = -1
    save(sr)
    sr.updateClients('clear')
  },
  shuffle: () => {
    if (sr.data.cur === -1) {
      // just shuffle
      sr.data.playlist = fn.shuffle(sr.data.playlist)
    } else {
      // shuffle and go to same element
      const id = sr.data.playlist[sr.data.cur].id
      sr.data.playlist = fn.shuffle(sr.data.playlist)
      sr.data.cur = sr.data.playlist.findIndex(item => item.id ===id)
    }
    save(sr)
    sr.updateClients('shuffle')
  },
  remove: () => {
    if (sr.data.cur === -1) {
      return
    }
    sr.data.playlist.splice(sr.data.cur, 1)
    if (sr.data.playlist.length === 0) {
      sr.data.cur = -1
    } else if (sr.data.playlist.length <= sr.data.cur) {
      sr.data.cur = 0
    }
    save(sr)
    sr.updateClients('remove')
  },
  updateClients: (eventName) => {
    sr.wss.clients.forEach(function each(ws) {
      sr.updateClient(eventName, ws)
    })
  },
  updateClient: (eventName, ws) => {
    if (ws.isAlive) {
      ws.send(JSON.stringify({event: eventName, data: sr.data}))
    }
  },
  loadYoutubeData: async (youtubeId) => {
    if (typeof sr.data.youtubeData[youtubeId] !== 'undefined') {
      return sr.data.youtubeData[youtubeId]
    }
    sr.data.youtubeData[youtubeId] = await fetchYoutubeData(youtubeId)
    save(sr)
    return sr.data.youtubeData[youtubeId]
  },
  addToPlaylist: async (youtubeId, userName) => {
    const yt = await sr.loadYoutubeData(youtubeId)

    const item = {
      id: Math.random(),
      yt: youtubeId,
      title: yt.snippet.title,
      timestamp: new Date().getTime(),
      user: userName,
      plays: 0,
      skips: 0,
      goods: 0,
      bads: 0,
    }

    let found = -1
    for (let i = 0; i < sr.data.playlist.length; i++) {
      let other = sr.data.playlist[i]
      if (other.plays === item.plays) {
        found = i
      } else if (found >= 0) {
        break
      }
    }
    if (found === -1) {
      found = sr.data.cur
    }

    sr.data.playlist.splice(found + 1, 0, item)

    if (sr.data.cur === -1) {
      sr.data.cur = 0
    }

    save(sr)
    sr.updateClients('add')
  },
  init: (client) => {
    const ws = require('ws')
    sr.wss = new ws.Server({ port: 1338 })
    function noop() { }
    sr.wss.on('connection', ws => {
      ws.isAlive = true
      ws.on('pong', function () { this.isAlive = true; })
      ws.on('message', function (data) {
        console.log(data)
        const d = JSON.parse(data)
        if (d.event && d.event === 'play') {
          sr.onPlay(d.id)
        }
      })
      sr.updateClient('init', ws)
    })
    const interval = setInterval(function ping() {
      sr.wss.clients.forEach(function each(ws) {
        if (ws.isAlive === false) {
          return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping(noop);
      });
    }, 30000)
    sr.wss.on('close', function close() {
      clearInterval(interval);
    });
  },
  cmds: {
    '!sr': async (context, params) => {
      if (params.length === 0) {
        return `Usage: !sr YOUTUBE-URL`
      }
      switch (params[0]) {
        case 'current':
          return `Currently playing: ${sr.data.playlist[sr.data.cur].yt}`
        case 'good':
          sr.like()
          return
        case 'bad':
          sr.dislike()
          return
        case 'skip':
          if (fn.isBroadcaster(context)) {
            sr.skip()
            return
          }
          break
        case 'resetStats':
          if (fn.isBroadcaster(context)) {
            sr.resetStats()
            return
          }
          break
        case 'clear':
          if (fn.isBroadcaster(context)) {
            sr.clear()
            return
          }
          break
        case 'rm':
          if (fn.isBroadcaster(context)) {
            sr.remove()
            return
          }
          break
        case 'shuffle':
          if (fn.isBroadcaster(context)) {
            sr.shuffle()
            return
          }
          break
      }

      const youtubeUrl = params[0]
      const youtubeId = extractYoutubeId(youtubeUrl)
      if (!youtubeId) {
        return `Could not process that song request`
      }
      await sr.addToPlaylist(youtubeId, context['display-name'])
      return `Added ${youtubeId} to the playlist!`
    },
  },
  routes: {
    '/sr/player/': (req, res) => {
      return {
        code: 200,
        type: 'text/html',
        body: `
<html>
<head> <meta charset="utf-8"/>
<style type="text/css">
body { margin: 0; background: #333; color: #eec; font: 15px monospace; }
#playlist { width: 640px; }
ol { list-style: inside decimal; padding: 0 }
ol li { padding: .5em 1em; margin: .5em 0; border: solid 1px #444; }
ol li span { float: right; }
h3 { text-align: center; }
.playing { background: #e8ffcc; color: #000; }
.playing:before { display: inline-block; content: "今　" }
.next { background: #81a694; color: #000; }
.next:before { display: inline-block; content: "次　" }
</style>
</head>
<body>
<div id="player"></div>
<div id="playlist"></div>
<script>

function prepareWs() {
  return new Promise((resolve, reject) => {
    const s = new WebSocket('ws://robyottoko:1338/')
    s.onmessage = (e) => {
      const d = JSON.parse(e.data)
      if (d.event && d.event === 'init') {
        resolve({
          s,
          playlist: d.data.playlist,
          cur: d.data.cur,
        })
      }
    }
  })
}

function prepareYt() {
  return new Promise((resolve, reject) => {
    var tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    window.onYouTubeIframeAPIReady = () => {
      let player
      const onReady = () => {
	resolve(player);
      }
      player = new YT.Player('player', {
        height: '390',
        width: '640',
        events: { onReady },
      })
    }
  })
}

function doEverything (s, player, playlist, cur) {
  const updatePlaylistView = () => {
    const l = [].concat(playlist.slice(cur), playlist.slice(0, cur))
    document.getElementById('playlist').innerHTML = '<h3>EXPERIMENTAL SONG REQUEST</h3>' +
	'<ol>' +
  l.map((item, idx) => ('' +
    '<li class="' + (idx === 0 ? 'playing' : 'next') + '">' +
      (item.title || item.yt) +
      '<span>' +
        '' + item.user + ' ' +
        '🔁 ' + item.plays + ' ' +
        '💖 ' + item.goods + ' ' +
        '💩 ' + item.bads + ' ' +
      '</span>' +
    '</li>'
  )).join('') +
	'</ol>'
  }

  const play = (idx, force) => {
    if (idx < 0) {
      player.stopVideo()
      updatePlaylistView()
      return
    }
    if (
      player.getPlayerState() === 1
      && idx === cur
      && !force
    ) {
      updatePlaylistView()
      return
    }
    const item = playlist[idx]
    player.cueVideoById(item.yt)
    player.playVideo()
    cur = idx
    updatePlaylistView()
    s.send(JSON.stringify({'event': 'play', 'id': item.id}))
  }

  const next = () => {
    const idx = (cur + 1) >= playlist.length ? 0 : cur + 1
    play(idx)
  }


  player.addEventListener('onStateChange', (event) => {
    if (event.data == YT.PlayerState.ENDED) {
      next()
    }
  })

  play(cur)
  s.onmessage = function (e) {
    const d = JSON.parse(e.data)
    if (!d.event) {
      return
    }
    switch (d.event) {
      case 'skip':
      case 'remove':
      case 'clear':
        playlist = d.data.playlist
        play(d.data.cur, true)
        break
      case 'dislike':
      case 'like':
      case 'onPlay':
      case 'resetStats':
      case 'shuffle':
        playlist = d.data.playlist
        cur = d.data.cur
        updatePlaylistView()
        break
      case 'add':
      case 'init':
        playlist = d.data.playlist
        play(d.data.cur)
        break
    }
  }
}

prepareWs().then(({s, playlist, cur}) => {
  prepareYt().then(p => {
    console.log(s, playlist, cur)
    doEverything(s, p, playlist, cur)
  })
})
</script>
</body>
</html>
	       `
      }
    },
  },
}

module.exports = sr
