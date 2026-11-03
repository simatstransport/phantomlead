import os
import sys
import json

sys.path.insert(0, 'package-builder')
from build_packages import build_package, calculate_sha256, PACKAGES

results = []
for pkg_code, config in PACKAGES.items():
    ver = config["version"]
    zip_name = f"{pkg_code}_version-{ver}.zip"
    zip_path = os.path.join("dist_packages", zip_name)
    if os.path.exists(zip_path):
        print(f"{pkg_code} already exists at {zip_path}, computing sha256...")
        sha = calculate_sha256(zip_path)
        results.append({
            "package_code": pkg_code,
            "zip_path": zip_path,
            "sha256": sha
        })
    else:
        print(f"Building {pkg_code}...")
        res = build_package(pkg_code, config)
        results.append(res)

with open("package_info.json", "w") as f:
    json.dump(results, f, indent=2)

print("\n=== All packages ready! ===")
for r in results:
    print(r["package_code"], r["sha256"])
