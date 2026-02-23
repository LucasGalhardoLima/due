export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:html', (html) => {
    html.head.unshift(`<script>
(function(){
  try {
    var m = document.cookie.match(/(?:^|;\\s*)due-palette=([^;]*)/);
    var p = m ? decodeURIComponent(m[1]) : 'mint';
    var valid = ['mint','cyan','amber','rose','peach'];
    if (valid.indexOf(p) === -1) p = 'mint';
    document.documentElement.classList.add('palette-' + p);
  } catch(e) {}
})();
</script>`)
  })
})
