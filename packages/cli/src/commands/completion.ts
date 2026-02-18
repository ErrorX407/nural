import { Command } from "commander";

export function completionCommand(program: Command) {
    return () => {
        const commands = program.commands.map(cmd => cmd.name()).join(" ");
        
        // We can also try to extract options but for now let's focus on commands
        // For subcommands like 'generate', we can check if they have registered arguments/options
        // but commander's structure might require more traversal. 
        // For now, we'll keep the specific 'generate' and 'add' cases as "smart defaults" 
        // but use the dynamic list for the main opts.

        const script = `
###-begin-nural-completion-###
#
# nural command completion script
#
# Installation: nural completion >> ~/.zshrc  (or ~/.bashrc)
# Source it: source <(nural completion)
#

_nural_completion() {
    local cur prev opts
    COMPREPLY=()
    cur="\${COMP_WORDS[COMP_CWORD]}"
    prev="\${COMP_WORDS[COMP_CWORD-1]}"
    opts="${commands}"

    case "\${prev}" in
        generate|g)
            opts="resource middleware guard interceptor filter provider service"
            ;;
        add)
            opts="redis rabbitmq mongoose prisma-pg"
            ;;
        *)
            ;;
    esac

    COMPREPLY=( $(compgen -W "\${opts}" -- \${cur}) )
    return 0
}
complete -F _nural_completion nural

###-end-nural-completion-###
`;
        console.log(script.trim());
    }
}