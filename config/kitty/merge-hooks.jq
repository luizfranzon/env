# Injeta o hook de abas do kitty em hooks/settings.json sem tocar no resto do arquivo.
# Uso: jq --arg cmd "<path-do-script>" -f merge-hooks.jq settings.json
def add_generic($ev):
  (.hooks[$ev] // []) as $arr
  | if any($arr[]?; ((.hooks // [])[]?.command // "") == $cmd) then .
    else .hooks[$ev] = ($arr + [{"hooks": [{"type": "command", "command": $cmd}]}])
    end;

(.hooks //= {})
| (
    (.hooks.PreToolUse // []) as $pre
    | if any($pre[]?; ((.hooks // [])[]?.command // "") == $cmd) then .
      else .hooks.PreToolUse = ($pre + [{"matcher": "*", "hooks": [{"type": "command", "command": $cmd}]}])
      end
  )
| add_generic("PostToolUse")
| add_generic("UserPromptSubmit")
| add_generic("Notification")
| add_generic("Stop")
| add_generic("SessionStart")
| add_generic("SessionEnd")
