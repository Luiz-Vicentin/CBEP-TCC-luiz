(() => {
  const videos = [
    ['video-dalton', 'video-aviso'],
    ['video-helena', 'video-aviso-helena'],
    ['video-olivio', 'video-aviso-olivio'],
    ['video-luci', 'video-aviso-luci']
  ].map(([id, avisoId]) => ({frame: document.getElementById(id), aviso: document.getElementById(avisoId)}))
    .filter(({frame, aviso}) => frame && aviso);
  if (!videos.length) return;
  videos.forEach(({frame}) => {
  const url = new URL(frame.src);
  if (location.protocol === 'http:' || location.protocol === 'https:') {
    url.searchParams.set('origin', location.origin);
    frame.src = url.href;
  }
  });
  window.onYouTubeIframeAPIReady = () => {
    videos.forEach(({frame, aviso}) => {
    new YT.Player(frame.id, {
      events: {
        onError(event) {
          const mensagens = {
            100: 'O YouTube informou que este vídeo foi removido ou está privado.',
            101: 'O responsável pelo vídeo não permite a reprodução em outros sites.',
            150: 'O responsável pelo vídeo não permite a reprodução em outros sites.',
            153: 'O YouTube não conseguiu identificar o site que está exibindo o vídeo.',
            5: 'O YouTube não conseguiu reproduzir este vídeo neste navegador.',
            2: 'O YouTube não reconheceu os dados deste vídeo.'
          };
          aviso.textContent = mensagens[event.data] || 'O YouTube não conseguiu carregar este vídeo.';
          aviso.hidden = false;
        },
        onStateChange(event) {
          if (event.data === 1) aviso.hidden = true;
        }
      }
    });
    });
  };
  const api = document.createElement('script');
  api.src = 'https://www.youtube.com/iframe_api';
  document.head.append(api);
})();
