"""
Finds and replaces hardcoded name/URL references in plots/index.php and plots/view.php.
Edit the REPLACEMENTS dict below, then run the script.
Author: Aritra Bal (ETP)
Date: 2026-06-30
"""

from pathlib import Path


# Keys are the exact strings to find in the files; values are what to replace them with.
REPLACEMENTS: dict[str, str] = {
    "https://etpwww.etp.kit.edu/~abal/plots/index.php": "https://placeholder.example.com/plots/index.php",
    "https://etpwww.etp.kit.edu/~abal/plots/view.php":  "https://placeholder.example.com/plots/view.php",
    "https://etpwww.etp.kit.edu/~abal/plots/":          "https://placeholder.example.com/plots/",
    "Aritra Bal":                                        "Placeholder Name",
}

TARGET_FILES: list[str] = [
    "index.php",
    "view.php",
]


def apply_replacements(file_path: Path, replacements: dict[str, str]) -> int:
    """Replace all keys with their values in the given file. Returns count of substitutions made."""
    content = file_path.read_text(encoding="utf-8")
    total = 0
    for old, new in replacements.items():
        count = content.count(old)
        if count:
            content = content.replace(old, new)
            total += count
            print(f"  [{count}x] {old!r} -> {new!r}")
    file_path.write_text(content, encoding="utf-8")
    return total


def main() -> None:
    script_dir = Path(__file__).parent
    for rel_path in TARGET_FILES:
        target = script_dir / rel_path
        if not target.exists():
            print(f"SKIP (not found): {rel_path}")
            continue
        print(f"\n{rel_path}")
        n = apply_replacements(target, REPLACEMENTS)
        print(f"  => {n} replacement(s) total")


if __name__ == "__main__":
    main()
