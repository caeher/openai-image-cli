# bash completion for oaiimage
_oaiimage_completions() {
  local cur="${COMP_WORDS[COMP_CWORD]}"
  local prev="${COMP_WORDS[COMP_CWORD-1]}"
  local commands="init config doctor models capabilities generate edit inpaint expand compose style transparent background session prompt typography variations media mask upscale restore enhance batch cost project gallery"
  local media_sub="inspect metadata resize convert compare crop rotate compress composite watermark thumbnail contact-sheet"
  local mask_sub="inspect preview invert union intersect dilate erode blur rect polygon"
  local prompt_sub="templates build create inspect save validate optimize"
  local session_sub="create edit history inspect export delete"
  local batch_sub="create run status retry export"
  local config_sub="init set get list reset"
  local gallery_sub="list inspect export"
  local background_sub="remove replace"
  local models_ids="gpt-image-2.5-flare gpt-image-2.5-sunburst gpt-image-2.5-flare-2026-09-08 gpt-image-2.5-sunburst-2026-09-08 gpt-image-2 gpt-image-2-2026-04-21 gpt-image-1.5 gpt-image-1 gpt-image-1-mini chatgpt-image-latest dall-e-2 dall-e-3"

  if [ "$COMP_CWORD" -eq 1 ]; then
    COMPREPLY=( $(compgen -W "$commands" -- "$cur") )
    return
  fi

  case "${COMP_WORDS[1]}" in
    media)
      COMPREPLY=( $(compgen -W "$media_sub" -- "$cur") )
      ;;
    mask)
      COMPREPLY=( $(compgen -W "$mask_sub" -- "$cur") )
      ;;
    prompt)
      COMPREPLY=( $(compgen -W "$prompt_sub" -- "$cur") )
      ;;
    session)
      COMPREPLY=( $(compgen -W "$session_sub" -- "$cur") )
      ;;
    batch)
      COMPREPLY=( $(compgen -W "$batch_sub" -- "$cur") )
      ;;
    config)
      COMPREPLY=( $(compgen -W "$config_sub" -- "$cur") )
      ;;
    gallery)
      COMPREPLY=( $(compgen -W "$gallery_sub" -- "$cur") )
      ;;
    background)
      COMPREPLY=( $(compgen -W "$background_sub" -- "$cur") )
      ;;
    models)
      if [ "$prev" = "list" ] || [ "$prev" = "models" ]; then
        COMPREPLY=( $(compgen -W "$models_ids" -- "$cur") )
      fi
      ;;
    generate|edit|style)
      if [ "$prev" = "--model" ]; then
        COMPREPLY=( $(compgen -W "$models_ids" -- "$cur") )
      fi
      ;;
  esac
}
complete -F _oaiimage_completions oaiimage
