#compdef oaiimage
_oaiimage() {
  local -a commands
  commands=(
    init config doctor models capabilities generate edit inpaint expand compose
    style transparent background session prompt typography variations media
    upscale restore enhance batch cost project gallery
  )
  _describe 'command' commands
}
compdef _oaiimage oaiimage
