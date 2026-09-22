import type { Argv } from "yargs"
import { UI } from "../ui"
import * as prompts from "@clack/prompts"
import { Installation } from "../../installation"
import { InstallationVersion } from "@kiwii/core/installation/version"

export const UpgradeCommand = {
  command: "upgrade [target]",
  describe: "upgrade kiwii to the latest or a specific version",
  builder: (yargs: Argv) => {
    return yargs
      .positional("target", {
        describe: "version to upgrade to, for ex '0.1.48' or 'v0.1.48'",
        type: "string",
      })
      .option("method", {
        alias: "m",
        describe: "installation method to use",
        type: "string",
        choices: ["curl"],
      })
  },
  handler: async (args: { target?: string; method?: string }) => {
    UI.empty()
    UI.println(UI.logo("  "))
    UI.empty()
    prompts.intro("Upgrade")
    const method = (args.method as Installation.Method) ?? (await Installation.method())
    if (method === "unknown") {
      prompts.log.error(`kiwii at ${process.execPath} was not installed by the kiwii installer`)
      const install = await prompts.select({
        message: "Run the installer anyway? It writes to ~/.kiwii/bin and leaves this copy untouched.",
        options: [
          { label: "Yes", value: true },
          { label: "No", value: false },
        ],
        initialValue: false,
      })
      if (!install) {
        prompts.outro("Done")
        return
      }
    }
    const target = args.target ? args.target.replace(/^v/, "") : await Installation.latest()

    if (InstallationVersion === target) {
      prompts.log.warn(`kiwii upgrade skipped: ${target} is already installed`)
      prompts.outro("Done")
      return
    }

    prompts.log.info(`From ${InstallationVersion} → ${target}`)
    const spinner = prompts.spinner()
    spinner.start("Upgrading...")
    // Confirming an unknown install means running the installer, which always writes to its own bin directory.
    const err = await Installation.upgrade("curl", target).catch((err) => err)
    if (err) {
      spinner.stop("Upgrade failed", 1)
      if (err instanceof Installation.UpgradeFailedError) prompts.log.error(err.stderr)
      else if (err instanceof Error) prompts.log.error(err.message)
      prompts.outro("Done")
      return
    }
    spinner.stop("Upgrade complete")
    prompts.outro("Done")
  },
}
