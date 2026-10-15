# bash completion for oaiimage
_oaiimage_completions() {
  local cur="${COMP_WORDS[COMP_CWORD]}"
  if [ "$COMP_CWORD" -eq 1 ]; then
    COMPREPLY=( $(compgen -W "init config doctor models capabilities generate edit inpaint expand compose style transparent background session prompt typography variations media upscale restore enhance batch cost project gallery" -- "$cur") )
  fi
}
complete -F _oaiimage_completions oaiimage
