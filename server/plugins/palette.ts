export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:html', (html) => {
    html.head.unshift(`<script>
(function(){
  try {
    var m = document.cookie.match(/(?:^|;\\s*)due-palette=([^;]*)/);
    var p = m ? decodeURIComponent(m[1]) : 'neon-sage';
    var valid = ['mono','cyber-mint','neon-sage','tokyo-night','aurora','vapor'];
    if (valid.indexOf(p) === -1) p = 'neon-sage';
    if (p !== 'mono') document.documentElement.classList.add('palette-' + p);
  } catch(e) {}
})();
</script>`)
  })
})
