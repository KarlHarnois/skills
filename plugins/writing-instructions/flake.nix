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

      oldestValeThatLintsNestedListsApart = "3.18.0";

      valeThatLintsNestedListsApart =
        pkgs:
        if pkgs.lib.versionAtLeast pkgs.vale.version oldestValeThatLintsNestedListsApart then
          pkgs.vale
        else
          pkgs.vale.overrideAttrs (
            finalAttrs: previousAttrs:
            let
              stampFinalVersion = builtins.replaceStrings [ previousAttrs.version ] [ finalAttrs.version ];
            in
            {
              version = "3.24.0";
              src = pkgs.fetchFromGitHub {
                owner = "vale-cli";
                repo = "vale";
                tag = "v${finalAttrs.version}";
                hash = "sha256-s3KEAUjZHApRG2+qxOJAzyXMP3FJNnJXzu2nv4oHwe8=";
              };
              proxyVendor = true;
              vendorHash = "sha256-cuSjULIbb7JtP0CkX4eFm9RChi3nQW46k5Ik9DyGYKk=";
              ldflags = map stampFinalVersion previousAttrs.ldflags;
            }
          );
    in
    {
      packages = forEachSystem (pkgs: {
        vale = valeThatLintsNestedListsApart pkgs;
      });
    };
}
