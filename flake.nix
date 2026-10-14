{
  description = "Coding assistant skills and the tools they run";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

  outputs =
    { nixpkgs, ... }:
    let
      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "aarch64-darwin"
      ];

      forEachSystem =
        buildOutputs: nixpkgs.lib.genAttrs systems (system: buildOutputs nixpkgs.legacyPackages.${system});
    in
    {
      packages = forEachSystem (pkgs: {
        inherit (pkgs) vale;
      });
    };
}
